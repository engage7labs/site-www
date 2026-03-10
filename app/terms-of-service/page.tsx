/**
 * Terms of Service Page
 *
 * Defines the terms and conditions for using Engage7 Labs services.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

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
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
