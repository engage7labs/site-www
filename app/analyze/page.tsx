/**
 * Analyze Page
 *
 * Product entry page for uploading and analyzing wearable data.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { AppleHealthTutorial } from "@/components/shared/apple-health-tutorial";
import { FileUpload } from "@/components/shared/file-upload";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Turnstile } from "@/components/shared/turnstile";
import { Checkbox } from "@/components/ui/checkbox";
import { submitAnalysisUpload } from "@/lib/api/analysis";
import { ApiClientError } from "@/lib/api/client";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, FileCheck, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function AnalyzePage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);

    void submitAnalysisUpload(
      selectedFile,
      consentGiven,
      locale,
      turnstileToken ?? undefined
    )
      .then((result) => {
        router.push(`/result/${result.job_id}`);
      })
      .catch((error: unknown) => {
        console.error("Upload error:", error);
        const message =
          error instanceof ApiClientError && error.message
            ? error.message
            : "Upload failed. Please try again or contact support.";
        toast.error(message);
        setIsUploading(false);
      });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-32 pb-12">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-10"
        >
          {/* Page Title */}
          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
              {t.analyze.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.analyze.subtitle}
            </p>
          </motion.div>

          {/* Workflow Steps */}
          <motion.div
            variants={fadeInUp}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 rounded-full bg-accent/10">
                <Upload className="h-6 w-6 text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {t.analyze.workflow.step1.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.analyze.workflow.step1.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 rounded-full bg-accent/10">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {t.analyze.workflow.step2.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.analyze.workflow.step2.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 rounded-full bg-accent/10">
                <FileCheck className="h-6 w-6 text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  {t.analyze.workflow.step3.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.analyze.workflow.step3.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Apple Health Export Tutorial */}
          <motion.div variants={fadeInUp} className="max-w-4xl mx-auto">
            <AppleHealthTutorial />
          </motion.div>

          {/* Upload Section */}
          <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
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
          </motion.div>

          {/* Trust Section */}
          <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
            <div className="rounded-lg bg-muted/30 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                <h3 className="text-base font-semibold text-foreground">
                  {t.analyze.trust.title}
                </h3>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-accent mt-1">•</span>
                  <span className="text-sm text-muted-foreground">
                    {t.analyze.trust.point1}
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-accent mt-1">•</span>
                  <span className="text-sm text-muted-foreground">
                    {t.analyze.trust.point2}
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-accent mt-1">•</span>
                  <span className="text-sm text-muted-foreground">
                    {t.analyze.trust.point3}
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
