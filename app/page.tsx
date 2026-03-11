"use client";

import { MouseSpotlight } from "@/components/mouse-spotlight";
import { useLocale } from "@/components/providers/locale-provider";
import { CommunityActivity } from "@/components/shared/community-activity";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { TechLogos } from "@/components/shared/tech-logos";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  FileCheck,
  FileText,
  Shield,
  TrendingUp,
  Upload,
} from "lucide-react";
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

export default function Home() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background">
      <MouseSpotlight />

      {/* Navigation */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background-field-jDbtjx7wXc8MMdz8MSbyAkcF5uTMNF.jpg')`,
          }}
        />
        {/* White overlay for text legibility */}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/50" />

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-3xl text-center space-y-8 relative z-10"
        >
          {/* Main Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-semibold text-pretty text-white leading-tight tracking-tight"
          >
            {t.home.hero.title}{" "}
            <span className="text-accent">{t.home.hero.titleHighlight}</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-white max-w-2xl mx-auto leading-relaxed font-light"
          >
            {t.home.hero.subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <Link href="/analyze">
              <Button
                size="lg"
                className="bg-[#C3F531] hover:bg-[#C3F531] text-black rounded-full px-8 transition-all duration-300 focus:ring-2 focus:ring-[#C3F531]/50 active:brightness-95"
              >
                {t.home.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 rounded-full px-8 hover:bg-white/20 transition-all duration-300 bg-white/10 text-white"
              onClick={() => {
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t.home.hero.ctaSecondary}
            </Button>
          </motion.div>

          {/* Trust microcopy */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/90"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t.home.hero.trustLine1}
            </span>
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t.home.hero.trustLine2}
            </span>
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t.home.hero.trustLine3}
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
              {t.home.pillars.sectionTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.home.pillars.sectionSubtitle}
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Deterministic Analysis Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                <Activity className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {t.home.pillars.deterministic.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t.home.pillars.deterministic.description}
              </p>
            </motion.div>

            {/* Explainable Signals Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {t.home.pillars.explainable.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t.home.pillars.explainable.description}
              </p>
            </motion.div>

            {/* Privacy by Design Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {t.home.pillars.privacy.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t.home.pillars.privacy.description}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How Engage7 Works Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
              {t.home.howItWorks.sectionTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.home.howItWorks.sectionSubtitle}
            </p>
          </motion.div>

          {/* 4-Step Process */}
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-accent">Step 1</div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t.home.howItWorks.step1.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.home.howItWorks.step1.description}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Activity className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-accent">Step 2</div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t.home.howItWorks.step2.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.home.howItWorks.step2.description}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-accent">Step 3</div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t.home.howItWorks.step3.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.home.howItWorks.step3.description}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <FileCheck className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-accent">Step 4</div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t.home.howItWorks.step4.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.home.howItWorks.step4.description}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Activity Section */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-xl mx-auto">
          <CommunityActivity t={t.home.communityActivity} />
        </div>
      </section>

      {/* Example Report Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
              {t.home.exampleReport.sectionTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.home.exampleReport.sectionSubtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card p-8 md:p-12 space-y-8">
              <div className="text-center space-y-2 pb-6 border-b border-border">
                <div className="inline-flex items-center justify-center p-3 rounded-lg bg-accent/10 mb-4">
                  <FileText className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  {t.home.exampleReport.cardTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t.home.exampleReport.cardSubtitle}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {t.home.exampleReport.sampleSummary.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t.home.exampleReport.sampleSummary.description}
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {t.home.exampleReport.sampleBaseline.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t.home.exampleReport.sampleBaseline.description}
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {t.home.exampleReport.sampleSignals.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t.home.exampleReport.sampleSignals.description}
                  </p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    {t.home.exampleReport.sampleStatus.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t.home.exampleReport.sampleStatus.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
              {t.home.faq.sectionTitle}
            </h2>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg bg-card border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t.home.faq.q1.question}
              </h3>
              <p className="text-muted-foreground">{t.home.faq.q1.answer}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg bg-card border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t.home.faq.q2.question}
              </h3>
              <p className="text-muted-foreground">{t.home.faq.q2.answer}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg bg-card border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t.home.faq.q3.question}
              </h3>
              <p className="text-muted-foreground">{t.home.faq.q3.answer}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg bg-card border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t.home.faq.q4.question}
              </h3>
              <p className="text-muted-foreground">{t.home.faq.q4.answer}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg bg-card border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t.home.faq.q5.question}
              </h3>
              <p className="text-muted-foreground">{t.home.faq.q5.answer}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="p-6 rounded-lg bg-card border border-border"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {t.home.faq.q6.question}
              </h3>
              <p className="text-muted-foreground">{t.home.faq.q6.answer}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {t.home.techStack.title}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <TechLogos />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-card/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground">
            {t.home.cta.title}
          </h2>
          <p className="text-lg text-muted-foreground">{t.home.cta.subtitle}</p>
          <div className="flex justify-center pt-4">
            <Link href="/analyze">
              <Button
                size="lg"
                className="bg-[#C3F531] hover:bg-[#C3F531] text-black rounded-full px-8 transition-all duration-300 focus:ring-2 focus:ring-[#C3F531]/50 active:brightness-95"
              >
                {t.home.cta.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
