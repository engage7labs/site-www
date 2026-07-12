export type PasswordUpdateFailure = {
  errorCode: "weak_password" | "password_update_failed";
  status: 422 | 409;
};

export function classifyPasswordUpdateFailure(error: {
  code?: unknown;
} | null): PasswordUpdateFailure {
  return error?.code === "weak_password"
    ? { errorCode: "weak_password", status: 422 }
    : { errorCode: "password_update_failed", status: 409 };
}
