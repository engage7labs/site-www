"use client";

import { InsightPreview } from "@/components/insights";
import { getAnalysisResult } from "@/lib/api/analysis";
import { trackResultPageViewed } from "@/lib/telemetry";
import type { AnalysisResult } from "@/lib/types/analysis";
import { AlertCircle, ArrowLeft, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 100;

export default function PortalReportPage({
  params,
}: Readonly<{ params: Promise<{ jobId: string }> }>) {
  const { jobId } = use(params);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function poll() {
    if (pollCount.current >= MAX_POLLS) {
      stopPolling();
      return;
    }
    pollCount.current += 1;
    try {
      const data = await getAnalysisResult(jobId);
      setResult(data);
      if (data.status === "completed" || data.status === "failed") {
        if (data.status === "completed") {
          trackResultPageViewed(jobId);
        }
        stopPolling();
      }
    } catch {
      setNotFound(true);
      stopPolling();
    }
  }

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);

    void poll(); // initial fetch
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const backLink = (
    <Link
      href="/portal/reports"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      My Reports
    </Link>
  );

  if (notFound) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">
            Report not found
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This report could not be loaded. It may have expired or the link is
            incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading report…</p>
      </div>
    );
  }

  if (result.status === "queued" || result.status === "processing") {
    const m = Math.floor(elapsedSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (elapsedSeconds % 60).toString().padStart(2, "0");
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="relative flex items-center justify-center">
            <div className="h-20 w-20 rounded-full border-4 border-accent/20" />
            <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-accent border-t-transparent animate-spin" />
            <span className="absolute text-sm font-mono font-semibold text-foreground">
              {m}:{s}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {elapsedSeconds > 60
                ? "Still working on your analysis…"
                : "Analysing your data"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This page updates automatically.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            Typically completes in 30–90 seconds
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "failed") {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">
            Analysis failed
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            {result.error ?? "Something went wrong during analysis."}
          </p>
          <Link
            href="/portal/upload"
            className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  // status === "completed"
  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <InsightPreview result={result} jobId={jobId} />
    </div>
  );
}
