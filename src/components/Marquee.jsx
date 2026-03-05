import { motion } from 'framer-motion'

const brands = [
  { name: 'Netflix', src: '/brands/netflix.png' },
  { name: 'Nike', src: '/brands/nike.png' },
  { name: 'GQ', src: '/brands/gq.png' },
  { name: 'Universal Pictures', src: '/brands/universal.png' },
  { name: 'Teen Vogue', src: '/brands/teenvogue.webp' },
  { name: 'Washington Post', src: '/brands/washingtonpost.svg' },
  { name: 'IMDbPro', src: '/brands/imdbpro.png' },
  { name: 'Walmart', src: '/brands/walmart.webp' },
]

export default function Marquee() {
  const doubled = [...brands, ...brands]

  return (
    <section className="py-16 md:py-24 border-y border-white/5 overflow-hidden bg-midnight">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center text-[10px] tracking-[0.5em] uppercase text-silver mb-12"
      >
        As Featured In & Worked With
      </motion.p>

      <div className="relative">
        {/* Gradient masks on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-midnight to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-midnight to-transparent z-10" />

        <div className="flex animate-marquee" style={{ width: 'max-content' }}>
          {doubled.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              className="flex-shrink-0 mx-8 md:mx-14 flex items-center justify-center h-10 md:h-12"
            >
              <img
                src={brand.src}
                alt={brand.name}
                className="h-full w-auto object-contain brightness-0 invert opacity-50 hover:opacity-90 transition-opacity duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
