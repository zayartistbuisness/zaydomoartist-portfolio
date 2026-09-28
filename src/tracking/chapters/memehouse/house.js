import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createInkPhotoMaterial, inkify } from '../../ink/inkChunk'
import { makeChrome } from '../../kit/chrome'

/*
 * The house: an architect's section model. Two storeys under a gable whose
 * pitch echoes the MemeHouse mark, cut open along the front plane so the
 * four rooms read like a drawing. Units are "house units"; y is up, the cut
 * plane faces +z, and the model sits on its plinth at y = 0.
 */
const T = 0.1
const HALF = 2.2
const PITCH = (34 * Math.PI) / 180
const TAN = Math.tan(PITCH)
export const H = {
  T,
  HALF,
  IN: HALF - T, // inner face of the outer walls
  BACK: -1.2,
  BACK_IN: -1.2 + T,
  FRONT: 1.2,
  FLOOR0: T,
  CEIL0: 1.5,
  FLOOR1: 1.5 + T,
  EAVE: 2.5,
  PITCH,
  TAN,
  RIDGE: 2.5 + HALF * TAN, // roof underside at the ridge line
  // Picture window in the back wall of room 4 (x0, x1, y0, y1).
  WIN: [0.5, 1.56, 1.92, 2.66],
}

/** Roof underside height at |x| = ax. */
export const roofY = (ax) => H.EAVE + (H.HALF - ax) * H.TAN

/*
 * Shared, render-free uniforms. Every material in the house references these
 * objects, so one write per frame drives the whole model (and no hook value
 * is ever mutated).
 */
export const U = {
  presence: { value: 0 },
  room: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }], // resolve per room
  alpha: [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }], // ink alpha per room
  base: { value: 0 },
  baseAlpha: { value: 0 },
  rooms: { value: new THREE.Vector4() },
  lamps: { value: new THREE.Vector4() },
  alphas: { value: new THREE.Vector4() },
}

export function box(x0, x1, y0, y1, z0, z1) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return g.toNonIndexed()
}

/** A slab lying under one roof slope; side = -1 (left) or 1 (right). */
function roofSlab(side, overhang, back, front) {
  const e = 0.07
  const len = (HALF + overhang + e) / Math.cos(PITCH)
  const g = new THREE.BoxGeometry(len, T, front - back)
  // Span [-len, 0] (left) or [0, len] (right) with the underside on y = 0,
  // tilt to the pitch, then hang the ridge end just past the centre line.
  g.translate((side * len) / 2, T / 2, (back + front) / 2)
  g.rotateZ(-side * PITCH)
  g.translate(-side * e, H.RIDGE + e * TAN, 0)
  return g.toNonIndexed()
}

function backWall() {
  const s = new THREE.Shape()
  s.moveTo(-HALF, T)
  s.lineTo(HALF, T)
  s.lineTo(HALF, H.EAVE)
  s.lineTo(0, H.RIDGE)
  s.lineTo(-HALF, H.EAVE)
  s.closePath()
  const [x0, x1, y0, y1] = H.WIN
  const hole = new THREE.Path()
  hole.moveTo(x0, y0)
  hole.lineTo(x0, y1)
  hole.lineTo(x1, y1)
  hole.lineTo(x1, y0)
  hole.closePath()
  s.holes.push(hole)
  // three r175 builds no lid faces when bevelEnabled is false (the contour is
  // only collected inside the bevel loop), so use a zero-size single bevel.
  const g = new THREE.ExtrudeGeometry(s, {
    depth: T,
    bevelEnabled: true,
    bevelThickness: 0,
    bevelSize: 0,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments: 1,
  })
  g.translate(0, 0, H.BACK)
  return g
}

function strip(g) {
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k)
  return g
}

/**
 * The white shell as one geometry. Faces lying on the cut plane get ink
 * vertex colour: the poché of a section drawing.
 */
