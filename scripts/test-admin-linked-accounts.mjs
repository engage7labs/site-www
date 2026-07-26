import assert from "node:assert/strict";
import { linkedAuthAccountsFromUser } from "../lib/linked-auth-accounts.ts";

const accounts = linkedAuthAccountsFromUser({
  email: "person@example.com",
  app_metadata: { providers: ["email", "google", "apple"] },
  identities: [
    {
      provider: "google",
      identity_data: { email: "Person@Example.com", avatar_url: "private" },
      created_at: "2026-01-02T03:04:05Z",
      last_sign_in_at: "2026-07-20T10:00:00Z",
    },
    {
      provider: "email",
      identity_data: {},
      created_at: "2025-10-01T00:00:00Z",
    },
  ],
});

assert.deepEqual(accounts, [
  {
    provider: "email",
    email: "person@example.com",
    created_at: "2025-10-01T00:00:00Z",
    last_sign_in_at: null,
  },
  {
    provider: "apple",
    email: null,
    created_at: null,
    last_sign_in_at: null,
  },
  {
    provider: "google",
    email: "person@example.com",
    created_at: "2026-01-02T03:04:05Z",
    last_sign_in_at: "2026-07-20T10:00:00Z",
  },
]);

assert.equal(JSON.stringify(accounts).includes("avatar_url"), false);
console.log("admin linked accounts contract: ok");
