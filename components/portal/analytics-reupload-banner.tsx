"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { isAnalyticsReuploadRequired } from "@/lib/analytics-status";

export function AnalyticsReuploadBanner() {
  const { t } = useLocale();
  const [requiresReupload, setRequiresReupload] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalyticsStatus() {
      try {
        const response = await fetch("/api/proxy/users/analytics-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const status: unknown = await response.json();
        setRequiresReupload(isAnalyticsReuploadRequired(status));
      } catch {
        // A failed status request must never infer a legacy-data state.
      }
    }

    void loadAnalyticsStatus();
    return () => controller.abort();
  }, []);

  if (!requiresReupload) return null;

  return (
    <section
      aria-labelledby="analytics-reupload-title"
      className="mx-4 mt-4 rounded-xl border border-amber-500/35 bg-amber-500/8 p-4 sm:mx-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <RefreshCw className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <h2 id="analytics-reupload-title" className="font-semibold text-foreground">
            {t.portal.analyticsReupload.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t.portal.analyticsReupload.body}
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/portal/upload">{t.portal.analyticsReupload.action}</Link>
        </Button>
      </div>
    </section>
  );
}
