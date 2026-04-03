import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  size?: number;
  href?: string;
  className?: string;
  compact?: boolean;
};

export function Logo({
  size = 96,
  href,
  className,
  compact = false,
}: LogoProps) {
  const src = compact ? "/bully-96x96.png" : "/engage7-logo-906x275.png";

  const content = (
    <Image
      src={src}
      alt="Engage7 logo"
      width={compact ? size : size * 2}
      height={size}
      className={className}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} aria-label="Go to homepage">
        {content}
      </Link>
    );
  }

  return content;
}
