export type AiValidationStatus = "passed" | "warning" | "blocked";

export interface AiNarrative {
  headline: string;
  longitudinal_interpretation: string;
  why_it_matters: string;
  suggested_next_step: string;
  evidence_used: string[];
  confidence_note: string;
  safety_note: string;
}

export interface AiReflectionArtifact {
  artifact_id: number;
  created_at: string | null;
  feature_key: string;
  analysis_id: string | null;
  input_evidence_pack_hash: string | null;
  input_contract_version: string | null;
  locale: string;
  provider: string;
  model: string;
  gate_mode: string;
  validation_status: AiValidationStatus;
  validation_warnings: string[];
  validation_errors: string[];
  would_pass_restricted: boolean;
  approx_input_tokens?: number | null;
  approx_output_tokens?: number | null;
  narrative: AiNarrative;
  report?: {
    job_id: string | null;
    report_label: string | null;
    created_at: string | null;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(source: Record<string, unknown>, key: keyof AiNarrative): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeCandidate(candidate: unknown): AiNarrative | null {
  if (!isRecord(candidate)) return null;
  const headline = stringField(candidate, "headline");
  const longitudinal = stringField(candidate, "longitudinal_interpretation");
  const why = stringField(candidate, "why_it_matters");
  const next = stringField(candidate, "suggested_next_step");
  const confidence = stringField(candidate, "confidence_note");
  const safety = stringField(candidate, "safety_note");
  const evidence = candidate.evidence_used;
  if (
    !headline ||
    !longitudinal ||
    !why ||
    !next ||
    !confidence ||
    !safety ||
    !Array.isArray(evidence)
  ) {
    return null;
  }
  return {
    headline,
    longitudinal_interpretation: longitudinal,
    why_it_matters: why,
    suggested_next_step: next,
    confidence_note: confidence,
    safety_note: safety,
    evidence_used: evidence
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .map((item) => item.trim())
      .slice(0, 5),
  };
}

export function extractAiNarrativeViewModel(source: unknown): AiNarrative | null {
  if (!isRecord(source)) return null;
  const renderedOutput = isRecord(source.rendered_output) ? source.rendered_output : null;
  const renderedOutputJson = isRecord(source.rendered_output_json)
    ? source.rendered_output_json
    : null;
  const artifact = isRecord(source.artifact) ? source.artifact : null;
  const artifactRendered = artifact && isRecord(artifact.rendered_output)
    ? artifact.rendered_output
    : null;

  const candidates = [
    source.narrative,
    renderedOutput?.narrative,
    source.normalized_output,
    renderedOutputJson?.narrative,
    source.normalized_output_json,
    artifact?.narrative,
    artifactRendered?.narrative,
    artifact?.normalized_output,
    source,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (normalized) return normalized;
  }
  return null;
}
