/**
 * Server-side admin ACR operations.
 *
 * GET lists repositories, manifests, and tags.
 * DELETE removes one explicit tag or manifest after server-side safety checks.
 */

import {
  ContainerRegistryClient,
  KnownContainerRegistryAudience,
  type ArtifactManifestProperties,
  type ArtifactTagProperties,
} from "@azure/container-registry";
import { DefaultAzureCredential } from "@azure/identity";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DeleteTargetType = "tag" | "manifest";

interface AcrConfig {
  loginServer: string;
  endpoint: string;
  registryName: string;
  environmentLabel: string | null;
  resourceGroup: string | null;
  subscriptionId: string | null;
  protectedRefs: Set<string>;
  protectedRefsConfigured: boolean;
  recentProtectionDays: number;
  maxRepositories: number;
  maxManifestsPerRepository: number;
  maxTagsPerManifest: number;
}

interface DeleteRequestBody {
  repository?: unknown;
  target_type?: unknown;
  tag?: unknown;
  digest?: unknown;
  confirmation?: unknown;
  final_confirm?: unknown;
  acknowledge_deployed_unknown?: unknown;
  override_recent?: unknown;
}

interface AcrEnvironmentExpectation {
  registryName: string;
  resourceGroup: string;
  subscriptionId: string;
}

interface AcrErrorInfo {
  detail: string;
  type: "credential_unavailable" | "permission_denied" | "not_found" | "request_failed";
  status_code: number | null;
  code: string | null;
  name: string | null;
}

const REPOSITORY_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,254}$/;
const TAG_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const DEFAULT_RECENT_PROTECTION_DAYS = 14;
const EXPECTED_AZURE_SUBSCRIPTION_ID = "ae6de222-cc1b-4230-aa85-898b5dae9ef3";
const ENV_EXPECTATIONS: Record<string, AcrEnvironmentExpectation> = {
  "prod-neu": {
    registryName: "acrengage7prodneu",
    resourceGroup: "rg-engage7-prod-neu",
    subscriptionId: EXPECTED_AZURE_SUBSCRIPTION_ID,
  },
  "dev-neu": {
    registryName: "acrengage7devneu",
    resourceGroup: "rg-engage7-dev-neu",
    subscriptionId: EXPECTED_AZURE_SUBSCRIPTION_ID,
  },
};

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifyJwt(token);
  if (!session?.sub || session.role !== "admin") return null;
  return session;
}

function firstEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

function normalizeLoginServer(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/g, "")
    .toLowerCase();
}

