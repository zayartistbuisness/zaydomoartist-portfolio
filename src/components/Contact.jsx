import { motion } from 'framer-motion'
import { Mail, ArrowUpRight } from 'lucide-react'

export default function Contact() {
  return (
    <section id="contact" className="py-24 md:py-36 px-6 md:px-12 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          className="mb-16 md:mb-24 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[10px] tracking-[0.5em] uppercase text-gold mb-4">04</p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light">
            Get In Touch
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '60px' }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-[1px] bg-gold mx-auto mt-8"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {/* Management / Representation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase text-silver mb-6">
              Management & Representation
            </p>

            <div className="space-y-6">
              <div className="group">
                <p className="text-xs tracking-[0.2em] uppercase text-silver mb-1">Talent Agency</p>
                <p className="text-white font-light text-lg">Schuller Talent</p>
              </div>

              <div className="h-[1px] bg-white/5" />

              <div className="group">
                <p className="text-xs tracking-[0.2em] uppercase text-silver mb-1">Management Team</p>
                <a
                  href="mailto:Kmatuka@gmail.com"
                  className="inline-flex items-center gap-1.5 text-white font-light text-lg hover:text-gold transition-colors duration-300"
                >
                  <Mail size={15} />
                  Kmatuka@gmail.com
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Direct inquiries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase text-silver mb-6">
              Direct Inquiries
            </p>

            <div className="space-y-6">
              <div className="group">
                <p className="text-xs tracking-[0.2em] uppercase text-silver mb-1">Press & Media</p>
                <a
                  href="mailto:lisa@lynkpr.com"
                  className="inline-flex items-center gap-1.5 text-white font-light text-lg hover:text-gold transition-colors duration-300"
                >
                  <Mail size={15} />
                  lisa@lynkpr.com
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <div className="h-[1px] bg-white/5" />

              {/* Social links */}
              <div>
                <p className="text-xs tracking-[0.2em] uppercase text-silver mb-3">Social</p>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/zaydomoartist/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] tracking-[0.15em] uppercase text-silver hover:text-gold transition-colors duration-300 border-b border-transparent hover:border-gold/30 pb-0.5"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.imdb.com/name/nm14198614/?ref_=mv_close"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] tracking-[0.15em] uppercase text-silver hover:text-gold transition-colors duration-300 border-b border-transparent hover:border-gold/30 pb-0.5"
                  >
                    IMDb
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 md:mt-36 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-silver/50">
            &copy; {new Date().getFullYear()} Zay "Domo" Artist. All Rights Reserved.
          </p>
          <a href="#hero" className="text-[10px] tracking-[0.3em] uppercase text-silver/50 hover:text-gold transition-colors">
            Back to Top
          </a>
        </motion.footer>
      </div>
    </section>
  )
}
