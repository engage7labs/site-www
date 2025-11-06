"use client"

import { useEffect, useRef } from "react"
import { useMotionValue, useSpring } from "framer-motion"

export function MouseSpotlight() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightRef = useRef<HTMLDivElement>(null)

  const springX = useSpring(mouseX, {
    stiffness: 50,
    damping: 20,
    mass: 0.5,
  })

  const springY = useSpring(mouseY, {
    stiffness: 50,
    damping: 20,
    mass: 0.5,
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const unsubscribeX = springX.onChange((latest) => {
      if (spotlightRef.current) {
        const yVal = springY.get()
        spotlightRef.current.style.background = `radial-gradient(circle 500px at ${latest}px ${yVal}px, rgba(61, 190, 115, 0.25) 0%, rgba(61, 190, 115, 0.1) 30%, transparent 70%)`
      }
    })

    const unsubscribeY = springY.onChange((latest) => {
      if (spotlightRef.current) {
        const xVal = springX.get()
        spotlightRef.current.style.background = `radial-gradient(circle 500px at ${xVal}px ${latest}px, rgba(61, 190, 115, 0.25) 0%, rgba(61, 190, 115, 0.1) 30%, transparent 70%)`
      }
    })

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      unsubscribeX()
      unsubscribeY()
    }
  }, [mouseX, mouseY, springX, springY])

  return <div ref={spotlightRef} className="pointer-events-none fixed inset-0 z-10 overflow-hidden" />
}
