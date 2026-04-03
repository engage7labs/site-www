"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { FileUpload } from "@/components/shared/file-upload";
import { Turnstile } from "@/components/shared/turnstile";
import { Checkbox } from "@/components/ui/checkbox";
import { submitAnalysisUpload } from "@/lib/api/analysis";
import { ApiClientError } from "@/lib/api/client";
import { getOrCreateSessionId } from "@/lib/api/events";
import { SESSION_COOKIE_NAME } from "@/lib/auth-edge";
import {
  trackAnalysisStarted,
  trackErrorOccurred,
  trackUploadCompleted,
  trackUploadStarted,
} from "@/lib/telemetry";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      const body = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      if (body.mode === "admin_view") setIsAdminView(true);
    } catch {
      /* ignore */
    }
  }, []);
  return isAdminView;
}

export default function PortalUploadPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const isAdminView = useIsAdminView();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);

    trackUploadStarted(
      selectedFile.size,
      selectedFile.name.endsWith(".zip") ? "export.zip" : undefined
    );

    void submitAnalysisUpload(
      selectedFile,
      consentGiven,
      locale,
      turnstileToken ?? undefined
    )
      .then((result) => {
        const sessionId = getOrCreateSessionId();
        window.localStorage.setItem(`engage7_job_${result.job_id}`, sessionId);

        trackUploadCompleted(result.job_id);
        trackAnalysisStarted(result.job_id);
        // Stay in portal — navigate to portal report page
        router.push(`/portal/reports/${result.job_id}`);
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof ApiClientError && error.message
            ? error.message
            : "Upload failed";

        trackErrorOccurred("upload_failed", errorMessage, {
          file_size: selectedFile.size,
          status_code:
            error instanceof ApiClientError ? error.statusCode : undefined,
        });

        const message =
          error instanceof ApiClientError && error.message
            ? error.message
            : "Upload failed. Please try again or contact support.";
        toast.error(message);
        setIsUploading(false);
      });
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl px-4 md:px-8 mt-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.analyze.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.analyze.subtitle}
            </p>
          </div>

          {isAdminView ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-3">
              <Lock className="mx-auto h-8 w-8 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Upload disabled
              </h2>
              <p className="text-sm text-muted-foreground">
                Uploads are not available while viewing as another user
                (read-only mode).
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="rounded-lg border border-border bg-card p-8 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      {t.analyze.upload.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t.analyze.upload.formatHint}
                    </p>
                    <p className="text-sm text-accent">
                      {t.analyze.upload.expectationHint}
                    </p>
                  </div>

                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onUpload={handleUpload}
                    isUploading={isUploading}
                    disabled={!consentGiven || !turnstileToken}
                    t={t}
                    consentSlot={
                      <>
                        <label className="flex items-start gap-3 text-xs text-muted-foreground leading-snug cursor-pointer">
                          <Checkbox
                            id="consent"
                            checked={consentGiven}
                            onCheckedChange={(checked) =>
                              setConsentGiven(checked === true)
                            }
                            className="mt-0.5"
                          />
                          <span>
                            {t.analyze.consent.description}{" "}
                            <Link
                              href="/privacy-policy"
                              className="text-accent hover:underline"
                              target="_blank"
                            >
                              {t.analyze.consent.linkText}
                            </Link>
                          </span>
                        </label>
                        <Turnstile onVerify={setTurnstileToken} />
                      </>
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
