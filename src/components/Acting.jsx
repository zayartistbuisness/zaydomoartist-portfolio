import { useState, useEffect } from 'react'
import { motion as Motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
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
  { year: '2026', title: 'Master of Dreams', role: 'Jerome Stone', format: 'Feature', status: 'Pre-release', visual: '/reel/reel-poster.jpg' },
  { year: '2026', title: 'Momma I Gotta Job', role: 'Lead', format: 'Feature', status: 'Post', visual: '/headshots/headshot-3.jpg' },
  { year: 'TBA', title: 'LA Jesus', role: 'Supporting', format: 'Feature', status: 'Post', visual: '/headshots/headshot-6.jpg' },
  { year: '2024', title: 'A Quiet Place: Day One', role: 'Young Bryan', format: 'Feature', status: 'Released', visual: '/headshots/headshot-1.jpg' },
  { year: '2024', title: 'Kingdom of the Planet of the Apes', role: 'Milo · Mo-Cap', format: 'Feature', status: 'Released', visual: '/headshots/headshot-5.jpg' },
  { year: '2023', title: 'The Last of Us', role: 'Supporting', format: 'HBO Series', status: 'Released', visual: '/headshots/headshot-2.jpg' },
  { year: '—', title: 'Overwatch 2', role: 'Voice', format: 'Game', status: 'Released', visual: '/headshots/headshot-4.jpg' },
  { year: '—', title: 'Fortnite', role: 'Voice', format: 'Game', status: 'Released', visual: '/headshots/headshot-6.jpg' },
  { year: '—', title: 'Call of Duty: WWII', role: 'Voice', format: 'Game', status: 'Released', visual: '/reel/reel-poster.jpg' },
]

function CreditVisual({ film }) {
  return (
    <aside id="filmography-visual" className="sticky top-28 hidden lg:block" aria-label="Selected credit portrait preview">
      <div className="relative aspect-[4/5] overflow-hidden border border-ivory/[0.08] bg-obsidian">
        <AnimatePresence mode="wait">
          {film ? (
            <Motion.div
              key={film.title}
              initial={{ opacity: 0, scale: 1.035 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: easeLux }}
              className="absolute inset-0"
            >
              <img
                src={film.visual}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover grayscale"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(6,6,7,0.88), transparent 58%)' }}
              />
              <div className="absolute inset-x-5 bottom-5">
                <p className="mb-2 text-[9px] uppercase tracking-[0.32em] text-gold">Performance archive</p>
                <p className="font-serif text-xl leading-tight text-ivory">{film.title}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-bone/55">Portrait frame · {film.role}</p>
              </div>
            </Motion.div>
          ) : (
            <Motion.div
              key="credit-preview-instruction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col justify-between p-6"
            >
              <span className="text-[9px] uppercase tracking-[0.32em] text-silver">Credit index / visual</span>
              <div>
                <span className="mb-5 block h-px w-12 bg-gold/60" />
                <p className="max-w-[18ch] font-editorial text-2xl italic leading-snug text-bone/65">
                  Hover a credit or focus its frame control.
                </p>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
}

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
    <Motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ perspective: 1200 }}
      className="relative aspect-[4/5] md:aspect-[3/4] w-full"
    >
      <Motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
        className="relative w-full h-full overflow-hidden border border-ivory/[0.08]"
      >
        <AnimatePresence>
          <Motion.img
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
      </Motion.div>
    </Motion.div>
  )
}

export default function Acting() {
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [activeCredit, setActiveCredit] = useState(null)

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
                  <Motion.span
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

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.34fr)] lg:gap-12">
            <Motion.ul {...inView} variants={stagger(0.05)}>
              {filmography.map((film, index) => (
                <Motion.li
                  key={film.title}
                  variants={fadeUp}
                  data-cursor={film.status}
                  onMouseEnter={() => setActiveCredit(index)}
                  onMouseLeave={(event) => {
                    if (!event.currentTarget.contains(document.activeElement)) setActiveCredit(null)
                  }}
                  onFocus={() => setActiveCredit(index)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setActiveCredit(null)
                  }}
                  className="group grid grid-cols-12 items-baseline gap-3 border-b border-ivory/[0.07] py-5 transition-colors duration-500 hover:bg-ivory/[0.015] md:gap-4 md:py-6"
                >
                  <span className="col-span-2 text-sm font-light tabular-nums text-silver md:col-span-1">{film.year}</span>
                  <span className="col-span-10 font-serif text-xl font-light leading-tight text-ivory transition-all duration-500 group-hover:text-gold md:col-span-5 md:text-3xl md:group-hover:translate-x-2">
                    {film.title}
                  </span>
                  <span className="col-span-5 mt-1 text-xs font-light text-silver md:col-span-2 md:mt-0 md:text-sm">{film.role}</span>
                  <div className="col-span-7 mt-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 md:col-span-4 md:mt-0">
                    <span className="text-right text-[9px] uppercase tracking-[0.24em] text-silver/70">{film.format}</span>
                    <span className="border border-ivory/[0.1] px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-bone/65">
                      {film.status}
                    </span>
                    <button
                      type="button"
                      aria-controls="filmography-visual"
                      aria-pressed={activeCredit === index}
                      aria-label={`Show an archive portrait for ${film.title}`}
                      onClick={() => setActiveCredit(index)}
                      className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-silver transition-colors duration-300 hover:text-gold focus-visible:text-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold/60 lg:inline-flex"
                    >
                      Frame <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </Motion.li>
              ))}
            </Motion.ul>

            <CreditVisual film={activeCredit === null ? null : filmography[activeCredit]} />
          </div>
        </div>
      </div>
    </section>
  )
}
