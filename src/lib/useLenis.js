import { useEffect } from 'react'
import Lenis from 'lenis'
import { prefersReducedMotion } from './motion'

/**
 * Inertial scroll for the whole gallery — the MONOLOG glide.
 * Touch stays native (Lenis default); reduced-motion users keep
 * plain browser scrolling and CSS smooth anchors.
 */
export default function useLenis() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    window.lenis = lenis

    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    // Route in-page anchors through Lenis so they glide instead of jump.
    const onClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]')
      if (!anchor) return
      const target = document.querySelector(anchor.getAttribute('href'))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { duration: 1.4 })
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
}
