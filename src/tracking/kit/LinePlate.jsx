import { useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createInkPhotoMaterial } from '../ink/inkChunk'
import { getChapter } from './chapterStore'
import { viewportAt } from './space'

/**
 * A monochrome plate (architecture, landscape, studio…) rendered entirely as
 * the ink line field: the Son Daven-style living background of a chapter.
 * Cover-fits the viewport at depth z, drifts with chapter progress, and is
 * clipped to the chapter's on-screen band so it never bleeds into neighbours.
 *
 * props: id, src, invert (1 on dark grounds), z, drift (world units of vertical
 * travel over the chapter), black/white (tone levels), opacity, resolve (0 = lines)
 */
export default function LinePlate({ id, src, invert = 0, z = -3, drift = 0.6, black = 0.12, white = 0.88, opacity = 1, resolve = 0, renderOrder = -5 }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const mat = useMemo(() => {
    const m = createInkPhotoMaterial(tex, { resolve, invert, black, white, alpha: opacity })
    m.depthTest = false
    return m
  }, [tex, invert, resolve, black, white, opacity])
  const ref = useRef()
  const camera = useThree((s) => s.camera)

  useFrame((state) => {
    const m = ref.current
    const c = getChapter(id)
    if (!m) return
    m.visible = c.visible && !!c.rect
    if (!m.visible) return
    const vp = viewportAt(state, camera, z)
    const aspect = tex.image.width / tex.image.height
    const coverW = Math.max(vp.width, vp.height * aspect) * 1.12
    m.scale.set(coverW, coverW / aspect, 1)
    m.position.set(0, (c.progress - 0.5) * drift, z)

    // Clip to the section's on-screen band, in device px from the bottom.
    const dpr = state.gl.getPixelRatio()
    const H = state.size.height
    const bottom = (H - Math.min(H, c.rect.bottom)) * dpr
    const top = (H - Math.max(0, c.rect.top)) * dpr
    m.material.uniforms.uClipY.value.set(bottom, top)
  })

  return (
    <mesh ref={ref} material={mat} renderOrder={renderOrder}>
      <planeGeometry />
    </mesh>
  )
}
