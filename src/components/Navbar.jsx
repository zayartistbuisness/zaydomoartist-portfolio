import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { easeLux } from '../lib/motion'

const links = [
  { label: 'Story', href: '#about' },
  { label: 'Acting', href: '#acting' },
  { label: 'Reel', href: '#reel' },
  { label: 'Music', href: '#music' },
  { label: 'Directing', href: '#directing' },
  { label: 'Press', href: '#press' },
  { label: 'MOSS', href: '/moss', route: true },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: easeLux, delay: 0.3 }}
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
          scrolled ? 'bg-obsidian/70 backdrop-blur-md border-b border-ivory/[0.06]' : ''
        }`}
      >
        <nav className="max-w-[1600px] mx-auto px-6 md:px-16 h-16 md:h-20 flex items-center justify-between">
          {/* Monogram */}
          <a href="#hero" data-cursor="TOP" className="group flex items-center gap-2.5">
            <span className="font-serif text-lg md:text-xl tracking-tight text-ivory group-hover:text-gold transition-colors duration-500">
              Zay <span className="italic text-gold-metallic">Domo</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-9">
            {links.map((l) =>
              l.route ? (
                <Link key={l.label} to={l.href} data-cursor="OPEN" className="nav-link">
                  {l.label}
                </Link>
              ) : (
                <a key={l.label} href={l.href} className="nav-link">
                  {l.label}
                </a>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden flex flex-col gap-1.5 w-8 items-end"
          >
            <span className={`block h-px bg-ivory transition-all duration-300 ${open ? 'w-6 rotate-45 translate-y-[3px]' : 'w-6'}`} />
            <span className={`block h-px bg-ivory transition-all duration-300 ${open ? 'w-6 -rotate-45 -translate-y-[3px]' : 'w-4'}`} />
          </button>
        </nav>
      </motion.header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 bg-obsidian/98 backdrop-blur-xl flex flex-col items-center justify-center gap-7 md:hidden"
          >
            {links.map((l, i) => {
              const cls = 'font-serif text-4xl italic text-ivory hover:text-gold transition-colors'
              return (
                <motion.div
                  key={l.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: easeLux }}
                >
                  {l.route ? (
                    <Link to={l.href} onClick={() => setOpen(false)} className={cls}>{l.label}</Link>
                  ) : (
                    <a href={l.href} onClick={() => setOpen(false)} className={cls}>{l.label}</a>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
