import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

/**
 * GENESIS — oversized typographic origin story.
 * Parallax stats + scroll-locked kinetic phrases intercut with a parallax portrait.
 */
export default function About() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%'])
  const blockRotate = useTransform(scrollYProgress, [0, 1], [-4, 4])

  return (
    <section id="about" ref={ref} className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-obsidian">
      {/* Watermark "GENESIS" */}
      <motion.span
        style={{ rotate: blockRotate }}
        className="pointer-events-none absolute -left-8 top-12 font-display text-[22vw] md:text-[16vw] text-ivory/[0.025] leading-none select-none whitespace-nowrap"
      >
        GENESIS
      </motion.span>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-8 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono-hud text-gold mb-3">02 / GENESIS</p>
            <p className="font-mono-hud text-silver">ORIGIN FILE · CLASSIFIED</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
              Built from <span className="italic text-gold">nothing</span>.<br/>
              Owed to <span className="italic text-gold">no one</span>.
            </h2>
          </div>
        </div>

        {/* Stat trio — huge numbers */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 mb-24 md:mb-36 border-y border-ivory/10 py-14 md:py-20"
        >
          {[
            { n: '12', l: 'ENTERED FOSTER CARE', s: 'Orlando, Florida · 2012' },
            { n: '2,000', l: 'FILMS STUDIED', s: 'Self-taught in the dark' },
            { n: '16', l: 'HIGH SCHOOL, GRADUATED', s: 'Two years early' },
          ].map((stat) => (
            <motion.div
              key={stat.l}
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } } }}
              className="relative flex flex-col gap-4"
            >
              <p className="font-mono-hud text-gold">{stat.l}</p>
              <p className="font-display text-[15vw] md:text-[9vw] leading-[0.8] text-ivory">{stat.n}</p>
              <p className="text-silver text-sm">{stat.s}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Two column: portrait + long-form narrative */}
        <div className="grid grid-cols-12 gap-8 md:gap-16 items-start">
          <motion.div
            style={{ y: imgY }}
            className="col-span-12 md:col-span-5 relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src="/headshots/headshot-4.jpg"
                alt="Zay Domo Artist"
                className="w-full h-full object-cover grayscale contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-blood/10 mix-blend-overlay" />

              {/* Corner markers */}
              {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map((c, i) => (
                <div key={i} className={`absolute w-6 h-6 border-gold ${c}`} />
              ))}

              {/* Caption overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-mono-hud text-ivory/70">PORTRAIT · 002</p>
                <p className="font-mono-hud text-gold mt-1">SHOT / SELF</p>
              </div>
            </div>
          </motion.div>

          <div className="col-span-12 md:col-span-7 space-y-10">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
            >
              <p className="font-mono-hud text-silver mb-4">CHAPTER / I</p>
              <p className="font-serif text-2xl md:text-3xl text-ivory leading-tight italic font-light">
                "No formal training. No industry. No one to call when it broke."
              </p>
              <p className="text-bone text-[15px] md:text-[16px] leading-relaxed font-light mt-6">
                Born in Orlando. Entered the foster care system at twelve.
                An obsessive love of film became the only door in — over 2,000 movies watched as education,
                as escape, as the map he didn't have.
                Graduated high school at sixteen. Worked two years at McDonald's.
                Every dollar funneled back into the career nobody believed was coming.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              <p className="font-mono-hud text-silver mb-4">CHAPTER / II</p>
              <p className="font-serif text-2xl md:text-3xl text-ivory leading-tight italic font-light">
                "The voice came first. The face came next."
              </p>
              <p className="text-bone text-[15px] md:text-[16px] leading-relaxed font-light mt-6">
                The break came through voice work — <em className="text-ivory not-italic">Call of Duty: WWII</em>,
                <em className="text-ivory not-italic"> Fortnite</em>, <em className="text-ivory not-italic">Overwatch 2</em>.
                Emotion through tone, rhythm, breath. That foundation became the edge on-screen:
                HBO's <em className="text-gold not-italic">The Last of Us</em> (2023),
                the motion-capture role of Milo in <em className="text-gold not-italic">Kingdom of the Planet of the Apes</em> (2024),
                Young Bryan in <em className="text-gold not-italic">A Quiet Place: Day One</em> (2024) —
                holding the screen without a single spoken line.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.3 }}
            >
              <p className="font-mono-hud text-silver mb-4">CHAPTER / III</p>
              <p className="font-serif text-2xl md:text-3xl text-ivory leading-tight italic font-light">
                "The system you come from doesn't have to define where you end up."
              </p>
              <p className="text-bone text-[15px] md:text-[16px] leading-relaxed font-light mt-6">
                Co-founder of World In Print Media. Vocal advocate for foster youth in entertainment.
                Featured in GQ, Movies Insider, The Washington Post. Over 100,000 followers. Upcoming —
                <em className="text-gold not-italic"> Master of Dreams</em> (2026) as Jerome Stone,
                with <em className="text-gold not-italic">Momma I Gotta Job</em> and
                <em className="text-gold not-italic"> LA Jesus</em> in post.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Upcoming film ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-24 md:mt-32 border-t border-ivory/10 pt-10"
        >
          <div className="flex items-baseline justify-between mb-8">
            <p className="font-mono-hud text-silver flex items-center gap-3">
              <span className="block w-2 h-2 bg-blood rounded-full animate-pulse-glow" />
              CURRENTLY IN PRODUCTION
            </p>
            <p className="font-mono-hud text-ivory">FRAME 2026+</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Master of Dreams', role: 'Jerome Stone', year: '2026', status: 'pre-release' },
              { title: 'Momma I Gotta Job', role: 'Lead', year: '2026', status: 'post-production' },
              { title: 'LA Jesus', role: 'Supporting', year: 'TBD', status: 'post-production' },
            ].map((film) => (
              <div key={film.title} data-cursor="DETAIL" className="border border-ivory/10 hover:border-gold/60 p-6 transition-all duration-500 group">
                <p className="font-mono-hud text-gold mb-4">{film.year}</p>
                <p className="font-serif text-2xl text-ivory italic group-hover:text-gold transition-colors">{film.title}</p>
                <p className="font-mono-hud text-silver mt-4">ROLE · {film.role.toUpperCase()}</p>
                <p className="font-mono-hud text-silver mt-1">STATUS · {film.status.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