function splitRefs(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProtectedRef(value: string, loginServer: string): string | null {
  const withoutProtocol = value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/g, "");
  if (!withoutProtocol) return null;
  const withoutRegistry = withoutProtocol.startsWith(`${loginServer}/`)
    ? withoutProtocol.slice(loginServer.length + 1)
    : withoutProtocol;
  if (!withoutRegistry.includes(":") && !withoutRegistry.includes("@")) return null;
  return withoutRegistry.toLowerCase();
}

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getConfig(): AcrConfig | null {
  const environmentLabel = firstEnv(
    "NEXT_PUBLIC_ADMIN_ENV_LABEL",
    "ENGAGE7_ENVIRONMENT_LABEL",
    "APP_ENV"
  );
  const resourceGroup = firstEnv(
    "ENGAGE7_AZURE_RESOURCE_GROUP",
    "AZURE_RESOURCE_GROUP",
    "ACA_JOB_RESOURCE_GROUP"
  );
  const subscriptionId = firstEnv(
    "ENGAGE7_AZURE_SUBSCRIPTION_ID",
    "AZURE_SUBSCRIPTION_ID",
    "ACA_JOB_SUBSCRIPTION_ID"
  );
  const configuredLoginServer = firstEnv(
    "ENGAGE7_ACR_LOGIN_SERVER",
    "AZURE_CONTAINER_REGISTRY_LOGIN_SERVER",
    "ACR_LOGIN_SERVER"
  );
  const configuredRegistryName = firstEnv(
    "ENGAGE7_ACR_NAME",
    "AZURE_CONTAINER_REGISTRY_NAME",
    "ACR_NAME"
  );

  const loginServer = configuredLoginServer
    ? normalizeLoginServer(configuredLoginServer)
    : configuredRegistryName
      ? normalizeLoginServer(`${configuredRegistryName}.azurecr.io`)
      : null;

  if (!loginServer || !/^[a-z0-9]{5,50}\.azurecr\.io$/.test(loginServer)) {
    return null;
  }

  const protectedValues = [
    ...splitRefs(process.env.ENGAGE7_ACR_PROTECTED_IMAGES ?? null),
    ...splitRefs(process.env.ENGAGE7_DEPLOYED_IMAGE_REFS ?? null),
    ...splitRefs(process.env.API_IMAGE_REF ?? null),
    ...splitRefs(process.env.INGEST_IMAGE_REF ?? null),
    ...splitRefs(process.env.ANALYSE_IMAGE_REF ?? null),
    ...splitRefs(process.env.ENGAGE7_API_IMAGE_REF ?? null),
    ...splitRefs(process.env.ENGAGE7_INGEST_IMAGE_REF ?? null),
    ...splitRefs(process.env.ENGAGE7_ANALYSE_IMAGE_REF ?? null),
  ];

  const protectedRefs = new Set(
    protectedValues
      .map((item) => normalizeProtectedRef(item, loginServer))
      .filter((item): item is string => Boolean(item))
  );

  return {
    loginServer,
    endpoint: `https://${loginServer}`,
    registryName: loginServer.replace(/\.azurecr\.io$/, ""),
    environmentLabel,
    resourceGroup,
    subscriptionId,
    protectedRefs,
    protectedRefsConfigured: protectedRefs.size > 0,
    recentProtectionDays: intFromEnv(
      "ENGAGE7_ACR_RECENT_PROTECTION_DAYS",
      DEFAULT_RECENT_PROTECTION_DAYS
    ),
    maxRepositories: intFromEnv("ENGAGE7_ACR_MAX_REPOSITORIES", 50),
    maxManifestsPerRepository: intFromEnv("ENGAGE7_ACR_MAX_MANIFESTS_PER_REPOSITORY", 50),
    maxTagsPerManifest: intFromEnv("ENGAGE7_ACR_MAX_TAGS_PER_MANIFEST", 50),
  };
}

