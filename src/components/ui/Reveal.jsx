import { motion } from 'framer-motion'
import { easeLux, inView } from '../../lib/motion'

/**
 * Default in-view reveal: fade + rise. Set `y` to override distance,
 * `delay` to sequence, and `as` to change the element.
 */
export default function Reveal({ children, as = 'div', delay = 0, y = 34, className = '', ...rest }) {
  const MotionTag = motion[as] || motion.div
  const variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: easeLux, delay } },
  }
  return (
    <MotionTag className={className} variants={variants} {...inView} {...rest}>
      {children}
    </MotionTag>
  )
}
