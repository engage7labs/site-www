"use client";

import Link from "next/link";

interface PortalSidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

export function PortalSidebarItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}: PortalSidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-accent/10 text-accent shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span
        className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
