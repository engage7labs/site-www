"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { FileUpload } from "@/components/shared/file-upload";
import {
  clearProcessingStart,
  elapsedSecondsFrom,
  ProcessingView,
  readProcessingStart,
  writeProcessingStart,
} from "@/components/shared/processing-view";
import { Checkbox } from "@/components/ui/checkbox";
import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";
import {
  trackUpdateDataCompleted,
  trackUpdateDataFailed,
  trackUpdateDataStarted,
} from "@/lib/telemetry";
import { Lock, CheckCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function useIsAdminView(): boolean {
  const [isAdminView, setIsAdminView] = useState(false);
  useEffect(() => {
    try {
      const cookies = document.cookie.split("; ");
      const sc = cookies.find((c) => c.startsWith(SESSION_COOKIE_NAME));
      if (!sc) return;
      const token = sc.split("=")[1];
      const parts = token.split(".");
      if (parts.length !== 3) return;
      const body = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (body.mode === "admin_view") setIsAdminView(true);
    } catch { /* ignore */ }
  }, []);
  return isAdminView;
}

type UploadStatus = "idle" | "uploading" | "queued" | "processing" | "completed" | "failed";
const ACTIVE_UPDATE_JOB_KEY = "engage7_active_update_job";

function userFriendlyUploadError(message: string | null | undefined): string {
  if (
    message &&
    /ETL produced no features CSV|no features CSV|processed features were unavailable/i.test(message)
  ) {
    return "We could not read health data from this ZIP. Please check that it is a valid Apple Health export.";
  }
  return message ?? "Analysis failed. Please try again.";
}

export default function PortalUploadPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const isAdminView = useIsAdminView();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [processingStartedAt, setProcessingStartedAt] = useState<number | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [reanalysisStatus, setReanalysisStatus] = useState<"idle" | "processing" | "no_data" | "completed" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionMessage = t.common.status.complete;

  useEffect(() => {
    const saved = window.sessionStorage.getItem(ACTIVE_UPDATE_JOB_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { jobId?: string; mode?: "upload" | "reanalysis" };
      if (!parsed.jobId) return;
      setActiveJobId(parsed.jobId);
      setStatus("processing");
      setReanalysisStatus(parsed.mode === "reanalysis" ? "processing" : "idle");
      setProcessingStartedAt(readProcessingStart() ?? writeProcessingStart());
    } catch {
      window.sessionStorage.removeItem(ACTIVE_UPDATE_JOB_KEY);
    }
  }, []);

  useEffect(() => {
    if (!processingStartedAt) return;
    setElapsedSeconds(elapsedSecondsFrom(processingStartedAt));
    const timer = setInterval(() => {
      setElapsedSeconds(elapsedSecondsFrom(processingStartedAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [processingStartedAt]);

  // Poll for completion once job is queued
  useEffect(() => {
    if (!activeJobId || (status !== "queued" && status !== "processing")) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/proxy/portal/analysis-status?job_id=${activeJobId}`);
        if (!res.ok) return;
        const data = await res.json() as { upload_status: string; error_message?: string | null };
        if (data.upload_status === "completed") {
          clearInterval(pollRef.current!);
          setStatus("completed");
          window.sessionStorage.removeItem(ACTIVE_UPDATE_JOB_KEY);
          clearProcessingStart();
          trackUpdateDataCompleted(activeJobId);
          toast.success(completionMessage);
          if (reanalysisStatus === "processing") {
            setReanalysisStatus("completed");
          } else {
            setTimeout(() => router.push("/portal"), 1500);
          }
        } else if (data.upload_status === "failed") {
          clearInterval(pollRef.current!);
          setStatus("failed");
          const message = userFriendlyUploadError(data.error_message);
          setFailureMessage(message);
          window.sessionStorage.removeItem(ACTIVE_UPDATE_JOB_KEY);
          clearProcessingStart();
          trackUpdateDataFailed("processing_failed");
          toast.error(message);
        } else if (data.upload_status === "processing") {
          setStatus("processing");
        }
      } catch { /* ignore poll errors */ }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeJobId, status, router, completionMessage, reanalysisStatus]);

  const handleUpload = async () => {
    if (!selectedFile || (status !== "idle" && status !== "failed")) return;

    setStatus("uploading");
    setFailureMessage(null);
    setProcessingStartedAt(writeProcessingStart());
    trackUpdateDataStarted();

    try {
      // Step 1 — get SAS URL + job_id from server (no file sent here)
      const tokenForm = new FormData();
      tokenForm.append("consent", "true");
      tokenForm.append("locale", locale);

      const tokenRes = await fetch("/api/proxy/upload-token", {
        method: "POST",
        body: tokenForm,
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({ detail: "Failed to get upload URL" })) as { detail?: string };
        throw new Error(err.detail ?? "Failed to get upload URL");
      }
      const tokenData = await tokenRes.json() as {
        mode?: string;
        job_id?: string;
        sas_url?: string;
        confirmUrl?: string;
        confirmHeaders?: Record<string, string>;
      };

      if (tokenData.mode !== "direct-blob" || !tokenData.sas_url || !tokenData.job_id) {
        throw new Error("Upload service unavailable. Please try again.");
      }

      // Step 2 — PUT file directly to Azure Blob Storage (bypasses Vercel size limit)
      const blobRes = await fetch(tokenData.sas_url, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": "application/zip",
        },
        body: selectedFile,
      });
      if (!blobRes.ok) {
        throw new Error(`File upload failed (${blobRes.status}). Please try again.`);
      }

      // Step 3 — portal confirm: creates UserAnalysis + triggers ingest job
      const confirmForm = new FormData();
      confirmForm.append("job_id", tokenData.job_id);
      confirmForm.append("locale", locale);

      const confirmRes = await fetch("/api/proxy/portal/confirm", {
        method: "POST",
        body: confirmForm,
      });
      if (!confirmRes.ok) {
        const err = await confirmRes.json().catch(() => ({ detail: "Confirm failed" })) as { detail?: string };
        throw new Error(err.detail ?? "Upload confirmation failed");
      }

      const data = await confirmRes.json() as { job_id: string };
      setActiveJobId(data.job_id);
      window.sessionStorage.setItem(ACTIVE_UPDATE_JOB_KEY, JSON.stringify({ jobId: data.job_id, mode: "upload" }));
      setStatus("queued");
    } catch (err) {
      trackUpdateDataFailed("upload_failed");
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
      clearProcessingStart();
      setStatus("idle");
      setProcessingStartedAt(null);
      setElapsedSeconds(0);
    }
  };

  const handleReanalysis = async () => {
    if (reanalysisStatus === "processing") return;
    if (!window.confirm(t.common.updateDataFlow.confirm)) return;
    setReanalysisStatus("processing");
    try {
      const response = await fetch("/api/proxy/portal/reanalyse", { method: "POST" });
      const data = await response.json() as { status?: string; job_id?: string };
      if (!response.ok) throw new Error("Reanalysis unavailable");
      if (data.status === "no_data") { setReanalysisStatus("no_data"); return; }
      if (!data.job_id) throw new Error("Reanalysis unavailable");
      setActiveJobId(data.job_id);
      window.sessionStorage.setItem(ACTIVE_UPDATE_JOB_KEY, JSON.stringify({ jobId: data.job_id, mode: "reanalysis" }));
      setProcessingStartedAt(writeProcessingStart());
      setStatus(data.status === "queued" ? "queued" : "processing");
    } catch {
      setReanalysisStatus("failed");
    }
  };

  const isUploading = status === "uploading" || status === "queued" || status === "processing" || status === "completed";

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl px-4 md:px-8 mt-10">
        <div className="flex flex-col gap-8">
          {isAdminView ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3">
              <Lock className="mx-auto h-8 w-8 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">Update Data disabled</h2>
              <p className="text-sm text-muted-foreground">
                Data updates are not available while viewing as another user (read-only mode).
              </p>
            </div>
          ) : status === "uploading" || status === "queued" || status === "processing" || status === "completed" ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
              {status === "completed" ? (
                <>
                  <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-foreground">{t.common.status.complete}</h2>
                  {reanalysisStatus === "completed" ? (
                    <Link className="text-sm font-medium text-accent hover:underline" href="/portal/insights">
                      {t.common.updateDataFlow.returnToInsights}
                    </Link>
                  ) : <p className="text-sm text-muted-foreground">{t.common.redirecting}</p>}
                </>
              ) : (
                <ProcessingView
                  phase={status === "uploading" ? "uploading" : "analyzing"}
                  elapsedSeconds={elapsedSeconds}
                  delayed={elapsedSeconds > 60}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-lg border border-border bg-card p-8 space-y-4" aria-labelledby="reanalyse-heading">
                <RefreshCw className="h-7 w-7 text-accent" aria-hidden="true" />
                <div className="space-y-2">
                  <h2 id="reanalyse-heading" className="text-xl font-semibold text-foreground">{t.common.updateDataFlow.reanalyseTitle}</h2>
                  <p className="text-sm text-muted-foreground">{t.common.updateDataFlow.reanalyseBody}</p>
                </div>
                {reanalysisStatus === "no_data" && <p role="status" className="text-sm text-destructive">{t.common.updateDataFlow.noData} <a className="underline" href="#upload-new-export">{t.common.updateDataFlow.uploadAction}</a></p>}
                {reanalysisStatus === "failed" && <p role="status" className="text-sm text-destructive">{t.common.status.failed}</p>}
                <button type="button" onClick={handleReanalysis} disabled={reanalysisStatus === "processing"} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60">
                  {reanalysisStatus === "processing" ? t.common.status.processing : t.common.updateDataFlow.reanalyseAction}
                </button>
              </section>
            <section id="upload-new-export" className="rounded-lg border border-border bg-card p-8 space-y-6" aria-labelledby="upload-heading">
              {status === "failed" && failureMessage && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {failureMessage}
                </div>
              )}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {t.common.updateDataFlow.uploadTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.common.updateDataFlow.uploadBody}
                </p>
                <p className="text-sm text-accent">
                  Engage7 will refresh your semantic report and timeline when processing completes.
                </p>
              </div>

              {/* iOS export guide */}
              <details className="group rounded-lg border border-border bg-muted/20 text-sm">
                <summary className="cursor-pointer px-4 py-3 font-medium text-muted-foreground hover:text-foreground transition-colors list-none flex items-center justify-between">
                  <span>📱 How to export from iPhone / Apple Health</span>
                  <span className="text-xs text-muted-foreground/60 group-open:hidden">Show steps</span>
                  <span className="text-xs text-muted-foreground/60 hidden group-open:inline">Hide</span>
                </summary>
                <ol className="px-4 pb-4 pt-1 space-y-1.5 text-muted-foreground leading-relaxed">
                  <li>1. Open the <strong className="text-foreground">Health</strong> app on your iPhone.</li>
                  <li>2. Tap your <strong className="text-foreground">profile picture</strong> (top right).</li>
                  <li>3. Scroll down and tap <strong className="text-foreground">Export All Health Data</strong>.</li>
                  <li>4. Tap <strong className="text-foreground">Export</strong> and wait a few seconds.</li>
                  <li>5. Choose <strong className="text-foreground">Save to Files</strong> → iCloud Drive.</li>
                  <li>6. Open this page on your iPhone, tap the update area and select <code className="font-mono text-accent">export.zip</code>.</li>
                </ol>
              </details>

              <FileUpload
                onFileSelect={setSelectedFile}
                onUpload={handleUpload}
                isUploading={isUploading}
                disabled={!consentGiven || isUploading}
                t={t}
                buttonLabel={t.common.updateDataFlow.uploadAction}
                buttonLoadingLabel={t.common.saving}
                consentSlot={
                  <label className="flex items-start gap-3 text-xs text-muted-foreground leading-snug cursor-pointer">
                    <Checkbox
                      id="consent"
                      checked={consentGiven}
                      onCheckedChange={(checked) => setConsentGiven(checked === true)}
                      className="mt-0.5"
                    />
                    <span>
                      {t.analyze.consent.description}{" "}
                      <Link href="/privacy-policy" className="text-accent hover:underline" target="_blank">
                        {t.analyze.consent.linkText}
                      </Link>
                    </span>
                  </label>
                }
              />
            </section>
            </div>
          )}

          {/* Link to analysis history */}
          <div className="text-center">
            <Link href="/portal/analyses" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View data updates →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
