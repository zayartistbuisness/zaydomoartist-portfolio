import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { easeLux, easeInOutLux, prefersReducedMotion } from '../lib/motion'

/**
 * A brief first-visit title card. The portfolio is mounted underneath it so
 * the hero image can load immediately, and repeat visits skip it entirely.
 */
export default function Loader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const reduced = useRef(prefersReducedMotion())

  useEffect(() => {
    let raf
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onComplete && onComplete()
    }

    if (reduced.current) {
      const t = setTimeout(() => {
        setProgress(100)
        finish()
      }, 120)
      return () => clearTimeout(t)
    }

    const total = 850
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / total, 1)
      // ease-out so it decelerates into 100
      setProgress(Math.round((1 - Math.pow(1 - p, 2.2)) * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else finish()
    }
    raf = requestAnimationFrame(tick)

    // Guarantee the reveal even if rAF is throttled/paused (e.g. a
    // background/hidden tab) — the site must never get stuck on the intro.
    const guard = setTimeout(() => {
      setProgress(100)
      finish()
    }, total + 250)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(guard)
    }
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-obsidian flex flex-col items-center justify-center overflow-hidden"
      role="status"
      aria-label="Opening Zay Domo Artist portfolio"
      exit={{ opacity: 0, transition: { duration: 0.45, ease: easeInOutLux } }}
    >
      {/* soft radial breath behind the name */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at center, rgba(200,162,76,0.06), transparent 70%)' }}
      />

      {/* Name */}
      <div className="relative text-center px-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, ease: easeLux }}
          className="label-mono text-silver mb-8"
          style={{ letterSpacing: '0.5em' }}
        >
          ACTOR · PRODUCER · DIRECTOR
        </motion.p>

        <h1 className="font-serif font-light leading-[0.95] text-ivory text-5xl md:text-7xl lg:text-8xl tracking-tight">
          {['Zay', 'Domo', 'Artist'].map((word, i) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                className={`inline-block ${i === 1 ? 'italic text-gold-metallic' : ''}`}
                initial={{ y: '115%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.62, ease: easeLux, delay: 0.08 + i * 0.07 }}
              >
                {i === 1 ? '“Domo”' : word}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* drawing hairline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.62, ease: easeInOutLux, delay: 0.16 }}
          className="mx-auto mt-10 h-px w-56 origin-center"
          style={{ background: 'linear-gradient(to right, transparent, rgba(200,162,76,0.7), transparent)' }}
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-baseline gap-3">
        <span className="label-mono text-silver">OPENING</span>
        <span className="font-serif text-ivory text-lg tabular-nums">
          {progress.toString().padStart(3, '0')}
        </span>
        <span className="label-mono text-gold">%</span>
      </div>
    </motion.div>
  )
}
