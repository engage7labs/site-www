"use client";

import { InsightPreview } from "@/components/insights";
import { useAppTheme } from "@/components/providers/app-theme-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { PostAnalysisModal } from "@/components/shared/post-analysis-modal";
import {
  clearProcessingStart,
  elapsedSecondsFrom,
  ProcessingView,
  readProcessingStart,
} from "@/components/shared/processing-view";
import { getAnalysisResult } from "@/lib/api/analysis";
import { ApiClientError } from "@/lib/api/client";
import {
  getOrCreateSessionId,
  sendUserEvent,
} from "@/lib/api/events";
import { createPollingManager } from "@/lib/polling";
import {
  trackAnalysisCompleted,
  trackTeaserViewed,
  trackTrialUnlockCompleted,
} from "@/lib/telemetry";
import {
  claimPublicAnalysis,
  clearPendingPublicClaim,
  PublicClaimBlockedError,
  rememberPendingPublicClaim,
} from "@/lib/public-analysis-claim";
import type { AnalysisResult } from "@/lib/types/analysis";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100; // 5 minutes max

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

// ---------------------------------------------------------------------------
// Shell wrapper with sticky header
// ---------------------------------------------------------------------------

function PageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.result.backToHome}
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}

function FocusedProcessingShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// State views
// ---------------------------------------------------------------------------

function NotFoundView() {
  const { t } = useLocale();
  return (
    <PageShell>
      <motion.div
        {...fadeInUp}
        className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
      >
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.result.error.notFoundTitle}
          </h1>
          <p className="text-muted-foreground max-w-md">
            {t.result.error.notFoundDescription}
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {t.result.backToAnalyze}
        </Link>
      </motion.div>
    </PageShell>
  );
}

function FailedView({ error }: Readonly<{ error: string | null }>) {
  const { t } = useLocale();

  // Transform technical errors into calm messages
  const calmMessage = getCalmErrorMessage(error, t);

  return (
    <PageShell>
      <motion.div
        {...fadeInUp}
        className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
      >
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.result.error.failedTitle}
          </h1>
          <p className="text-muted-foreground max-w-md">{calmMessage}</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {t.result.error.failedHint}
          </p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {t.common.tryAgain}
        </Link>
      </motion.div>
    </PageShell>
  );
}

/**
 * Transform technical errors into user-friendly messages
 */
function getCalmErrorMessage(error: string | null, t: any): string {
  if (!error)
    return t.result.error.calmDefault;

  // Map technical errors to calm messages
  const errorMap: Record<string, string> = {
    timeout:
      t.result.error.calmTimeout,
    interrupted:
      t.result.error.calmInterrupted,
    stalled:
      t.result.error.calmStalled,
    missing:
      t.result.error.calmMissing,
    network:
      t.result.error.calmNetwork,
    invalid:
      t.result.error.calmInvalid,
  };

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(pattern)) {
      return message;
    }
  }

  // Default to generic message
  return t.result.error.description;
}

function FetchErrorView({ message }: Readonly<{ message: string }>) {
  const { t } = useLocale();
  return (
    <PageShell>
      <motion.div
        {...fadeInUp}
        className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
      >
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {t.result.error.title}
          </h1>
          <p className="text-muted-foreground max-w-md">{message}</p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {t.result.backToAnalyze}
        </Link>
      </motion.div>
    </PageShell>
  );
}

function TeaserWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
  }, []);
  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {children}
    </div>
  );
}

function CompletedView({
  result,
  jobId,
  onOpenModal,
}: Readonly<{
  result: AnalysisResult;
  jobId: string;
  onOpenModal: () => void;
}>) {
  const { appTheme } = useAppTheme();
  return (
    <TeaserWrapper>
      <InsightPreview
        result={result}
        jobId={jobId}
        theme={appTheme}
        onOpenModal={onOpenModal}
      />
    </TeaserWrapper>
  );
}

// ---------------------------------------------------------------------------
// Session boundary helper
// ---------------------------------------------------------------------------

/**
 * Returns true if the current session is allowed to view the given job.
 * Claims ownership for pre-boundary jobs (no owner recorded yet).
 */
function verifySessionOwnership(jobId: string): boolean {
  const sessionId = getOrCreateSessionId();
  const ownerKey = `engage7_job_${jobId}`;
  const owner = window.localStorage.getItem(ownerKey);
  if (owner && owner !== sessionId) return false;
  if (!owner) window.localStorage.setItem(ownerKey, sessionId);
  return true;
}

// ---------------------------------------------------------------------------
// Main page — resolves params, manages polling lifecycle
// ---------------------------------------------------------------------------

