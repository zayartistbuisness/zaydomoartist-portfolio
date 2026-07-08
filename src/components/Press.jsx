import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SectionHeader from './ui/SectionHeader'
import { inView, stagger, fadeUp } from '../lib/motion'

/**
 * On record — the ivory room. The one daylight space in the gallery:
 * paper-white walls, ink type, the same gold. Interviews and features,
 * every row a live link — only press that can be followed to a source
 * belongs here.
 */
const items = [
  {
    year: '2024',
    title: 'On Helping Adopted Children Get Started in Acting',
    outlet: 'PopSize UK',
    kind: 'Feature',
    cursor: 'READ',
    href: 'https://popsize.co.uk/news/2024/09/the-last-of-us-and-a-quiet-place-day-one-actor-zay-domo-artist-talks-about-helping-adopted-children-get-started-in-the-acting-industry/',
  },
  {
    year: '2023',
    title: 'From Voice Acting Prodigy to On-Screen Sensation',
    outlet: 'News24hours',
    kind: 'Profile',
    cursor: 'READ',
    href: 'http://news24hours.in/2023/05/05/zay-domo-artist-from-voice-acting-prodigy-to-on-screen-sensation/',
  },
  {
    year: '—',
    title: 'Defying the Odds — Music Career Journey',
    outlet: 'The Staffa Corner',
    kind: 'Podcast',
    cursor: 'LISTEN',
    href: 'https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview',
  },
  {
    year: '—',
    title: 'From Foster Care to Hollywood',
    outlet: 'Interview',
    kind: 'Video',
    cursor: 'WATCH',
    href: 'https://www.youtube.com/watch?v=4WaNPnJQWtk',
  },
]

export default function Press() {
  return (
    <section id="press" className="relative py-28 md:py-44 px-6 md:px-16 overflow-hidden bg-ivory text-obsidian">
      <div className="max-w-[1600px] mx-auto">
        <SectionHeader
          index="VII"
          label="Press"
          title={[{ text: 'On' }, { text: 'record', gold: true }]}
          note="Interviews and features."
          light
        />

        <motion.ul {...inView} variants={stagger(0.07)} className="border-t border-obsidian/15">
          {items.map((item) => (
            <motion.li key={item.href} variants={fadeUp}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor={item.cursor}
                className="group grid grid-cols-12 gap-3 md:gap-4 items-baseline border-b border-obsidian/10 py-6 md:py-7 transition-colors duration-500 hover:bg-obsidian/[0.03]"
              >
                <span className="col-span-2 md:col-span-1 text-obsidian/50 text-sm font-light tabular-nums">{item.year}</span>
                <span className="col-span-10 md:col-span-6 font-serif text-xl md:text-3xl font-light text-obsidian group-hover:text-gold-deep transition-all duration-500 md:group-hover:translate-x-2 leading-tight">
                  {item.title}
                </span>
                <span className="col-span-6 md:col-span-3 text-obsidian/55 text-xs md:text-sm font-light md:mt-0 mt-1">{item.outlet}</span>
                <span className="col-span-5 md:col-span-1 text-right md:text-left text-[10px] tracking-[0.28em] uppercase text-obsidian/45">{item.kind}</span>
                <span className="col-span-1 flex justify-end text-obsidian/40 group-hover:text-gold-deep transition-colors duration-500">
                  <ArrowUpRight size={16} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
