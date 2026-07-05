import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

/**
 * CONTACT — transmission terminal.
 * Closing card with emails-as-transmissions, signature, back-to-top beacon.
 */
export default function Contact() {
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const channels = [
    {
      k: 'MANAGEMENT',
      label: 'Schuller Talent',
      target: 'schullertalent@gmail.com',
      href: 'mailto:schullertalent@gmail.com',
    },
    {
      k: 'THEATRICAL',
      label: 'Coast to Coast Talent',
      target: 'coastyouth@ctctalent.com',
      href: 'mailto:coastyouth@ctctalent.com',
      site: 'https://www.ctctalent.com/',
    },
    {
      k: 'PRESS / MEDIA',
      label: 'Lisa @ Lynk PR',
      target: 'lisa@lynkpr.com',
      href: 'mailto:lisa@lynkpr.com',
    },
  ]

  return (
    <section id="contact" className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-obsidian border-t border-ivory/10">
      {/* Ambient backdrop — huge closing wordmark */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2 }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <span className="font-display text-[35vw] md:text-[22vw] text-ivory/[0.035] leading-none whitespace-nowrap tracking-tight">
          END · TX
        </span>
      </motion.div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-8 mb-16 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <p className="font-mono-hud text-gold mb-3">07 / SIGNAL-END</p>
            <p className="font-mono-hud text-silver flex items-center gap-2">
              <span className="block w-2 h-2 rounded-full bg-blood animate-pulse-glow" />
              CHANNEL OPEN
            </p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-serif text-fluid-big font-light text-ivory leading-none">
              Transmission <span className="italic text-gold">complete.</span><br/>
              Return signal <span className="italic text-gold">awaited.</span>
            </h2>
          </div>
        </div>

        {/* Transmission terminal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="border border-gold/30 bg-charcoal/40 backdrop-blur-sm"
        >
          {/* Terminal header */}
          <div className="flex items-center justify-between border-b border-ivory/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <span className="block w-2 h-2 rounded-full bg-blood" />
              <span className="block w-2 h-2 rounded-full bg-gold" />
              <span className="block w-2 h-2 rounded-full bg-ivory/70" />
              <span className="font-mono-hud text-silver ml-3">zdomo@transmission : ~ $</span>
            </div>
            <span className="font-mono-hud text-silver">{clock.toISOString().slice(0, 19).replace('T', ' · ')} UTC</span>
          </div>

          {/* Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-ivory/10">
            {channels.map((c, i) => (
              <div key={c.k} className="p-6 md:p-10">
                <p className="font-mono-hud text-gold mb-3">CH/{String(i + 1).padStart(2, '0')} · {c.k}</p>
                <p className="font-mono-hud text-silver mb-4">{c.label}</p>
                {c.href ? (
                  <a
                    href={c.href}
                    data-cursor="TRANSMIT"
                    className="group inline-flex items-center gap-2 text-ivory hover:text-gold transition-colors font-serif text-xl md:text-2xl break-all"
                  >
                    {c.target}
                    <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <p className="font-serif text-xl md:text-2xl text-ivory">{c.target}</p>
                )}
                {c.site && (
                  <a
                    href={c.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="VISIT"
                    className="font-mono-hud text-silver hover:text-gold transition-colors mt-3 inline-flex items-center gap-1.5"
                  >
                    {c.site.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ArrowUpRight size={11} />
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Social signal bar */}
          <div className="border-t border-ivory/10 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="font-mono-hud text-silver">SECONDARY CHANNELS · SOCIAL</p>
            <div className="flex items-center gap-6">
              {[
                { label: 'INSTAGRAM', href: 'https://www.instagram.com/zaydomoartist/' },
                { label: 'IMDB',      href: 'https://www.imdb.com/name/nm14198614/?ref_=mv_close' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor={s.label}
                  className="group font-mono-hud text-ivory hover:text-gold transition-colors inline-flex items-center gap-1.5"
                >
                  {s.label}
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Sign-off */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-20 md:mt-28 text-center"
        >
          <p className="font-mono-hud text-silver mb-4">SIGNED</p>
          <h3 className="font-serif italic text-5xl md:text-8xl text-ivory leading-none">
            Zay <span className="text-gold">"Domo"</span> Artist
          </h3>
          <p className="font-mono-hud text-silver mt-6">— END OF TRANSMISSION —</p>
        </motion.div>

        {/* Footer row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-24 pt-8 border-t border-ivory/5 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="font-mono-hud text-silver/60">
            © {new Date().getFullYear()} · ZAY "DOMO" ARTIST · ALL RIGHTS RESERVED
          </p>
          <a
            href="#hero"
            data-cursor="RETURN"
            className="font-mono-hud text-silver hover:text-gold transition-colors"
          >
            ← RETURN TO TOP
          </a>
        </motion.div>
      </div>
    </section>
  )
}
