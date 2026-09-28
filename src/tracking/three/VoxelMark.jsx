import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { inkify } from '../ink/inkChunk'

// Reads a pixel-grid logo (one flat colour per `cell` px square) into voxels.
function sampleMark(src, cell) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cols = Math.round(img.width / cell)
      const rows = Math.round(img.height / cell)
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, img.width, img.height).data
      const voxels = []
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = Math.min(img.width - 1, Math.floor((x + 0.5) * cell))
          const py = Math.min(img.height - 1, Math.floor((y + 0.5) * cell))
          const i = (py * img.width + px) * 4
          if (data[i + 3] < 128) continue
          voxels.push({ x, y, r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255 })
        }
      }
      resolve({ voxels, cols, rows })
    }
    img.onerror = reject
    img.src = src
  })
}

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeOut = (t) => 1 - (1 - t) ** 3
const easeIn = (t) => t * t * t
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t) }

/**
 * Scroll-scrubbed voxel logo. `getProgress()` returns 0..1 across its pinned
 * chapter:
 *   0.00–0.26  voxels rush in from just behind the frame and lock into place
 *   0.18–0.55  the mark resolves to true colour and turns so its depth reads
 *   0.50–0.70  it splits down the middle and swings open like doors
 *   0.66–1.00  the editorial spread behind it has the stage
 */
export default function VoxelMark({ src, cell = 6, getProgress, heightFrac = 0.62, invert = 1 }) {
  const [mark, setMark] = useState(null)
  const mesh = useRef()
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    let live = true
    sampleMark(src, cell).then((m) => live && setMark(m))
    return () => { live = false }
  }, [src, cell])

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ metalness: 0.2, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.1 })
    inkify(m, { resolve: 0, invert, alpha: 0 })
    return m
  }, [invert])

  // Per-voxel constants: grid target, scatter origin, timing, spin axis.
  const layout = useMemo(() => {
    if (!mark) return null
    const { voxels, cols, rows } = mark
    return voxels.map((v, i) => {
      const tx = v.x - cols / 2 + 0.5
      const ty = rows / 2 - v.y - 0.5
      const a = hash(i) * Math.PI * 2
      const radius = Math.max(cols, rows) * (0.55 + hash(i + 7) * 0.6)
      return {
        tx, ty,
        sx: Math.cos(a) * radius,
        sy: Math.sin(a) * radius * 0.6,
        sz: -10 - hash(i + 13) * 34,
        delay: (1 - (v.y / rows)) * 0.1 + hash(i + 3) * 0.06,
        spin: hash(i + 21) * 6 - 3,
        push: 0.5 + hash(i + 29),
      }
    })
  }, [mark])

  useEffect(() => {
    if (!mark || !mesh.current) return
    const color = new THREE.Color()
    mark.voxels.forEach((v, i) => {
      color.setRGB(v.r, v.g, v.b, THREE.SRGBColorSpace)
      mesh.current.setColorAt(i, color)
    })
    mesh.current.instanceColor.needsUpdate = true
  }, [mark])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const m = mesh.current
    if (!m || !layout) return
    const q = getProgress()
    const vp = state.viewport.getCurrentViewport(camera, [0, 0, 0])
    const unit = (vp.height * heightFrac) / Math.max(mark.rows, mark.cols * 0.8)
    const open = easeIn(smooth(0.5, 0.7, q))
    // A slow yaw plus a fixed tilt so the slab's depth reads while it holds.
    const yaw = Math.sin((q - 0.12) * Math.PI * 1.4) * 0.55
    const pitch = 0.18

    const ink = m.material.userData.ink
    ink.uInkAlpha.value = (1 - smooth(0.62, 0.7, q))
    ink.uResolve.value = smooth(0.18, 0.28, q) * (1 - smooth(0.54, 0.62, q))
    m.visible = ink.uInkAlpha.value > 0.002

    for (let i = 0; i < layout.length; i++) {
      const L = layout[i]
      const k = easeOut(clamp01((q - L.delay) / 0.14))
      const side = L.tx < 0 ? -1 : 1
      let x = L.sx + (L.tx - L.sx) * k
      let y = L.sy + (L.ty - L.sy) * k
      let z = L.sz * (1 - k)
      // Doors: each half swings out toward the camera and off-frame.
      // Hinged at the outer edges: halves slide apart and swing toward camera.
      x += side * open * (mark.cols * 1.1 + Math.abs(L.tx) * 0.6) * L.push
      z += open * (18 + Math.abs(L.tx) * 0.8) * L.push
      // Rotate the assembled grid position as one rigid slab.
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
      const rx = x * cy + z * sy
      const rz = -x * sy + z * cy
      const ry = y * cp - rz * sp
      const rz2 = y * sp + rz * cp
      dummy.position.set(rx * unit, ry * unit, rz2 * unit)
      const r = (1 - k) * L.spin + open * L.spin * 0.6
      dummy.rotation.set(r + pitch, r * 0.7 + yaw, 0)
      const s = unit * 0.92 * (k > 0.001 ? 1 : 0)
      dummy.scale.set(s, s, s * 2.6)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  if (!mark) return null
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, mark.voxels.length]} material={material} frustumCulled={false}>
      <boxGeometry />
    </instancedMesh>
  )
}
