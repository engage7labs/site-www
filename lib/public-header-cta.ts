export type PublicHeaderSecondaryCta =
  | { href: "/login"; kind: "sign-in" }
  | { href: "/portal"; kind: "portal" };

export function resolvePublicHeaderSecondaryCta(
  hasValidSession: boolean,
): PublicHeaderSecondaryCta {
  return hasValidSession
    ? { href: "/portal", kind: "portal" }
    : { href: "/login", kind: "sign-in" };
}
