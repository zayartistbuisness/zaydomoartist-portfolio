import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const SECTIONS = [
  { id: 'hero',      label: 'ORIGIN',   index: '00' },
  { id: 'signal',    label: 'SIGNAL',   index: '01' },
  { id: 'about',     label: 'GENESIS',  index: '02' },
  { id: 'acting',    label: 'SCREEN',   index: '03' },
  { id: 'music',     label: 'FREQUENCY',index: '04' },
  { id: 'business',  label: 'EMPIRE',   index: '05' },
  { id: 'directing', label: 'VISION',   index: '06' },
  { id: 'contact',   label: 'SIGNAL-END', index: '07' },
]

export default function HUD({ activeSection }) {
  const [now, setNow] = useState(new Date())
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const pct = h.scrollHeight - h.clientHeight > 0
        ? (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100
        : 0
      setScrollPct(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const stamp = now.toISOString().replace('T', ' · ').slice(0, 19) + ' UTC'
  const activeMeta = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0]

  return (
    <>
      {/* Top-left: call sign */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="fixed top-5 left-5 md:top-6 md:left-8 z-50 pointer-events-none"
      >
        <p className="font-mono-hud text-ivory/80">Z.DOMO // TX_07 // ON AIR</p>
        <p className="font-mono-hud text-silver mt-1">{stamp}</p>
      </motion.div>

      {/* Top-right: live scroll percentage */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="fixed top-5 right-5 md:top-6 md:right-8 z-50 pointer-events-none text-right"
      >
        <div className="flex items-center justify-end gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blood" style={{ animation: 'pulse-dot 1.4s infinite' }} />
          <p className="font-mono-hud text-ivory/80">REC</p>
        </div>
        <p className="font-mono-hud text-silver mt-1">{scrollPct.toFixed(2).padStart(5, '0')}%</p>
      </motion.div>

      {/* Bottom-left: current section meta */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="fixed bottom-5 left-5 md:bottom-6 md:left-8 z-50 pointer-events-none"
      >
        <p className="font-mono-hud text-silver">FRAME {activeMeta.index}</p>
        <p className="font-mono-hud text-ivory mt-1">{activeMeta.label}</p>
      </motion.div>

      {/* Bottom-right: copyright marquee */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="fixed bottom-5 right-5 md:bottom-6 md:right-8 z-50 pointer-events-none text-right"
      >
        <p className="font-mono-hud text-silver">© {new Date().getFullYear()} · ZAY DOMO</p>
        <p className="font-mono-hud text-ivory/50 mt-1">ARTIST // FOUNDER</p>
      </motion.div>

      {/* Right rail: section pips */}
      <nav className="fixed top-1/2 -translate-y-1/2 right-4 md:right-6 z-50 hidden md:block">
        <ul className="flex flex-col gap-6">
          {SECTIONS.map((section) => {
            const active = activeSection === section.id
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  data-cursor={section.label}
                  className="group flex items-center gap-3 justify-end"
                >
                  <span className={`font-mono-hud transition-all duration-500 ${active ? 'text-gold opacity-100' : 'text-silver opacity-0 group-hover:opacity-100'}`}>
                    {section.label}
                  </span>
                  <span
                    className={`block h-[1px] transition-all duration-500 ${
                      active ? 'w-8 bg-gold' : 'w-3 bg-silver group-hover:w-6 group-hover:bg-ivory'
                    }`}
                  />
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
