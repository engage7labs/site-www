"use client";

import type { DarthContextualIntelligence } from "@/lib/darth";
import { ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export function ContextualIntelligenceCard({
  artifact,
  locale,
}: {
  artifact: DarthContextualIntelligence | null | undefined;
  locale: string;
}) {
  const canonicalLocale = locale === "pt-BR" ? "pt-BR" : "en-IE";
  const copy = artifact?.presentation?.[canonicalLocale];
  if (!copy?.headline) return null;

  return (
    <section className="rounded-2xl border border-accent/35 bg-gradient-to-br from-accent/10 via-card to-card p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-accent">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {canonicalLocale === "pt-BR"
            ? "SOL · Seu histórico em perspectiva"
            : "SOL · Your history in perspective"}
        </span>
      </div>
      <h2 className="text-base font-semibold text-card-foreground">
        {copy.headline}
      </h2>
      {copy.recent_pattern && (
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.recent_pattern}
        </p>
      )}
      {copy.longitudinal && (
        <p className="mt-2 text-sm text-muted-foreground">
          {copy.longitudinal}
        </p>
      )}
      {copy.evidence && (
        <p className="mt-3 border-l-2 border-accent/40 pl-3 text-xs leading-relaxed text-muted-foreground">
          {copy.evidence}
        </p>
      )}
      <div className="mt-4 rounded-lg bg-accent/5 p-3">
        {copy.safe_action && (
          <p className="text-sm font-medium text-card-foreground">
            {copy.safe_action}
          </p>
        )}
        {copy.what_not_to_overreact_to && (
          <p className="mt-2 text-xs text-muted-foreground">
            {copy.what_not_to_overreact_to}
          </p>
        )}
      </div>
      {copy.confidence && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{copy.confidence}</span>
          </span>
          {copy.explore && (
            <Link
              href="/portal/insights"
              className="font-semibold text-accent hover:underline"
            >
              {copy.explore}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
