export type PublicHeaderCta =
  | { href: "/login?next=/onboarding"; kind: "get-started" }
  | { href: "/portal"; kind: "portal" };

export function resolvePublicHeaderCta(
  hasValidSession: boolean,
): PublicHeaderCta {
  return hasValidSession
    ? { href: "/portal", kind: "portal" }
    : { href: "/login?next=/onboarding", kind: "get-started" };
}
