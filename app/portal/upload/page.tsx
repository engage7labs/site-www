"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { FileUpload } from "@/components/shared/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";
import { trackUploadCompleted, trackUploadStarted } from "@/lib/telemetry";
import { Lock, CheckCircle, Loader2 } from "lucide-react";
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

export default function PortalUploadPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const isAdminView = useIsAdminView();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for completion once job is queued
  useEffect(() => {
    if (!activeJobId || (status !== "queued" && status !== "processing")) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/proxy/portal/analysis-status?job_id=${activeJobId}`);
        if (!res.ok) return;
        const data = await res.json() as { upload_status: string };
        if (data.upload_status === "completed") {
          clearInterval(pollRef.current!);
          setStatus("completed");
          trackUploadCompleted(activeJobId);
          toast.success("Analysis complete!");
          setTimeout(() => router.push("/portal/health"), 1500);
        } else if (data.upload_status === "failed") {
          clearInterval(pollRef.current!);
          setStatus("failed");
          toast.error("Analysis failed. Please try again.");
        } else if (data.upload_status === "processing") {
          setStatus("processing");
        }
      } catch { /* ignore poll errors */ }
    }, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeJobId, status, router]);

  const handleUpload = async () => {
    if (!selectedFile || status !== "idle") return;

    setStatus("uploading");
    trackUploadStarted(selectedFile.size);

    const form = new FormData();
    form.append("file", selectedFile, selectedFile.name);
    form.append("locale", locale);

    try {
      const res = await fetch("/api/proxy/portal/upload", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" })) as { detail?: string };
        throw new Error(err.detail ?? "Upload failed");
      }
      const data = await res.json() as { job_id: string };
      setActiveJobId(data.job_id);
      setStatus("queued");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStatus("idle");
    }
  };

  const isUploading = status !== "idle";

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl px-4 md:px-8 mt-10">
        <div className="flex flex-col gap-8">
          {isAdminView ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3">
              <Lock className="mx-auto h-8 w-8 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">Upload disabled</h2>
              <p className="text-sm text-muted-foreground">
                Uploads are not available while viewing as another user (read-only mode).
              </p>
            </div>
          ) : status === "queued" || status === "processing" || status === "completed" ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center space-y-4">
              {status === "completed" ? (
                <>
                  <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-foreground">Analysis complete</h2>
                  <p className="text-sm text-muted-foreground">Redirecting to your portal…</p>
                </>
              ) : (
                <>
                  <Loader2 className="mx-auto h-10 w-10 text-accent animate-spin" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {status === "queued" ? "Processing your data…" : "Running analysis…"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This takes 2–5 minutes. You can close this page — we'll have your results ready.
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-mono">{activeJobId?.slice(0, 8)}</p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">{t.analyze.upload.title}</h2>
                <p className="text-sm text-muted-foreground">{t.analyze.upload.formatHint}</p>
                <p className="text-sm text-accent">{t.analyze.upload.expectationHint}</p>
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
                  <li>6. Open this page on your iPhone, tap the upload area and select <code className="font-mono text-accent">export.zip</code>.</li>
                </ol>
              </details>

              <FileUpload
                onFileSelect={setSelectedFile}
                onUpload={handleUpload}
                isUploading={isUploading}
                disabled={!consentGiven || isUploading}
                t={t}
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
            </div>
          )}

          {/* Link to analysis history */}
          <div className="text-center">
            <Link href="/portal/analyses" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View previous analyses →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
