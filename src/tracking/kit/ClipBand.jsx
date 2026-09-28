import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { getChapter } from './chapterStore'

/**
 * Clips every ink material inside to its chapter's on-screen band, so a
 * chapter's 3D can never spill over the section above or below it (e.g. a
 * film strip trailing onto the next chapter's paper). Works on anything built
 * with inkify / createInkPhotoMaterial / createInkUniforms (uClipY).
 */
export default function ClipBand({ id, children }) {
  const ref = useRef()
  useFrame((state) => {
    const g = ref.current
    const c = getChapter(id)
    if (!g || !c.rect) return
    const dpr = state.gl.getPixelRatio()
    const H = state.size.height
    const bottom = (H - Math.min(H, c.rect.bottom)) * dpr
    const top = (H - Math.max(0, c.rect.top)) * dpr
    g.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null
      if (!mats) return
      for (const m of mats) {
        const u = m.uniforms?.uClipY || m.userData?.ink?.uClipY
        if (u) u.value.set(bottom, top)
      }
    })
  })
  return <group ref={ref}>{children}</group>
}
