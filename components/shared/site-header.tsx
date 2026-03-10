/**
 * SiteHeader — shared top navigation used across all public pages.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  const { t } = useLocale();

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
            <Button variant="ghost" className="text-foreground hover:bg-muted">
              {t.nav.getStarted}
            </Button>
          </Link>
        </motion.div>
      </div>
    </nav>
  );
}
