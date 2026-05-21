"use client";

const PENDING_CLAIM_KEY = "engage7_pending_public_claim_job_id";
const CONSUMED_CLAIMS_KEY = "engage7_consumed_public_claim_job_ids";
const TERMINAL_CLAIM_PREFIX = "engage7.publicClaim.consumed.";
const TOAST_QUEUE_KEY = "engage7.publicClaim.toastQueue";

export type PublicClaimStatus = "imported_now" | "already_imported" | string;
export type PublicClaimFinalStatus =
  | "imported_now"
  | "already_imported"
  | "blocked"
  | "failed";

interface PublicClaimTerminalRecord {
  final_status: PublicClaimFinalStatus;
  timestamp: number;
  shown_toast: boolean;
}

export interface PublicClaimToastDecision {
  job_id: string;
  final_status: PublicClaimFinalStatus;
}

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

function terminalClaimKey(jobId: string): string {
  return `${TERMINAL_CLAIM_PREFIX}${jobId}`;
}

function normalizeFinalStatus(status: PublicClaimStatus | undefined): PublicClaimFinalStatus | null {
  if (status === "imported_now" || status === "already_imported") return status;
  if (status === "blocked" || status === "failed") return status;
  return null;
}

function readPublicClaimTerminal(jobId: string): PublicClaimTerminalRecord | null {
  if (!jobId) return null;
  try {
    const raw = window.localStorage.getItem(terminalClaimKey(jobId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublicClaimTerminalRecord>;
    const finalStatus = normalizeFinalStatus(parsed.final_status);
    if (!finalStatus) return null;
    return {
      final_status: finalStatus,
      timestamp: typeof parsed.timestamp === "number" ? parsed.timestamp : Date.now(),
      shown_toast: parsed.shown_toast === true,
    };
  } catch {
    return null;
  }
}

function writePublicClaimTerminal(jobId: string, record: PublicClaimTerminalRecord): void {
  window.localStorage.setItem(terminalClaimKey(jobId), JSON.stringify(record));
}

function readToastQueue(): string[] {
  try {
    const raw = window.localStorage.getItem(TOAST_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeToastQueue(jobIds: string[]): void {
  window.localStorage.setItem(TOAST_QUEUE_KEY, JSON.stringify([...new Set(jobIds)].slice(-20)));
}

function queuePublicClaimToast(jobId: string): void {
  const terminal = readPublicClaimTerminal(jobId);
  if (!jobId || !terminal || terminal.shown_toast) return;
  writeToastQueue([...readToastQueue(), jobId]);
}

function unqueuePublicClaimToast(jobId: string): void {
  writeToastQueue(readToastQueue().filter((item) => item !== jobId));
}

export function readQueuedPublicClaimToast(): string | null {
  return readToastQueue().find((jobId) => {
    const terminal = readPublicClaimTerminal(jobId);
    return terminal && !terminal.shown_toast;
  }) ?? null;
}

export function readPublicClaimToastCandidateJobId(): string | null {
  return readPendingPublicClaim() ?? readQueuedPublicClaimToast();
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

export function recordPublicClaimTerminal(
  jobId: string,
  status: PublicClaimStatus | undefined,
): PublicClaimTerminalRecord | null {
  const finalStatus = normalizeFinalStatus(status);
  if (!jobId || !finalStatus) return null;
  const existing = readPublicClaimTerminal(jobId);
  if (existing) return existing;
  const record: PublicClaimTerminalRecord = {
    final_status: finalStatus,
    timestamp: Date.now(),
    shown_toast: false,
  };
  writePublicClaimTerminal(jobId, record);
  const consumed = readConsumedPublicClaims();
  consumed.add(jobId);
  window.localStorage.setItem(CONSUMED_CLAIMS_KEY, JSON.stringify([...consumed].slice(-50)));
  return record;
}

export function markPublicClaimConsumed(
  jobId: string,
  status: PublicClaimStatus = "already_imported",
): void {
  if (!jobId) return;
  recordPublicClaimTerminal(jobId, status);
  if (readPendingPublicClaim() === jobId) {
    clearPendingPublicClaim();
  }
}

export function hasConsumedPublicClaim(jobId: string): boolean {
  if (!jobId) return false;
  return Boolean(readPublicClaimTerminal(jobId)) || readConsumedPublicClaims().has(jobId);
}

export function consumePublicClaimToast(
  jobId: string,
  status?: PublicClaimStatus,
): PublicClaimToastDecision | null {
  const terminal = status
    ? recordPublicClaimTerminal(jobId, status)
    : readPublicClaimTerminal(jobId);
  if (!terminal) return null;
  if (terminal.shown_toast) {
    unqueuePublicClaimToast(jobId);
    if (readPendingPublicClaim() === jobId) {
      clearPendingPublicClaim();
    }
    return null;
  }

  writePublicClaimTerminal(jobId, { ...terminal, shown_toast: true });
  unqueuePublicClaimToast(jobId);
  if (readPendingPublicClaim() === jobId) {
    clearPendingPublicClaim();
  }
  return { job_id: jobId, final_status: terminal.final_status };
}

export async function claimPublicAnalysis(
  jobId: string,
  options: { deferToast?: boolean } = {},
): Promise<PublicClaimResult> {
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
    recordPublicClaimTerminal(jobId, result.claim_status);
    if (options.deferToast) {
      queuePublicClaimToast(jobId);
    } else if (readPendingPublicClaim() === jobId) {
      clearPendingPublicClaim();
    }
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

export async function consumePendingPublicClaimForToast(): Promise<PublicClaimToastDecision | null> {
  const pendingJobId = readPendingPublicClaim();
  if (pendingJobId) {
    if (hasConsumedPublicClaim(pendingJobId)) {
      const decision = consumePublicClaimToast(pendingJobId);
      if (!decision && readPendingPublicClaim() === pendingJobId) {
        clearPendingPublicClaim();
      }
      return decision;
    }
    const result = await claimPublicAnalysis(pendingJobId);
    return consumePublicClaimToast(result.job_id || pendingJobId, result.claim_status);
  }

  const queuedJobId = readQueuedPublicClaimToast();
  if (queuedJobId) {
    return consumePublicClaimToast(queuedJobId);
  }
  return null;
}
