import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function Cursor() {
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    const isTouch = matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    let rx = window.innerWidth / 2
    let ry = window.innerHeight / 2
    let dx = rx
    let dy = ry
    let raf

    const onMove = (e) => {
      dx = e.clientX
      dy = e.clientY
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`
      }
    }

    const loop = () => {
      rx += (dx - rx) * 0.18
      ry += (dy - ry) * 0.18
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }

    const onOver = (e) => {
      const target = e.target.closest('[data-cursor]')
      if (target) {
        setHovering(true)
        setLabel(target.getAttribute('data-cursor') || '')
      } else {
        setHovering(false)
        setLabel('')
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <motion.div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[10000] hidden md:flex items-center justify-center"
        animate={{
          width: hovering ? 64 : 28,
          height: hovering ? 64 : 28,
          borderColor: hovering ? 'rgba(201,168,76,0.9)' : 'rgba(242,235,218,0.35)',
          backgroundColor: hovering ? 'rgba(201,168,76,0.04)' : 'transparent',
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: '50%',
        }}
      >
        {hovering && label && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono-hud text-[9px] text-gold whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </motion.div>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[10001] hidden md:block w-1 h-1 rounded-full bg-ivory"
      />
    </>
  )
}
