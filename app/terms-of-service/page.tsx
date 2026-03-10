/**
 * Terms of Service Page
 *
 * Defines the terms and conditions for using Engage7 Labs services.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
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

export default function TermsOfServicePage() {
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
            {t.termsOfService.backToHome}
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
              <FileText className="h-8 w-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
                {t.termsOfService.title}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.termsOfService.lastUpdated}
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t.termsOfService.intro}
            </p>
          </motion.div>

          {/* Section 1: Service Description */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.termsOfService.sections.serviceDescription.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.termsOfService.sections.serviceDescription.content}
            </p>
          </motion.section>

          {/* Section 2: User Responsibilities */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.termsOfService.sections.userResponsibilities.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.termsOfService.sections.userResponsibilities.content}
            </p>
          </motion.section>

          {/* Section 3: Medical Disclaimer */}
          <motion.section
            variants={fadeInUp}
            className="space-y-4 p-6 border-l-4 border-destructive bg-destructive/5"
          >
            <h2 className="text-2xl font-semibold text-foreground">
              {t.termsOfService.sections.disclaimer.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.termsOfService.sections.disclaimer.content}
            </p>
          </motion.section>

          {/* Section 4: Limitation of Liability */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.termsOfService.sections.limitation.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.termsOfService.sections.limitation.content}
            </p>
          </motion.section>

          {/* Section 5: Service Changes */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t.termsOfService.sections.serviceChanges.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t.termsOfService.sections.serviceChanges.content}
            </p>
          </motion.section>

          {/* Back to Home CTA */}
          <motion.div variants={fadeInUp} className="pt-8">
            <Link href="/">
              <Button size="lg" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.termsOfService.backToHome}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
