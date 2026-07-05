import { motion } from 'framer-motion'
import { easeLux } from '../../lib/motion'

/**
 * Word-by-word masked reveal for headings — each word rises out of a clip.
 * Pass plain text; use `stagger`/`delay` to tune the cadence.
 */
export default function SplitText({
  text,
  className = '',
  delay = 0,
  stagger = 0.055,
  once = true,
  as = 'span',
}) {
  const words = String(text).split(' ')
  const Tag = motion[as] || motion.span

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '-10% 0px' }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      style={{ display: 'inline' }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
          <motion.span
            style={{ display: 'inline-block', willChange: 'transform' }}
            variants={{ hidden: { y: '115%' }, show: { y: '0%', transition: { duration: 0.95, ease: easeLux } } }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
