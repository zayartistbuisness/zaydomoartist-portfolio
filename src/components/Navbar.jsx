import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const links = [
  { label: 'Origin',     href: '#hero' },
  { label: 'Signal',     href: '#signal' },
  { label: 'Genesis',    href: '#about' },
  { label: 'Screen',     href: '#acting' },
  { label: 'Frequency',  href: '#music' },
  { label: 'Empire',     href: '#business' },
  { label: 'Vision',     href: '#directing' },
  { label: 'MOSS Algo',  href: '/moss', isRoute: true },
  { label: 'Contact',    href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile-only hamburger (desktop uses HUD + right rail) */}
      <div className="md:hidden fixed top-4 right-4 z-[60]">
        <button
          onClick={() => setOpen(!open)}
          data-cursor={open ? 'CLOSE' : 'MENU'}
          className="w-10 h-10 flex items-center justify-center border border-ivory/20 bg-obsidian/80 backdrop-blur-sm text-ivory"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-obsidian/98 backdrop-blur-xl flex flex-col items-start justify-center gap-6 px-10 md:hidden"
          >
            <p className="font-mono-hud text-gold mb-4">INDEX · TRANSMISSIONS</p>
            {links.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="flex items-baseline gap-4"
              >
                <span className="font-mono-hud text-silver w-8">0{i + 1}</span>
                {link.isRoute ? (
                  <Link
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="font-serif text-3xl italic text-ivory"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-serif text-3xl italic text-ivory"
                  >
                    {link.label}
                  </a>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
