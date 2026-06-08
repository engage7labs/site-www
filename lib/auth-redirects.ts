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
