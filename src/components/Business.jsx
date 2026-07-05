import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const sportsbooks = [
  { name: 'DraftKings', src: '/brands/draftkings.svg' },
  { name: 'FanDuel', src: '/brands/fanduel.png' },
  { name: 'BetMGM', src: '/brands/betmgm.webp' },
  { name: 'Fanatics Sportsbook', src: '/brands/fanatics.png' },
]

function Counter({ target, duration = 1800, suffix = '' }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setN(Math.floor(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return <>{n.toLocaleString()}{suffix}</>
}

/**
 * MOSS Algorithm — financial-terminal aesthetic.
 * Ticker-tape stats, terminal-style printout, hero trophy photo.
 */
export default function Business() {
  const [clock, setClock] = useState(new Date())
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section id="business" className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-obsidian">
      {/* Watermark */}
      <span className="pointer-events-none absolute -left-10 top-24 font-display text-[22vw] md:text-[14vw] text-ivory/[0.025] leading-none select-none whitespace-nowrap">
        MOSS·ALGO
      </span>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-8 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono-hud text-gold mb-3">05 / EMPIRE</p>
            <p className="font-mono-hud text-silver">BUSINESS · VENTURE</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
              Proof the vision <span className="italic text-gold">extends</span> beyond the screen.
            </h2>
          </div>
        </div>

        {/* Ticker tape */}
        <div className="relative overflow-hidden border-y border-gold/30 bg-charcoal/40 py-3 mb-16 md:mb-24">
          <div className="flex items-center whitespace-nowrap animate-ticker">
            {[
              'MOSS ALGO',
              '▲ 15,000+ ACTIVE MEMBERS',
              '▲ #1 LARGEST COMMUNITY',
              '▲ INTEGRATED W/ EVERY MAJOR US SPORTSBOOK',
              '▲ WHOP CREATOR AWARDS · 10K & 5K MILESTONES',
              '▲ FOUNDED BY Z.DOMO',
            ].map((x, i) => (
              <span key={i} className="font-mono-hud text-gold px-10 flex items-center gap-8">
                {x}
                <span className="text-blood">◆</span>
              </span>
            ))}
          </div>
        </div>

        {/* Main 2-col: trophy | terminal */}
        <div onMouseEnter={() => setStarted(true)} className="grid grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Trophy image with film treatment */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="col-span-12 md:col-span-6 relative"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src="/headshots/whop-trophy.jpg"
                alt="Zay with Whop Creator Awards"
                className="w-full h-full object-cover"
              />
              {/* Treatment */}
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent mix-blend-overlay" />
              {/* Corner HUD */}
              {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map((c, i) => (
                <div key={i} className={`absolute w-6 h-6 border-gold/60 ${c}`} />
              ))}
              {/* Caption */}
              <div className="absolute left-4 bottom-4 right-4 flex items-end justify-between">
                <div>
                  <p className="font-mono-hud text-gold">WHOP · CREATOR AWARDS</p>
                  <p className="font-mono-hud text-ivory/80 mt-1">10,000 & 5,000 MEMBER MILESTONES</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-hud text-ivory">FRAME / 03</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Terminal printout */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="col-span-12 md:col-span-6"
          >
            <div className="border border-gold/20 bg-charcoal/30 p-6 md:p-8">
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-ivory/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="block w-2 h-2 rounded-full bg-blood" />
                  <span className="block w-2 h-2 rounded-full bg-gold" />
                  <span className="block w-2 h-2 rounded-full bg-ivory/70" />
                  <span className="font-mono-hud text-silver ml-3">moss_algo@live : ~ $</span>
                </div>
                <span className="font-mono-hud text-silver">{clock.toISOString().slice(11, 19)} UTC</span>
              </div>

              <div className="font-mono text-xs md:text-sm text-bone space-y-2 mb-6">
                <p><span className="text-gold">&gt;</span> status --community</p>
                <p className="text-silver pl-4">COMMUNITY :: ACTIVE · 15,000+ MEMBERS</p>
                <p><span className="text-gold">&gt;</span> report --partners</p>
                <p className="text-silver pl-4">INTEGRATION :: ALL MAJOR US SPORTSBOOKS</p>
                <p><span className="text-gold">&gt;</span> founder --query</p>
                <p className="text-silver pl-4">FOUNDER :: ZAY "DOMO" ARTIST</p>
              </div>

              <h3 className="font-serif text-4xl md:text-6xl italic text-ivory leading-none mb-3">
                MOSS<br/>
                <span className="text-gold">Algorithm</span>
              </h3>
              <p className="font-mono-hud text-silver mb-6">ONE OF THE LARGEST SPORTS BETTING COMMUNITIES</p>

              <p className="text-bone text-[15px] leading-relaxed font-light mb-8">
                What started as a personal edge became an empire. Our proprietary algorithm is
                currently used by <span className="text-ivory">every major sportsbook across the United States</span>.
                Not a side project — the answer to the question everyone asks.
              </p>

              <Link
                to="/moss"
                data-cursor="LAUNCH"
                className="inline-flex items-center gap-3 group"
              >
                <span className="flex items-center justify-center w-14 h-14 rounded-full border border-gold group-hover:bg-gold transition-colors">
                  <ArrowUpRight size={18} className="text-gold group-hover:text-obsidian transition-colors" />
                </span>
                <span className="font-mono-hud text-ivory group-hover:text-gold transition-colors">
                  ENTER MOSS ALGORITHM
                </span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Live stats */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-3 border-t border-ivory/10 mt-24 md:mt-32 divide-y md:divide-y-0 md:divide-x divide-ivory/10"
        >
          {[
            { n: 15000, suffix: '+', l: 'ACTIVE MEMBERS', s: 'and counting' },
            { n: 1, l: '#1 LARGEST COMMUNITY', s: 'on the market', prefix: true },
            { n: 100, l: '% SPORTSBOOK COVERAGE', s: 'every major US book' },
          ].map((stat) => (
            <motion.div
              key={stat.l}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              className="py-10 md:py-14 px-0 md:px-10"
            >
              <p className="font-mono-hud text-gold mb-4">{stat.l}</p>
              <p className="font-display text-[18vw] md:text-[8vw] leading-[0.8] text-ivory">
                {stat.prefix ? '#' : ''}<Counter target={stat.n} suffix={stat.suffix || ''} />
              </p>
              <p className="text-silver text-sm mt-3">{stat.s}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sportsbook strip */}
        <div className="mt-24">
          <p className="font-mono-hud text-silver mb-8 flex items-center gap-3">
            <span className="block w-8 h-[1px] bg-gold" />
            ALGORITHM INTEGRATED ACROSS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border border-ivory/10 p-8 md:p-12">
            {sportsbooks.map((book) => (
              <div
                key={book.name}
                data-cursor={book.name.toUpperCase()}
                className="flex items-center justify-center h-12 md:h-16 group"
              >
                <img
                  src={book.src}
                  alt={book.name}
                  className="h-full w-auto object-contain brightness-0 invert opacity-50 group-hover:opacity-100 transition-all duration-500 max-w-[180px]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
