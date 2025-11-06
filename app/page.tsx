"use client"

import { motion } from "framer-motion"
import { ArrowRight, Lock, Zap, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MouseSpotlight } from "@/components/mouse-spotlight"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <MouseSpotlight />

      {/* Navigation */}
      <nav className="fixed top-0 w-full backdrop-blur-md bg-background/80 border-b border-border z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-semibold text-foreground"
          >
            Engage7 Labs
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Button variant="ghost" className="text-foreground hover:bg-muted">
              Get Started
            </Button>
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
        <div className="absolute inset-0 bg-white/30" />

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
            Calm intelligence, <span className="text-accent">beautifully delivered</span>.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-white max-w-2xl mx-auto leading-relaxed font-light"
          >
            Experience AI that respects your privacy, thinks clearly, and transforms how you work.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 transition-all duration-300"
            >
              Explore Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 rounded-full px-8 hover:bg-white/20 transition-all duration-300 bg-white/10 text-white"
            >
              Learn More
            </Button>
          </motion.div>

          {/* Decorative element */}
          <motion.div variants={fadeInUp} className="pt-8">
            <div className="inline-block px-4 py-2 rounded-full bg-card border border-border">
              <p className="text-sm text-muted-foreground">Trusted by teams building the future</p>
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
            <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">Three pillars of excellence</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with intention to deliver clarity, security, and joy.
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Green AI Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Green AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                Efficient, eco-conscious intelligence that delivers results without waste. Sustainability meets
                performance.
              </p>
            </motion.div>

            {/* Privacy First Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Privacy First</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data stays yours. Encrypted, secure, and never used for training. Privacy is non-negotiable.
              </p>
            </motion.div>

            {/* Fluid UX Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-accent transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300">
                <Smile className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Fluid UX</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seamless, intuitive interactions that feel natural. Clarity in every interaction, from command to
                completion.
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
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground">Ready to experience calm intelligence?</h2>
          <p className="text-lg text-muted-foreground">
            Join teams transforming their workflow with Engage7 Labs. Simple, secure, and beautifully intelligent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 transition-all duration-300"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border rounded-full px-8 hover:bg-muted transition-all duration-300 bg-transparent"
            >
              Schedule a Demo
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
            <p className="text-muted-foreground text-sm">© 2025 Engage7 Labs. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">
                Contact
              </a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
