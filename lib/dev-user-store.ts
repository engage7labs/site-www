/**
 * dev-user-store.ts
 *
 * In-memory user store for local development when the Python API is not
 * running or has not yet been restarted with the new /auth routes.
 *
 * State survives within a single Next.js dev-server session but is cleared
 * on server restart. This is intentional — it is purely for local validation.
 *
 * This module is never loaded in production (guarded by NODE_ENV checks at
 * call sites). It does NOT replace the Python API's SQLite/Azure SQL store.
 */

import bcrypt from "bcryptjs";

const _users = new Map<string, string>(); // email (normalised) -> bcrypt hash

export const devUserStore = {
  async register(email: string, password: string): Promise<"ok" | "conflict"> {
    const key = email.toLowerCase().trim();
    if (_users.has(key)) return "conflict";
    const hash = await bcrypt.hash(password, 12);
    _users.set(key, hash);
    return "ok";
  },

  async verify(email: string, password: string): Promise<boolean> {
    const hash = _users.get(email.toLowerCase().trim());
    if (!hash) return false;
    return bcrypt.compare(password, hash);
  },
};
