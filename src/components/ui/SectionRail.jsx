import { motion } from 'framer-motion'

/**
 * Museum wayfinding — a hairline rail of roman numerals fixed to the
 * right edge. The room you're standing in glows gold; any tick glides
 * you to its room. Flips to ink when the ivory room (Press) is active.
 */
const rooms = [
  { id: 'about', n: 'I' },
  { id: 'acting', n: 'II' },
  { id: 'reel', n: 'III' },
  { id: 'music', n: 'IV' },
  { id: 'business', n: 'V' },
  { id: 'directing', n: 'VI' },
  { id: 'press', n: 'VII' },
  { id: 'contact', n: 'VIII' },
]

export default function SectionRail({ active }) {
  const light = active === 'press'
  return (
    <motion.nav
      aria-label="Rooms"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-[18px]"
    >
      {rooms.map((r) => {
        const on = active === r.id
        return (
          <a key={r.id} href={`#${r.id}`} data-cursor={r.n} className="group flex items-center gap-2.5">
            <span
              className={`font-editorial italic text-xs leading-none transition-all duration-500 ${
                on
                  ? `opacity-100 ${light ? 'text-gold-deep' : 'text-gold'}`
                  : `opacity-0 group-hover:opacity-70 ${light ? 'text-obsidian/70' : 'text-bone/70'}`
              }`}
            >
              {r.n}
            </span>
            <span
              className={`h-px transition-all duration-500 ${
                on
                  ? `w-7 ${light ? 'bg-gold-deep' : 'bg-gold'}`
                  : `w-3.5 group-hover:w-6 ${light ? 'bg-obsidian/30' : 'bg-ivory/25'}`
              }`}
            />
          </a>
        )
      })}
    </motion.nav>
  )
}
