/**
 * Friends Page
 *
 * Social sharing and invite page for Engage7.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { SocialShare } from "@/components/shared/social-share";
import { Button } from "@/components/ui/button";
import { getPublicMetrics, type PublicMetrics } from "@/lib/api/analysis";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Globe,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function FriendsPage() {
  const { t } = useLocale();
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    getPublicMetrics()
      .then(setMetrics)
      .catch(() => setMetricsError(true));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.friends.backToHome}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-12"
        >
          {/* Page Header */}
          <motion.div variants={fadeInUp} className="space-y-4 text-center">
            <div className="flex items-center justify-center space-x-3">
              <Users className="h-8 w-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
                {t.friends.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t.friends.subtitle}
            </p>
          </motion.div>

          {/* Social Proof Metrics */}
          <motion.div variants={fadeInUp} className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">
                {t.friends.socialProof.title}
              </h2>
              {metricsError ? (
                <p className="text-sm text-muted-foreground text-center">
                  {t.friends.socialProof.error}
                </p>
              ) : !metrics ? (
                <p className="text-sm text-muted-foreground text-center">
                  {t.friends.socialProof.loading}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground">
                      {metrics.total_uploads}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.friends.socialProof.totalUploads}
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground">
                      {metrics.uploads_24h}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.friends.socialProof.recentUploads}
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-2xl font-semibold text-foreground">
                      {metrics.unique_locales}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.friends.socialProof.languages}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Share Card */}
          <motion.div variants={fadeInUp} className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Share2 className="h-8 w-8 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {t.friends.shareTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.friends.shareDescription}
                </p>
              </div>

              <SocialShare
                url={t.friends.shareUrl}
                text={t.friends.shareText}
                t={t.socialShare}
              />
            </div>
          </motion.div>

          {/* Back to Home CTA */}
          <motion.div variants={fadeInUp} className="text-center pt-8">
            <Link href="/">
              <Button size="lg" variant="outline" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.friends.backToHome}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
