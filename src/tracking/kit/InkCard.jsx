import { useMemo, useRef, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import { createInkPhotoMaterial } from '../ink/inkChunk'

/**
 * A photograph living in the scene: drawn through the shared ink grid and
 * resolving to the real image on hover (and/or via getResolve()).
 * Transparent PNG cut-outs keep their silhouette — no rectangles.
 *
 * props:
 *   src, width (world units; height follows the image aspect)
 *   getResolve?: () => 0..1   base resolve each frame (e.g. from scroll)
 *   hoverResolve: resolve while hovered (default 1)
 *   fadeFrom/fadeTo: uv.y band where the photo stays true (see inkChunk)
 *   invert: 1 on dark grounds
 *   onClick, ...mesh props (position, rotation, renderOrder)
 */
export default function InkCard({ src, width = 2, getResolve, hoverResolve = 1, fadeFrom, fadeTo, invert = 0, black = 0.06, white = 0.92, onClick, ...props }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const mat = useMemo(
    () => createInkPhotoMaterial(tex, { resolve: 0, invert, black, white, fadeFrom, fadeTo }),
    [tex, invert, black, white, fadeFrom, fadeTo],
  )
  const [hovered, setHovered] = useState(false)
  const anim = useRef({ r: 0 })
  const mesh = useRef()
  const aspect = tex.image.width / tex.image.height

  useFrame((_, dt) => {
    const base = getResolve ? getResolve() : 0
    const target = Math.max(base, hovered ? hoverResolve : 0)
    easing.damp(anim.current, 'r', target, hovered ? 0.18 : 0.3, dt)
    if (mesh.current) mesh.current.material.uniforms.uResolve.value = anim.current.r
  })

  return (
    <mesh
      ref={mesh}
      {...props}
      material={mat}
      scale={[width, width / aspect, 1]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = onClick ? 'pointer' : '' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
      onClick={onClick}
    >
      <planeGeometry />
    </mesh>
  )
}
