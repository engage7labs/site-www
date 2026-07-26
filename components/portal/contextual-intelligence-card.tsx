"use client";

import type { DarthContextualIntelligence } from "@/lib/darth";
import { ShieldCheck, Sparkles } from "lucide-react";

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
    <section className="rounded-xl border border-accent/30 bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-accent">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {canonicalLocale === "pt-BR"
            ? "Inteligência fisiológica pessoal"
            : "Personal physiological intelligence"}
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
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{copy.confidence}</span>
        </div>
      )}
    </section>
  );
}
