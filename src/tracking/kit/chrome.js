import * as THREE from 'three'
import { inkify } from '../ink/inkChunk'

/**
 * Liquid-chrome physical material routed through the shared ink grid.
 * opts: { resolve (0 ink … 1 chrome), invert (1 on dark grounds), alpha }.
 * Per-frame control: mesh.material.userData.ink.uResolve.value = …
 */
export function makeChrome(opts = {}, overrides = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#f4f2ec',
    metalness: 1,
    roughness: 0.07,
    clearcoat: 0.35,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.1,
    ...overrides,
  })
  inkify(m, opts)
  return m
}
