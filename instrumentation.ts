export async function register() {
  const publicApiBaseUrlKey = ["NEXT_PUBLIC", "API_BASE_URL"].join("_");
  const apiBaseUrl = process.env[publicApiBaseUrlKey] ?? null;

  console.log("[env-debug] NEXT_PUBLIC_API_BASE_URL at server startup:", {
    value: apiBaseUrl,
    isSet: Boolean(apiBaseUrl),
  });
}
