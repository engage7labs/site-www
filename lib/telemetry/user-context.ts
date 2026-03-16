/**
 * User Context Helpers
 *
 * Captures privacy-safe browser context for telemetry enrichment.
 * Sprint 11 — locale, timezone, device class, viewport, referrer.
 */

/** Coarse time-of-day bucket derived from the browser clock. */
function getTimeOfDayBucket(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/** Simple device-type classification from viewport width. */
function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/** Detect browser family from userAgent. */
function getBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "other";
}

/** Parse UTM parameters from the current URL. */
function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

/**
 * Returns a privacy-safe context object suitable for PostHog event properties.
 */
export function getUserContext(): Record<string, unknown> {
  if (typeof window === "undefined") return {};

  return {
    locale: navigator.language ?? "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
    browser: getBrowser(),
    device_type: getDeviceType(),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    referrer: document.referrer || undefined,
    path: window.location.pathname,
    local_hour: new Date().getHours(),
    time_of_day_bucket: getTimeOfDayBucket(),
    ...getUtmParams(),
  };
}
