import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion'
import { easeLux } from '../lib/motion'

/**
 * The gallery's opening wall — a single portrait treated as the centerpiece
 * work. Full-bleed and hushed: a slow breath of a zoom, the faintest cursor
 * parallax, and the name set like an engraved plate. One continuous gradient
 * carries the image into the black (no seams), so the type stays legible on
 * the left while the portrait holds the frame.
 */
export default function Hero() {
  const sectionRef = useRef(null)

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const ix = useSpring(px, { stiffness: 60, damping: 20 })
  const iy = useSpring(py, { stiffness: 60, damping: 20 })
  const onMove = (e) => {
    px.set((e.clientX / window.innerWidth - 0.5) * -20)
    py.set((e.clientY / window.innerHeight - 0.5) * -20)
  }

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.55])
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-24%'])

  const nameLines = [
    { text: 'Zay', gold: false },
    { text: '“Domo”', gold: true },
    { text: 'Artist', gold: false },
  ]

  return (
    <section
      ref={sectionRef}
      id="hero"
      onMouseMove={onMove}
      className="relative min-h-screen w-full overflow-hidden bg-obsidian"
    >
      {/* ── The portrait (full-bleed) ── */}
      <motion.div className="absolute inset-0" style={{ x: ix, y: iy }}>
        <motion.div
          className="absolute inset-[-4%]"
          style={{ y: imgY }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: easeLux }}
        >
          <motion.img
            src="/headshots/headshot-3.jpg"
            alt="Zay “Domo” Artist"
            className="w-full h-full object-cover object-[68%_20%]"
            style={{ filter: 'grayscale(100%) contrast(1.05) brightness(0.9)' }}
            animate={{ scale: [1, 1.06] }}
            transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
          />
          <motion.div className="absolute inset-0 bg-obsidian" style={{ opacity: dim }} />
        </motion.div>

        {/* one continuous wash: darkens the left for the type, melts the
            bottom into the next room. Single layers → no visible seam. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #060607 0%, rgba(6,6,7,0.94) 20%, rgba(6,6,7,0.6) 36%, rgba(6,6,7,0.18) 55%, rgba(6,6,7,0) 76%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #060607 1%, rgba(6,6,7,0) 26%)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(130% 100% at 62% 42%, transparent 62%, rgba(6,6,7,0.5) 100%)' }}
        />
      </motion.div>

      {/* ── The plate / name ── */}
      <motion.div style={{ y: titleY }} className="relative z-10 min-h-screen flex items-center pointer-events-none">
        <div className="w-full px-6 md:px-16">
          <div className="md:max-w-[46%]">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: easeLux, delay: 0.4 }}
              className="mb-8"
            >
              <span className="text-[10.5px] tracking-[0.5em] uppercase font-light text-bone/55">
                The Portfolio of
              </span>
            </motion.div>

            <h1 className="font-serif font-light text-ivory leading-[0.86] tracking-tight text-[clamp(3.2rem,9vw,9rem)]">
              {nameLines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    className={`inline-block ${line.gold ? 'italic text-gold-metallic pr-[0.1em]' : ''}`}
                    style={line.gold ? { marginLeft: '0.6em' } : undefined}
                    initial={{ y: '116%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1.15, ease: easeLux, delay: 0.55 + i * 0.14 }}
                  >
                    {line.text}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: easeLux, delay: 1.15 }}
              className="mt-9 flex items-center gap-5"
            >
              <span className="h-px w-12 bg-gold/50" />
              <span className="text-[11px] md:text-xs tracking-[0.4em] uppercase font-light text-bone/75">
                Actor &nbsp;·&nbsp; Producer &nbsp;·&nbsp; Director
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Enter cue ── */}
      <motion.a
        href="#about"
        data-cursor="ENTER"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        className="absolute bottom-9 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 group"
      >
        <span className="text-[10px] tracking-[0.45em] uppercase font-light text-bone/50 group-hover:text-gold transition-colors duration-500">
          Enter
        </span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="block h-10 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(200,162,76,0.7), transparent)' }}
        />
      </motion.a>
    </section>
  )
}
