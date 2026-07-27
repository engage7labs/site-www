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

export interface DarthChartAnnotation {
  title: string;
  insight: string;
  proof_statement: string;
}

export interface DarthProofChart {
  id: string;
  role: "evidence" | "supporting" | "conflict";
  proves: "state" | "trajectory" | "conflict";
  metric: string;
  window: "latest_day" | "last_7d" | "last_30d";
  baseline_reference: "baseline_30d";
  proof_statement: string;
  priority: number;
  claim_relation?: "supports_claim" | "shows_conflict" | "shows_driver";
  type?: "divergence";
  signals?: string[];
  annotation: DarthChartAnnotation;
}

export interface DarthTeaserEvidence {
  metric: string;
  value: number | string | null;
  window: string;
  comparison: string | null;
  statement: string;
}

export interface DarthTeaser {
  template_id: string;
  archetype: "tension" | "strength" | "baseline" | "fallback";
  headline: string;
  subtext: string;
  action: string;
  cta: string;
  copy?: Record<
    DarthLocale,
    {
      headline: string;
      subtext: string;
      action: string;
      cta: string;
      evidence?: Record<string, string>;
    }
  >;
  badge: {
    icon: "crown";
    label: "Free";
  };
  visual: {
    type: "line" | "none";
    metric: string | null;
    window: string | null;
    role: "evidence" | "context" | "none";
  };
  evidence: DarthTeaserEvidence[];
  score: number;
  confidence: number;
  reason: string;
  fallback_level: number;
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

export interface DarthTrajectory {
  direction: "improving" | "deteriorating" | "unstable";
  window: string;
  confidence: number;
}

export interface DarthConflict {
  exists: boolean;
  signals: string[];
  explanation: string;
}

export interface DarthGuidance {
  decision_window_hours: number;
  risk_type: string;
  pattern_continues: string;
  predicted_outcome: string;
  recommended_adjustment: string;
  suggested_action: string;
  statement: string;
}

export interface DarthConsequence {
  summary: string;
  if_pattern_continues: string;
  scope: "recovery" | "sleep" | "activity" | "multi_domain";
  severity: "low" | "medium" | "high";
}

export interface DarthBaselineContext {
  headline: string;
  explanation: string;
}

export interface DarthEvidence {
  strength: number;
  consistency: number;
  coverage: number;
  confidence_adjusted: number;
}

export interface DarthEvidencePackSignal {
  ref_id: string;
  domain: string;
  metric_key: string;
  window: string;
  direction: string;
  comparison_label: string;
  confidence: number;
  display_hint: string;
}

export type DarthDriftStatus =
  | "unknown"
  | "baseline_stable"
  | "baseline_in_transition"
  | "baseline_low_confidence"
  | "emerging_new_pattern";

export interface DarthEvidencePack {
  contract_version: "darth_evidence_pack.v4" | string;
  source: "darth";
  evidence_pack_hash?: string;
  product_frame?: "fitness_performance_recovery_intelligence" | string;
  baseline_semantics?: {
    primary_baseline_label: "recent_personal_baseline" | string;
    comparison_window_label: "recent_week" | string;
    population_comparison_allowed: boolean;
  };
  presentation_policy?: {
    avoid_raw_health_values: boolean;
    avoid_clinical_language: boolean;
    use_fitness_performance_language: boolean;
  };
  drift_context?: {
    status: DarthDriftStatus | string;
    confidence: "unknown" | "low" | "medium" | "high" | string;
    display_hint: string;
  };
  capacity_context?: {
    readiness_frame: "active_life_readiness" | string;
    productivity_frame: "capacity_management" | string;
    subjective_context_available: boolean;
  };
  state: NonNullable<DarthPayload["state"]> | string;
  trajectory: {
    direction: DarthTrajectory["direction"] | string;
    window: string;
    confidence: number;
  };
  confidence: number;
  primary_claim: string;
  guidance_summary: {
    risk_type: string;
    decision_window_hours: number;
    statement: string;
    recommended_adjustment: string;
  };
  baseline_context: DarthBaselineContext;
  evidence_refs: string[];
  signals: DarthEvidencePackSignal[];
  limitations: string[];
  user_profile_type: "general" | "amateur_athlete" | "student" | "entrepreneur";
  allowed_ai_tasks: string[];
  disallowed_ai_claims: string[];
  contextual_intelligence?: {
    contract_version: string;
    current_state_key: string;
    recent_pattern_key: string;
    longitudinal_state: string;
    action_key: string;
    overreaction_key: string;
    evidence_strength: string;
    sol_contract_version?: string;
    sol_primary_archetype?: string;
    sol_comparison_key?: string;
    sol_limitation_key?: string;
  };
}

export interface DarthStatePresentation {
  state_label?: string;
  trajectory?: DarthTrajectory & {
    direction_label?: string;
    window_label?: string;
    confidence_label?: string;
  };
  confidence_label?: string;
  primary_claim?: string;
  baseline_context?: DarthBaselineContext;
  dominant_signal?: string | null;
  conflicting_signal?: string | null;
  conflict?: DarthConflict;
  guidance?: DarthGuidance & {
    risk_type?: string;
  };
  consequence?: DarthConsequence & {
    scope_label?: string;
    severity_label?: string;
  };
  explanation?: string;
}

export interface DarthContextualPresentation {
  locale: "en-IE" | "pt-BR";
  archetype?: string | null;
  headline: string | null;
  recent_pattern: string | null;
  safe_action: string | null;
  what_not_to_overreact_to: string | null;
  confidence: string | null;
  longitudinal: string | null;
  evidence?: string | null;
  explore?: string | null;
}

export interface DarthSolInsightPresentation {
  archetype: string;
  archetype_label: string | null;
  headline: string;
  explanation: string;
  comparison: string | null;
  period: string | null;
  evidence: string;
  confidence: string;
  action: string;
  limitation: string;
}

export interface DarthContextualIntelligence {
  contract_version: "darth.v4" | "darth.v3" | string;
  algorithm_version: "darth_algorithm.v4.0.0" | "darth_algorithm.v3.0.0" | string;
  contextual_contract_version: "darth_contextual_intelligence.v2" | "darth_contextual_intelligence.v1" | string;
  presentation: Partial<
    Record<"en-IE" | "pt-BR", DarthContextualPresentation>
  >;
  eligible_insights?: Partial<
    Record<"en-IE" | "pt-BR", DarthSolInsightPresentation[]>
  >;
}

export interface DarthPayload {
  contract_version?: "darth.v4" | "darth.v3" | string;
  algorithm_version?: string;
  state?:
    | "RECOVERING"
    | "STRAIN_ACCUMULATING"
    | "OVERREACHED"
    | "STABLE"
    | "MISALIGNED_RECOVERY";
  trajectory?: DarthTrajectory;
  primary_claim?: string;
  baseline_context?: DarthBaselineContext;
  dominant_signal?: string | null;
  conflicting_signal?: string | null;
  conflict?: DarthConflict;
  guidance?: DarthGuidance;
  consequence?: DarthConsequence;
  evidence?: DarthEvidence;
  charts?: DarthProofChart[];
  confidence?: number;
  explanation?: string;
  time_windows?: Record<string, { name: string; start: string; end: string }>;
  narrative_state?: {
    primary_theme: string;
    tone: string;
    direction: string;
    confidence: number;
    supporting_domains: string[];
  };
  presentation?: DarthPresentation;
  state_presentation?: Record<string, DarthStatePresentation>;
  explainability?: DarthInsightBlock[];
  teaser?: DarthTeaser;
  evidence_pack?: DarthEvidencePack;
  contextual_intelligence?: DarthContextualIntelligence;
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

export function getDarthTeaser(sections: unknown): DarthTeaser | null {
  return getDarthPayload(sections)?.teaser ?? null;
}

export function getDarthExplainability(sections: unknown): DarthInsightBlock[] {
  return getDarthPayload(sections)?.explainability ?? [];
}

export function resolveDarthLocale(locale: string): DarthLocale {
  if (locale === "hi-IN") return "hi-IN";
  return locale === "pt-BR" ? "pt-BR" : "en-IE";
}

const DARTH_WINDOW_LABELS: Record<
  string,
  { "en-IE": string; "pt-BR": string }
> = {
  latest_day: {
    "en-IE": "latest available day",
    "pt-BR": "dia mais recente com dados",
  },
  last_7d: {
    "en-IE": "recent week",
    "pt-BR": "semana recente",
  },
  rolling_7d: {
    "en-IE": "recent week",
    "pt-BR": "semana recente",
  },
  last_30d: {
    "en-IE": "recent month",
    "pt-BR": "mês recente",
  },
  baseline_30d: {
    "en-IE": "recent personal baseline",
    "pt-BR": "padrão pessoal recente",
  },
  baseline_long: {
    "en-IE": "recent personal baseline",
    "pt-BR": "padrão pessoal recente",
  },
};

const DARTH_TRAJECTORY_LABELS: Record<
  string,
  { "en-IE": string; "pt-BR": string }
> = {
  improving: {
    "en-IE": "more favorable",
    "pt-BR": "mais favorável",
  },
  deteriorating: {
    "en-IE": "less favorable",
    "pt-BR": "menos favorável",
  },
  unstable: {
    "en-IE": "signals are mixed",
    "pt-BR": "sinais mistos",
  },
};

function darthDisplayLocale(locale: string): "en-IE" | "pt-BR" {
  return locale === "pt-BR" ? "pt-BR" : "en-IE";
}

export function displayDarthWindowLabel(
  window: string | null | undefined,
  locale: string
): string | null {
  if (!window) return null;
  const resolved = darthDisplayLocale(locale);
  const labels = DARTH_WINDOW_LABELS[window];
  return labels?.[resolved] ?? window.replaceAll("_", " ");
}

export function displayDarthComparisonLabel(
  window: string | null | undefined,
  locale: string
): string | null {
  if (!window) return null;
  const resolved = darthDisplayLocale(locale);
  if (window === "baseline_30d" || window === "baseline_long") {
    return resolved === "pt-BR"
      ? "semana recente comparada com padrão pessoal recente"
      : "recent week compared with recent personal baseline";
  }
  return displayDarthWindowLabel(window, locale);
}

export function displayDarthTrajectoryLabel(
  direction: string | null | undefined,
  locale: string
): string | null {
  if (!direction) return null;
  const resolved = darthDisplayLocale(locale);
  const labels = DARTH_TRAJECTORY_LABELS[direction];
  return labels?.[resolved] ?? direction.replaceAll("_", " ");
}

export function humanizeDarthTechnicalText(
  value: string | null | undefined,
  locale: string
): string | null {
  if (!value) return null;
  const resolved = darthDisplayLocale(locale);
  const replacements: Array<[RegExp, string]> = [
    [/\blast_7d\b/gi, DARTH_WINDOW_LABELS.last_7d[resolved]],
    [/\brolling_7d\b/gi, DARTH_WINDOW_LABELS.rolling_7d[resolved]],
    [/\blast_30d\b/gi, DARTH_WINDOW_LABELS.last_30d[resolved]],
    [/\bbaseline_30d\b/gi, DARTH_WINDOW_LABELS.baseline_30d[resolved]],
    [/\bbaseline_long\b/gi, DARTH_WINDOW_LABELS.baseline_long[resolved]],
    [/\blatest_day\b/gi, DARTH_WINDOW_LABELS.latest_day[resolved]],
    [
      /\bdeteriorating\b/gi,
      resolved === "pt-BR" ? "menos favorável" : "less favorable",
    ],
    [
      /\bphysiological state\b/gi,
      resolved === "pt-BR"
        ? "padrão de prontidão para vida ativa"
        : "active-life readiness pattern",
    ],
    [
      /\bphysiological strain\b/gi,
      resolved === "pt-BR" ? "carga de recuperação" : "recovery load",
    ],
    [
      /\bhealth baseline\b/gi,
      resolved === "pt-BR" ? "padrão pessoal" : "personal pattern",
    ],
    [
      /\bhealth pattern\b/gi,
      resolved === "pt-BR" ? "padrão pessoal" : "personal pattern",
    ],
    [/\bstrain\b/gi, resolved === "pt-BR" ? "carga" : "load"],
    [
      /\busual range\b/gi,
      resolved === "pt-BR"
        ? "padrão pessoal recente"
        : "recent personal baseline",
    ],
  ];
  const cleaned = replacements
    .reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replace(/\bvs\b/gi, resolved === "pt-BR" ? "comparado com" : "compared with")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

export function resolveDarthPresentationLocale(
  _presentation: DarthPresentation | null | undefined,
  activeLocale: string
): DarthLocale {
  return resolveDarthLocale(activeLocale);
}

export function selectDarthCopy(
  copy: Record<string, DarthCopy> | undefined,
  locale: string
): DarthCopy | null {
  if (!copy) return null;
  const resolved = resolveDarthLocale(locale);
  return copy[resolved] ?? (resolved === "en-IE" ? copy["en-IE"] : null) ?? null;
}

export function selectDarthCta(
  cta: DarthPresentation["cta"] | undefined,
  locale: string
): string | null {
  if (!cta) return null;
  const resolved = resolveDarthLocale(locale);
  return cta.copy[resolved] ?? (resolved === "en-IE" ? cta.copy["en-IE"] : null) ?? null;
}

export function selectDarthStatePresentation(
  payload: DarthPayload | null | undefined,
  locale: string
): DarthStatePresentation | null {
  if (!payload?.state_presentation) return null;
  const resolved = resolveDarthLocale(locale);
  return payload.state_presentation[resolved] ??
    (resolved === "en-IE" ? payload.state_presentation["en-IE"] : null) ??
    null;
}
