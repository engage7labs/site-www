/**
 * SiteHeader — shared top navigation used across all public pages.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { LoginFormFields } from "@/components/shared/login-form-fields";
import { Logo } from "@/components/shared/logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  fetchAuthSessionSnapshot,
  subscribeAuthSessionChanges,
} from "@/lib/auth-session-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function SiteHeader() {
  const { t } = useLocale();
  const [loginOpen, setLoginOpen] = useState(false);
  const [sessionDestination, setSessionDestination] = useState<{
    href: string;
    label: string;
  } | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const refreshSessionDestination = useCallback(async () => {
    const session = await fetchAuthSessionSnapshot().catch(() => null);
    if (!session) {
      setSessionDestination(null);
      setSessionChecked(true);
      return;
    }

    setSessionDestination(
      session.role === "admin" && session.mode !== "admin_view"
        ? { href: "/admin", label: t.nav.dashboard }
        : { href: "/portal", label: t.nav.portal }
    );
    setSessionChecked(true);
  }, [t.nav.dashboard, t.nav.portal]);

  useEffect(() => {
    void refreshSessionDestination();
    const unsubscribe = subscribeAuthSessionChanges(() => {
      void refreshSessionDestination();
    });
    const handleFocus = () => {
      void refreshSessionDestination();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshSessionDestination]);

  return (
    <nav className="fixed top-0 w-full bg-white dark:bg-background border-b border-border z-50 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/">
            <Image
              src="/logo-engage7-labs.svg"
              alt="Engage7 Labs"
              width={160}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <ThemeSwitcher />
          <LocaleSwitcher />
          <Link href="/analyze">
            <Button className="bg-lime-400 text-black font-medium rounded-md px-4 py-2 hover:bg-lime-300 transition">
              {t.nav.getStarted}
            </Button>
          </Link>

          {sessionDestination ? (
            <Link href={sessionDestination.href}>
              <button
                className="rounded-md border border-lime-400 px-4 py-2 text-sm font-medium text-lime-400 transition hover:bg-lime-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
                type="button"
              >
                {sessionDestination.label}
              </button>
            </Link>
          ) : sessionChecked ? (
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <button
                  className="rounded-md border border-lime-400 px-4 py-2 text-sm font-medium text-lime-400 transition hover:bg-lime-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
                  type="button"
                >
                  {t.nav.login}
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="text-center">
                  <div className="mx-auto mb-2">
                    <Logo size={48} compact href="/" />
                  </div>
                  <DialogTitle className="text-2xl">
                    {t.auth.login.title}
                  </DialogTitle>
                  <DialogDescription>
                    {t.auth.login.subtitle}
                  </DialogDescription>
                </DialogHeader>
                <LoginFormFields onSuccess={() => setLoginOpen(false)} />
              </DialogContent>
            </Dialog>
          ) : (
            <button
              className="rounded-md border border-lime-400/50 px-4 py-2 text-sm font-medium text-lime-400/70"
              type="button"
              disabled
            >
              {t.nav.login}
            </button>
          )}
        </motion.div>
      </div>
    </nav>
  );
}
