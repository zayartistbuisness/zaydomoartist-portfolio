import { motion } from 'framer-motion'

const stills = [
  { src: '/headshots/keon-still-1.jpg', alt: 'Gym · Hand-wrapping',    time: '00:04:12' },
  { src: '/headshots/keon-still-2.jpg', alt: 'Foster care · Office',   time: '00:18:55' },
  { src: '/headshots/keon-still-3.jpg', alt: 'Shadow boxing · Mirror', time: '00:37:08' },
  { src: '/headshots/keon-still-4.jpg', alt: 'Ring · Corner',          time: '01:24:39' },
]

/**
 * KEON — viewfinder / film-strip treatment.
 * Scroll-revealed slates, screenplay-formatted synopsis, director credit card.
 */
export default function Directing() {
  return (
    <section id="directing" className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-charcoal/30">
      {/* Watermark */}
      <span className="pointer-events-none absolute right-0 top-16 font-display text-[22vw] md:text-[14vw] text-ivory/[0.025] leading-none select-none whitespace-nowrap">
        VISION
      </span>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-8 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono-hud text-gold mb-3">06 / VISION</p>
            <p className="font-mono-hud text-silver">DIRECTING · WRITING</p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
              The only way out <span className="italic text-gold">is through.</span>
            </h2>
          </div>
        </div>

        {/* Slate header — clapperboard treatment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="border border-ivory/20 bg-obsidian/60 mb-12 md:mb-20"
        >
          <div className="grid grid-cols-12 text-xs md:text-sm">
            <div className="col-span-3 border-r border-ivory/20 p-4 md:p-6">
              <p className="font-mono-hud text-silver mb-1">PRODUCTION</p>
              <p className="font-display text-lg md:text-3xl text-ivory">KEON</p>
            </div>
            <div className="col-span-3 border-r border-ivory/20 p-4 md:p-6">
              <p className="font-mono-hud text-silver mb-1">DIRECTOR</p>
              <p className="font-mono text-[11px] md:text-base text-ivory">ZAY "DOMO" ARTIST</p>
            </div>
            <div className="col-span-3 border-r border-ivory/20 p-4 md:p-6">
              <p className="font-mono-hud text-silver mb-1">DATE</p>
              <p className="font-mono text-[11px] md:text-base text-ivory">2027 · PLANNED</p>
            </div>
            <div className="col-span-3 p-4 md:p-6">
              <p className="font-mono-hud text-silver mb-1">TAKE</p>
              <p className="font-mono text-[11px] md:text-base text-gold">FIRST · ROLL</p>
            </div>
          </div>
          {/* Stripe pattern bottom */}
          <div className="h-4 bg-[repeating-linear-gradient(90deg,#c9a84c_0,#c9a84c_14px,#050506_14px,#050506_28px)]" />
        </motion.div>

        {/* Main: poster + screenplay synopsis */}
        <div className="grid grid-cols-12 gap-8 md:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="col-span-12 md:col-span-5 relative"
          >
            <div className="relative aspect-[2/3] overflow-hidden">
              <img
                src="/headshots/keon-poster.jpg"
                alt="KEON — Official Poster"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
              {/* Corner markers */}
              {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map((c, i) => (
                <div key={i} className={`absolute w-6 h-6 border-gold/60 ${c}`} />
              ))}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="block w-2 h-2 rounded-full bg-blood animate-pulse-glow" />
                <span className="font-mono-hud text-ivory">REC · IN DEVELOPMENT</span>
              </div>
            </div>

            {/* Film info strip */}
            <div className="grid grid-cols-3 mt-4 text-center border border-ivory/10 divide-x divide-ivory/10">
              <div className="py-3">
                <p className="font-mono-hud text-silver">GENRE</p>
                <p className="font-mono-hud text-ivory mt-1">DRAMA</p>
              </div>
              <div className="py-3">
                <p className="font-mono-hud text-silver">FORMAT</p>
                <p className="font-mono-hud text-ivory mt-1">FEATURE</p>
              </div>
              <div className="py-3">
                <p className="font-mono-hud text-silver">STATUS</p>
                <p className="font-mono-hud text-gold mt-1">DEV</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="col-span-12 md:col-span-7"
          >
            <p className="font-mono-hud text-gold mb-4">FEATURED · SCREENPLAY · ORIGINAL</p>
            <h3 className="font-serif text-5xl md:text-7xl italic font-light text-ivory leading-none mb-10">Keon</h3>

            {/* Screenplay-style synopsis */}
            <div className="border-l-2 border-gold/50 pl-6 md:pl-8 space-y-6 font-mono text-[13px] md:text-sm text-bone leading-relaxed">
              <p>
                <span className="text-gold">FADE IN:</span>
              </p>
              <p>
                <span className="text-ivory uppercase">EXT. CENTRAL FLORIDA — BOXING GYM — DAY</span>
              </p>
              <p>
                After witnessing his mother's overdose at ten years old, a foster youth named
                <span className="text-ivory"> KEON </span>
                survives six years of institutional invisibility in rural Central Florida before
                finding purpose in a rundown boxing gym run by a grieving former champion.
              </p>
              <p>
                As Keon fights for a chance at adoption — and his coach fights to stay sober —
                both discover that the only way out of the past is <span className="italic text-gold">through it</span>.
              </p>
              <p>
                One round at a time.
              </p>
              <p className="text-gold">
                FADE OUT.
              </p>
            </div>

            {/* Credits */}
            <div className="grid grid-cols-2 gap-8 mt-12 border-t border-ivory/10 pt-8">
              {[
                { label: 'DIRECTOR', value: 'Zay "Domo" Artist' },
                { label: 'WRITER',   value: 'Zay "Domo" Artist' },
                { label: 'GENRE',    value: 'Drama' },
                { label: 'STATUS',   value: 'In Development', gold: true },
              ].map((c) => (
                <div key={c.label}>
                  <p className="font-mono-hud text-silver mb-2">{c.label}</p>
                  <p className={`font-serif text-lg ${c.gold ? 'text-gold' : 'text-ivory'}`}>{c.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Film stills — contact-sheet treatment */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-24 md:mt-36"
        >
          <div className="flex items-baseline justify-between mb-8 border-t border-ivory/10 pt-8">
            <p className="font-mono-hud text-silver">SELECTED FRAMES · CONTACT SHEET</p>
            <p className="font-mono-hud text-silver hidden md:block">{stills.length} STILLS</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stills.map((still, i) => (
              <motion.div
                key={still.src}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                data-cursor="FRAME"
                className="relative aspect-video overflow-hidden group border border-ivory/10 hover:border-gold/60 transition-all"
              >
                <img
                  src={still.src}
                  alt={still.alt}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
                  <p className="font-mono-hud text-ivory bg-obsidian/60 px-2 py-1">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="font-mono-hud text-gold bg-obsidian/60 px-2 py-1">
                    {still.time}
                  </p>
                </div>
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-mono-hud text-ivory bg-obsidian/60 px-2 py-1">
                    {still.alt.toUpperCase()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
