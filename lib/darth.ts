export type DarthLocale = "en-IE" | "pt-BR" | "hi-IN";

export interface DarthCopy {
  title: string;
  body: string;
  evidence: string;
  action: string;
}

export interface DarthInsightBlock {
  id: string;
  domain: string;
  priority: "hero" | "supporting";
  semantic_key: string;
  observation: string;
  window: string;
  baseline: string;
  meaning: string;
  action: string;
  evidence_refs: string[];
  signal_refs?: Array<{
    name: string;
    type?: string;
    window?: string;
    baseline_value?: number | null;
    confidence?: number;
  }>;
  chart_binding: string | null;
  confidence?: number;
  severity?: string;
  window_label?: string;
  comparison?: {
    type: string;
    baseline: number | null;
    label: string;
    metric?: string;
  };
  visual_emphasis?: {
    tone?: string;
    accent?: string;
  };
  params: Record<string, unknown>;
  copy?: Record<string, DarthCopy>;
}

export interface DarthChartBinding {
  key: string;
  component: string;
  role?: "evidence" | "impact" | "support";
  label_key?: string;
  empty_state_key?: string;
  emphasis?: "primary" | "secondary";
  evidence_refs: string[];
}

export interface DarthPresentation {
  hero: DarthInsightBlock;
  supporting: DarthInsightBlock[];
  evidence_blocks: DarthInsightBlock[];
  chart_bindings: DarthChartBinding[];
  cta: {
    key: string;
    copy: Record<string, string>;
  };
  meta?: {
    primary_domain?: string;
    severity?: string;
    direction?: string;
    confidence?: number;
    supporting_domains?: string[];
  };
  layout_hints?: Record<string, unknown>;
  visual_emphasis?: {
    hero_tone?: string;
    accent?: string;
  };
}

export interface DarthPayload {
  narrative_state?: {
    primary_theme: string;
    tone: string;
    direction: string;
    confidence: number;
    supporting_domains: string[];
  };
  presentation?: DarthPresentation;
  explainability?: DarthInsightBlock[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function getDarthPayload(sections: unknown): DarthPayload | null {
  if (!isObject(sections)) return null;
  const darth = sections.darth;
  if (!isObject(darth)) return null;
  return darth as DarthPayload;
}

export function getDarthPresentation(sections: unknown): DarthPresentation | null {
  return getDarthPayload(sections)?.presentation ?? null;
}

export function getDarthExplainability(sections: unknown): DarthInsightBlock[] {
  return getDarthPayload(sections)?.explainability ?? [];
}

export function resolveDarthLocale(locale: string): DarthLocale {
  if (locale === "hi-IN") return "hi-IN";
  return locale === "pt-BR" ? "pt-BR" : "en-IE";
}

export function selectDarthCopy(
  copy: Record<string, DarthCopy> | undefined,
  locale: string
): DarthCopy | null {
  if (!copy) return null;
  const resolved = resolveDarthLocale(locale);
  return copy[resolved] ?? copy["en-IE"] ?? null;
}

export function selectDarthCta(
  cta: DarthPresentation["cta"] | undefined,
  locale: string
): string | null {
  if (!cta) return null;
  const resolved = resolveDarthLocale(locale);
  return cta.copy[resolved] ?? cta.copy["en-IE"] ?? null;
}