export function buildShell() {
  const { IN, BACK, BACK_IN, FRONT, CEIL0, FLOOR1, EAVE, RIDGE } = H
  const parts = [
    box(-HALF, HALF, 0, T, BACK, FRONT), // ground slab
    box(-IN, IN, CEIL0, FLOOR1, BACK_IN, FRONT), // first floor
    box(-HALF, -IN, T, EAVE + T * TAN, BACK_IN, FRONT), // outer walls
    box(IN, HALF, T, EAVE + T * TAN, BACK_IN, FRONT),
    box(-T / 2, T / 2, T, CEIL0, BACK_IN, FRONT), // party wall, ground
    box(-T / 2, T / 2, FLOOR1, RIDGE + 0.02, BACK_IN, FRONT), // party wall, attic
    backWall(),
    roofSlab(-1, 0.16, BACK - 0.16, FRONT),
    roofSlab(1, 0.16, BACK - 0.16, FRONT),
    box(-2.46, 2.46, -0.022, 0, -1.46, 1.48), // model base board
  ].map(strip)
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  const pos = g.attributes.position
  const nor = g.attributes.normal
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const cut = nor.getZ(i) > 0.9 && pos.getZ(i) > FRONT - 0.002
    const floor = nor.getY(i) > 0.9
    const c = cut ? 0.012 : floor ? 0.86 : 1
    col[i * 3] = c
    col[i * 3 + 1] = c
    col[i * 3 + 2] = c
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.computeBoundingSphere()
  return g
}

const f = (v) => v.toFixed(4)

/*
 * Shell shader additions (layered on the shared ink patch):
 * - vHP: position pushed out along its normal, in house space. It decides
 *   which room a face belongs to and gives a cheap analytic ambient occlusion
 *   (distance from the pushed point to the room's other planes).
 * - Rooms are dim until lit; the lit room brightens and resolves to real.
 */
const PUSH = 0.28
const SHELL_HEAD = /* glsl */ `
varying vec3 vHP;
uniform vec4 uRooms;
uniform vec4 uLamps;
uniform vec4 uAlphas;
float mhRoom(vec4 v, vec3 p) {
  float right = step(0.0, p.x);
  float upper = step(${f(H.FLOOR1 - 0.03)}, p.y);
  return mix(mix(v.x, v.y, right), mix(v.z, v.w, right), upper);
}
float mhSoft(float d) { return mix(0.5, 1.0, smoothstep(0.0, ${f(PUSH * 1.05)}, d)); }
vec2 mhInterior(vec3 p) {
  float ax = abs(p.x);
  float upper = step(${f(H.FLOOR1 - 0.03)}, p.y);
  float dSide = ${f(H.IN)} - ax;
  float dPart = ax - ${f(T / 2)};
  float dFloor = p.y - mix(${f(H.FLOOR0)}, ${f(H.FLOOR1)}, upper);
  float dCeil = mix(${f(H.CEIL0)} - p.y, 99.0, upper);
  float dRoof = mix(99.0, (${f(H.EAVE)} + (${f(HALF)} - ax) * ${f(TAN)} - p.y) * ${f(Math.cos(PITCH))}, upper);
  float dBack = p.z - ${f(H.BACK_IN)};
  float inside = step(0.0, min(min(min(dSide, dPart), min(dFloor, dCeil)), min(dRoof, dBack))) * step(p.z, ${f(H.FRONT)});
  float ao = mhSoft(dSide) * mhSoft(dPart) * mhSoft(dFloor) * mhSoft(dCeil) * mhSoft(dRoof) * mhSoft(dBack);
  return vec2(inside, mix(1.0, ao, inside));
}
`

