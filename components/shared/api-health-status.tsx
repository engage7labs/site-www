/**
 * APIHealthStatus — Calm API health indicator
 *
 * Shows a friendly message if API is unavailable.
 * If available, optionally shows a positive/neutral state or nothing at all.
 */

"use client";

import { getApiHealth } from "@/lib/api/analysis";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Coffee } from "lucide-react";
import { useEffect, useState } from "react";

interface APIHealthStatusProps {
  className?: string;
  hideWhenUnhealthy?: boolean;
  suppressUnhealthy?: boolean;
}

export function APIHealthStatus({
  className,
  hideWhenUnhealthy = false,
  suppressUnhealthy = false,
}: Readonly<APIHealthStatusProps>) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkHealth = () => {
      getApiHealth()
        .then((response) => {
          if (!cancelled) {
            setIsHealthy(response.status === "healthy");
            if (response.version) setVersion(response.version);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setIsHealthy(false);
          }
        });
    };

    checkHealth();
    const interval = window.setInterval(checkHealth, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  // Still checking - keep UI quiet.
  if (isHealthy === null) {
    return null;
  }

  // API is healthy - show a subtle positive state.
  if (isHealthy) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          API online{version ? ` ${version}` : ""}
        </div>
      </motion.div>
    );
  }

  // Homepage mode: quietly hide indicator when API is unhealthy.
  if (hideWhenUnhealthy || suppressUnhealthy) {
    return null;
  }

  // API is unhealthy - show calm, friendly message
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/20 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Coffee className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-base font-semibold text-orange-900 dark:text-orange-100">
              Taking a short break
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Our analysis engines are stretching their legs for a moment. This
              usually takes just a minute or two. Please try again shortly!
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 italic">
              If this persists, feel free to reach out to us.
            </p>
          </div>
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-orange-400 dark:text-orange-500" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
