/**
 * SiteHeader — shared top navigation used across all public pages.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  fetchAuthSessionSnapshot,
  subscribeAuthSessionChanges,
} from "@/lib/auth-session-client";
import { resolvePublicHeaderSecondaryCta } from "@/lib/public-header-cta";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { trackPublicGetStartedClicked } from "@/lib/telemetry";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const { t } = useLocale();
  const [hasValidSession, setHasValidSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const refreshSession = async () => {
      const session = await fetchAuthSessionSnapshot().catch(() => null);
      if (active) {
        setHasValidSession(Boolean(session));
        setSessionChecked(true);
      }
    };

    void refreshSession();
    const unsubscribe = subscribeAuthSessionChanges(() => {
      void refreshSession();
    });
    const handleFocus = () => {
      void refreshSession();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const secondaryCta = resolvePublicHeaderSecondaryCta(hasValidSession);

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
          <Button
            asChild
            className="bg-lime-400 text-black font-medium rounded-md px-4 py-2 hover:bg-lime-300 transition"
          >
            <Link
              data-testid="site-header-get-started"
              href="/login?next=/onboarding"
              onClick={trackPublicGetStartedClicked}
            >
              {t.nav.getStarted}
            </Link>
          </Button>
          {sessionChecked ? (
            <Button
              asChild
              className={
                secondaryCta.kind === "portal"
                  ? "bg-black text-white font-medium rounded-md px-4 py-2 hover:bg-zinc-800 transition"
                  : "border border-lime-400 bg-transparent px-4 py-2 font-medium text-lime-500 transition hover:bg-lime-400/10"
              }
              variant="outline"
            >
              <Link data-testid="site-header-secondary-cta" href={secondaryCta.href}>
                {secondaryCta.kind === "portal" ? t.nav.portal : t.nav.signIn}
              </Link>
            </Button>
          ) : null}
        </motion.div>
      </div>
    </nav>
  );
}
