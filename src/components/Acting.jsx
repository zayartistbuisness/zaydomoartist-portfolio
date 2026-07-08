import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import Reveal from './ui/Reveal'
import SectionHeader from './ui/SectionHeader'
import { easeLux, inView, stagger, fadeUp } from '../lib/motion'

const frames = [
  { src: '/headshots/headshot-3.jpg', year: '2024' },
  { src: '/headshots/headshot-1.jpg', year: '2024' },
  { src: '/headshots/headshot-6.jpg', year: '2024' },
  { src: '/headshots/headshot-5.jpg', year: '2024' },
  { src: '/headshots/headshot-2.jpg', year: '2024' },
  { src: '/headshots/headshot-4.jpg', year: '2024' },
]

const filmography = [
  { year: '2026', title: 'Master of Dreams', role: 'Jerome Stone', format: 'Feature', status: 'Pre-release' },
  { year: '2026', title: 'Momma I Gotta Job', role: 'Lead', format: 'Feature', status: 'Post' },
  { year: 'TBA', title: 'LA Jesus', role: 'Supporting', format: 'Feature', status: 'Post' },
  { year: '2024', title: 'A Quiet Place: Day One', role: 'Young Bryan', format: 'Feature', status: 'Released' },
  { year: '2024', title: 'Kingdom of the Planet of the Apes', role: 'Milo · Mo-Cap', format: 'Feature', status: 'Released' },
  { year: '2023', title: 'The Last of Us', role: 'Supporting', format: 'HBO Series', status: 'Released' },
  { year: '—', title: 'Overwatch 2', role: 'Voice', format: 'Game', status: 'Released' },
  { year: '—', title: 'Fortnite', role: 'Voice', format: 'Game', status: 'Released' },
  { year: '—', title: 'Call of Duty: WWII', role: 'Voice', format: 'Game', status: 'Released' },
]

function FeaturedFrame({ active }) {
  // cursor-driven 3D tilt
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    ry.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 10)
    rx.set(((e.clientY - (r.top + r.height / 2)) / r.height) * -10)
  }
  const reset = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ perspective: 1200 }}
      className="relative aspect-[4/5] md:aspect-[3/4] w-full"
    >
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
        className="relative w-full h-full overflow-hidden border border-ivory/[0.08]"
      >
        <AnimatePresence>
          <motion.img
            key={active}
            src={frames[active].src}
            alt="Zay “Domo” Artist — portrait"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.1, ease: easeLux }, scale: { duration: 6, ease: 'easeOut' } }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(6,6,7,0.5), transparent 40%)' }} />
        {/* index plate */}
        <div className="absolute bottom-5 left-5 flex items-center gap-3">
          <span className="font-serif italic text-gold-metallic text-2xl">{String(active + 1).padStart(2, '0')}</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-bone/60">/ {String(frames.length).padStart(2, '0')} · {frames[active].year}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Acting() {
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)

  // auto-advance the gallery
  useEffect(() => {
    if (hovering) return
    const id = setInterval(() => setActive((a) => (a + 1) % frames.length), 4800)
    return () => clearInterval(id)
  }, [hovering])

  return (
    <section id="acting" className="relative py-28 md:py-48 px-6 md:px-16 overflow-hidden bg-onyx">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader
          index="II"
          label="Acting"
          title={[{ text: 'Screen' }]}
          note="Portrait series and selected credits — voice to motion capture to lead."
        />

        {/* Gallery: featured frame + selector */}
        <div
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className="grid grid-cols-12 gap-6 md:gap-10 items-stretch mb-28 md:mb-40"
        >
          <div className="col-span-12 md:col-span-8">
            <FeaturedFrame active={active} />
          </div>

          {/* Selector column */}
          <div className="col-span-12 md:col-span-4 grid grid-cols-6 md:grid-cols-2 gap-3">
            {frames.map((f, i) => (
              <button
                key={f.src}
                onClick={() => setActive(i)}
                data-cursor="VIEW"
                className={`relative overflow-hidden aspect-square md:aspect-[3/4] border transition-all duration-500 ${
                  active === i ? 'border-gold' : 'border-ivory/[0.08] hover:border-ivory/30'
                }`}
              >
                <img
                  src={f.src}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    active === i ? 'opacity-100' : 'opacity-45 grayscale hover:opacity-80'
                  }`}
                />
                {active === i && (
                  <motion.span
                    layoutId="acting-active-line"
                    className="absolute bottom-0 left-0 right-0 h-px bg-gold"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filmography index */}
        <div>
          <Reveal>
            <div className="flex items-baseline justify-between mb-4 border-t border-ivory/[0.08] pt-8">
              <h3 className="font-serif italic text-ivory text-2xl md:text-3xl">Selected Filmography</h3>
              <span className="text-[10px] tracking-[0.3em] uppercase text-silver hidden md:block">{filmography.length} Credits</span>
            </div>
          </Reveal>

          <motion.ul {...inView} variants={stagger(0.05)}>
            {filmography.map((film) => (
              <motion.li
                key={film.title}
                variants={fadeUp}
                data-cursor={film.status}
                className="group grid grid-cols-12 gap-3 md:gap-4 items-baseline border-b border-ivory/[0.07] py-5 md:py-6 transition-colors duration-500 hover:bg-ivory/[0.015]"
              >
                <span className="col-span-2 md:col-span-1 text-silver text-sm font-light tabular-nums">{film.year}</span>
                <span className="col-span-10 md:col-span-6 font-serif text-xl md:text-3xl font-light text-ivory group-hover:text-gold transition-all duration-500 md:group-hover:translate-x-2 leading-tight">
                  {film.title}
                </span>
                <span className="col-span-6 md:col-span-3 text-silver text-xs md:text-sm font-light md:mt-0 mt-1">{film.role}</span>
                <span className="col-span-6 md:col-span-2 text-right text-[10px] tracking-[0.28em] uppercase text-silver/70">{film.format}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}
