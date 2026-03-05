import { motion } from 'framer-motion'
import { Film, Award, Calendar } from 'lucide-react'

const stills = [
  { src: '/headshots/keon-still-1.png', alt: 'Keon - Gym hand-wrapping scene' },
  { src: '/headshots/keon-still-2.png', alt: 'Keon - Foster care office scene' },
  { src: '/headshots/keon-still-3.png', alt: 'Keon - Shadow boxing scene' },
  { src: '/headshots/keon-still-4.png', alt: 'Keon - Boxing ring corner' },
]

export default function Directing() {
  return (
    <section id="directing" className="py-24 md:py-36 px-6 md:px-12 bg-charcoal/30">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          className="mb-16 md:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold mb-4">03</p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light">
            Directing
          </h2>
        </motion.div>

        {/* Keon Feature Film Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Movie poster */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative overflow-hidden">
              <img
                src="/headshots/keon-poster.png"
                alt="KEON - Official Movie Poster"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Film info strip */}
            <div className="flex items-center gap-6 mt-4 text-[10px] tracking-[0.2em] uppercase text-silver">
              <span className="flex items-center gap-1.5"><Film size={12} /> Feature Film</span>
              <span className="flex items-center gap-1.5"><Calendar size={12} /> 2027</span>
              <span className="flex items-center gap-1.5"><Award size={12} /> Official Selection</span>
            </div>
          </motion.div>

          {/* Synopsis and details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase text-gold mb-4">Featured Project</p>
            <h3 className="font-serif text-3xl md:text-5xl italic font-light mb-6">Keon</h3>

            <div className="space-y-4 text-silver text-sm md:text-[15px] leading-relaxed font-light mb-8">
              <p>
                After witnessing his mother's overdose at ten years old, a foster youth named Keon
                survives six years of institutional invisibility in rural Central Florida before finding
                purpose in a rundown boxing gym run by a grieving former champion. As Keon fights for a
                chance at adoption and his coach fights to stay sober, both discover that the only way
                out of the past is through it — one round at a time.
              </p>
            </div>

            {/* Credits */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[11px] border-t border-white/10 pt-6">
              <div>
                <p className="tracking-[0.3em] uppercase text-silver mb-1">Director</p>
                <p className="text-white">Zay "Domo" Artist</p>
              </div>
              <div>
                <p className="tracking-[0.3em] uppercase text-silver mb-1">Writer</p>
                <p className="text-white">Zay "Domo" Artist</p>
              </div>
              <div>
                <p className="tracking-[0.3em] uppercase text-silver mb-1">Genre</p>
                <p className="text-white">Drama</p>
              </div>
              <div>
                <p className="tracking-[0.3em] uppercase text-silver mb-1">Status</p>
                <p className="text-gold">In Development</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Film stills gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 md:mt-24"
        >
          <p className="text-[10px] tracking-[0.5em] uppercase text-silver mb-6">Film Stills</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {stills.map((still, i) => (
              <motion.div
                key={still.src}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="aspect-video overflow-hidden group"
              >
                <img
                  src={still.src}
                  alt={still.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
