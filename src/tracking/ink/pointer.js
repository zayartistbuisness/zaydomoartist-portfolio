import { useEffect } from 'react'

// Pointer state in CSS px, shared by the DOM lens ring and the WebGL scene.
export const pointer = { x: -1e4, y: -1e4, active: false, lastMove: 0, touch: false }

export function usePointerTracking() {
  useEffect(() => {
    const onMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.touch = e.pointerType === 'touch'
      pointer.active = true
      pointer.lastMove = performance.now()
    }
    const onLeave = () => { pointer.active = false }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])
}
