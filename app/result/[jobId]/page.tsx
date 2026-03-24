"use client";

import { InsightPreview } from "@/components/insights";
import { useAppTheme } from "@/components/providers/app-theme-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { getAnalysisResult } from "@/lib/api/analysis";
import { ApiClientError } from "@/lib/api/client";
import { createPollingManager } from "@/lib/polling";
import {
  trackAnalysisCompleted,
  trackAnalysisStarted,
  trackResultPageViewed,
} from "@/lib/telemetry";
import type { AnalysisResult } from "@/lib/types/analysis";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

function PageShell({ children }: { children: React.ReactNode }) {
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

// ---------------------------------------------------------------------------
// State views
// ---------------------------------------------------------------------------

function LoadingView() {
  const { t } = useLocale();
  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <p className="text-muted-foreground">{t.result.loading}</p>
      </div>
    </PageShell>
  );
}

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
            Result Not Found
          </h1>
          <p className="text-muted-foreground max-w-md">
            This analysis job could not be found. It may have expired or the
            link is incorrect.
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

function ProcessingView({
  result,
  elapsedSeconds,
}: {
  result: AnalysisResult;
  elapsedSeconds: number;
}) {
  const { t } = useLocale();
  const statusLabel =
    result.status === "queued"
      ? t.result.status.pending
      : t.result.status.processing;

  // Show calm message if taking longer than 60 seconds
  const isDelayed = elapsedSeconds > 60;

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <PageShell>
      <motion.div
        {...fadeInUp}
        className="flex flex-col items-center justify-center py-24 space-y-6 text-center"
      >
        <div className="relative flex items-center justify-center">
          <div className="h-20 w-20 rounded-full border-4 border-accent/20" />
          <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <span className="absolute text-sm font-mono font-semibold text-foreground">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {isDelayed ? "Still working on your analysis…" : statusLabel}
          </h1>
          <p className="text-muted-foreground max-w-md">
            {isDelayed
              ? "This is taking longer than expected, but we're still processing your data."
              : "Your analysis is underway. This page updates automatically."}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Typically completes in 30-90 seconds</span>
        </div>
      </motion.div>
    </PageShell>
  );
}

function FailedView({ error }: { error: string | null }) {
  const { t } = useLocale();

  // Transform technical errors into calm messages
  const calmMessage = getCalmErrorMessage(error, t);

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
          <p className="text-muted-foreground max-w-md">{calmMessage}</p>
        </div>
        <Link
          href="/analyze"
          className="inline-flex items-center px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {t.result.error.retryButton}
        </Link>
      </motion.div>
    </PageShell>
  );
}

/**
 * Transform technical errors into user-friendly messages
 */
function getCalmErrorMessage(error: string | null, t: any): string {
  if (!error) return t.result.error.description;

  // Map technical errors to calm messages
  const errorMap: Record<string, string> = {
    timeout: "Your analysis took too long to process. Please try again.",
    network:
      "We couldn't connect to process your data. Please check your connection and try again.",
    invalid:
      "The data provided couldn't be processed. Please check your file and try again.",
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

function FetchErrorView({ message }: { message: string }) {
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

function CompletedView({
  result,
  jobId,
}: {
  result: AnalysisResult;
  jobId: string;
}) {
  const { appTheme } = useAppTheme();
  return <InsightPreview result={result} jobId={jobId} theme={appTheme} />;
}

// ---------------------------------------------------------------------------
// Main page — resolves params, manages polling lifecycle
// ---------------------------------------------------------------------------

export default function ResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollingManagerRef = useRef<ReturnType<
    typeof createPollingManager
  > | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedFiredRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { jobId: id } = await params;
      if (!mounted) return;

      setJobId(id);

      // Telemetry: result page viewed
      trackResultPageViewed(id);

      // Reset completed flag for new job
      completedFiredRef.current = false;

      // Start elapsed timer
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        if (mounted) {
          setElapsedSeconds((prev) => prev + 1);
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

        // Track initial state
        if (data.status === "queued" || data.status === "processing") {
          trackAnalysisStarted(id);
        }

        // If already terminal, stop polling
        if (data.status === "completed") {
          if (!completedFiredRef.current) {
            completedFiredRef.current = true;
            trackAnalysisCompleted(id);
          }
          return;
        }

        if (data.status === "failed") {
          return;
        }

        // Start polling for non-terminal states
        await pollingManager.start(async () => {
          const updated = await getAnalysisResult(id);
          if (mounted) {
            setResult(updated);

            if (updated.status === "completed" && !completedFiredRef.current) {
              completedFiredRef.current = true;
              trackAnalysisCompleted(id);
            }
          }
          return updated;
        });
      } catch (err) {
        if (!mounted) return;

        if (err instanceof ApiClientError && err.statusCode === 404) {
          setIsNotFound(true);
          return;
        }

        // User-friendly error message
        const message =
          err instanceof Error ? err.message : "Failed to load results";
        setFetchError(message);
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

  // Initial loading state
  if (!result && !isNotFound && !fetchError) {
    return <LoadingView />;
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

  if (result.status === "queued" || result.status === "processing") {
    return <ProcessingView result={result} elapsedSeconds={elapsedSeconds} />;
  }

  return <CompletedView result={result} jobId={jobId!} />;
}
