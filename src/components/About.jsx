import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Eyebrow from './ui/Eyebrow'
import Reveal from './ui/Reveal'
import { easeLux, inView, stagger, fadeUp } from '../lib/motion'

const stats = [
  { n: '12', l: 'Age entering foster care' },
  { n: '2,000', l: 'Films studied, self-taught' },
  { n: '16', l: 'Graduated, two years early' },
]

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
        {/* Header */}
        <div className="mb-16 md:mb-28">
          <Reveal y={20}>
            <Eyebrow index="I">Orlando · b. 2004</Eyebrow>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-7 font-serif font-light text-ivory leading-[0.9] text-[clamp(2.6rem,6vw,5.5rem)]">
              Genesis
            </h2>
          </Reveal>
        </div>

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
              <span className="text-[10px] tracking-[0.3em] uppercase font-light text-silver">Orlando, FL</span>
            </div>
          </div>

          {/* Narrative */}
          <div className="col-span-12 md:col-span-7 md:pt-4">
            <Reveal>
              <p className="font-editorial italic text-2xl md:text-3xl text-bone/90 leading-snug mb-10">
                A self-taught actor, producer, and director from Orlando, Florida.
              </p>
            </Reveal>

            <motion.div {...inView} variants={stagger(0.12)} className="space-y-7 text-bone/75 text-[15px] md:text-[17px] leading-relaxed font-light max-w-2xl">
              <motion.p variants={fadeUp}>
                Placed in foster care at twelve, he found an education in film — more than two
                thousand watched in the dark. He graduated high school at sixteen, two years early,
                and put every dollar from two years at McDonald's back into the work.
              </motion.p>
              <motion.p variants={fadeUp}>
                The breakthrough came through voice — <span className="text-ivory">Call of Duty: WWII</span>,{' '}
                <span className="text-ivory">Fortnite</span>, <span className="text-ivory">Overwatch 2</span> —
                before the screen. HBO's <span className="text-gold">The Last of Us</span> (2023); Milo, in motion
                capture, for <span className="text-gold">Kingdom of the Planet of the Apes</span> (2024); Young Bryan
                in <span className="text-gold">A Quiet Place: Day One</span> (2024).
              </motion.p>
              <motion.p variants={fadeUp}>
                Co-founder of World In Print Media and an advocate for foster youth in entertainment.
                Featured in <span className="text-ivory">GQ</span>, <span className="text-ivory">Movies Insider</span>,
                and <span className="text-ivory">The Washington Post</span>.
              </motion.p>
            </motion.div>
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
              <span className="font-serif font-light text-ivory text-6xl md:text-7xl leading-none">{s.n}</span>
              <span className="text-[11px] tracking-[0.28em] uppercase font-light text-silver">{s.l}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
