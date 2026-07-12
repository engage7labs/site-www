export const PASSWORD_ENABLED_METADATA_KEY = "engage7_password_enabled";

export function hasPasswordSignInMethod(user: {
  app_metadata?: { providers?: unknown } | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{ provider?: string }> | null;
}): boolean {
  const providers = new Set<string>(
    Array.isArray(user.app_metadata?.providers)
      ? user.app_metadata.providers.filter(
          (provider): provider is string => typeof provider === "string",
        )
      : [],
  );
  for (const identity of user.identities ?? []) {
    if (identity.provider) providers.add(identity.provider);
  }
  return (
    providers.has("email") ||
    user.user_metadata?.[PASSWORD_ENABLED_METADATA_KEY] === true
  );
}
