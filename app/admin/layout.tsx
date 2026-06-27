import { Logo } from "@/components/shared/logo";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin — Engage7",
};

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/features", label: "Features" },
  { href: "/admin/ai-artifacts", label: "AI Artifacts" },
  { href: "/admin/blobs", label: "Blob Storage" },
  { href: "/admin/feedback", label: "Feedback" },
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side role check — redirect non-admins
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifyJwt(token) : null;

  if (!session || session.role !== "admin") {
    redirect("/portal");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Logo size={28} href="/admin" className="rounded-lg" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                Engage7 Admin Portal
              </span>
              <span className="block text-[11px] text-muted-foreground">
                Engage7 Labs
              </span>
            </div>
          </div>
          <nav
            aria-label="Admin navigation"
            className="flex items-center gap-x-4 gap-y-2 overflow-x-auto whitespace-nowrap pb-1 text-xs lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0"
          >
            {ADMIN_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/portal"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Portal
            </a>
            <AdminLogoutButton />
            <span className="text-[10px] text-muted-foreground/50">
              v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.45.0.0"}
            </span>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
