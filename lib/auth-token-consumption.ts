/**
 * Durable one-time auth token ledger.
 *
 * Stores only SHA-256 token hashes in Supabase/Postgres. Raw JWTs and hashes
 * must not be logged.
 */

import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

const TABLE = "auth_token_consumptions";
const DUPLICATE_KEY = "23505";

export type AuthTokenPurpose = "welcome_access" | "password_reset";

export interface AuthTokenConsumptionInput {
  token: string;
  purpose: AuthTokenPurpose;
  subject: string;
  userId?: string | null;
  expiresAt?: Date | null;
}

export interface AuthTokenConsumptionResult {
  ok: boolean;
  alreadyConsumed?: boolean;
  error?: string;
}

export function hashAuthToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function rowFor(input: AuthTokenConsumptionInput) {
  return {
    token_hash: hashAuthToken(input.token),
    purpose: input.purpose,
    subject: input.subject.trim().toLowerCase(),
    user_id: input.userId ?? null,
    expires_at: input.expiresAt?.toISOString() ?? null,
  };
}

function isDuplicate(error: { code?: string; message?: string } | null): boolean {
  return (
    error?.code === DUPLICATE_KEY ||
    (error?.message ?? "").toLowerCase().includes("duplicate")
  );
}

export async function isAuthTokenConsumed(
  token: string,
  purpose: AuthTokenPurpose
): Promise<AuthTokenConsumptionResult> {
  const tokenHash = hashAuthToken(token);
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("token_hash")
    .eq("token_hash", tokenHash)
    .eq("purpose", purpose)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, alreadyConsumed: Boolean(data) };
}

export async function consumeAuthToken(
  input: AuthTokenConsumptionInput
): Promise<AuthTokenConsumptionResult> {
  const { error } = await supabaseAdmin.from(TABLE).insert({
    ...rowFor(input),
    consumed_at: new Date().toISOString(),
  });

  if (!error) return { ok: true };
  if (isDuplicate(error)) return { ok: false, alreadyConsumed: true };
  return { ok: false, error: error.message };
}

export async function claimAuthTokenUse(
  input: AuthTokenConsumptionInput
): Promise<AuthTokenConsumptionResult> {
  const { error } = await supabaseAdmin.from(TABLE).insert({
    ...rowFor(input),
    consumed_at: null,
  });

  if (!error) return { ok: true };
  if (isDuplicate(error)) return { ok: false, alreadyConsumed: true };
  return { ok: false, error: error.message };
}

export async function completeAuthTokenUse(
  token: string,
  purpose: AuthTokenPurpose
): Promise<AuthTokenConsumptionResult> {
  const tokenHash = hashAuthToken(token);
  const { error } = await supabaseAdmin
    .from(TABLE)
    .update({ consumed_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .eq("purpose", purpose);

  if (!error) return { ok: true };
  return { ok: false, error: error.message };
}

export async function releaseAuthTokenUse(
  token: string,
  purpose: AuthTokenPurpose
): Promise<AuthTokenConsumptionResult> {
  const tokenHash = hashAuthToken(token);
  const { error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("token_hash", tokenHash)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  if (!error) return { ok: true };
  return { ok: false, error: error.message };
}
