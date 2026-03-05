import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const pillars = [
  { label: 'Acting', href: '#acting' },
  { label: 'Production', href: '#music' },
  { label: 'Directing', href: '#directing' },
  { label: 'Contact', href: '#contact' },
]

export default function Hero() {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  return (
    <section id="hero" className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image - the suited B&W headshot */}
      <div className="absolute inset-0">
        <motion.img
          src="/headshots/headshot-3.jpg"
          alt="Zay Domo Artist"
          className="w-full h-full object-cover object-top"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.25 }}
          transition={{ duration: 2, ease: [0.76, 0, 0.24, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/40 to-midnight" />
      </div>

      {/* Title */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        <motion.p
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-[10px] md:text-xs tracking-[0.5em] uppercase text-silver mb-6"
        >
          The Official Portfolio of
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-none"
        >
          <span className="block">Zay</span>
          <span className="block italic text-gold">"Domo"</span>
          <span className="block">Artist</span>
        </motion.h1>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '80px' }}
          transition={{ delay: 1.2, duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="h-[1px] bg-gold mx-auto mt-8 mb-10"
        />

        {/* Navigation pillars */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 md:gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          {pillars.map((pillar, i) => (
            <motion.a
              key={pillar.label}
              href={pillar.href}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + i * 0.12, duration: 0.6 }}
              className={`relative px-4 py-2 text-[11px] md:text-xs tracking-[0.3em] uppercase transition-all duration-500 border border-transparent hover:border-white/20 ${
                hoveredIndex !== null && hoveredIndex !== i
                  ? 'opacity-30'
                  : 'opacity-100'
              } ${hoveredIndex === i ? 'text-gold' : 'text-white'}`}
            >
              {pillar.label}
              {hoveredIndex === i && (
                <motion.div
                  layoutId="hero-underline"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[1px] bg-gold"
                />
              )}
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <span className="text-[9px] tracking-[0.4em] uppercase text-silver">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={14} className="text-silver" />
        </motion.div>
      </motion.div>
    </section>
  )
}
