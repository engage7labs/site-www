/**
 * CommunityActivity — reusable social proof metrics widget.
 *
 * Fetches aggregate anonymous metrics from GET /api/metrics and displays
 * community activity: total uploads, recent uploads, and unique locales.
 */

"use client";

import { getPublicMetrics, type PublicMetrics } from "@/lib/api/analysis";
import { motion } from "framer-motion";
import { BarChart3, Clock, Globe } from "lucide-react";
import { useEffect, useState } from "react";

interface CommunityActivityProps {
  t: {
    title: string;
    totalUploads: string;
    recentUploads: string;
    languages: string;
    loading: string;
    error: string;
  };
  className?: string;
}

export function CommunityActivity({ t, className }: CommunityActivityProps) {
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    getPublicMetrics()
      .then(setMetrics)
      .catch(() => setMetricsError(true));
  }, []);

  // If API is unavailable, render nothing (calm UX - no error message on homepage)
  if (metricsError) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={className}
    >
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground text-center">
          {t.title}
        </h2>
        {!metrics ? (
          <p className="text-sm text-muted-foreground text-center">
            {t.loading}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.total_uploads}
              </p>
              <p className="text-xs text-muted-foreground">{t.totalUploads}</p>
            </div>
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.uploads_24h}
              </p>
              <p className="text-xs text-muted-foreground">{t.recentUploads}</p>
            </div>
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {metrics.unique_locales}
              </p>
              <p className="text-xs text-muted-foreground">{t.languages}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
