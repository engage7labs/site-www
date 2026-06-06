/**
 * Feature Preview — Sprint 42.0
 *
 * Reusable hook and helper to load and query preview features from the API.
 * If loading fails, Portal must still render without crashing — all helpers
 * return safe defaults on error.
 *
 * Usage:
 *   const { features, isEnabled } = usePreviewFeatures();
 *   if (isEnabled("darth_v2_portal_insights")) { ... }
 *
 * Security: this module only shows/hides UI badges. It does not gate
 * data access — that remains on the server.
 *
 * Public surfaces: do NOT call usePreviewFeatures() outside authenticated Portal.
 */

"use client";

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewFeature {
  feature_key: string;
  label: string;
  enabled: boolean;
  surface: string;
  rollout_scope: string;
  admin_only: boolean;
  plan_scope: string;
}

interface PreviewFeaturesState {
  features: PreviewFeature[];
  loading: boolean;
  error: boolean;
  isEnabled: (featureKey: string) => boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Load preview features from the authenticated API.
 * Returns safe defaults (empty list, isEnabled → false) on failure.
 * Safe to use in any authenticated Portal component.
 */
export function usePreviewFeatures(): PreviewFeaturesState {
  const [features, setFeatures] = useState<PreviewFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/proxy/users/preview-features");
        if (!res.ok) throw new Error(`Preview features failed: ${res.status}`);
        const data = (await res.json()) as { features?: PreviewFeature[] };
        if (!cancelled) {
          setFeatures(Array.isArray(data.features) ? data.features : []);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isEnabled = (featureKey: string): boolean => {
    const feature = features.find((f) => f.feature_key === featureKey);
    return feature?.enabled === true;
  };

  return { features, loading, error, isEnabled };
}

/**
 * Standalone helper: check if a feature is enabled in a feature list.
 * Useful when features are already loaded (no hook).
 */
export function isPreviewFeatureEnabled(
  features: PreviewFeature[],
  featureKey: string
): boolean {
  return features.find((f) => f.feature_key === featureKey)?.enabled === true;
}
