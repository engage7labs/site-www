"use client";

const PENDING_CLAIM_KEY = "engage7_pending_public_claim_job_id";
const CONSUMED_CLAIMS_KEY = "engage7_consumed_public_claim_job_ids";

export type PublicClaimStatus = "imported_now" | "already_imported" | string;

export interface PublicClaimResult {
  claimed: boolean;
  already_claimed: boolean;
  user_analysis_id: string;
  job_id: string;
  feature_timeline_status: string;
  handoff_status?: string;
  claim_status?: PublicClaimStatus;
  portal_data_status?: unknown;
}

export function rememberPendingPublicClaim(jobId: string): void {
  if (!jobId) return;
  window.sessionStorage.setItem(PENDING_CLAIM_KEY, jobId);
}

export function readPendingPublicClaim(): string | null {
  return window.sessionStorage.getItem(PENDING_CLAIM_KEY);
}

export function clearPendingPublicClaim(): void {
  window.sessionStorage.removeItem(PENDING_CLAIM_KEY);
}

function readConsumedPublicClaims(): Set<string> {
  try {
    const raw = window.localStorage.getItem(CONSUMED_CLAIMS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function markPublicClaimConsumed(jobId: string): void {
  if (!jobId) return;
  const consumed = readConsumedPublicClaims();
  consumed.add(jobId);
  window.localStorage.setItem(CONSUMED_CLAIMS_KEY, JSON.stringify([...consumed].slice(-50)));
  if (readPendingPublicClaim() === jobId) {
    clearPendingPublicClaim();
  }
}

export function hasConsumedPublicClaim(jobId: string): boolean {
  if (!jobId) return false;
  return readConsumedPublicClaims().has(jobId);
}

export async function claimPublicAnalysis(jobId: string): Promise<PublicClaimResult> {
  const res = await fetch("/api/proxy/users/claim-public-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      detail?: string;
      error?: string;
    };
    throw new Error(
      data.detail ??
        data.error ??
        "We could not import this public analysis yet.",
    );
  }

  const result = (await res.json()) as PublicClaimResult;
  if (result.claim_status === "already_imported" || result.claim_status === "imported_now") {
    markPublicClaimConsumed(jobId);
  }
  return result;
}

export async function claimPendingPublicAnalysis(): Promise<PublicClaimResult | null> {
  const jobId = readPendingPublicClaim();
  if (!jobId) return null;
  if (hasConsumedPublicClaim(jobId)) {
    clearPendingPublicClaim();
    return null;
  }
  return claimPublicAnalysis(jobId);
}
