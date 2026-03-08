"use client";

import { MouseSpotlight } from "@/components/mouse-spotlight";
import { useLocale } from "@/components/providers/locale-provider";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Shield, TrendingUp } from "lucide-react";
import Image from "next/image";
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
      <nav className="fixed top-0 w-full bg-white dark:bg-background border-b border-border z-50 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YWxBTZdyZPGsqtujby8t5HegkfW1hI.png"
              alt="Engage7 Labs"
              width={160}
              height={50}
              className="h-12 w-auto"
            />
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
              <Button
                variant="ghost"
                className="text-foreground hover:bg-muted"
              >
                {t.nav.getStarted}
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

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
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 transition-all duration-300"
              >
                {t.home.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 rounded-full px-8 hover:bg-white/20 transition-all duration-300 bg-white/10 text-white"
            >
              {t.home.hero.ctaSecondary}
            </Button>
          </motion.div>

          {/* Decorative element */}
          <motion.div variants={fadeInUp} className="pt-8">
            <div className="inline-block px-4 py-2 rounded-full bg-card/50 border border-border backdrop-blur-sm">
              <p className="text-sm text-white font-medium">
                {t.home.hero.trustBadge}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/analyze">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 transition-all duration-300"
              >
                {t.home.cta.ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-border rounded-full px-8 hover:bg-muted transition-all duration-300 bg-transparent"
            >
              {t.home.cta.ctaSecondary}
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
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
              <a
                href="#"
                className="hover:text-foreground transition-colors duration-300"
              >
                {t.home.footer.privacy}
              </a>
              <a
                href="#"
                className="hover:text-foreground transition-colors duration-300"
              >
                {t.home.footer.terms}
              </a>
              <a
                href="#"
                className="hover:text-foreground transition-colors duration-300"
              >
                {t.home.footer.contact}
              </a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
