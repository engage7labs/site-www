"use client";

import { Clock } from "lucide-react";

export const PROCESSING_START_KEY = "engage7_processing_start";

export type ProcessingPhase = "uploading" | "analyzing";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function readProcessingStart(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PROCESSING_START_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function writeProcessingStart(startedAt = Date.now()): number {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PROCESSING_START_KEY, String(startedAt));
  }
  return startedAt;
}

export function clearProcessingStart(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PROCESSING_START_KEY);
  }
}

export function elapsedSecondsFrom(startedAt: number | null): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

export function ProcessingView({
  phase,
  elapsedSeconds,
  delayed = false,
}: Readonly<{
  phase: ProcessingPhase;
  elapsedSeconds: number;
  delayed?: boolean;
}>) {
  const isUploading = phase === "uploading";
  const heading = isUploading
    ? "Uploading your data"
    : delayed
      ? "Still working on your analysis..."
      : "Analyzing your data";
  const subtext = isUploading
    ? "Keep this tab open while we securely transfer your file."
    : delayed
      ? "This is taking longer than expected, but we're still processing your data."
      : "Typically completes in 30-90 seconds";

  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
      <div className="relative flex items-center justify-center">
        <div className="h-20 w-20 rounded-full border-4 border-accent/20" />
        <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-accent border-t-transparent animate-spin" />
        <span className="absolute text-sm font-mono font-semibold text-foreground">
          {formatTime(elapsedSeconds)}
        </span>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
        <p className="text-muted-foreground max-w-md">{subtext}</p>
      </div>
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          {isUploading
            ? "Large Apple Health exports can take a moment."
            : "Typically completes in 30-90 seconds"}
        </span>
      </div>
    </div>
  );
}
