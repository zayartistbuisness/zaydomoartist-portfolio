import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'

// Stand-ins used until (or if) the Blender GLBs are present. Each is
// normalized to a ~1.0 bounding radius like the exported sculptures.

function noise3(x, y, z) {
  // Cheap smooth value noise from layered sines; enough for a molten blob.
  return (
    Math.sin(x * 1.7 + Math.sin(y * 1.3)) * 0.5 +
    Math.sin(y * 2.1 + Math.sin(z * 1.9)) * 0.3 +
    Math.sin(z * 2.7 + Math.sin(x * 2.3)) * 0.2
  )
}

function blob(seed = 0, amount = 0.28) {
  const g = new THREE.SphereGeometry(0.8, 160, 120)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = v.clone().normalize()
    const d = 1 + amount * noise3(n.x * 1.6 + seed, n.y * 1.6 - seed, n.z * 1.6 + seed * 0.5)
    v.multiplyScalar(d)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

function spikeStar(count = 14) {
  const parts = [new THREE.SphereGeometry(0.36, 64, 48)]
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const dir = new THREE.Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r).normalize()
    const len = 0.62 + ((i * 37) % 11) / 11 * 0.22
    const cone = new THREE.ConeGeometry(0.12, len, 32, 1)
    cone.translate(0, len / 2 + 0.22, 0)
    cone.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir))
    parts.push(cone)
  }
  const merged = mergeGeometries(parts.map((g) => g.toNonIndexed()))
  merged.computeVertexNormals()
  return merged
}

function filmTwist() {
  const g = new ParametricGeometry((u, v, target) => {
    const a = u * Math.PI * 2
    const twist = a * 0.5
    const w = (v - 0.5) * 0.42
    const R = 0.78
    const x = (R + w * Math.cos(twist)) * Math.cos(a)
    const z = (R + w * Math.cos(twist)) * Math.sin(a)
    const y = w * Math.sin(twist) + Math.sin(a * 2) * 0.12
    target.set(x, y, z)
  }, 240, 12)
  g.computeVertexNormals()
  return g
}

function lensElement() {
  const pts = [
    [0, -0.18], [0.35, -0.16], [0.62, -0.1], [0.74, -0.06], [0.76, -0.06],
    [0.76, 0.02], [0.84, 0.02], [0.84, 0.1], [0.78, 0.12], [0.6, 0.16], [0.3, 0.12], [0, 0.1],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const g = new THREE.LatheGeometry(pts, 128)
  g.rotateX(Math.PI / 2)
  g.computeVertexNormals()
  return g
}

export const FALLBACKS = {
  spike_star: spikeStar,
  soft_form: () => blob(0.7, 0.3),
  molten_glove: () => blob(2.1, 0.36),
  film_twist: filmTwist,
  lens_element: lensElement,
  domo_sigil: () => spikeStar(),
}

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)
const cache = new Map()

/** Resolve a form's geometry: Blender GLB if exported, else the stand-in. */
export function loadFormGeometry(name) {
  if (cache.has(name)) return cache.get(name)
  const promise = new Promise((resolve) => {
    const fallback = () => resolve({ geometry: FALLBACKS[name](), source: 'procedural' })
    loader.load(
      `/tracking/models/${name}.glb`,
      (gltf) => {
        const geos = []
        gltf.scene.updateMatrixWorld(true)
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            const g = o.geometry.clone()
            g.applyMatrix4(o.matrixWorld)
            for (const key of Object.keys(g.attributes)) if (key !== 'position' && key !== 'normal') g.deleteAttribute(key)
            geos.push(g)
          }
        })
        if (!geos.length) return fallback()
        let g = geos.length > 1 ? mergeGeometries(geos) : geos[0]
        if (!g.attributes.normal) g = mergeVertices(g)
        g.computeBoundingSphere()
        const { center, radius } = g.boundingSphere
        g.translate(-center.x, -center.y, -center.z)
        g.scale(1 / radius, 1 / radius, 1 / radius)
        if (!g.attributes.normal) g.computeVertexNormals()
        resolve({ geometry: g, source: 'blender' })
      },
      undefined,
      fallback,
    )
  })
  cache.set(name, promise)
  return promise
}
