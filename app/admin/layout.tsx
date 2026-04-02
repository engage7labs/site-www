import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Engage7",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <a
            href="/portal"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Portal
          </a>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
