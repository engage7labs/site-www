/**
 * Friends Page
 *
 * Social sharing and invite page for Engage7.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { CommunityActivity } from "@/components/shared/community-activity";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { SocialShare } from "@/components/shared/social-share";
import { config } from "@/lib/config";
import { motion } from "framer-motion";
import { Share2, Users } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-32 pb-16">
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

          {/* Community Activity */}
          <motion.div variants={fadeInUp} className="max-w-lg mx-auto">
            <CommunityActivity t={t.friends.socialProof} />
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
                url={config.siteUrl}
                text={t.friends.shareText}
                t={t.socialShare}
              />
            </div>
          </motion.div>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}

