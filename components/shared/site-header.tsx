/**
 * SiteHeader — shared top navigation used across all public pages.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { LoginFormFields } from "@/components/shared/login-form-fields";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

export function SiteHeader() {
  const { t } = useLocale();
  const [loginOpen, setLoginOpen] = useState(false);

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

          {/* Login button + modal */}
          <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
            <DialogTrigger asChild>
              <button
                className="rounded-md border border-lime-400 px-4 py-2 text-sm font-medium text-lime-400 transition hover:bg-lime-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
                type="button"
              >
                Login
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground text-lg font-bold">
                  E7
                </div>
                <DialogTitle>Sign in to Engage7</DialogTitle>
                <DialogDescription>
                  Personal insight system — your data stays yours
                </DialogDescription>
              </DialogHeader>
              <LoginFormFields onSuccess={() => setLoginOpen(false)} />
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </nav>
  );
}
