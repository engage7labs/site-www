export interface LinkedAuthAccount {
  provider: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
}

interface AuthIdentityLike {
  provider?: unknown;
  identity_data?: Record<string, unknown> | null;
  created_at?: unknown;
  last_sign_in_at?: unknown;
}

interface AuthUserLike {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  identities?: AuthIdentityLike[] | null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function providerRank(provider: string): number {
  return ["email", "apple", "google"].indexOf(provider);
}

/** Convert Supabase Auth metadata into the small, safe admin UI contract. */
export function linkedAuthAccountsFromUser(user: AuthUserLike): LinkedAuthAccount[] {
  const accounts: LinkedAuthAccount[] = [];
  const representedProviders = new Set<string>();

  for (const identity of user.identities ?? []) {
    const provider = optionalString(identity.provider)?.toLowerCase();
    if (!provider) continue;
    representedProviders.add(provider);
    accounts.push({
      provider,
      email:
        optionalString(identity.identity_data?.email)?.toLowerCase() ??
        (provider === "email" ? optionalString(user.email)?.toLowerCase() ?? null : null),
      created_at: optionalString(identity.created_at),
      last_sign_in_at: optionalString(identity.last_sign_in_at),
    });
  }

  const metadataProviders = user.app_metadata?.providers;
  const providers = new Set<string>();
  if (Array.isArray(metadataProviders)) {
    for (const value of metadataProviders) {
      const provider = optionalString(value)?.toLowerCase();
      if (provider) providers.add(provider);
    }
  }
  const primaryProvider = optionalString(user.app_metadata?.provider)?.toLowerCase();
  if (primaryProvider) providers.add(primaryProvider);

  for (const provider of providers) {
    if (representedProviders.has(provider)) continue;
    accounts.push({
      provider,
      email: provider === "email" ? optionalString(user.email)?.toLowerCase() ?? null : null,
      created_at: null,
      last_sign_in_at: null,
    });
  }

  return accounts.sort((left, right) => {
    const leftRank = providerRank(left.provider);
    const rightRank = providerRank(right.provider);
    if (leftRank !== rightRank) {
      if (leftRank === -1) return 1;
      if (rightRank === -1) return -1;
      return leftRank - rightRank;
    }
    return left.provider.localeCompare(right.provider);
  });
}
