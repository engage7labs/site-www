/**
 * SiteFooter — shared footer used across all public pages.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { motion } from "framer-motion";
import Link from "next/link";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <p className="text-muted-foreground text-sm">
            {t.home.footer.copyright}
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy-policy"
              className="hover:text-foreground transition-colors duration-300"
            >
              {t.home.footer.privacy}
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-foreground transition-colors duration-300"
            >
              {t.home.footer.terms}
            </Link>
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors duration-300"
            >
              {t.home.footer.contact}
            </Link>
            <a
              href="https://github.com/rodrigomarquest/practicum2-nof1-adhd-bd"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors duration-300"
            >
              {t.home.footer.research}
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
