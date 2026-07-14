import { useEffect, useRef, useState } from 'react'
import { motion, animate, useInView, useScroll, useTransform } from 'framer-motion'
import Reveal from './ui/Reveal'
import SectionHeader from './ui/SectionHeader'
import { easeLux, inView, stagger, fadeUp } from '../lib/motion'

const stats = [
  { n: '12', l: 'Age entering foster care' },
  { n: '2,000', l: 'Films studied, self-taught' },
  { n: '16', l: 'Graduated, two years early' },
]

/** A number that counts itself up when the visitor reaches it. */
function StatNumber({ value }) {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, margin: '-10% 0px' })
  const [display, setDisplay] = useState('0')
  useEffect(() => {
    if (!seen) return
    const target = parseInt(value.replace(/,/g, ''), 10)
    const controls = animate(0, target, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString('en-US')),
    })
    return () => controls.stop()
  }, [seen, value])
  return (
    <span ref={ref} className="font-serif font-light text-ivory text-6xl md:text-7xl leading-none tabular-nums">
      {display}
    </span>
  )
}

/**
 * Genesis — the origin, told plainly. Facts and a portrait; no slogans.
 */
export default function About() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-4%', '8%'])

  return (
    <section id="about" ref={ref} className="relative py-28 md:py-48 px-6 md:px-16 overflow-hidden bg-obsidian">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader index="I" label="Orlando · b. 2006" title={[{ text: 'Genesis' }]} className="md:mb-28" />

        <div className="grid grid-cols-12 gap-10 md:gap-20 items-start">
          {/* Portrait */}
          <div className="col-span-12 md:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: 1.3, ease: easeLux }}
              className="relative overflow-hidden border border-ivory/[0.08]"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <motion.img
                  src="/headshots/headshot-1.jpg"
                  alt="Zay “Domo” Artist"
                  style={{ y: imgY, filter: 'grayscale(100%) contrast(1.05)' }}
                  className="w-full h-[112%] object-cover object-center"
                />
              </div>
            </motion.div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.3em] uppercase font-light text-silver">Zay “Domo” Artist</span>
              <span className="text-[10px] tracking-[0.3em] uppercase font-light text-silver">Los Angeles, CA</span>
            </div>
          </div>

          {/* Narrative */}
          <div className="col-span-12 md:col-span-7 md:pt-4">
            <Reveal>
              <p className="font-editorial italic text-2xl md:text-3xl text-bone/90 leading-snug mb-10">
                Self-taught, from Orlando. Movies were my escape in foster care — more than two
                thousand of them. Then the escape became the plan.
              </p>
            </Reveal>

            <motion.div {...inView} variants={stagger(0.12)} className="space-y-7 text-bone/75 text-[15px] md:text-[17px] leading-relaxed font-light max-w-2xl">
              <motion.p variants={fadeUp}>
                I entered care at twelve. Acting wasn't even on my radar until I was about fifteen —
                and there's no roadmap for a foster kid who wants into this industry. No funding, no
                mentorship, no one holding the door. So I made a plan: I graduated high school at
                sixteen, worked two years full-time at McDonald's, and put every dollar back into
                the work.
              </motion.p>
              <motion.p variants={fadeUp}>
                Voice came first — <span className="text-ivory">Call of Duty: WWII</span>,{' '}
                <span className="text-ivory">Fortnite</span>, <span className="text-ivory">Overwatch 2</span> —
                where you learn to carry a whole performance in tone and rhythm. Then the screen:
                HBO's <span className="text-gold">The Last of Us</span> (2023). <span className="text-gold">Kingdom
                of the Planet of the Apes</span> (2024) as Milo, in motion capture — a judge had to sign off
                before I could fly to Australia to shoot, because I was still in care. Young Bryan in{' '}
                <span className="text-gold">A Quiet Place: Day One</span> (2024).
              </motion.p>
              <motion.p variants={fadeUp}>
                During the strike I cold-emailed the biggest agencies in the business, because nobody
                was going to do it for me — that's how I found my team. Off set I co-founded World In
                Print Media, and I advocate for foster youth in entertainment: we're some of the most
                creative, resourceful people there are. We just need the room. The goal, said out
                loud: an Oscar by twenty-five.
              </motion.p>
            </motion.div>

            {/* the artist signs the wall — ink drawn left to right */}
            <motion.p
              initial={{ clipPath: 'inset(-15% 100% -15% 0)' }}
              whileInView={{ clipPath: 'inset(-15% 0% -15% 0)' }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1.9, ease: easeLux, delay: 0.35 }}
              className="mt-12 font-editorial italic text-3xl md:text-4xl text-gold-metallic"
            >
              — Zay “Domo” Artist
            </motion.p>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          {...inView}
          variants={stagger(0.14)}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4 mt-24 md:mt-36 border-t border-ivory/[0.08] pt-14 md:pt-20"
        >
          {stats.map((s) => (
            <motion.div key={s.l} variants={fadeUp} className="flex flex-col gap-3">
              <StatNumber value={s.n} />
              <span className="text-[11px] tracking-[0.28em] uppercase font-light text-silver">{s.l}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
