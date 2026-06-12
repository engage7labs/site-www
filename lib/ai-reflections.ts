export type AiValidationStatus = "passed" | "warning" | "blocked" | "failed";

export interface AiNarrative {
  headline: string;
  longitudinal_interpretation: string;
  why_it_matters: string;
  suggested_next_step: string;
  evidence_used: string[];
  confidence_note: string;
  safety_note: string;
}

export interface AiReflectionArtifact {
  artifact_id: number;
  created_at: string | null;
  feature_key: string;
  analysis_id: string | null;
  input_evidence_pack_hash: string | null;
  input_contract_version: string | null;
  locale: string;
  provider: string;
  model: string;
  gate_mode: string;
  validation_status: AiValidationStatus;
  validation_warnings: string[];
  validation_errors: string[];
  would_pass_restricted: boolean;
  approx_input_tokens?: number | null;
  approx_output_tokens?: number | null;
  narrative: AiNarrative;
  report?: {
    job_id: string | null;
    report_label: string | null;
    created_at: string | null;
  };
}

export interface AiReflectionMetadata {
  feature_key?: string;
  analysis_id?: string | null;
  input_evidence_pack_hash?: string | null;
  locale?: string;
  gate_mode?: string | null;
  validation_status?: AiValidationStatus | null;
  validation_warnings: string[];
  validation_errors: string[];
  would_pass_restricted?: boolean | null;
  artifact_id?: number | string | null;
  created_at?: string | null;
}

export interface AiReflectionContext {
  featureKey: string;
  analysisId?: string | number | null;
  evidencePackHash?: string | null;
  locale: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringish(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function boolish(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "true", "1"].includes(normalized)) return true;
    if (["no", "false", "0"].includes(normalized)) return false;
  }
  return null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim());
}

export function normalizeAiValidationStatus(value: unknown): AiValidationStatus | null {
  return value === "passed" || value === "warning" || value === "blocked" || value === "failed"
    ? value
    : null;
}

function stringField(source: Record<string, unknown>, key: keyof AiNarrative): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeCandidate(candidate: unknown): AiNarrative | null {
  if (!isRecord(candidate)) return null;
  const headline = stringField(candidate, "headline");
  const longitudinal = stringField(candidate, "longitudinal_interpretation");
  const why = stringField(candidate, "why_it_matters");
  const next = stringField(candidate, "suggested_next_step");
  const confidence = stringField(candidate, "confidence_note");
  const safety = stringField(candidate, "safety_note");
  const evidence = candidate.evidence_used;
  if (
    !headline ||
    !longitudinal ||
    !why ||
    !next ||
    !confidence ||
    !safety ||
    !Array.isArray(evidence)
  ) {
    return null;
  }
  return {
    headline,
    longitudinal_interpretation: longitudinal,
    why_it_matters: why,
    suggested_next_step: next,
    confidence_note: confidence,
    safety_note: safety,
    evidence_used: evidence
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .map((item) => item.trim())
      .slice(0, 5),
  };
}

export function extractAiNarrativeViewModel(source: unknown): AiNarrative | null {
  if (!isRecord(source)) return null;
  const renderedOutput = isRecord(source.rendered_output) ? source.rendered_output : null;
  const renderedOutputJson = isRecord(source.rendered_output_json)
    ? source.rendered_output_json
    : null;
  const artifact = isRecord(source.artifact) ? source.artifact : null;
  const artifactRendered = artifact && isRecord(artifact.rendered_output)
    ? artifact.rendered_output
    : null;

  const candidates = [
    source.narrative,
    renderedOutput?.narrative,
    source.normalized_output,
    renderedOutputJson?.narrative,
    source.normalized_output_json,
    artifact?.narrative,
    artifactRendered?.narrative,
    artifact?.normalized_output,
    source,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (normalized) return normalized;
  }
  return null;
}

export function extractAiReflectionMetadata(source: unknown): AiReflectionMetadata | null {
  if (!isRecord(source)) return null;
  const metadata = isRecord(source.metadata) ? source.metadata : null;
  const artifact = isRecord(source.artifact) ? source.artifact : null;
  const candidate = metadata ?? artifact ?? source;
  const status = normalizeAiValidationStatus(candidate.validation_status);

  return {
    feature_key: stringish(candidate.feature_key) ?? undefined,
    analysis_id: stringish(candidate.analysis_id),
    input_evidence_pack_hash: stringish(candidate.input_evidence_pack_hash),
    locale: stringish(candidate.locale) ?? undefined,
    gate_mode: stringish(candidate.gate_mode),
    validation_status: status,
    validation_warnings: stringList(candidate.validation_warnings),
    validation_errors: stringList(candidate.validation_errors),
    would_pass_restricted: boolish(candidate.would_pass_restricted),
    artifact_id: stringish(candidate.artifact_id),
    created_at: stringish(candidate.created_at),
  };
}

export function isRenderableAiReflection(metadata: AiReflectionMetadata | null): boolean {
  if (!metadata?.validation_status) return false;
  if (metadata.validation_status === "passed") return true;
  return (
    metadata.validation_status === "warning" &&
    metadata.gate_mode === "monitor" &&
    metadata.validation_errors.length === 0
  );
}

export function isCurrentAiReflection(
  metadata: AiReflectionMetadata | null,
  context: AiReflectionContext,
): boolean {
  if (!metadata) return false;
  const analysisId = stringish(context.analysisId);
  return Boolean(
    metadata.feature_key === context.featureKey &&
      metadata.locale === context.locale &&
      (!analysisId || metadata.analysis_id === analysisId) &&
      (!context.evidencePackHash ||
        metadata.input_evidence_pack_hash === context.evidencePackHash),
  );
}
