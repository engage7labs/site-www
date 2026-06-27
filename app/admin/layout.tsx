import { AdminShell } from "@/components/admin/admin-shell";
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

  return <AdminShell>{children}</AdminShell>;
}
