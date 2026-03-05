import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="about" className="py-24 md:py-36 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        {/* Image side */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="relative"
        >
          <div className="relative overflow-hidden aspect-[3/4]">
            <img
              src="/headshots/headshot-4.jpg"
              alt="Zay Domo Artist portrait"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/50 to-transparent" />
          </div>
          {/* Accent line */}
          <motion.div
            initial={{ height: 0 }}
            whileInView={{ height: '120px' }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute -right-4 md:-right-8 top-1/4 w-[1px] bg-gold/40"
          />
        </motion.div>

        {/* Text side */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[10px] tracking-[0.5em] uppercase text-gold mb-4"
          >
            About
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="font-serif text-3xl md:text-5xl font-light leading-tight mb-8"
          >
            The Art of
            <span className="italic text-gold"> Self-Invention</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="space-y-5 text-silver text-sm md:text-[15px] leading-relaxed font-light"
          >
            <p>
              <strong className="text-white">Zay Domo Artist</strong> is an actor, entrepreneur, and advocate whose trajectory from the foster care system to major Hollywood productions has made him one of the most compelling young talents in the industry. Born in Orlando, Florida, Zay entered foster care at 12 and discovered his passion for performance through an obsessive love of film — watching over 2,000 movies that became both his escape and his education. With no formal training and no industry support system, he graduated high school at 16, worked full-time at McDonald's for two years, and invested everything he earned into building his career from scratch.
            </p>
            <p>
              Zay broke into the industry through voice acting, lending his talents to major gaming franchises including <em className="text-ivory">Call of Duty: WWII</em>, <em className="text-ivory">Fortnite</em>, and <em className="text-ivory">Overwatch 2</em>. That foundation in vocal performance — learning to convey emotion purely through tone and rhythm — gave him a distinctive edge when he transitioned to on-screen work. His credits now span HBO's Emmy-nominated series <em className="text-ivory">The Last of Us</em> (2023), the motion-capture role of Milo in <em className="text-ivory">Kingdom of the Planet of the Apes</em> (2024), and the role of Young Bryan in <em className="text-ivory">A Quiet Place: Day One</em> (2024), where he worked under director Michael Sarnoski and held the screen through entirely non-verbal performance. His upcoming slate includes <em className="text-ivory">Master of Dreams</em> (2026), where he plays Jerome Stone, as well as <em className="text-ivory">Momma I Gotta Job</em> and <em className="text-ivory">LA Jesus</em>, both currently in post-production.
            </p>
            <p>
              Beyond acting, Zay is a co-founder of World In Print Media and a vocal advocate for foster youth in the entertainment industry. He has been featured in GQ Magazine, Movies Insider, and The Washington Post, and maintains a social media presence of over 100,000 followers. His story is one of relentless self-invention — proof that the system you come from doesn't have to define where you end up.
            </p>
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '60px' }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-[1px] bg-gold/40 mt-10"
          />
        </div>
      </div>
    </section>
  )
}
