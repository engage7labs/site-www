/**
 * Result Page
 *
 * Displays analysis results for a specific job ID.
 * Polls GET /api/result/{jobId} until the job reaches a terminal state.
 *
 * Sprint 11: when completed, renders the InsightPreview experience
 * instead of the previous text-only CompletedView.
 */

"use client";

import { useAppTheme } from "@/components/providers/app-theme-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { InsightPreview } from "@/components/insights";
import { getAnalysisResult } from "@/lib/api/analysis";
import { ApiClientError } from "@/lib/api/client";
import {
  trackResultPageViewed,
  trackAnalysisStarted,
  trackAnalysisCompleted,
} from "@/lib/telemetry";
import type { AnalysisResult } from "@/lib/types/analysis";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Loader2,
} from "lucide-react";
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

function ProcessingView({ result }: { result: AnalysisResult }) {
  const { t } = useLocale();
  const statusLabel =
    result.status === "queued"
      ? t.result.status.pending
      : t.result.status.processing;

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
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
            {formatTime(elapsed)}
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {statusLabel}
          </h1>
          <p className="text-muted-foreground max-w-md">
            Your analysis is underway. This page updates automatically.
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
          <p className="text-muted-foreground max-w-md">
            {error ?? t.result.error.description}
          </p>
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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;
    let completedFired = false;

    const init = async () => {
      const { jobId: id } = await params;
      setJobId(id);

      // Telemetry: result page viewed
      trackResultPageViewed(id);

      // Initial fetch
      try {
        const data = await getAnalysisResult(id);
        setResult(data);

        // Track initial state
        if (
          data.status === "queued" ||
          data.status === "processing"
        ) {
          trackAnalysisStarted(id);
        }

        // Immediately return if already in terminal state
        if (data.status === "completed" || data.status === "failed") {
          if (data.status === "completed" && !completedFired) {
            completedFired = true;
            trackAnalysisCompleted(id);
          }
          return;
        }
      } catch (err) {
        if (err instanceof ApiClientError && err.statusCode === 404) {
          setIsNotFound(true);
          return;
        }
        setFetchError(
          err instanceof Error ? err.message : "Failed to load results"
        );
        return;
      }

      // Poll until terminal state or timeout
      interval = setInterval(async () => {
        pollCount++;
        if (pollCount >= MAX_POLLS) {
          clearInterval(interval!);
          setFetchError(
            "Analysis timed out after 5 minutes. Please try again."
          );
          return;
        }
        try {
          const data = await getAnalysisResult(id);
          setResult(data);
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(interval!);
            if (data.status === "completed" && !completedFired) {
              completedFired = true;
              trackAnalysisCompleted(id);
            }
          }
        } catch {
          // Ignore transient poll errors — keep polling
        }
      }, POLL_INTERVAL_MS);
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
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
    return <ProcessingView result={result} />;
  }

  return <CompletedView result={result} jobId={jobId!} />;
}
