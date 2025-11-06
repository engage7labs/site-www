"use client"

import { useEffect, useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"

export function MouseSpotlight() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightRef = useRef<HTMLDivElement>(null)

  const springX = useTransform(mouseX, (value) => value)
  const springY = useTransform(mouseY, (value) => value)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      ref={spotlightRef}
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      style={{
        background: `radial-gradient(circle 400px at ${mouseX}px ${mouseY}px, rgba(61, 190, 115, 0.15), transparent 80%)`,
      }}
    />
  )
}
