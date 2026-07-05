import { motion } from 'framer-motion'
import Eyebrow from './ui/Eyebrow'
import Reveal from './ui/Reveal'
import { inView, stagger, fadeUp, easeLux } from '../lib/motion'

const stills = [
  { src: '/headshots/keon-still-1.jpg', label: 'Gym · Hand-wrapping' },
  { src: '/headshots/keon-still-2.jpg', label: 'Foster Care · Office' },
  { src: '/headshots/keon-still-3.jpg', label: 'Shadow Boxing · Mirror' },
  { src: '/headshots/keon-still-4.jpg', label: 'Ring · Corner' },
]

const credits = [
  { l: 'Director', v: 'Zay “Domo” Artist' },
  { l: 'Writer', v: 'Zay “Domo” Artist' },
  { l: 'Genre', v: 'Drama' },
  { l: 'Status', v: 'In Development', gold: true },
]

/**
 * Directing — Keon, presented as a film work. Poster, synopsis, and a
 * contact sheet of frames. No clapperboard theatrics.
 */
export default function Directing() {
  return (
    <section id="directing" className="relative py-28 md:py-48 px-6 md:px-16 overflow-hidden bg-obsidian">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-16 md:mb-24">
          <Reveal y={20}><Eyebrow index="V">Directing · Writing</Eyebrow></Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-7 font-serif italic font-light text-ivory leading-[0.9] text-[clamp(2.6rem,6vw,5.5rem)]">Keon</h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-12 gap-10 md:gap-16 items-start">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-12%' }}
            transition={{ duration: 1.2, ease: easeLux }}
            className="col-span-12 md:col-span-5"
          >
            <div className="relative aspect-[2/3] overflow-hidden border border-ivory/[0.08]">
              <img src="/headshots/keon-poster.jpg" alt="Keon — poster" className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(6,6,7,0.6), transparent 45%)' }} />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <span className="text-[10px] tracking-[0.3em] uppercase text-bone/70">Feature · Drama</span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-gold">2027</span>
              </div>
            </div>
          </motion.div>

          {/* Synopsis */}
          <div className="col-span-12 md:col-span-7 md:pt-2">
            <Reveal>
              <p className="font-editorial italic text-2xl md:text-3xl text-bone/90 leading-snug mb-9">
                A feature — written and directed by Zay.
              </p>
            </Reveal>
            <motion.div {...inView} variants={stagger(0.12)} className="space-y-6 text-bone/75 text-[15px] md:text-[17px] leading-relaxed font-light max-w-2xl">
              <motion.p variants={fadeUp}>
                After witnessing his mother's overdose at ten, a foster youth named Keon survives six
                years of institutional invisibility in rural Central Florida — before finding purpose in
                a rundown boxing gym run by a grieving former champion.
              </motion.p>
              <motion.p variants={fadeUp}>
                As Keon fights for a chance at adoption, and his coach fights to stay sober, both learn
                that the only way out of the past is through it. One round at a time.
              </motion.p>
            </motion.div>

            <motion.div {...inView} variants={stagger(0.08)} className="grid grid-cols-2 gap-8 mt-12 border-t border-ivory/[0.08] pt-8 max-w-lg">
              {credits.map((c) => (
                <motion.div key={c.l} variants={fadeUp}>
                  <p className="text-[10px] tracking-[0.28em] uppercase text-silver mb-2">{c.l}</p>
                  <p className={`font-serif text-lg ${c.gold ? 'text-gold' : 'text-ivory'}`}>{c.v}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Frames */}
        <div className="mt-24 md:mt-36">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] uppercase text-silver mb-8 border-t border-ivory/[0.08] pt-8">Selected Frames</p>
          </Reveal>
          <motion.div {...inView} variants={stagger(0.1)} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stills.map((s) => (
              <motion.figure
                key={s.src}
                variants={fadeUp}
                data-cursor="FRAME"
                className="group relative aspect-video overflow-hidden border border-ivory/[0.08]"
              >
                <img
                  src={s.src}
                  alt={s.label}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-obsidian/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-[10px] tracking-[0.24em] uppercase text-bone/85">{s.label}</span>
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
