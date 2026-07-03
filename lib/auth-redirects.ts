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

export function resolveAuthRedirectOrigin(windowOrigin: string): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trimmed = configured.trim().replace(/\/+$/, "");

  if (trimmed) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.origin;
      }
    } catch {
      // Fall through to the browser origin for local development.
    }
  }

  return windowOrigin;
}
