export type AuthIntent = "login" | "register";

export function shouldCreateUserForAuthIntent(intent: AuthIntent): boolean {
  return intent === "register";
}

export function preservesCanonicalUser(
  existingUserId: string | null | undefined,
  authenticatedUserId: string,
): boolean {
  return !existingUserId || existingUserId === authenticatedUserId;
}
