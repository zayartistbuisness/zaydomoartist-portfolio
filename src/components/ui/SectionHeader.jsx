import { motion } from 'framer-motion'
import Eyebrow from './Eyebrow'
import Reveal from './Reveal'
import { easeLux } from '../../lib/motion'

/**
 * The room's opening wall — a placard, then a headline at architectural
 * scale whose words rise out of masks, with an optional side note.
 * `title` is a list of segments ({ text, gold, italic }) so a single
 * word can carry the gold italic without breaking the reveal cadence.
 */
export default function SectionHeader({
  index,
  label,
  title,
  note,
  light = false,
  titleClass = 'text-[clamp(3rem,8.5vw,9.5rem)]',
  className = '',
}) {
  let w = 0
  const segments = title.map((seg) => ({
    ...seg,
    words: seg.text.split(' ').map((word) => ({ word, i: w++ })),
  }))

  return (
    <div
      className={`mb-14 md:mb-24 ${
        note ? 'flex flex-col md:flex-row md:items-end md:justify-between gap-6' : ''
      } ${className}`}
    >
      <div>
        <Reveal y={16}>
          <Eyebrow index={index} light={light}>{label}</Eyebrow>
        </Reveal>
        {/* The in-view observer must live on the h2 — the words start
            clipped below their overflow-hidden masks, so observing the
            words themselves would never fire. */}
        <motion.h2
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-10% 0px' }}
          className={`mt-6 font-serif font-light leading-[0.92] tracking-[-0.01em] ${titleClass} ${
            light ? 'text-obsidian' : 'text-ivory'
          }`}
        >
          {segments.map((seg, si) => (
            <span key={si}>
              {seg.words.map(({ word, i }) => (
                <span
                  key={i}
                  className={`inline-block overflow-hidden align-top ${
                    seg.gold || seg.italic ? 'pr-[0.06em]' : ''
                  }`}
                >
                  {/* gold-metallic is background-clip:text — it must sit on
                      the transformed element itself or the paint is lost */}
                  <motion.span
                    className={`inline-block will-change-transform ${
                      seg.gold || seg.italic ? 'italic' : ''
                    } ${seg.gold ? 'text-gold-metallic' : ''}`}
                    custom={i}
                    variants={{
                      hidden: { y: '112%' },
                      show: (n) => ({
                        y: '0%',
                        transition: { duration: 1.05, ease: easeLux, delay: 0.12 + n * 0.07 },
                      }),
                    }}
                  >
                    {/* nbsp: a plain trailing space would be trimmed inside
                        the inline-block and the words would run together */}
                    {word}{' '}
                  </motion.span>
                </span>
              ))}
            </span>
          ))}
        </motion.h2>
      </div>
      {note && (
        <Reveal delay={0.25}>
          <p className={`text-sm font-light max-w-xs md:text-right md:pb-4 ${light ? 'text-obsidian/60' : 'text-silver'}`}>
            {note}
          </p>
        </Reveal>
      )}
    </div>
  )
}
