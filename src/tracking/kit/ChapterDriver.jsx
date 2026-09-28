import { useFrame } from '@react-three/fiber'
import { allChapters } from './chapterStore'

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/** Measures every registered chapter once per frame, before scenes update. */
export default function ChapterDriver() {
  useFrame(() => {
    const vh = window.innerHeight
    for (const c of allChapters()) {
      if (!c.el) continue
      const r = c.el.getBoundingClientRect()
      c.rect = r
      c.visible = r.bottom > 0 && r.top < vh
      c.enter = clamp01(1 - r.top / vh)
      c.progress = clamp01(-r.top / Math.max(1, r.height - vh))
    }
  }, -2)
  return null
}
