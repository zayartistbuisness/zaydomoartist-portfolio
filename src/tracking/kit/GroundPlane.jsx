import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { getChapter } from './chapterStore'
import { rectToWorld } from './space'

/**
 * The chapter's background colour, drawn in WebGL (not CSS) so it can cover
 * whatever 3D sits in earlier chapters. Tracks the section's on-screen band.
 *
 * Chapters render in page order (each Scene sits in a group with ascending
 * renderOrder), and the ground always passes the depth test and writes far
 * depth: it paints over earlier chapters' objects inside its band and resets
 * depth there, so its own chapter draws cleanly on top — a true curtain.
 */
export default function GroundPlane({ id, color, z = -6, renderOrder = -10 }) {
  const ref = useRef()
  const camera = useThree((s) => s.camera)
  useFrame((state) => {
    const m = ref.current
    const c = getChapter(id)
    if (!m) return
    m.visible = c.visible && !!c.rect
    if (!m.visible) return
    const vh = state.size.height
    const top = Math.max(c.rect.top, -4)
    const bottom = Math.min(c.rect.bottom, vh + 4)
    const w = rectToWorld({ left: -4, width: state.size.width + 8, top, height: bottom - top }, state, camera, z)
    m.position.set(w.x, w.y, z)
    m.scale.set(w.w, w.h, 1)
  })
  return (
    <mesh ref={ref} renderOrder={renderOrder}>
      <planeGeometry />
      <meshBasicMaterial color={color} depthFunc={THREE.AlwaysDepth} depthWrite toneMapped={false} />
    </mesh>
  )
}
