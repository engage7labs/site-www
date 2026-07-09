const DEFAULT_AUTH_REDIRECT = "/portal";

export function safeAuthRedirectPath(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_AUTH_REDIRECT;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }

  try {
    const parsed = new URL(trimmed, "http://engage7.local");
    if (parsed.origin !== "http://engage7.local") return DEFAULT_AUTH_REDIRECT;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT;
  }
}

export function buildAuthCallbackUrl(origin: string, nextPath: string): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeAuthRedirectPath(nextPath));
  return callback.toString();
}

function parseHttpOrigin(value: string): string | null {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.origin;
    }
  } catch {
    return null;
  }

  return null;
}

function isLocalOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function resolveAuthRedirectOrigin(windowOrigin: string): string {
  const browserOrigin = parseHttpOrigin(windowOrigin) ?? windowOrigin;
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const configuredOrigin = parseHttpOrigin(configured);

  if (
    configuredOrigin &&
    (!isLocalOrigin(configuredOrigin) || isLocalOrigin(browserOrigin))
  ) {
    return configuredOrigin;
  }

  return browserOrigin;
}
