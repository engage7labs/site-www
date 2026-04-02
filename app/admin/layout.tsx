import { SESSION_COOKIE_NAME, verifyJwt } from "@/lib/auth-server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin — Engage7",
};

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
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-bold">
              E7
            </span>
            <span className="text-sm font-semibold text-foreground">
              Admin Panel
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs">
            <a
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Overview
            </a>
            <a
              href="/admin/users"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Users
            </a>
            <a
              href="/admin/events"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Events
            </a>
            <a
              href="/admin/feedback"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Feedback
            </a>
            <a
              href="/portal"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Portal
            </a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
