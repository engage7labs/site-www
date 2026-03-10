/**
 * Contact Page
 *
 * LinkedIn CTA page for connecting with Engage7 Labs.
 */

"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Linkedin } from "lucide-react";
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

export default function ContactPage() {
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
            {t.contact.backToHome}
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
              <Linkedin className="h-8 w-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground">
                {t.contact.title}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t.contact.subtitle}
            </p>
          </motion.div>

          {/* LinkedIn CTA Card */}
          <motion.div variants={fadeInUp} className="max-w-lg mx-auto">
            <div className="rounded-2xl border border-border bg-card p-8 space-y-6 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-[#0A66C2]/10 flex items-center justify-center">
                <Linkedin className="h-10 w-10 text-[#0A66C2]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {t.contact.linkedin.heading}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t.contact.linkedin.description}
                </p>
              </div>
              <a
                href="https://linkedin.com/in/rodrigomarquest"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg"
                >
                  {t.contact.linkedin.button}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Back to Home CTA */}
          <motion.div variants={fadeInUp} className="text-center pt-8">
            <Link href="/">
              <Button size="lg" variant="outline" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.contact.backToHome}
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
