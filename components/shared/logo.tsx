import Link from "next/link";

/**
 * Engage7 Logo — 96x96 placeholder.
 *
 * A self-contained SVG placeholder component. Replace the SVG contents
 * with the real logo asset when available. If a `href` is provided the
 * logo wraps in a Next.js Link.
 */
export function Logo({
  size = 96,
  href,
  className,
}: {
  size?: number;
  href?: string;
  className?: string;
}) {
  const svg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Engage7 logo"
    >
      <rect
        width="96"
        height="96"
        rx="20"
        className="fill-accent"
      />
      <text
        x="48"
        y="56"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-accent-foreground"
        fontSize="32"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        E7
      </text>
    </svg>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Go to homepage">
        {svg}
      </Link>
    );
  }

  return svg;
}
