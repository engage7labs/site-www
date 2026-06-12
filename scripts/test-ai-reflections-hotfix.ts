import assert from "node:assert/strict";
import {
  extractAiNarrativeViewModel,
  extractAiReflectionMetadata,
  isCurrentAiReflection,
  isRenderableAiReflection,
} from "../lib/ai-reflections";

const narrative = {
  headline: "Recovery trend is steady",
  longitudinal_interpretation: "Your recent pattern is holding steady.",
  why_it_matters: "This helps you plan load with context.",
  suggested_next_step: "Keep the next block consistent.",
  evidence_used: ["sleep trend", "activity load"],
  confidence_note: "Confidence is moderate.",
  safety_note: "Reflection only.",
};

const context = {
  featureKey: "ai_darth_health_overview_narrative",
  analysisId: "137",
  evidencePackHash: "sha256:current",
  locale: "en-IE",
};

const passedRenderedArtifact = {
  artifact_id: 19,
  feature_key: "ai_darth_health_overview_narrative",
  analysis_id: 137,
  input_evidence_pack_hash: "sha256:current",
  locale: "en-IE",
  gate_mode: "monitor",
  validation_status: "passed",
  validation_warnings: [],
  validation_errors: [],
  would_pass_restricted: "Yes",
  rendered_output: { narrative },
};

assert.deepEqual(extractAiNarrativeViewModel(passedRenderedArtifact), narrative);
const passedMetadata = extractAiReflectionMetadata(passedRenderedArtifact);
assert.equal(isRenderableAiReflection(passedMetadata), true);
assert.equal(isCurrentAiReflection(passedMetadata, context), true);

const flatNormalizedArtifact = {
  ...passedRenderedArtifact,
  rendered_output: undefined,
  normalized_output: narrative,
};

assert.deepEqual(extractAiNarrativeViewModel(flatNormalizedArtifact), narrative);
assert.equal(isRenderableAiReflection(extractAiReflectionMetadata(flatNormalizedArtifact)), true);

const warningArtifact = {
  ...passedRenderedArtifact,
  validation_status: "warning",
  validation_warnings: ["field_truncated"],
};

assert.equal(isRenderableAiReflection(extractAiReflectionMetadata(warningArtifact)), true);

const blockedArtifact = {
  ...passedRenderedArtifact,
  validation_status: "blocked",
};

assert.equal(isRenderableAiReflection(extractAiReflectionMetadata(blockedArtifact)), false);

const wrongLocaleArtifact = {
  ...passedRenderedArtifact,
  locale: "pt-BR",
};

assert.equal(isCurrentAiReflection(extractAiReflectionMetadata(wrongLocaleArtifact), context), false);

const wrongEvidenceArtifact = {
  ...passedRenderedArtifact,
  input_evidence_pack_hash: "sha256:old",
};

assert.equal(isCurrentAiReflection(extractAiReflectionMetadata(wrongEvidenceArtifact), context), false);

const warningWithErrors = {
  ...passedRenderedArtifact,
  validation_status: "warning",
  validation_errors: ["unsafe_output"],
};

assert.equal(isRenderableAiReflection(extractAiReflectionMetadata(warningWithErrors)), false);

console.log("AI reflection hotfix helper checks passed");
