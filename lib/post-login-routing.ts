export function postLoginDestination({
  requireAdmin,
  redirectTo,
}: {
  requireAdmin: boolean;
  redirectTo: string;
}): string {
  return requireAdmin ? "/admin" : redirectTo;
}
