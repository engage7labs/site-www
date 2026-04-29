const PRODUCTION_APP_URL = "https://www.engage7.ie";
const DEVELOPMENT_APP_URL = "http://localhost:3000";

export interface CanonicalAppUrlResolution {
  appUrl: string;
  source: string;
}

export interface MagicLinkRedirectResolution extends CanonicalAppUrlResolution {
  redirectTo: string;
  redirectHost: string;
  redirectPath: string;
}

function normalizeAppUrl(value: string): string | null {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isProductionRuntime(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}

function isVercelDeploymentUrl(appUrl: string): boolean {
  return new URL(appUrl).hostname.endsWith(".vercel.app");
}

function isBareProductionHost(appUrl: string): boolean {
  return new URL(appUrl).hostname === "engage7.ie";
}

export function resolveCanonicalAppUrl(): CanonicalAppUrlResolution {
  const configured = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL ?? "");

  if (configured) {
    if (
      isProductionRuntime() &&
      (isVercelDeploymentUrl(configured) || isBareProductionHost(configured))
    ) {
      return {
        appUrl: PRODUCTION_APP_URL,
        source: isVercelDeploymentUrl(configured)
          ? "NEXT_PUBLIC_APP_URL_REJECTED_VERCEL_PRODUCTION_FALLBACK"
          : "NEXT_PUBLIC_APP_URL_REJECTED_BARE_DOMAIN_PRODUCTION_FALLBACK",
      };
    }

    return {
      appUrl: configured,
      source: "NEXT_PUBLIC_APP_URL",
    };
  }

  if (isProductionRuntime()) {
    return {
      appUrl: PRODUCTION_APP_URL,
      source: "PRODUCTION_FALLBACK",
    };
  }

  return {
    appUrl: DEVELOPMENT_APP_URL,
    source: "DEVELOPMENT_FALLBACK",
  };
}

export function resolveMagicLinkRedirect(): MagicLinkRedirectResolution {
  const resolution = resolveCanonicalAppUrl();
  const redirectTo = `${resolution.appUrl}/auth/callback`;
  const url = new URL(redirectTo);

  return {
    ...resolution,
    redirectTo,
    redirectHost: url.hostname,
    redirectPath: url.pathname,
  };
}