function createClient(config: AcrConfig): ContainerRegistryClient {
  return new ContainerRegistryClient(config.endpoint, new DefaultAzureCredential(), {
    audience: KnownContainerRegistryAudience.AzureResourceManagerPublicCloud,
  });
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sizeFromManifest(manifest: ArtifactManifestProperties): number | null {
  const record = manifest as ArtifactManifestProperties & {
    size?: number;
    sizeInBytes?: number;
  };
  return typeof record.sizeInBytes === "number"
    ? record.sizeInBytes
    : typeof record.size === "number"
      ? record.size
      : null;
}

function isRecent(value: Date | string | null | undefined, days: number): boolean {
  if (days <= 0 || !value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < days * 24 * 60 * 60 * 1000;
}

function referenceKeys(repository: string, tag?: string | null, digest?: string | null): string[] {
  const keys: string[] = [];
  if (tag) keys.push(`${repository}:${tag}`);
  if (digest) keys.push(`${repository}@${digest}`);
  return keys.map((key) => key.toLowerCase());
}

function isProtectedRef(
  config: AcrConfig,
  repository: string,
  tag?: string | null,
  digest?: string | null
): boolean {
  return referenceKeys(repository, tag, digest).some((key) => config.protectedRefs.has(key));
}

function statusForTarget(params: {
  protected: boolean;
  recent: boolean;
  registryCanDelete: boolean;
  detectionConfigured: boolean;
}): "protected" | "registry locked" | "recent" | "review required" {
  if (params.protected) return "protected";
  if (!params.registryCanDelete) return "registry locked";
  if (params.recent) return "recent";
  return params.detectionConfigured ? "review required" : "review required";
}

function expectedForEnvironment(label: string | null): AcrEnvironmentExpectation | null {
  if (!label) return null;
  return ENV_EXPECTATIONS[label.trim().toLowerCase()] ?? null;
}

function redactSubscriptionForDisplay(value: string | null): string | null {
  if (!value) return null;
  return value === EXPECTED_AZURE_SUBSCRIPTION_ID ? value : `configured (...${value.slice(-6)})`;
}

function classifyAcrError(error: unknown): AcrErrorInfo {
  let statusCode: number | null = null;
  let code: string | null = null;
  let name: string | null = null;

  if (error && typeof error === "object") {
    const rawStatusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof rawStatusCode === "number") statusCode = rawStatusCode;
    const rawCode = (error as { code?: unknown }).code;
    if (typeof rawCode === "string") code = rawCode;
    const rawName = (error as { name?: unknown }).name;
    if (typeof rawName === "string") name = rawName;
  }

  if (name === "CredentialUnavailableError" || code === "CredentialUnavailableError") {
    return {
      detail:
        "ACR diagnostics unavailable: Azure credential is unavailable for the Web runtime.",
      type: "credential_unavailable",
      status_code: statusCode,
      code,
      name,
    };
  }

  if (statusCode === 401 || statusCode === 403) {
    return {
      detail:
        "ACR diagnostics unavailable: Azure permission denied for the configured registry.",
      type: "permission_denied",
      status_code: statusCode,
      code,
      name,
    };
  }

  if (statusCode === 404) {
    return {
      detail:
        "ACR diagnostics unavailable: configured registry was not found or is not visible to this identity.",
      type: "not_found",
      status_code: statusCode,
      code,
      name,
    };
  }

  return {
    detail:
      typeof statusCode === "number"
        ? `Azure ACR request failed with status ${statusCode}`
        : code
          ? `Azure ACR request failed: ${code}`
          : "Azure ACR request failed",
    type: "request_failed",
    status_code: statusCode,
    code,
    name,
  };
}

function buildAcrDiagnostics(config: AcrConfig | null, error?: AcrErrorInfo) {
  const environmentLabel =
    config?.environmentLabel ??
    firstEnv("NEXT_PUBLIC_ADMIN_ENV_LABEL", "ENGAGE7_ENVIRONMENT_LABEL", "APP_ENV");
  const expected = expectedForEnvironment(environmentLabel);
  const configuredRegistryName =
    config?.registryName ??
    firstEnv("ENGAGE7_ACR_NAME", "AZURE_CONTAINER_REGISTRY_NAME", "ACR_NAME");
  const configuredLoginServer =
    config?.loginServer ??
    firstEnv(
      "ENGAGE7_ACR_LOGIN_SERVER",
      "AZURE_CONTAINER_REGISTRY_LOGIN_SERVER",
      "ACR_LOGIN_SERVER"
    );
  const configuredResourceGroup =
    config?.resourceGroup ??
    firstEnv("ENGAGE7_AZURE_RESOURCE_GROUP", "AZURE_RESOURCE_GROUP", "ACA_JOB_RESOURCE_GROUP");
  const configuredSubscriptionId =
    config?.subscriptionId ??
    firstEnv("ENGAGE7_AZURE_SUBSCRIPTION_ID", "AZURE_SUBSCRIPTION_ID", "ACA_JOB_SUBSCRIPTION_ID");

  return {
    environment_label: environmentLabel,
    configured: {
      registry_name: configuredRegistryName,
      login_server: configuredLoginServer,
      resource_group: configuredResourceGroup,
      subscription_id: redactSubscriptionForDisplay(configuredSubscriptionId),
    },
    expected,
    checks: {
      registry_matches_expected: expected && configuredRegistryName
        ? configuredRegistryName === expected.registryName
        : null,
      resource_group_matches_expected: expected && configuredResourceGroup
        ? configuredResourceGroup === expected.resourceGroup
        : null,
      subscription_matches_expected: expected && configuredSubscriptionId
        ? configuredSubscriptionId === expected.subscriptionId
        : null,
      protected_refs_configured: config?.protectedRefsConfigured ?? false,
      azure_identity_env_present: Boolean(
        firstEnv("AZURE_CLIENT_ID", "AZURE_TENANT_ID", "AZURE_FEDERATED_TOKEN_FILE")
      ),
      managed_identity_hint_present: Boolean(firstEnv("AZURE_CLIENT_ID", "MANAGED_IDENTITY_CLIENT_ID")),
    },
    missing_env: [
      configuredRegistryName || configuredLoginServer ? null : "ENGAGE7_ACR_NAME or ENGAGE7_ACR_LOGIN_SERVER",
      configuredResourceGroup ? null : "AZURE_RESOURCE_GROUP or ENGAGE7_AZURE_RESOURCE_GROUP",
      configuredSubscriptionId ? null : "AZURE_SUBSCRIPTION_ID or ENGAGE7_AZURE_SUBSCRIPTION_ID",
    ].filter((item): item is string => Boolean(item)),
    error,
  };
}

function isValidRepository(value: string): boolean {
  return (
    value.length <= 255 &&
    REPOSITORY_PATTERN.test(value) &&
    !value.includes("//") &&
    !value.endsWith("/")
  );
}

function auditAcr(action: string, status: string, details: Record<string, string | null>) {
  console.info("[admin acr audit]", {
    action,
    status,
    timestamp: new Date().toISOString(),
    ...details,
  });
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const config = getConfig();
  if (!config) {
    return NextResponse.json({
      enabled: false,
      detail: "Azure Container Registry is not configured for this Web environment.",
      diagnostics: buildAcrDiagnostics(null),
      repositories: [],
    });
  }

  const client = createClient(config);
  const repositories = [];
  let repositoryCount = 0;
  let totalManifestCount = 0;
  let totalTagCount = 0;
  let totalSizeBytes = 0;
  let repositoriesTruncated = false;

  try {
    for await (const repositoryName of client.listRepositoryNames()) {
      if (repositoryCount >= config.maxRepositories) {
        repositoriesTruncated = true;
        break;
      }

      repositoryCount += 1;
      const repository = client.getRepository(repositoryName);
      const properties = await repository.getProperties().catch(() => null);
      const manifests = [];
      let manifestCount = 0;
      let manifestsTruncated = false;

      for await (const manifest of repository.listManifestProperties({
        order: "LastUpdatedOnDescending",
      })) {
        if (manifestCount >= config.maxManifestsPerRepository) {
          manifestsTruncated = true;
          break;
        }

        manifestCount += 1;
        totalManifestCount += 1;
        const manifestSize = sizeFromManifest(manifest);
        if (manifestSize) totalSizeBytes += manifestSize;

        const artifact = repository.getArtifact(manifest.digest);
        const tags = [];
        let tagCount = 0;
        let tagsTruncated = false;

        for await (const tag of artifact.listTagProperties({
          order: "LastUpdatedOnDescending",
        })) {
          if (tagCount >= config.maxTagsPerManifest) {
            tagsTruncated = true;
            break;
          }
          tagCount += 1;
          totalTagCount += 1;

          const tagProtected = isProtectedRef(config, repositoryName, tag.name, tag.digest);
          const tagRecent = isRecent(tag.lastUpdatedOn, config.recentProtectionDays);
          tags.push({
            name: tag.name,
            digest: tag.digest,
            created_at: toIso(tag.createdOn),
            last_updated_at: toIso(tag.lastUpdatedOn),
            can_delete: tag.canDelete !== false && !tagProtected,
            status: statusForTarget({
              protected: tagProtected,
              recent: tagRecent,
              registryCanDelete: tag.canDelete !== false,
              detectionConfigured: config.protectedRefsConfigured,
            }),
            protected: tagProtected,
            recent: tagRecent,
          });
        }

        const manifestTags = manifest.tags ?? tags.map((tag) => tag.name);
        const manifestProtected =
          isProtectedRef(config, repositoryName, null, manifest.digest) ||
          manifestTags.some((manifestTag) =>
            isProtectedRef(config, repositoryName, manifestTag, manifest.digest)
          ) ||
          tags.some((tag) => tag.protected);
        const manifestRecent = isRecent(manifest.lastUpdatedOn, config.recentProtectionDays);

        manifests.push({
          digest: manifest.digest,
          tags: manifestTags,
          tag_details: tags,
          tags_truncated: tagsTruncated,
          size_bytes: manifestSize,
          created_at: toIso(manifest.createdOn),
          last_updated_at: toIso(manifest.lastUpdatedOn),
          architecture: manifest.architecture ?? null,
          operating_system: manifest.operatingSystem ?? null,
          related_artifact_count: manifest.relatedArtifacts?.length ?? 0,
          can_delete: manifest.canDelete !== false && !manifestProtected,
          status: statusForTarget({
            protected: manifestProtected,
            recent: manifestRecent,
            registryCanDelete: manifest.canDelete !== false,
            detectionConfigured: config.protectedRefsConfigured,
          }),
          protected: manifestProtected,
          recent: manifestRecent,
        });
      }

      repositories.push({
        name: repositoryName,
        created_at: toIso(properties?.createdOn),
        last_updated_at: toIso(properties?.lastUpdatedOn),
        manifest_count: properties?.manifestCount ?? manifests.length,
        tag_count:
          properties?.tagCount ??
          manifests.reduce((sum, manifest) => sum + manifest.tag_details.length, 0),
        can_delete: false,
        status: "repository delete disabled",
        manifests,
        manifests_truncated: manifestsTruncated,
      });
    }

    return NextResponse.json({
      enabled: true,
      registry: {
        name: config.registryName,
        login_server: config.loginServer,
        endpoint: config.endpoint,
      },
      diagnostics: buildAcrDiagnostics(config),
      protected_detection: {
        configured: config.protectedRefsConfigured,
        protected_ref_count: config.protectedRefs.size,
        recent_protection_days: config.recentProtectionDays,
      },
      limits: {
        max_repositories: config.maxRepositories,
        max_manifests_per_repository: config.maxManifestsPerRepository,
        max_tags_per_manifest: config.maxTagsPerManifest,
      },
      total_count: repositoryCount,
      total_manifest_count: totalManifestCount,
      total_tag_count: totalTagCount,
      total_size_bytes: totalSizeBytes,
      repositories_truncated: repositoriesTruncated,
      repositories,
    });
  } catch (error) {
    const errorInfo = classifyAcrError(error);
    return NextResponse.json(
      {
        detail: errorInfo.detail,
        diagnostics: buildAcrDiagnostics(config, errorInfo),
      },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      {
        detail: "Azure Container Registry is not configured",
        diagnostics: buildAcrDiagnostics(null),
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as DeleteRequestBody | null;
  const repository = typeof body?.repository === "string" ? body.repository.trim() : "";
  const targetType =
    body?.target_type === "tag" || body?.target_type === "manifest"
      ? (body.target_type as DeleteTargetType)
      : null;
  const tag = typeof body?.tag === "string" ? body.tag.trim() : "";
  const digest = typeof body?.digest === "string" ? body.digest.trim() : "";
  const confirmation = typeof body?.confirmation === "string" ? body.confirmation.trim() : "";

  if (!repository || !isValidRepository(repository)) {
    return NextResponse.json({ detail: "Invalid repository" }, { status: 400 });
  }
  if (!targetType) {
    return NextResponse.json({ detail: "target_type must be tag or manifest" }, { status: 400 });
  }
  if (targetType === "tag" && (!tag || !TAG_PATTERN.test(tag))) {
    return NextResponse.json({ detail: "Invalid tag" }, { status: 400 });
  }
  if (targetType === "manifest" && (!digest || !DIGEST_PATTERN.test(digest))) {
    return NextResponse.json({ detail: "Invalid manifest digest" }, { status: 400 });
  }
  if (body?.final_confirm !== true) {
    return NextResponse.json({ detail: "final_confirm is required" }, { status: 400 });
  }

  const expectedConfirmation =
    targetType === "tag" ? `delete ${repository}:${tag}` : `delete ${repository}@${digest}`;
  if (confirmation !== expectedConfirmation) {
    return NextResponse.json({ detail: "Confirmation text does not match target" }, { status: 400 });
  }

  if (!config.protectedRefsConfigured && body?.acknowledge_deployed_unknown !== true) {
    return NextResponse.json(
      {
        detail:
          "Deployed image detection is not configured. Acknowledge this before deleting ACR content.",
      },
      { status: 409 }
    );
  }

  const client = createClient(config);
  const repositoryClient = client.getRepository(repository);

  try {
    if (targetType === "tag") {
      const artifact = repositoryClient.getArtifact(tag);
      const tagProperties = await artifact.getTagProperties(tag);
      const tagProtected = isProtectedRef(config, repository, tagProperties.name, tagProperties.digest);
      const tagRecent = isRecent(tagProperties.lastUpdatedOn, config.recentProtectionDays);

      if (tagProtected) {
        return NextResponse.json({ detail: "This tag is protected as a deployed image reference" }, { status: 409 });
      }
      if (tagProperties.canDelete === false) {
        return NextResponse.json({ detail: "This tag is locked against deletion in ACR" }, { status: 409 });
      }
      if (tagRecent && body?.override_recent !== true) {
        return NextResponse.json(
          { detail: "This tag is recent. Explicit recent override is required." },
          { status: 409 }
        );
      }

      await artifact.deleteTag(tag);
      auditAcr("delete_tag", "success", {
        repository,
        tag,
        digest: tagProperties.digest,
      });
      return NextResponse.json({
        ok: true,
        action: "delete_tag",
        repository,
        tag,
        digest: tagProperties.digest,
      });
    }

    const artifact = repositoryClient.getArtifact(digest);
    const manifest = await artifact.getManifestProperties();
    const manifestProtected =
      isProtectedRef(config, repository, null, manifest.digest) ||
      (manifest.tags ?? []).some((manifestTag) =>
        isProtectedRef(config, repository, manifestTag, manifest.digest)
      );
    const manifestRecent = isRecent(manifest.lastUpdatedOn, config.recentProtectionDays);

    if (manifestProtected) {
      return NextResponse.json({ detail: "This manifest is protected as a deployed image reference" }, { status: 409 });
    }
    if (manifest.canDelete === false) {
      return NextResponse.json({ detail: "This manifest is locked against deletion in ACR" }, { status: 409 });
    }
    if (manifestRecent && body?.override_recent !== true) {
      return NextResponse.json(
        { detail: "This manifest is recent. Explicit recent override is required." },
        { status: 409 }
      );
    }

    await artifact.delete();
    auditAcr("delete_manifest", "success", {
      repository,
      tag: null,
      digest: manifest.digest,
    });
    return NextResponse.json({
      ok: true,
      action: "delete_manifest",
      repository,
      digest: manifest.digest,
      deleted_tags: manifest.tags ?? [],
    });
  } catch (error) {
    const errorInfo = classifyAcrError(error);
    auditAcr(targetType === "tag" ? "delete_tag" : "delete_manifest", "failed", {
      repository,
      tag: targetType === "tag" ? tag : null,
      digest: targetType === "manifest" ? digest : null,
    });
    return NextResponse.json(
      {
        detail: errorInfo.detail,
        diagnostics: buildAcrDiagnostics(config, errorInfo),
      },
      { status: 503 }
    );
  }
}
