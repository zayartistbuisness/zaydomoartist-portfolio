import { useState } from 'react'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import Reveal from './ui/Reveal'
import SectionHeader from './ui/SectionHeader'
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
  const shouldReduceMotion = useReducedMotion()
  const [stripPaused, setStripPaused] = useState(false)
  const [stripFocused, setStripFocused] = useState(false)

  return (
    <section id="directing" className="relative py-28 md:py-48 px-6 md:px-16 overflow-hidden bg-obsidian">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader index="VI" label="Directing · Writing" title={[{ text: 'Keon', italic: true }]} />

        <div className="grid grid-cols-12 gap-10 md:gap-16 items-start">
          {/* Poster */}
          <Motion.div
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
          </Motion.div>

          {/* Synopsis */}
          <div className="col-span-12 md:col-span-7 md:pt-2">
            <Reveal>
              <p className="font-editorial italic text-2xl md:text-3xl text-bone/90 leading-snug mb-9">
                A feature — written and directed by Zay. The material is close to home.
              </p>
            </Reveal>
            <Motion.div {...inView} variants={stagger(0.12)} className="space-y-6 text-bone/75 text-[15px] md:text-[17px] leading-relaxed font-light max-w-2xl">
              <Motion.p variants={fadeUp}>
                After witnessing his mother's overdose at ten, a foster youth named Keon survives six
                years of institutional invisibility in rural Central Florida — before finding purpose in
                a rundown boxing gym run by a grieving former champion.
              </Motion.p>
              <Motion.p variants={fadeUp}>
                As Keon fights for a chance at adoption, and his coach fights to stay sober, both learn
                that the only way out of the past is through it. One round at a time.
              </Motion.p>
            </Motion.div>

            <Motion.div {...inView} variants={stagger(0.08)} className="grid grid-cols-2 gap-8 mt-12 border-t border-ivory/[0.08] pt-8 max-w-lg">
              {credits.map((c) => (
                <Motion.div key={c.l} variants={fadeUp}>
                  <p className="text-[10px] tracking-[0.28em] uppercase text-silver mb-2">{c.l}</p>
                  <p className={`font-serif text-lg ${c.gold ? 'text-gold' : 'text-ivory'}`}>{c.v}</p>
                </Motion.div>
              ))}
            </Motion.div>
          </div>
        </div>

        {/* Frames */}
        <div className="mt-24 md:mt-36">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-6 border-t border-ivory/[0.08] pt-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-silver">Selected Frames</p>
                <p className="mt-2 font-editorial text-lg italic text-bone/55">Contact sheet 01 · visual development</p>
              </div>
              {shouldReduceMotion ? (
                <span className="hidden text-[9px] uppercase tracking-[0.24em] text-silver md:block">Motion reduced</span>
              ) : (
                <button
                  type="button"
                  aria-pressed={stripPaused}
                  onClick={() => setStripPaused((paused) => !paused)}
                  className="text-[9px] uppercase tracking-[0.24em] text-silver transition-colors duration-300 hover:text-gold focus-visible:text-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold/60"
                >
                  {stripPaused ? 'Resume strip' : 'Pause strip'}
                </button>
              )}
            </div>
          </Reveal>
          <Motion.div
            {...inView}
            variants={fadeUp}
            className={`border-y border-ivory/[0.08] py-3 ${shouldReduceMotion ? 'overflow-x-auto' : 'mask-fade-lr overflow-hidden'}`}
            aria-label="Keon visual development contact sheet"
          >
            <div
              className={`flex w-max ${shouldReduceMotion ? '' : 'animate-marquee'}`}
              style={{
                animationDuration: '48s',
                ...(stripPaused || stripFocused ? { animationPlayState: 'paused' } : {}),
              }}
              onFocusCapture={() => setStripFocused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setStripFocused(false)
              }}
            >
              {(shouldReduceMotion ? [0] : [0, 1]).map((copy) => (
                <div
                  key={copy}
                  role={copy === 0 ? 'list' : undefined}
                  aria-hidden={copy === 1 ? 'true' : undefined}
                  className="flex shrink-0 gap-3 pr-3 md:gap-4 md:pr-4"
                >
                  {stills.map((still, index) => (
                    <figure
                      key={`${copy}-${still.src}`}
                      role={copy === 0 ? 'listitem' : undefined}
                      tabIndex={copy === 0 ? 0 : -1}
                      data-cursor="FRAME"
                      className="group relative aspect-video w-[72vw] max-w-[430px] shrink-0 overflow-hidden border border-ivory/[0.08] bg-onyx outline-none sm:w-[46vw] md:w-[34vw] lg:w-[27vw] focus-visible:border-gold/60"
                    >
                      <img
                        src={still.src}
                        alt={copy === 0 ? still.label : ''}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full scale-100 object-cover grayscale transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025] group-hover:grayscale-0 group-focus:grayscale-0"
                      />
                      <div className="absolute left-3 top-3 border border-ivory/15 bg-obsidian/70 px-2 py-1 text-[8px] uppercase tracking-[0.22em] text-bone/65 backdrop-blur-sm">
                        {String(index + 1).padStart(2, '0')} / {String(stills.length).padStart(2, '0')}
                      </div>
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/90 to-transparent p-3 opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100 md:group-focus:opacity-100">
                        <span className="text-[10px] uppercase tracking-[0.24em] text-bone/85">{still.label}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </Motion.div>
        </div>
      </div>
    </section>
  )
}
