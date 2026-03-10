"use client";

import { motion } from "framer-motion";

interface TechLogo {
  name: string;
  icon: string; // emoji or text representation
}

const row1: TechLogo[] = [
  { name: "Python", icon: "Python" },
  { name: "FastAPI", icon: "FastAPI" },
  { name: "Next.js", icon: "Next.js" },
  { name: "React", icon: "React" },
  { name: "TypeScript", icon: "TypeScript" },
  { name: "Tailwind CSS", icon: "Tailwind" },
  { name: "Pandas", icon: "Pandas" },
  { name: "NumPy", icon: "NumPy" },
];

const row2: TechLogo[] = [
  { name: "Azure", icon: "Azure" },
  { name: "Vercel", icon: "Vercel" },
  { name: "GitHub", icon: "GitHub" },
  { name: "Matplotlib", icon: "Matplotlib" },
  { name: "Pydantic", icon: "Pydantic" },
  { name: "Radix UI", icon: "Radix" },
  { name: "Framer Motion", icon: "Framer" },
  { name: "SQLite", icon: "SQLite" },
];

const row3: TechLogo[] = [
  { name: "Cloudflare", icon: "Cloudflare" },
  { name: "Docker", icon: "Docker" },
  { name: "Node.js", icon: "Node.js" },
  { name: "Recharts", icon: "Recharts" },
  { name: "shadcn/ui", icon: "shadcn" },
  { name: "Lucide", icon: "Lucide" },
  { name: "Sonner", icon: "Sonner" },
  { name: "Uvicorn", icon: "Uvicorn" },
];

function ScrollRow({
  logos,
  direction = "left",
  duration = 30,
}: {
  logos: TechLogo[];
  direction?: "left" | "right";
  duration?: number;
}) {
  const doubled = [...logos, ...logos];

  return (
    <div className="relative overflow-hidden py-2">
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration,
            ease: "linear",
          },
        }}
      >
        {doubled.map((logo, idx) => (
          <div
            key={`${logo.name}-${idx}`}
            className="flex-shrink-0 px-5 py-2.5 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors"
          >
            {logo.name}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function TechLogos() {
  return (
    <div className="space-y-3 overflow-hidden">
      <ScrollRow logos={row1} direction="left" duration={35} />
      <ScrollRow logos={row2} direction="right" duration={40} />
      <ScrollRow logos={row3} direction="left" duration={30} />
    </div>
  );
}
