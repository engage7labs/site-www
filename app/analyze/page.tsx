/**
 * Analyze Page
 *
 * Product entry page for uploading and analyzing wearable data.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { FileUpload } from "@/components/shared/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { submitAnalysisUpload } from "@/lib/api/analysis";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const { t } = useLocale();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Submit file to API
      const result = await submitAnalysisUpload(selectedFile);

      // Redirect to result page with job ID
      router.push(`/result/${result.jobId}`);
    } catch (error) {
      console.error("Upload error:", error);
      // TODO: Add proper error handling/toast notification
      alert(
        "Failed to upload file. Please try again or contact support if the issue persists."
      );
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.analyze.backToHome}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-16"
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
                  ⏱️ {t.analyze.upload.expectationHint}
                </p>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                onUpload={handleUpload}
                isUploading={isUploading}
                disabled={!consentGiven}
                t={t}
              />
            </div>
          </motion.div>

          {/* Consent Section */}
          <motion.div variants={fadeInUp} className="max-w-2xl mx-auto">
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-6 space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {t.analyze.consent.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.analyze.consent.description}
                </p>
                <p className="text-xs text-destructive font-medium">
                  ⚠️ {t.analyze.consent.disclaimer}
                </p>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) =>
                    setConsentGiven(checked === true)
                  }
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t.analyze.consent.required}{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-accent hover:underline"
                    target="_blank"
                  >
                    {t.analyze.consent.linkText}
                  </Link>
                </label>
              </div>
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
    </div>
  );
}
