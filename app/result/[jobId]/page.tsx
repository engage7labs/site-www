/**
 * Result Page
 *
 * Displays analysis results for a specific job ID.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getAnalysisResult, getAnalysisStatus } from "@/lib/api/analysis";
import type { AnalysisResult } from "@/lib/types/analysis";
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

export default function ResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { t } = useLocale();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const init = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.jobId;
      setJobId(id);

      const fetchResult = async () => {
        try {
          setLoading(true);
          setError(null);

          const analysisResult = await getAnalysisResult(id);
          setResult(analysisResult);
          setLoading(false);

          if (
            analysisResult.status === "pending" ||
            analysisResult.status === "processing"
          ) {
            pollingInterval = setInterval(async () => {
              try {
                const status = await getAnalysisStatus(id);

                if (
                  status.status === "completed" ||
                  status.status === "failed"
                ) {
                  const finalResult = await getAnalysisResult(id);
                  setResult(finalResult);
                  if (pollingInterval) clearInterval(pollingInterval);
                }
              } catch (pollError) {
                console.error("Polling error:", pollError);
              }
            }, 3000);
          }
        } catch (err) {
          console.error("Error fetching result:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load analysis result"
          );
          setLoading(false);
        }
      };

      fetchResult();
    };

    init();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [params]);
}
