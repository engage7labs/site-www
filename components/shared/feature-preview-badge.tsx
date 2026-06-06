/**
 * FeaturePreviewBadge — Sprint 42.0
 *
 * Small, clean badge to mark DARTH/experimental Portal cards as Preview.
 * Must only appear in authenticated Portal surfaces — never on public pages.
 *
 * Usage:
 *   <FeaturePreviewBadge />
 *   <FeaturePreviewBadge label="Preview" />
 *
 * Design: small, non-noisy, muted. Does not compete with card content.
 */

interface FeaturePreviewBadgeProps {
  /** Label shown in the badge. Defaults to "Preview". */
  label?: string;
  className?: string;
}

export function FeaturePreviewBadge({
  label = "Preview",
  className = "",
}: FeaturePreviewBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-accent/25 bg-accent/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent/70 ${className}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
