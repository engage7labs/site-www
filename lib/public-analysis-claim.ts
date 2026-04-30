"use client";

const PENDING_CLAIM_KEY = "engage7_pending_public_claim_job_id";

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

export async function claimPublicAnalysis(jobId: string): Promise<{
  claimed: boolean;
  already_claimed: boolean;
  user_analysis_id: string;
  job_id: string;
  feature_timeline_status: string;
  portal_data_status?: unknown;
}> {
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

  return res.json();
}

export async function claimPendingPublicAnalysis(): Promise<string | null> {
  const jobId = readPendingPublicClaim();
  if (!jobId) return null;
  await claimPublicAnalysis(jobId);
  clearPendingPublicClaim();
  return jobId;
}
