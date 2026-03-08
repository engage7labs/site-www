/**
 * Result Page
 *
 * Displays analysis results for a specific job ID.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

interface AnalysisResult {
  jobId: string;
  status: AnalysisStatus;
  summary?: {
    datasetPeriod: string;
    recordsAnalyzed: number;
    insightsGenerated: number;
  };
  insights?: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
  }>;
  error?: string;
}

export default function ResultPage({ params }: { params: { jobId: string } }) {
  const { t } = useLocale();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // Simulate API call to fetch result
    const fetchResult = async () => {
      setLoading(true);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock result data
      const mockResult: AnalysisResult = {
        jobId: params.jobId,
        status: "completed",
        summary: {
          datasetPeriod: "April 2018 - March 2026",
          recordsAnalyzed: 2855,
          insightsGenerated: 12,
        },
        insights: [
          {
            id: "1",
            title: "Recovery Baseline Established",
            description:
              "Your physiological baseline shows consistent recovery patterns with an average HRV of 45ms.",
            category: "Recovery",
          },
          {
            id: "2",
            title: "Sleep Duration Trend",
            description:
              "Sleep duration has improved by 12% over the past 6 months, averaging 7.2 hours per night.",
            category: "Sleep",
          },
          {
            id: "3",
            title: "Activity Consistency",
            description:
              "Physical activity shows stable weekly patterns with consistent step counts on weekdays.",
            category: "Activity",
          },
        ],
      };

      setResult(mockResult);
      setLoading(false);
    };

    fetchResult();
  }, [params.jobId]);

  const getStatusIcon = (status: AnalysisStatus) => {
    switch (status) {
      case "pending":
      case "processing":
        return <Loader2 className="h-6 w-6 text-accent animate-spin" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-accent" />;
      case "failed":
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: AnalysisStatus) => {
    return t.result.status[status];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.result.backToHome}
          </Link>
          <Link href="/analyze">
            <Button variant="ghost" size="sm">
              {t.result.backToAnalyze}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-4 py-32"
          >
            <Loader2 className="h-12 w-12 text-accent animate-spin" />
            <p className="text-muted-foreground">{t.result.loading}</p>
          </motion.div>
        ) : result?.status === "failed" ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="max-w-2xl mx-auto space-y-8"
          >
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <h1 className="text-3xl font-semibold text-foreground">
                {t.result.error.title}
              </h1>
              <p className="text-muted-foreground">
                {result.error || t.result.error.description}
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex justify-center space-x-4"
            >
              <Link href="/analyze">
                <Button size="lg">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.result.error.retryButton}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-12"
          >
            {/* Status Header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-accent/10">
                {getStatusIcon(result?.status || "pending")}
              </div>
              <h1 className="text-4xl font-semibold text-foreground">
                {t.result.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {getStatusText(result?.status || "pending")}
              </p>
            </motion.div>

            {result?.status === "completed" && result.summary && (
              <>
                {/* Summary Section */}
                <motion.div variants={fadeInUp}>
                  <div className="rounded-lg border border-border bg-card p-8">
                    <h2 className="text-2xl font-semibold text-foreground mb-6">
                      {t.result.summary.title}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t.result.summary.datasetPeriod}
                        </p>
                        <p className="text-2xl font-semibold text-foreground">
                          {result.summary.datasetPeriod}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t.result.summary.recordsAnalyzed}
                        </p>
                        <p className="text-2xl font-semibold text-foreground">
                          {result.summary.recordsAnalyzed.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t.result.summary.insightsGenerated}
                        </p>
                        <p className="text-2xl font-semibold text-foreground">
                          {result.summary.insightsGenerated}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Insights Section */}
                {result.insights && result.insights.length > 0 && (
                  <motion.div variants={fadeInUp}>
                    <h2 className="text-2xl font-semibold text-foreground mb-6">
                      {t.result.insights.title}
                    </h2>
                    <div className="space-y-4">
                      {result.insights.map((insight) => (
                        <div
                          key={insight.id}
                          className="rounded-lg border border-border bg-card p-6 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-foreground">
                              {insight.title}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                              {insight.category}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            {insight.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Artifacts Section */}
                <motion.div variants={fadeInUp}>
                  <div className="rounded-lg border border-border bg-card p-8">
                    <h2 className="text-2xl font-semibold text-foreground mb-6">
                      {t.result.artifacts.title}
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button size="lg" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        {t.result.artifacts.downloadPDF}
                      </Button>
                      <Button size="lg" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        {t.result.artifacts.downloadData}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
