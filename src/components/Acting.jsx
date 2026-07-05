import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const headshots = [
  { src: '/headshots/headshot-1.jpg', meta: { id: 'PORTRAIT · 001', loc: 'WINDOW · STUDIO', yr: '2024' } },
  { src: '/headshots/headshot-2.jpg', meta: { id: 'PORTRAIT · 002', loc: 'STUDIO · LO-KEY',  yr: '2024' } },
  { src: '/headshots/headshot-3.jpg', meta: { id: 'PORTRAIT · 003', loc: 'FORMAL · EDITORIAL', yr: '2024' } },
  { src: '/headshots/headshot-4.jpg', meta: { id: 'PORTRAIT · 004', loc: 'CLOSE-UP · SERIES',  yr: '2024' } },
  { src: '/headshots/headshot-5.jpg', meta: { id: 'PORTRAIT · 005', loc: 'LIFESTYLE · STREET', yr: '2024' } },
  { src: '/headshots/headshot-6.jpg', meta: { id: 'PORTRAIT · 006', loc: 'ROOFTOP · DUSK',     yr: '2024' } },
]

const filmography = [
  { year: '2026', title: 'Master of Dreams',          role: 'Jerome Stone',  type: 'FEATURE', status: 'PRE-RELEASE' },
  { year: 'TBA',  title: 'LA Jesus',                   role: 'Supporting',    type: 'FEATURE', status: 'POST' },
  { year: '2026', title: 'Momma I Gotta Job',          role: 'Lead',          type: 'FEATURE', status: 'POST' },
  { year: '2024', title: 'A Quiet Place: Day One',     role: 'Young Bryan',   type: 'FEATURE', status: 'RELEASED' },
  { year: '2024', title: 'Kingdom of the Planet of the Apes', role: 'Milo (Mo-Cap)', type: 'FEATURE', status: 'RELEASED' },
  { year: '2023', title: 'The Last of Us',             role: 'Supporting',    type: 'HBO · SERIES', status: 'RELEASED' },
  { year: '—',    title: 'Overwatch 2',                role: 'Voice',         type: 'GAME',    status: 'RELEASED' },
  { year: '—',    title: 'Fortnite',                   role: 'Voice',         type: 'GAME',    status: 'RELEASED' },
  { year: '—',    title: 'Call of Duty: WWII',         role: 'Voice',         type: 'GAME',    status: 'RELEASED' },
]

export default function Acting() {
  const [active, setActive] = useState(2)

  return (
    <section id="acting" className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-charcoal/30">
      {/* Watermark */}
      <span className="pointer-events-none absolute right-0 top-20 font-display text-[22vw] md:text-[14vw] text-ivory/[0.025] leading-none select-none whitespace-nowrap">
        SCREEN
      </span>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-8 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono-hud text-gold mb-3">03 / SCREEN</p>
            <p className="font-mono-hud text-silver">ACTING · PORTFOLIO</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
              Every frame <span className="italic text-gold">a different</span> world.
            </h2>
          </div>
        </div>

        {/* Portrait Theatre — one dominant, others as stacked tabs */}
        <div className="grid grid-cols-12 gap-4 md:gap-8 mb-24 md:mb-32">
          {/* Dominant portrait */}
          <div className="col-span-12 md:col-span-8 relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={headshots[active].src}
                src={headshots[active].src}
                alt={headshots[active].meta.id}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Film overlay: grain + scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-obsidian via-transparent to-transparent" />
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)'
            }} />

            {/* Corner HUD */}
            {['top-4 left-4 border-t border-l', 'top-4 right-4 border-t border-r', 'bottom-4 left-4 border-b border-l', 'bottom-4 right-4 border-b border-r'].map((c, i) => (
              <div key={i} className={`absolute w-8 h-8 border-ivory/60 ${c}`} />
            ))}

            {/* Meta overlay */}
            <AnimatePresence mode="wait">
              <motion.div
                key={headshots[active].src + '-meta'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-6 bottom-6 right-6 flex items-end justify-between"
              >
                <div>
                  <p className="font-mono-hud text-gold">{headshots[active].meta.id}</p>
                  <p className="font-mono-hud text-ivory/80 mt-1">{headshots[active].meta.loc}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-hud text-ivory">{headshots[active].meta.yr}</p>
                  <p className="font-mono-hud text-silver mt-1">{active + 1} / {headshots.length}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* REC indicator */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <span className="block w-2 h-2 rounded-full bg-blood animate-pulse-glow" />
              <span className="font-mono-hud text-ivory">LIVE</span>
            </div>
          </div>

          {/* Thumbnail column */}
          <div className="col-span-12 md:col-span-4 grid grid-cols-6 md:grid-cols-2 gap-2 md:gap-3">
            {headshots.map((shot, i) => (
              <button
                key={shot.src}
                onClick={() => setActive(i)}
                data-cursor={`VIEW ${i + 1}`}
                className={`relative aspect-square md:aspect-[3/4] overflow-hidden group border transition-all duration-500 ${
                  active === i ? 'border-gold' : 'border-ivory/10 hover:border-ivory/40'
                }`}
              >
                <img
                  src={shot.src}
                  alt={shot.meta.id}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    active === i ? 'opacity-100' : 'opacity-50 group-hover:opacity-90 grayscale group-hover:grayscale-0'
                  }`}
                />
                {active === i && (
                  <motion.div
                    layoutId="acting-active"
                    className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gold"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filmography */}
        <div className="mt-16">
          <div className="flex items-baseline justify-between mb-10 border-t border-ivory/10 pt-8">
            <h3 className="font-display text-4xl md:text-6xl text-ivory">FILMOGRAPHY</h3>
            <p className="font-mono-hud text-silver hidden md:block">INDEXED · {filmography.length} ENTRIES</p>
          </div>

          <ul>
            {filmography.map((film, i) => (
              <motion.li
                key={film.title + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
                data-cursor={film.status}
                className="group relative grid grid-cols-12 gap-4 items-center border-t border-ivory/10 py-5 md:py-7 hover:bg-ivory/[0.02] transition-colors"
              >
                <span className="col-span-2 md:col-span-1 font-mono-hud text-silver group-hover:text-gold transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="col-span-3 md:col-span-2 font-mono-hud text-silver">{film.year}</span>
                <span className="col-span-7 md:col-span-5 font-serif text-xl md:text-3xl text-ivory group-hover:text-gold transition-colors leading-tight">
                  {film.title}
                </span>
                <span className="col-span-6 md:col-span-2 font-mono-hud text-silver/80">{film.type}</span>
                <span className="col-span-6 md:col-span-2 font-mono-hud text-ivory/70 text-right">{film.role}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
