import { Suspense, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { getChapter } from './chapterStore'

/**
 * Mounts a chapter's scene the first time its section comes within `margin`
 * viewports of the screen, then keeps it (scenes hide themselves when off
 * screen). Textures and geometry for far-away chapters never load up front.
 */
export default function ChapterMount({ id, margin = 1.2, children }) {
  const [mounted, setMounted] = useState(false)
  useFrame(() => {
    if (mounted) return
    const c = getChapter(id)
    if (!c.rect) return
    const vh = window.innerHeight
    if (c.rect.top < vh * (1 + margin) && c.rect.bottom > -vh * margin) setMounted(true)
  })
  return mounted ? <Suspense fallback={null}>{children}</Suspense> : null
}
