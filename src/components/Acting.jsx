import { motion } from 'framer-motion'

const images = [
  { src: '/headshots/headshot-1.jpg', alt: 'Zay Domo - Window portrait' },
  { src: '/headshots/headshot-2.jpg', alt: 'Zay Domo - Studio portrait' },
  { src: '/headshots/headshot-3.jpg', alt: 'Zay Domo - Formal headshot' },
  { src: '/headshots/headshot-4.jpg', alt: 'Zay Domo - Close-up portrait' },
  { src: '/headshots/headshot-5.jpg', alt: 'Zay Domo - Lifestyle' },
  { src: '/headshots/headshot-6.jpg', alt: 'Zay Domo - Rooftop portrait' },
]

export default function Acting() {
  return (
    <section id="acting" className="py-24 md:py-36 px-6 md:px-12 bg-charcoal/30">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          className="mb-16 md:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold mb-4">01</p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light">
            Acting
          </h2>
          <p className="text-silver text-sm md:text-base font-light mt-4 max-w-lg">
            A selection of headshots and portfolio work. Every frame tells a different story,
            every expression a different world.
          </p>
        </motion.div>

        {/* Masonry grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
          {images.map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
              className="relative group overflow-hidden break-inside-avoid"
            >
              <div className="overflow-hidden">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold">{img.alt}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
