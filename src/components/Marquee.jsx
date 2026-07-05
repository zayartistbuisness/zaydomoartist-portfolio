import { motion } from 'framer-motion'

const brands = [
  { name: 'Netflix', src: '/brands/netflix.png' },
  { name: 'Universal Pictures', src: '/brands/universal.png' },
  { name: 'Nike', src: '/brands/nike.png' },
  { name: 'GQ', src: '/brands/gq.png' },
  { name: 'Teen Vogue', src: '/brands/teenvogue.webp' },
  { name: 'Washington Post', src: '/brands/washingtonpost.svg' },
  { name: 'IMDbPro', src: '/brands/imdbpro.png' },
  { name: 'Walmart', src: '/brands/walmart.webp' },
]

const credits = [
  'HBO · THE LAST OF US',
  'KINGDOM OF THE PLANET OF THE APES',
  'A QUIET PLACE · DAY ONE',
  'CALL OF DUTY WWII',
  'FORTNITE',
  'OVERWATCH 2',
  'MASTER OF DREAMS · 2026',
  'MOMMA I GOTTA JOB',
  'LA JESUS',
]

export default function Marquee() {
  const doubledBrands = [...brands, ...brands]
  const doubledCredits = [...credits, ...credits, ...credits]

  return (
    <section id="signal" className="relative py-24 md:py-36 border-y border-ivory/5 overflow-hidden bg-obsidian">
      {/* Section label */}
      <div className="px-6 md:px-16 mb-16 md:mb-24 grid grid-cols-12 items-end gap-8">
        <div className="col-span-12 md:col-span-3">
          <p className="font-mono-hud text-gold mb-3">01 / SIGNAL</p>
          <p className="font-mono-hud text-silver">RECEIVED / DECODED</p>
        </div>
        <div className="col-span-12 md:col-span-9">
          <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
            The world has been watching. <span className="italic text-gold">Now you are too.</span>
          </h2>
        </div>
      </div>

      {/* Credit ticker — faster, runs opposite direction */}
      <div className="relative overflow-hidden mb-16 border-y border-ivory/10 py-6 bg-charcoal/40">
        <div className="flex animate-marquee-fast gap-16" style={{ width: 'max-content' }}>
          {doubledCredits.map((credit, i) => (
            <span
              key={`${credit}-${i}`}
              className="font-display text-3xl md:text-5xl text-ivory/70 whitespace-nowrap flex items-center gap-16"
            >
              {credit}
              <span className="text-blood">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Brand logo marquee */}
      <div className="mb-12 px-6 md:px-16">
        <p className="font-mono-hud text-silver mb-8 flex items-center gap-3">
          <span className="block w-8 h-[1px] bg-gold" />
          FEATURED · PARTNERED · PRESSED
        </p>
      </div>

      <div className="relative mask-fade-lr">
        <div className="flex animate-marquee items-center" style={{ width: 'max-content' }}>
          {doubledBrands.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              data-cursor={brand.name.toUpperCase()}
              className="flex-shrink-0 mx-8 md:mx-16 flex items-center justify-center h-10 md:h-14 group"
            >
              <img
                src={brand.src}
                alt={brand.name}
                className="h-full w-auto object-contain brightness-0 invert opacity-40 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 transition-all duration-500 max-w-[180px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Press callouts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="px-6 md:px-16 mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-ivory/5 pt-16"
      >
        {[
          { k: 'FOLLOWERS', v: '100K+', s: 'across platforms' },
          { k: 'MEMBERS', v: '15,000+', s: 'MOSS Algorithm community' },
          { k: 'CREDITS', v: '47', s: 'active roles logged' },
        ].map((stat, i) => (
          <div key={stat.k} className="relative">
            <span className="absolute -top-4 -left-2 font-mono-hud text-blood/60">· 0{i + 1}</span>
            <p className="font-mono-hud text-silver mb-2">{stat.k}</p>
            <p className="font-display text-5xl md:text-6xl text-ivory leading-none">{stat.v}</p>
            <p className="text-silver text-sm mt-3">{stat.s}</p>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
