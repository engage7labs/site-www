/**
 * Privacy Policy Page
 *
 * Provides transparency about data handling and privacy practices.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

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

export default function PrivacyPolicyPage() {
  const { t } = useLocale();

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
            {t.privacyPolicy.backToHome}
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
          <motion.div variants={fadeInUp} className="space-y-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
                {t.privacyPolicy.title}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.privacyPolicy.lastUpdated}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.privacyPolicy.intro}
            </p>
          </motion.div>

          {/* Section 1: Data Collection */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.privacyPolicy.sections.dataCollection.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.privacyPolicy.sections.dataCollection.content}
            </p>
          </motion.section>

          {/* Section 2: Data Usage */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.privacyPolicy.sections.dataUsage.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.privacyPolicy.sections.dataUsage.content}
            </p>
          </motion.section>

          {/* Section 3: Data Storage */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.privacyPolicy.sections.dataStorage.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.privacyPolicy.sections.dataStorage.content}
            </p>
          </motion.section>

          {/* Section 4: Your Rights */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.privacyPolicy.sections.dataRights.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.privacyPolicy.sections.dataRights.content}
            </p>
          </motion.section>

          {/* Back to Home CTA */}
          <motion.div variants={fadeInUp} className="pt-8">
            <Link href="/">
              <Button size="lg" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.privacyPolicy.backToHome}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
