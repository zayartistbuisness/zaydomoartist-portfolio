import { useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createInkPhotoMaterial } from '../ink/inkChunk'
import { rectToWorld } from './space'

/**
 * A photograph drawn in the WebGL ink layer but laid out by the DOM: it fits
 * (contain) inside the element returned by getSlot(), so CSS decides where it
 * sits and it scrolls with the page. Resolve comes from getResolve() (0 = ink
 * lines, 1 = photo); fadeFrom/fadeTo keep the top of the picture photographic
 * while the bottom bleeds into the line field (see inkChunk).
 */
export default function DomImage({ src, getSlot, getResolve, align = 'bottom', invert = 0, fadeFrom, fadeTo, edge = 0, black = 0.05, white = 0.92, renderOrder = 0 }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const mat = useMemo(() => createInkPhotoMaterial(tex, { resolve: 0, invert, black, white, fadeFrom, fadeTo, edge }), [tex, invert, black, white, fadeFrom, fadeTo, edge])
  const ref = useRef()
  const camera = useThree((s) => s.camera)
  const aspect = tex.image.width / tex.image.height

  useFrame((state) => {
    const m = ref.current
    const el = getSlot()
    if (!m || !el) return
    const r = el.getBoundingClientRect()
    m.visible = r.bottom > 0 && r.top < state.size.height && r.width > 0
    if (!m.visible) return
    const w = rectToWorld(r, state, camera, 0)
    // contain-fit inside the slot
    let pw = w.w
    let ph = pw / aspect
    if (ph > w.h) { ph = w.h; pw = ph * aspect }
    const y = align === 'bottom' ? w.y - w.h / 2 + ph / 2 : align === 'top' ? w.y + w.h / 2 - ph / 2 : w.y
    m.position.set(w.x, y, 0)
    m.scale.set(pw, ph, 1)
    m.material.uniforms.uResolve.value = getResolve ? getResolve() : 1
  })

  return (
    <mesh ref={ref} material={mat} renderOrder={renderOrder}>
      <planeGeometry />
    </mesh>
  )
}