export default function ResultPage({
  params,
}: Readonly<{
  params: Promise<{ jobId: string }>;
}>) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const processingStartedAtRef = useRef<number | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const pollingManagerRef = useRef<ReturnType<
    typeof createPollingManager
  > | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedFiredRef = useRef(false);
  const seenInProgressRef = useRef(false);
  const polling404CountRef = useRef(0);

  const handleCompletedState = (id: string) => {
    if (!completedFiredRef.current) {
      completedFiredRef.current = true;
      trackAnalysisCompleted(id);
      void sendUserEvent("analysis_completed", { job_id: id });
    }
  };

  const handleOpenModal = useCallback(() => {
    setShowCompletionModal(true);
  }, []);

  const isProtectedHandoff =
    result?.handoff?.status === "protected_timeline_login_required";

  const handleProtectedHandoff = async (): Promise<void> => {
    if (!jobId) return;
    rememberPendingPublicClaim(jobId);

    const sessionResponse = await fetch("/api/auth/session", {
      cache: "no-store",
    });
    if (!sessionResponse.ok) {
      router.push(`/login?next=/portal&claim_job_id=${encodeURIComponent(jobId)}`);
      return;
    }

    try {
      await claimPublicAnalysis(jobId, { deferToast: true });
      clearPendingPublicClaim();
      router.push("/portal");
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? t.result.protectedHandoffModal.blocked
          : t.result.protectedHandoffModal.genericError,
      );
    }
  };

  const handleModalDownload = () => {
    if (!jobId || !result?.artifacts?.pdf_available) return;
    window.open(
      `/api/proxy/result/${jobId}/pdf`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleModalEmail = async (
    email: string,
    consent: boolean
  ): Promise<void> => {
    if (!jobId) return;
    rememberPendingPublicClaim(jobId, email);
    const analysisData = result
      ? {
          report_label: "Health Analysis",
          summary: result.summary,
          highlights: result.highlights,
          sections: result.sections,
        }
      : undefined;

    const response = await fetch("/api/proxy/users/create-or-get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        consent,
        preferred_locale: locale,
        job_id: jobId,
        analysis_data: analysisData,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        (data as { detail?: string }).detail ||
          "Failed to create account. Please try again."
      );
    }

    try {
      await claimPublicAnalysis(jobId, { deferToast: true });
      clearPendingPublicClaim();
    } catch (err) {
      if (err instanceof PublicClaimBlockedError && err.status === "claim_email_mismatch") {
        throw new Error(t.portal.shell.claimEmailMismatch);
      }
      throw new Error(
        err instanceof Error
          ? `Your account is ready, but we could not import this analysis yet: ${err.message}`
          : "Your account is ready, but we could not import this analysis yet. Please try again from the Portal.",
      );
    }

    trackTrialUnlockCompleted(jobId);

    // Sprint 37.8: surface email-delivery outcome from the proxy without
    // blocking the portal redirect. Show a calm warning toast if the
    // welcome/magic-link email failed; the user is still authenticated
    // via the session cookie set by the proxy.
    const data = (await response.json().catch(() => ({}))) as {
      email_delivery?: { status?: string; reason?: string };
    };
    const status = data.email_delivery?.status;
    if (status && status !== "sent" && status !== "skipped_existing_user") {
      const { toast } = await import("sonner");
      toast.warning(
        t.result.preview.fullReport.emailWarning
      );
    }
  };

  const handleModalShare = async (): Promise<void> => {
    const shareUrl = "https://www.engage7.ie";

    // Prefer native share sheet (mobile + modern desktop)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Engage7", url: shareUrl });
        void sendUserEvent("share_clicked", {
          job_id: jobId ?? undefined,
          metadata: { channel: "native_share", url: shareUrl },
        });
        return;
      } catch (err) {
        // User dismissed the share sheet — propagate so modal shows no feedback
        if (err instanceof DOMException && err.name === "AbortError") throw err;
        // Other navigator.share failures — try clipboard fallback
      }
    }

    // Clipboard fallback — let errors propagate so modal doesn't show false feedback
    await navigator.clipboard.writeText(shareUrl);
    void sendUserEvent("share_clicked", {
      job_id: jobId ?? undefined,
      metadata: { channel: "clipboard", url: shareUrl },
    });
  };

  useEffect(() => {
    let mounted = true;

    const createPollCallback = (id: string) => async () => {
      try {
        const updated = await getAnalysisResult(id);
        polling404CountRef.current = 0;
        if (!mounted) return updated;

        setResult(updated);
        if (updated.status === "queued" || updated.status === "processing") {
          seenInProgressRef.current = true;
        }

        if (updated.status === "completed" && !completedFiredRef.current) {
          clearProcessingStart();
          handleCompletedState(id);
        }
        return updated;
      } catch (error) {
        const is404 =
          error instanceof ApiClientError && error.statusCode === 404;

        if (is404 && seenInProgressRef.current) {
          polling404CountRef.current += 1;
          if (polling404CountRef.current >= 3) {
            return {
              job_id: id,
              status: "failed",
              summary: null,
              highlights: [],
              sections: null,
              artifacts: null,
              error:
                "Analysis state was lost after a service interruption. Please retry your upload.",
            } as AnalysisResult;
          }
        }
        throw error;
      }
    };

    const handleInitError = (err: unknown) => {
      if (err instanceof ApiClientError && err.statusCode === 404) {
        setIsNotFound(true);
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to load results";
      setFetchError(message);
    };

    const init = async () => {
      const { jobId: id } = await params;
      if (!mounted) return;

      setJobId(id);

      // ── Session boundary ──
      if (!verifySessionOwnership(id)) {
        setIsNotFound(true);
        return;
      }

      // Telemetry: teaser viewed (funnel step 4)
      trackTeaserViewed(id);

      // Reset completed flag for new job
      completedFiredRef.current = false;
      seenInProgressRef.current = false;
      polling404CountRef.current = 0;

      // Start elapsed timer
      processingStartedAtRef.current = readProcessingStart() ?? Date.now();
      setElapsedSeconds(elapsedSecondsFrom(processingStartedAtRef.current));
      timerRef.current = setInterval(() => {
        if (mounted) {
          setElapsedSeconds(elapsedSecondsFrom(processingStartedAtRef.current));
        }
      }, 1000);

      // Create polling manager
      const pollingManager = createPollingManager({
        maxPolls: MAX_POLLS,
        intervalMs: POLL_INTERVAL_MS,
        jobId: id,
      });
      pollingManagerRef.current = pollingManager;

      // Initial fetch with error tracking
      try {
        const data = await getAnalysisResult(id);
        if (!mounted) return;

        setResult(data);

        const isInProgress =
          data.status === "queued" || data.status === "processing";
        if (isInProgress) {
          seenInProgressRef.current = true;
        }

        // If already terminal, stop polling
        if (data.status === "completed") {
          clearProcessingStart();
          handleCompletedState(id);
          return;
        }

        if (data.status === "failed") {
          clearProcessingStart();
          return;
        }

        // Start polling for non-terminal states
        await pollingManager.start(createPollCallback(id));

        const pollingState = pollingManager.getState();
        if (mounted && pollingState.status === "timeout") {
          setResult((prev) => ({
            job_id: id,
            status: "failed",
            summary: prev?.summary ?? null,
            highlights: prev?.highlights ?? [],
            sections: prev?.sections ?? null,
            artifacts: prev?.artifacts ?? null,
            error:
              "Analysis stalled and did not reach a terminal state in time. Please retry your upload.",
          }));
        }
      } catch (err) {
        if (!mounted) return;
        handleInitError(err);
      }
    };

    init();

    // Cleanup
    return () => {
      mounted = false;
      if (pollingManagerRef.current) {
        pollingManagerRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [params]);

  // Initial loading state — show analyzing screen immediately with live timer
  if (!result && !isNotFound && !fetchError) {
    return (
      <FocusedProcessingShell>
        <ProcessingView phase="analyzing" elapsedSeconds={elapsedSeconds} />
      </FocusedProcessingShell>
    );
  }

  if (isNotFound) {
    return <NotFoundView />;
  }

  if (fetchError && !result) {
    return <FetchErrorView message={fetchError} />;
  }

  if (!result) return null;

  if (result.status === "failed") {
    return <FailedView error={result.error} />;
  }

  // --- SPRINT 22.0.5: Only show teaser/insight when payload is truly ready ---
  const isTeaserReady =
    result.status === "completed" &&
    result.sections &&
    typeof result.sections === "object" &&
    Object.keys(result.sections).length > 0 &&
    result.summary &&
    result.highlights && Array.isArray(result.highlights);

  if (!isTeaserReady) {
    // Show processing state until teaser payload is truly ready
    return (
      <FocusedProcessingShell>
        <ProcessingView
          phase="analyzing"
          elapsedSeconds={elapsedSeconds}
          delayed={elapsedSeconds > 60}
        />
      </FocusedProcessingShell>
    );
  }

  return (
    <>
      <CompletedView
        result={result}
        jobId={jobId!}
        onOpenModal={handleOpenModal}
      />
      <PostAnalysisModal
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onDownload={handleModalDownload}
        onFeedback={() => undefined}
        onEmailSubmit={handleModalEmail}
        onShare={handleModalShare}
        mode={isProtectedHandoff ? "protected-handoff" : "premium"}
        onProtectedHandoff={handleProtectedHandoff}
      />
    </>
  );
}
