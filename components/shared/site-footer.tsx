/**
 * SiteFooter — shared footer used across all public pages.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getApiVersion } from "@/lib/api/analysis";
import { config } from "@/lib/config";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

interface FooterApiVersion {
  version?: string;
  git_sha?: string;
  build_time?: string;
}

function safeToken(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return null;
  if (/[/\\]|https?:|=|@/.test(trimmed)) return null;
  if (!/^[A-Za-z0-9._:+-]+$/.test(trimmed)) return null;
  return trimmed;
}

function formatVersion(value: string | null | undefined): string | null {
  const token = safeToken(value);
  if (!token) return null;
  return token.startsWith("v") ? token : `v${token}`;
}

function buildVersionTitle(apiVersion: FooterApiVersion | null): string {
  const webVersion = formatVersion(config.appVersion) ?? "Web version unavailable";
  if (!apiVersion?.version) {
    return `Web ${webVersion} | API unavailable`;
  }

  const formattedApiVersion = formatVersion(apiVersion.version);
  if (!formattedApiVersion) {
    return `Web ${webVersion} | API unavailable`;
  }

  const gitSha = safeToken(apiVersion.git_sha);
  if (gitSha) {
    return `Web ${webVersion} | API ${formattedApiVersion} | API hash ${gitSha}`;
  }

  const buildTime = safeToken(apiVersion.build_time);
  if (buildTime) {
    return `Web ${webVersion} | API ${formattedApiVersion} | API build ${buildTime}`;
  }

  return `Web ${webVersion} | API ${formattedApiVersion} | API hash unavailable`;
}

export function SiteFooter() {
  const { t } = useLocale();
  const [apiVersion, setApiVersion] = useState<FooterApiVersion | null>(null);
  const versionTitle = buildVersionTitle(apiVersion);

  useEffect(() => {
    let cancelled = false;

    getApiVersion()
      .then((response) => {
        if (!cancelled) setApiVersion(response);
      })
      .catch(() => {
        if (!cancelled) setApiVersion(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
          <p
            className="text-muted-foreground text-sm"
            title={versionTitle}
          >
            {t.home.footer.copyright}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:justify-end">
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
            <span
              className="text-xs text-muted-foreground/60"
              title={versionTitle}
            >
              {formatVersion(config.appVersion) ?? "vdev"}
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
