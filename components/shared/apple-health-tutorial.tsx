/**
 * Apple Health Export Tutorial
 *
 * Responsive tutorial section explaining how to export Apple Health data.
 * Desktop/tablet: 4 images in a row (grid).
 * Mobile: horizontal scroll-snap carousel.
 *
 * Image assets are expected in public/ — file paths are easy to adjust.
 */

"use client";

import Image from "next/image";

interface TutorialStep {
  image: string;
  alt: string;
  caption: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    image: "/apple-health-step-1.png",
    alt: "Open the Health app on iPhone",
    caption: "1. Open the Health app",
  },
  {
    image: "/apple-health-step-2.png",
    alt: "Tap your profile photo in the top-right corner",
    caption: "2. Tap your profile photo",
  },
  {
    image: "/apple-health-step-3.png",
    alt: "Scroll down and tap Export All Health Data",
    caption: '3. Tap "Export All Health Data"',
  },
  {
    image: "/apple-health-step-4.png",
    alt: "Save the export ZIP to Files on iPhone",
    caption: "4. Save to Files",
  },
];

export function AppleHealthTutorial() {
  return (
    <section className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          How to export your Apple Health data
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Follow these four steps on your iPhone to create the ZIP file you need
          for analysis. The export typically takes a few minutes.
        </p>
      </div>

      {/* Desktop / Tablet: 4-column grid */}
      {/* Mobile: horizontal scroll-snap carousel */}
      <div
        className={
          "flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 " +
          "md:grid md:grid-cols-4 md:overflow-visible md:snap-none md:pb-0 " +
          "-mx-6 px-6 md:mx-0 md:px-0"
        }
      >
        {TUTORIAL_STEPS.map((step, i) => (
          <div
            key={i}
            className={
              "flex-shrink-0 snap-center w-[72%] sm:w-[55%] md:w-auto " +
              "flex flex-col items-center space-y-3"
            }
          >
            <div className="relative w-full aspect-[9/19] rounded-2xl overflow-hidden bg-muted/30">
              <Image
                src={step.image}
                alt={step.alt}
                fill
                sizes="(max-width: 768px) 72vw, 25vw"
                className="object-contain"
                priority={i === 0}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center font-medium">
              {step.caption}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <p className="text-[11px] text-muted-foreground text-center md:hidden">
        Swipe to see all steps →
      </p>
    </section>
  );
}
