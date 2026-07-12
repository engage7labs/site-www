import assert from "node:assert/strict";

const { createPkceVerifierStorage } = await import(
  "../lib/supabase-pkce-storage.ts"
);

const values = new Map();
const storage = createPkceVerifierStorage({
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
});

const verifierKey = "sb-dev-auth-token-code-verifier";
const sessionKey = "sb-dev-auth-token";
storage.setItem(verifierKey, "verifier");
storage.setItem(sessionKey, "session-must-not-persist");

assert.equal(storage.getItem(verifierKey), "verifier");
assert.equal(storage.getItem(sessionKey), null);
assert.equal(values.has(sessionKey), false);

storage.removeItem(verifierKey);
assert.equal(storage.getItem(verifierKey), null);

console.log("Google PKCE verifier-storage checks passed.");