export function makeShellMaterial() {
  const m = new THREE.MeshStandardMaterial({
    color: '#f2efe9',
    roughness: 0.82,
    metalness: 0,
    vertexColors: true,
    envMapIntensity: 0.95,
  })
  const ink = inkify(m, { resolve: 1, invert: 0, alpha: 0 })
  ink.uInkAlpha = U.presence
  const inkCompile = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    inkCompile(shader, renderer)
    shader.uniforms.uRooms = U.rooms
    shader.uniforms.uLamps = U.lamps
    shader.uniforms.uAlphas = U.alphas
    shader.vertexShader = `varying vec3 vHP;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n  vHP = position + normalize(normal) * ${f(PUSH)};`,
    )
    const resolveFn = 'float inkResolveAt(vec2 frag) { return inkResolveWith(frag, uResolve); }'
    if (import.meta.env.DEV && !shader.fragmentShader.includes(resolveFn)) {
      console.warn('[memehouse] ink chunk changed: per-room resolve patch did not apply')
    }
    const lumLine = 'float inkLum = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));'
    shader.fragmentShader = `${SHELL_HEAD}\n${shader.fragmentShader}`
      .replace(resolveFn, 'float inkResolveAt(vec2 frag) { return inkResolveWith(frag, uResolve * mhRoom(uRooms, vHP)); }')
      // Draw the white model lightly: lift midtones for the line pass only,
      // so walls read as a pen drawing and hatching gathers in corners.
      .replace(lumLine, `${lumLine}\n          inkLum = 1.0 - pow(1.0 - inkLum, 1.7);`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        {
          vec2 mhIn = mhInterior(vHP);
          float lamp = mhRoom(uLamps, vHP);
          gl_FragColor.rgb *= mhIn.y * mix(1.0, mix(0.7, 1.0, lamp), mhIn.x);
          // Rooms out of focus fall back to faint lines on the paper backing.
          gl_FragColor.a *= mhRoom(uAlphas, vHP);
        }`,
      )
  }
  m.customProgramCacheKey = () => 'ink-v1-mh-shell'
  return m
}

/** Opaque paper under the inked shell, so line gaps never show the plate. */
export function makeBackingMaterial() {
  return new THREE.MeshBasicMaterial({
    color: '#ece9e2',
    transparent: true,
    opacity: 0,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

function bind(m, r) {
  const ink = inkify(m, { resolve: 0, invert: 0, alpha: 0 })
  ink.uResolve = U.room[r]
  ink.uInkAlpha = U.alpha[r]
  return m
}

/** Per-room materials: resolve and fade with their room. */
export function makeRoomMaterials(r) {
  const chrome = makeChrome({ resolve: 0, alpha: 0 })
  chrome.userData.ink.uResolve = U.room[r]
  chrome.userData.ink.uInkAlpha = U.alpha[r]
  return {
    chrome,
    ink: bind(new THREE.MeshStandardMaterial({ color: '#161615', roughness: 0.38, metalness: 0.2 }), r),
    white: bind(new THREE.MeshStandardMaterial({ color: '#f1eee8', roughness: 0.78 }), r),
    lamp: bind(new THREE.MeshStandardMaterial({ color: '#cfccc5', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.4 }), r),
  }
}

/** Base chrome: the plinth band under the model. */
export function makeBaseChrome() {
  const m = makeChrome({ resolve: 0, alpha: 0 }, { roughness: 0.12 })
  m.userData.ink.uResolve = U.base
  m.userData.ink.uInkAlpha = U.baseAlpha
  return m
}

/**
 * Contact shadow under the base, drawn by the ink as hatching (never a
 * grey blur): a soft footprint rendered to a small canvas.
 */
export function makeShadow() {
  const W = 512
  const Hh = 320
  const c = document.createElement('canvas')
  c.width = W
  c.height = Hh
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, Hh)
  ctx.filter = 'blur(22px)'
  ctx.fillStyle = '#5a5854'
  ctx.fillRect(W * 0.14, Hh * 0.2, W * 0.72, Hh * 0.6)
  ctx.filter = 'blur(8px)'
  ctx.fillStyle = '#2a2927'
  ctx.fillRect(W * 0.2, Hh * 0.3, W * 0.6, Hh * 0.42)
  const tex = new THREE.CanvasTexture(c)
  const mat = createInkPhotoMaterial(tex, { resolve: 0, invert: 0, alpha: 0, black: 0.1, white: 0.95 })
  mat.uniforms.uInkAlpha = U.baseAlpha
  return { tex, mat }
}

/** A rectangular frame (border only) of inner size w×h, standing on z = 0. */
export function frameGeometry(w, h, border, depth) {
  const x = w / 2 + border / 2
  const y = h / 2 + border / 2
  const parts = [
    box(-w / 2 - border, w / 2 + border, y - border / 2, y + border / 2, 0, depth),
    box(-w / 2 - border, w / 2 + border, -y - border / 2, -y + border / 2, 0, depth),
    box(-x - border / 2, -x + border / 2, -h / 2, h / 2, 0, depth),
    box(x - border / 2, x + border / 2, -h / 2, h / 2, 0, depth),
  ]
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}
