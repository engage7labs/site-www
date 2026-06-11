"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { usePreviewFeatures } from "@/lib/feature-preview";
import {
  extractAiNarrativeViewModel,
  type AiReflectionArtifact,
} from "@/lib/ai-reflections";
import { AlertTriangle, Bot, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const COPY = {
  "en-IE": {
    title: "AI Reflections",
    subtitle: "Generated from this report",
    older: "This reflection belongs to an older report and may not describe your current data.",
    empty: "No AI reflections have been generated from this report yet.",
    warning: "Monitor warning",
    passed: "Passed",
    open: "Open",
    close: "Close",
    generated: "Generated",
    locale: "Locale",
    status: "Status",
    evidence: "Evidence used",
  },
  "pt-BR": {
    title: "Reflexões com IA",
    subtitle: "Gerada a partir deste relatório",
    older: "Esta reflexão pertence a um relatório anterior e pode não descrever seus dados atuais.",
    empty: "Nenhuma reflexão com IA foi gerada a partir deste relatório ainda.",
    warning: "Aviso em monitoramento",
    passed: "Aprovada",
    open: "Abrir",
    close: "Fechar",
    generated: "Gerada",
    locale: "Idioma",
    status: "Status",
    evidence: "Evidências usadas",
  },
};

const AI_FEATURE_KEY = "ai_darth_health_overview_narrative";

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString(locale === "pt-BR" ? "pt-BR" : "en-IE", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusLabel(reflection: AiReflectionArtifact, copy: typeof COPY["en-IE"]) {
  return reflection.validation_status === "warning" ? copy.warning : copy.passed;
}

export function AiReflectionsPanel({ analysisId }: { analysisId: string }) {
  const { locale } = useLocale();
  const { isEnabled, loading: featureLoading } = usePreviewFeatures();
  const featureEnabled = isEnabled(AI_FEATURE_KEY);
  const copy = locale === "pt-BR" ? COPY["pt-BR"] : COPY["en-IE"];
  const [reflections, setReflections] = useState<AiReflectionArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<AiReflectionArtifact | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (featureLoading || !featureEnabled) {
      setLoading(false);
      setReflections([]);
      return;
    }
    const params = new URLSearchParams({ analysis_id: analysisId, limit: "20" });
    (async () => {
      try {
        const res = await fetch(
          `/api/proxy/ai/health-overview-narrative/history?${params.toString()}`,
        );
        const data = (await res.json().catch(() => null)) as {
          reflections?: AiReflectionArtifact[];
        } | null;
        if (!cancelled && res.ok) {
          setReflections(data?.reflections ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId, featureEnabled, featureLoading]);

  if (featureLoading || !featureEnabled) {
    return null;
  }

  async function toggleDetail(reflection: AiReflectionArtifact) {
    if (selectedId === reflection.artifact_id) {
      setSelectedId(null);
      setSelected(null);
      return;
    }
    setSelectedId(reflection.artifact_id);
    setSelected(null);
    const res = await fetch(
      `/api/proxy/ai/health-overview-narrative/artifacts/${reflection.artifact_id}`,
    );
    const data = (await res.json().catch(() => null)) as {
      artifact?: AiReflectionArtifact;
    } | null;
    if (res.ok && data?.artifact) {
      const narrative = extractAiNarrativeViewModel(data.artifact);
      setSelected(narrative ? { ...data.artifact, narrative } : data.artifact);
    }
  }

  return (
    <section className="portal-panel rounded-lg border border-border/70 bg-card/85 p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-card-foreground">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      ) : reflections.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="mt-4 flex flex-col divide-y divide-border/70">
          {reflections.map((reflection) => {
            const isSelected = selectedId === reflection.artifact_id;
            return (
              <div key={reflection.artifact_id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Bot className="h-4 w-4 text-accent" />
                      <p className="text-sm font-medium text-card-foreground">
                        {reflection.narrative.headline}
                      </p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {statusLabel(reflection, copy)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {copy.generated}: {formatDate(reflection.created_at, locale)} · {copy.locale}:{" "}
                      {reflection.locale}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleDetail(reflection)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/30 px-3 text-xs font-medium text-card-foreground transition-colors hover:border-accent/45"
                  >
                    {isSelected ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {isSelected ? copy.close : copy.open}
                  </button>
                </div>

                {isSelected && selected && (
                  <div className="mt-3 rounded-lg border border-border/70 bg-background/35 p-4">
                    <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <p className="text-xs text-amber-100/85">{copy.older}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.status}
                        </p>
                        <p className="mt-1 text-xs text-card-foreground/85">
                          {statusLabel(selected, copy)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.generated}
                        </p>
                        <p className="mt-1 text-xs text-card-foreground/85">
                          {formatDate(selected.created_at, locale)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-card-foreground/85">
                      {selected.narrative.longitudinal_interpretation}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-card-foreground/85">
                      {selected.narrative.why_it_matters}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-card-foreground/85">
                      {selected.narrative.suggested_next_step}
                    </p>
                    {selected.narrative.evidence_used.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.evidence}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selected.narrative.evidence_used.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                      {selected.narrative.confidence_note}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {selected.narrative.safety_note}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
