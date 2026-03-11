/**
 * Apple Health Export Tutorial
 *
 * Responsive tutorial section — images only, no explanatory text.
 * Desktop/tablet: 4 images in a 4-column grid.
 * Mobile: horizontal scroll-snap carousel.
 *
 * Image assets expected in public/tutorial/.
 */

"use client";

const STEPS = [
  { src: "/tutorial/step1.png", alt: "step1" },
  { src: "/tutorial/step2.png", alt: "step2" },
  { src: "/tutorial/step3.png", alt: "step3" },
  { src: "/tutorial/step4.png", alt: "step4" },
];

export function AppleHealthTutorial() {
  return (
    <section>
      {/* Desktop / Tablet: 4-column grid */}
      <div className="hidden md:grid grid-cols-4 gap-6 items-center justify-center">
        {STEPS.map((step) => (
          <img
            key={step.alt}
            src={step.src}
            alt={step.alt}
            className="w-full h-auto rounded-2xl"
          />
        ))}
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory pb-2 md:hidden">
        {STEPS.map((step) => (
          <img
            key={step.alt}
            src={step.src}
            alt={step.alt}
            className="snap-center min-w-[260px] rounded-2xl"
          />
        ))}
      </div>
    </section>
  );
}
