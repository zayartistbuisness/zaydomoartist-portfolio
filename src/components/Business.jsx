import { motion } from 'framer-motion'
import { TrendingUp, Users, BarChart3, Trophy } from 'lucide-react'

const sportsbooks = [
  { name: 'DraftKings', src: '/brands/draftkings.svg' },
  { name: 'FanDuel', src: '/brands/fanduel.png' },
  { name: 'BetMGM', src: '/brands/betmgm.webp' },
  { name: 'Fanatics Sportsbook', src: '/brands/fanatics.png' },
]

const stats = [
  { number: '15,000+', label: 'Active Members', icon: Users },
  { number: '#1', label: 'Largest Community', icon: Trophy },
  { number: 'Every Major', label: 'US Sportsbook Uses Our Algorithm', icon: BarChart3 },
]

export default function Business() {
  const doubled = [...sportsbooks, ...sportsbooks]

  return (
    <section id="business" className="py-24 md:py-36 px-6 md:px-12">
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
            Business
          </h2>
          <p className="text-silver text-sm md:text-base font-light mt-4 max-w-lg">
            Beyond entertainment — building one of the largest sports betting communities in the market.
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Trophy image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative overflow-hidden">
              <img
                src="/headshots/whop-trophy.jpg"
                alt="Zay Domo holding Whop trophies for 10,000 and 5,000 members"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent" />
            </div>
            {/* Caption overlay */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold">Whop Creator Awards</p>
              <p className="text-xs text-silver mt-1">10,000 & 5,000 Member Milestones</p>
            </motion.div>
          </motion.div>

          {/* Business info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={18} className="text-gold" />
              <p className="text-[10px] tracking-[0.5em] uppercase text-gold">Featured Venture</p>
            </div>

            <h3 className="font-serif text-3xl md:text-5xl font-light mb-2">
              Artists Picks
            </h3>
            <p className="text-silver text-sm tracking-[0.15em] uppercase mb-8">
              Founded by Zay "Domo" Artist
            </p>

            <div className="space-y-4 text-silver text-sm md:text-[15px] leading-relaxed font-light mb-10">
              <p>
                Artists Picks is one of the largest sports betting communities on the market, with
                over <strong className="text-white">15,000+ active members</strong> and counting.
                What started as a personal edge became an empire — our proprietary algorithm is
                currently used by <strong className="text-white">every major sportsbook across the
                United States</strong>.
              </p>
              <p>
                This isn't a side project. This is the answer to the question everyone asks — and the
                proof that the vision extends far beyond the screen.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                  className="text-center"
                >
                  <stat.icon size={16} className="text-gold mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-light text-white">{stat.number}</p>
                  <p className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-silver mt-1 leading-tight">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sportsbook partners carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 md:mt-28"
        >
          <p className="text-[10px] tracking-[0.5em] uppercase text-silver mb-8 text-center">
            Algorithm Integrated Across
          </p>

          <div className="relative overflow-hidden">
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-midnight to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-midnight to-transparent z-10" />

            <div className="flex animate-marquee" style={{ width: 'max-content', animationDuration: '18s' }}>
              {doubled.map((brand, i) => (
                <div
                  key={`${brand.name}-${i}`}
                  className="flex-shrink-0 mx-10 md:mx-16 flex items-center justify-center h-10 md:h-14"
                >
                  <img
                    src={brand.src}
                    alt={brand.name}
                    className="h-full w-auto object-contain brightness-0 invert opacity-40 hover:opacity-80 transition-opacity duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
