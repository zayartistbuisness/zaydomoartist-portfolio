import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

/**
 * Refined luxury cursor: a precise gold dot + a lagging ring that expands
 * and reads a `data-cursor="LABEL"` attribute on hover. Desktop only.
 */
export default function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.4 })
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.4 })

  const [label, setLabel] = useState('')
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    setEnabled(true)

    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      if (!visible) setVisible(true)
      const target = e.target.closest('[data-cursor], a, button, [role="button"]')
      if (target) {
        setHovering(true)
        setLabel(target.getAttribute('data-cursor') || '')
      } else {
        setHovering(false)
        setLabel('')
      }
    }
    const leave = () => setVisible(false)

    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [x, y, visible])

  if (!enabled) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none hidden md:block" aria-hidden>
      {/* Dot */}
      <motion.div
        className="absolute top-0 left-0 rounded-full bg-gold"
        style={{ x, y, width: 6, height: 6, translateX: '-50%', translateY: '-50%', opacity: visible ? 1 : 0 }}
      />
      {/* Ring */}
      <motion.div
        className="absolute top-0 left-0 rounded-full border border-gold/60 flex items-center justify-center"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hovering ? 56 : 30,
          height: hovering ? 56 : 30,
          opacity: visible ? (hovering ? 0.9 : 0.5) : 0,
          borderColor: hovering ? 'rgba(200,162,76,0.9)' : 'rgba(200,162,76,0.5)',
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="label-mono text-gold whitespace-nowrap"
              style={{ fontSize: 8 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
