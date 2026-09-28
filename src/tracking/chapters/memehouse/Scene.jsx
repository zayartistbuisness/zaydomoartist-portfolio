import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import GroundPlane from '../../kit/GroundPlane'
import LinePlate from '../../kit/LinePlate'
import InkCard from '../../kit/InkCard'
import { getChapter } from '../../kit/chapterStore'
import { smooth } from '../../kit/space'
import VoxelMark from '../../three/VoxelMark'
import { loadFormGeometry } from '../../three/forms'
import { pointer } from '../../ink/pointer'
import {
  BASE, ID, KEYS, LAYOUT, markProgress, presenceAt, roomFocusAlpha, roomLight, scrollToStop, tourAt, trackAt,
} from './timeline'
import {
  H, U, box, buildShell, frameGeometry, makeBackingMaterial, makeBaseChrome, makeRoomMaterials, makeShadow, makeShellMaterial, roofY,
} from './house'
import { useAsset, useImageOr, useDrawn } from './assets'

const PAPER = '#E8E4DB'

/* ── Scratch (module level: no allocation per frame, no hook mutation) ── */
const TR = { i: 0, hold: true, h: 0, e: 0 }
const POSE = { tx: 0, ty: 0, tz: 0, az: 0, el: 0, fw: 1, fh: 1, hop: 0 }
const _eye = new THREE.Vector3()
const _tgt = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _view = new THREE.Matrix4()
const _shift = new THREE.Matrix4()
const _local = new THREE.Vector3()
const hover = { room: -1 }

// Where the model may sit on screen (fractions of the viewport), so the DOM
// column and captions never sit on top of the room being shown.
const SAFE_WIDE = { x0: 0.37, x1: 0.965, y0: 0.14, y1: 0.9 }
const DRIFT = 0.075

/*
 * Narrow framing (phones and portrait tablets: NARROW_MQ, reported by
 * Section as LAYOUT.on). There the DOM stacks the header on top and a
 * caption at the bottom, and the band between them changes with every caption. So
 * instead of fitting a flat box, each stop names the house-space points that
 * must stay in view (the room's cut-plane frame and plinth, or the whole
 * house) and the camera is solved to fit their perspective projection inside
 * the band that Section measures (LAYOUT).
 */
const P_HOUSE = [
  [-2.5, -0.16, -1.5], [2.5, -0.16, -1.5], [-2.5, -0.16, 1.52], [2.5, -0.16, 1.52],
  [-2.4, 2.53, -1.36], [2.4, 2.53, -1.36], [-2.4, 2.53, 1.2], [2.4, 2.53, 1.2],
  [0, 4.16, -1.36], [0, 4.16, 1.2],
]
const P_ARRIVE = P_HOUSE.map(([x, y, z]) => [x * 1.6, 2 + (y - 2) * 1.6, z * 1.6])
const mirror = (list) => list.map(([x, y, z]) => [-x, y, z])
const P_LOW_L = [[-2.26, -0.16, 1.52], [0.08, -0.16, 1.52], [-2.26, 1.62, 1.2], [0.08, 1.62, 1.2]]
const P_UP_L = [[0.08, 1.5, 1.2], [-2.2, 1.5, 1.2], [-2.4, 2.39, 1.2], [-2.4, 2.53, 1.2], [0.08, 4.16, 1.2]]
// Miami is seen from the right, so the outer wall and roof running back
// from the cut plane are in view too and must not run off the edge.
const P_UP_R = [...mirror(P_UP_L), [2.4, 2.39, -1.36], [2.4, 2.53, -1.36], [2.2, 1.5, -1.2], [0, 4.16, -1.36]]
const NARROW_PTS = [P_ARRIVE, P_HOUSE, P_LOW_L, mirror(P_LOW_L), P_UP_L, P_UP_R, P_HOUSE]
const NARROW_X = [0.045, 0.955]
const GAP_TOP = 12 // px of paper under the header copy
const GAP_BOTTOM = 16 // px above the caption rule
// Depth cap on narrow screens: the house is shrunk toward the kit camera
// (an identical projection) so it never falls behind the ground plane,
// which writes depth 16 units out.
const DMAX = 12.5
const MAX_PTS = 16
const _px = new Float32Array(MAX_PTS)
const _py = new Float32Array(MAX_PTS)
const _pz = new Float32Array(MAX_PTS)
const FIT_A = { d: 0, sx: 0, sy: 0 }
const FIT_B = { d: 0, sx: 0, sy: 0 }
const FIT_H = { d: 0, sx: 0, sy: 0 }
const _t = [0, 0, 0]
const _scale = new THREE.Matrix4()

/**
 * Smallest dolly distance d (and lateral shift sx, sy in camera space) at
 * which every point projects inside the safe rect (NDC x0..x1, y0..y1).
 * Orientation is fixed by az/el; the look-at point is t. Closed form: for
 * each axis, every pair of points bounds d from below.
 */
function fitPoints(pts, t, az, el, x0, x1, y0, y1, tx, ty, out) {
  const sa = Math.sin(az)
  const ca = Math.cos(az)
  const se = Math.sin(el)
  const ce = Math.cos(el)
  const n = Math.min(pts.length, MAX_PTS)
  for (let i = 0; i < n; i++) {
    const dx = pts[i][0] - t[0]
    const dy = pts[i][1] - t[1]
    const dz = pts[i][2] - t[2]
    _px[i] = dx * ca - dz * sa
    _py[i] = -dx * se * sa + dy * ce - dz * se * ca
    _pz[i] = dx * sa * ce + dy * se + dz * ca * ce
  }
  let d = 0.5
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      d = Math.max(
        d,
        (_px[j] - _px[i] + tx * (x1 * _pz[j] - x0 * _pz[i])) / (tx * (x1 - x0)),
        (_py[j] - _py[i] + ty * (y1 * _pz[j] - y0 * _pz[i])) / (ty * (y1 - y0)),
      )
    }
  }
  let xl = -Infinity
  let xh = Infinity
  let yl = -Infinity
  let yh = Infinity
  for (let i = 0; i < n; i++) {
    const k = d - _pz[i]
    xl = Math.max(xl, x0 * k * tx - _px[i])
    xh = Math.min(xh, x1 * k * tx - _px[i])
    yl = Math.max(yl, y0 * k * ty - _py[i])
    yh = Math.min(yh, y1 * k * ty - _py[i])
  }
  out.d = d
  out.sx = (xl + xh) / 2
  out.sy = (yl + yh) / 2
  return out
}

/** Top of key i's caption (CSS px); key 0 (arrival) shares the first. */
const capTop = (i, H) => LAYOUT.caps[Math.max(0, i - 1)] || H * 0.66

/** Fit `pts` in the band from the header down to a caption top (px → NDC). */
function fitBand(pts, cap, az, el, t, H, tx, ty, out) {
  const top = LAYOUT.top + GAP_TOP
  const bottom = Math.max(top + H * 0.12, cap - GAP_BOTTOM)
  return fitPoints(
    pts, t, az, el,
    2 * NARROW_X[0] - 1, 2 * NARROW_X[1] - 1, 1 - (2 * bottom) / H, 1 - (2 * top) / H,
    tx, ty, out,
  )
}

const lerp = (a, b, t) => a + (b - a) * t
const RESOLVE = [0, 1, 2, 3].map((r) => () => U.room[r].value)

function poseAt(tr, out) {
  const a = KEYS[tr.i]
  if (tr.hold) {
    out.tx = a.t[0]
    out.ty = a.t[1]
    out.tz = a.t[2]
    out.az = a.az + (tr.h - 0.5) * DRIFT
    out.el = a.el
    out.fw = a.fw
    out.fh = a.fh
    out.hop = 0
    return out
  }
  const b = KEYS[tr.i + 1]
  const e = tr.e
  out.tx = lerp(a.t[0], b.t[0], e)
  out.ty = lerp(a.t[1], b.t[1], e)
  out.tz = lerp(a.t[2], b.t[2], e)
  out.az = lerp(a.az + DRIFT / 2, b.az - DRIFT / 2, e)
  out.el = lerp(a.el, b.el, e)
  out.fw = lerp(a.fw, b.fw, e)
  out.fh = lerp(a.fh, b.fh, e)
  // Dolly out a little between rooms, then push in: orbit plus push-in.
  out.hop = tr.i === 0 ? 0 : Math.sin(Math.PI * e)
  return out
}

function roomAt(point, group) {
  _local.copy(point)
  group.worldToLocal(_local)
  return (_local.x < 0 ? 0 : 1) + (_local.y > H.FLOOR1 - 0.03 ? 2 : 0)
}

const fromLink = (e) => !!e.nativeEvent?.target?.closest?.('a, button')

/* ── Pieces ─────────────────────────────────────────────────────────── */

/** A picture in the architecture: InkCard with an optional mat and frame. */
function Framed({ src, mats, room, maxW, maxH, frame = 'ink', mat = 0.045, border = 0.022, depth = 0.03, matDepth = 0.008, position, rotation }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const aspect = tex.image.width / tex.image.height
  const w = Math.min(maxW, maxH * aspect)
  const h = w / aspect
  const frameGeo = useMemo(
    () => (frame ? frameGeometry(w + 2 * mat, h + 2 * mat, border, depth) : null),
    [frame, w, h, mat, border, depth],
  )
  useEffect(() => () => frameGeo?.dispose(), [frameGeo])
  const ref = useRef()
  useFrame(() => {
    const g = ref.current
    const card = g && g.children[g.children.length - 1]
    if (card?.material?.uniforms) card.material.uniforms.uInkAlpha.value = U.alpha[room].value
  })
  const focus = (e) => {
    if (fromLink(e)) return
    e.stopPropagation()
    scrollToStop(room + 1)
  }
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {frameGeo && <mesh geometry={frameGeo} material={frame === 'chrome' ? mats.chrome : mats.ink} renderOrder={-2} />}
      {mat > 0 && (
        <mesh position={[0, 0, matDepth / 2]} material={mats.white} renderOrder={-2}>
          <boxGeometry args={[w + 2 * mat, h + 2 * mat, matDepth]} />
        </mesh>
      )}
      <InkCard src={src} width={w} position={[0, 0, matDepth + 0.006]} getResolve={RESOLVE[room]} onClick={focus} renderOrder={-1} />
    </group>
  )
}

/** A monitor: an ink body with the card as its face. */
function Screen({ src, mats, room, width, position, rotation, stand = 0, bezel = 0.028, cross = false }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const h = width / (tex.image.width / tex.image.height)
  const ref = useRef()
  useFrame(() => {
    const g = ref.current
    const card = g && g.children[g.children.length - 1]
    if (card?.material?.uniforms) card.material.uniforms.uInkAlpha.value = U.alpha[room].value
  })
  const focus = (e) => {
    if (fromLink(e)) return
    e.stopPropagation()
    scrollToStop(room + 1)
  }
  const d = 0.04
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {stand > 0 && (
        <>
          <mesh position={[0, -stand / 2 - h / 2, -d / 2]} material={mats.chrome} renderOrder={-2}>
            <boxGeometry args={[0.022, stand, 0.022]} />
          </mesh>
          <mesh position={[0, -stand - h / 2 + 0.006, -d / 2]} material={mats.chrome} renderOrder={-2}>
            <boxGeometry args={[0.3, 0.012, 0.22]} />
          </mesh>
        </>
      )}
      <mesh position={[0, 0, -d / 2]} material={mats.ink} renderOrder={-2}>
        <boxGeometry args={[width + bezel * 2, h + bezel * 2, d]} />
      </mesh>
      {cross && (
        <>
          <mesh position={[0, 0, 0.008]} material={mats.ink} renderOrder={-2}>
            <boxGeometry args={[0.012, h, 0.004]} />
          </mesh>
          <mesh position={[0, 0, 0.008]} material={mats.ink} renderOrder={-2}>
            <boxGeometry args={[width, 0.012, 0.004]} />
          </mesh>
        </>
      )}
      <InkCard src={src} width={width} position={[0, 0, 0.003]} getResolve={RESOLVE[room]} onClick={focus} renderOrder={-1} />
    </group>
  )
}

function Lamp({ room, geometry, material }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) ref.current.material.emissiveIntensity = U.lamps.value.getComponent(room) * 1.6
  })
  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={-2} />
}

/** The MemeHouse index artifact (soft_form) on a plinth in the Miami room. */
function Sculpture({ mats, position }) {
  const [geo, setGeo] = useState(null)
  const ref = useRef()
  useEffect(() => {
    let live = true
    loadFormGeometry('soft_form').then((r) => live && setGeo(r.geometry))
    return () => { live = false }
  }, [])
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.18
  })
  return (
    <group position={position}>
      <mesh position={[0, 0.23, 0]} material={mats.white} renderOrder={-2}>
        <boxGeometry args={[0.34, 0.46, 0.34]} />
      </mesh>
      {geo && <mesh ref={ref} geometry={geo} material={mats.chrome} position={[0, 0.72, 0]} scale={0.25} rotation-x={0.35} renderOrder={-2} />}
    </group>
  )
}

/* Drawn cards use the site's own type; the coast plate falls back to a
   tonal stand-in; event photos appear once they exist (no stand-in). */
function Card({ drawn, children }) {
  const url = useDrawn(drawn)
  if (!url) return null
  return <Suspense fallback={null}>{children(url)}</Suspense>
}
function Photo({ file, fallback, children }) {
  const url = useImageOr(BASE + file, fallback)
  if (!url) return null
  return <Suspense fallback={null}>{children(url)}</Suspense>
}
function EventPhoto({ file, children }) {
  const url = useAsset(`${BASE}event/${file}`)
  if (!url) return null
  return <Suspense fallback={null}>{children(url)}</Suspense>
}

function Rooms({ kit }) {
  const { BACK, BACK_IN, IN, FLOOR0, FLOOR1 } = H
  const [r0, r1, r2, r3] = kit.rooms
  const [x0, x1, y0, y1] = H.WIN
  return (
    <>
      {/* 01 · The Debut: the calendar, and the stream room on the monitor
          (Isaac Francis / Twitch clip, Nov 26, 2025). */}
      <Card drawn="debutDays">
        {(src) => <Framed src={src} mats={r0} room={0} maxW={1.02} maxH={0.8} position={[-1.34, 0.86, BACK_IN]} />}
      </Card>
      <EventPhoto file="the-debut-stream-set.webp">
        {(src) => <Screen src={src} mats={r0} room={0} width={0.64} stand={0.46} position={[-1.66, FLOOR0 + 0.46 + 0.18, 0.42]} rotation={[0, 0.62, 0]} />}
      </EventPhoto>

      {/* 02 · Capaholics: the launch party on the wall screen (DDG Live,
          Oct 2, 2025); the TwitchCon DJ booth framed (Net Influencer). */}
      <EventPhoto file="capaholics-launch-party.webp">
        {(src) => <Screen src={src} mats={r1} room={1} width={1.08} position={[1.33, 0.84, BACK_IN + 0.04]} />}
      </EventPhoto>
      <EventPhoto file="twitchcon-dj-booth.webp">
        {(src) => <Framed src={src} mats={r1} room={1} maxW={0.5} maxH={0.66} position={[IN, 0.84, 0.28]} rotation={[0, -Math.PI / 2, 0]} />}
      </EventPhoto>

      {/* 03 · The studio: MemeHouse LA's own TwitchCon weekend photographs. */}
      <EventPhoto file="twitchcon-stream-desk.webp">
        {(src) => <Framed src={src} mats={r2} room={2} frame={null} mat={0.035} matDepth={0.03} maxW={0.72} maxH={0.84} position={[-1.52, 2.16, BACK_IN]} />}
      </EventPhoto>
      <EventPhoto file="twitchcon-videographer.webp">
        {(src) => <Framed src={src} mats={r2} room={2} frame={null} mat={0.035} matDepth={0.03} maxW={0.72} maxH={0.84} position={[-0.7, 2.16, BACK_IN]} />}
      </EventPhoto>
      <EventPhoto file="twitchcon-camera-table.webp">
        {(src) => <Framed src={src} mats={r2} room={2} maxW={0.6} maxH={0.66} position={[-IN, 2.06, 0.3]} rotation={[0, Math.PI / 2, 0]} />}
      </EventPhoto>

      {/* 04 · Art Basel / Miami: the coast through the picture window */}
      <Photo file="plate_miami_coast.webp" fallback="pendingCoast">
        {(src) => <Framed src={src} mats={r3} room={3} frame={null} mat={0} maxW={1.72} maxH={1.15} position={[(x0 + x1) / 2, (y0 + y1) / 2 + 0.02, BACK - 0.12]} />}
      </Photo>
      <mesh geometry={kit.windowGeo} material={r3.chrome} renderOrder={-2} />
      <Card drawn="miamiScreen">
        {(src) => <Screen src={src} mats={r3} room={3} width={0.78} position={[H.T / 2 + 0.022, 2.2, 0.05]} rotation={[0, Math.PI / 2, 0]} />}
      </Card>
      <Sculpture mats={r3} position={[1.84, FLOOR1, 0.98]} />

      {kit.lampGeos.map((g, r) => (
        <Lamp key={r} room={r} geometry={g} material={kit.rooms[r].lamp} />
      ))}
    </>
  )
}

function createKit() {
  const { BACK, BACK_IN, CEIL0, PITCH } = H
  const [x0, x1, y0, y1] = H.WIN
  const b = 0.03
  const windowGeo = mergeBoxes([
    box(x0, x0 + b, y0, y1, BACK, BACK_IN), // jambs
    box(x1 - b, x1, y0, y1, BACK, BACK_IN),
    box(x0, x1, y1 - b, y1, BACK, BACK_IN), // head
    box(x0 - 0.03, x1 + 0.03, y0 - 0.025, y0 + 0.005, BACK, BACK_IN + 0.07), // sill
    box((x0 + x1) / 2 - 0.012, (x0 + x1) / 2 + 0.012, y0, y1, BACK + 0.03, BACK_IN - 0.03), // mullion
  ])
  const ceilingStrip = (cx) => box(cx - 0.035, cx + 0.035, CEIL0 - 0.02, CEIL0, -0.95, 0.9)
  const slopeStrip = (side) => {
    const g = new THREE.BoxGeometry(0.075, 0.02, 1.85)
    g.rotateZ(-side * PITCH)
    g.translate(side * 1.15, roofY(1.15) - 0.014 / Math.cos(PITCH), -0.05)
    return g
  }
  return {
    shellGeo: buildShell(),
    shellMat: makeShellMaterial(),
    backingMat: makeBackingMaterial(),
    baseGeo: box(-2.5, 2.5, -0.16, -0.022, -1.5, 1.52),
    baseMat: makeBaseChrome(),
    shadow: makeShadow(),
    windowGeo,
    lampGeos: [ceilingStrip(-1.075), ceilingStrip(1.075), slopeStrip(-1), slopeStrip(1)],
    rooms: [0, 1, 2, 3].map(makeRoomMaterials),
  }
}

function mergeBoxes(list) {
  const g = new THREE.BufferGeometry()
  let n = 0
  list.forEach((p) => { n += p.attributes.position.count })
  const pos = new Float32Array(n * 3)
  const nor = new Float32Array(n * 3)
  let o = 0
  list.forEach((p) => {
    pos.set(p.attributes.position.array, o * 3)
    nor.set(p.attributes.normal.array, o * 3)
    o += p.attributes.position.count
    p.dispose()
  })
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  return g
}

function disposeKit(kit) {
  kit.shellGeo.dispose()
  kit.shellMat.dispose()
  kit.backingMat.dispose()
  kit.baseGeo.dispose()
  kit.baseMat.dispose()
  kit.shadow.tex.dispose()
  kit.shadow.mat.dispose()
  kit.windowGeo.dispose()
  kit.lampGeos.forEach((g) => g.dispose())
  kit.rooms.forEach((m) => Object.values(m).forEach((x) => x.dispose()))
}

/* ── The house, flown by a virtual camera ───────────────────────────── */

function House() {
  const [kit] = useState(createKit)
  useEffect(() => () => disposeKit(kit), [kit])
  const [lightTarget] = useState(() => new THREE.Object3D())
  const group = useRef()
  const model = useRef()
  const sun = useRef()
  const backing = useRef()
  const lean = useRef({ x: 0, y: 0 })

  useFrame((state, dt) => {
    const g = group.current
    if (!g || !model.current) return
    const c = getChapter(ID)
    const p = c.progress
    const presence = presenceAt(p)
    const on = c.visible && presence > 0.002
    model.current.visible = on
    U.presence.value = presence
    if (sun.current) sun.current.intensity = on ? 0.95 * presence : 0
    if (!on) return

    // Rooms light up as the camera reaches them; a hovered room glows a little.
    trackAt(p, TR)
    let lit = 0
    for (let r = 0; r < 4; r++) {
      const v = roomLight(r, TR)
      const a = roomFocusAlpha(r, TR, p)
      U.room[r].value = v
      U.alpha[r].value = a * presence
      U.alphas.value.setComponent(r, a)
      lit = Math.max(lit, v)
      U.lamps.value.setComponent(r, Math.max(v, hover.room === r ? 0.45 : 0))
    }
    U.rooms.value.set(U.room[0].value, U.room[1].value, U.room[2].value, U.room[3].value)
    U.base.value = lit
    U.baseAlpha.value = presence * (1 - 0.75 * tourAt(p))
    if (backing.current) backing.current.material.opacity = presence

    // Virtual camera pose in house space, with a little cursor parallax.
    poseAt(TR, POSE)
    const l = lean.current
    const px = pointer.active && !pointer.touch ? (pointer.x / state.size.width) * 2 - 1 : 0
    const py = pointer.active && !pointer.touch ? (pointer.y / state.size.height) * 2 - 1 : 0
    easing.damp(l, 'x', px, 0.6, dt)
    easing.damp(l, 'y', py, 0.6, dt)
    const az = POSE.az + l.x * 0.07
    const el = POSE.el - l.y * 0.035

    // Solve the dolly distance so the framed box fits the layout's safe area.
    const cam = state.camera
    const W = state.size.width
    const Hpx = state.size.height
    const aspect = W / Hpx
    const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
    const hop = 1 + POSE.hop * 0.3
    // One switch with the CSS: the same media query sets LAYOUT.on.
    const narrow = LAYOUT.on
    let dist
    if (narrow) {
      // Narrow: fit this stop's points between header and caption. Mid-move,
      // both ends are fitted from the current angle and blended, and the
      // dolly pulls back to the whole house (a room close-up at half-way
      // would spill under the copy).
      const tx = tanH * aspect
      const a = TR.i
      _t[0] = POSE.tx
      _t[1] = POSE.ty
      _t[2] = POSE.tz
      fitBand(NARROW_PTS[a], capTop(a, Hpx), POSE.az, POSE.el, _t, Hpx, tx, tanH, FIT_A)
      if (!TR.hold) {
        const e = TR.e
        const cap = lerp(capTop(a, Hpx), capTop(a + 1, Hpx), e)
        fitBand(NARROW_PTS[a + 1], capTop(a + 1, Hpx), POSE.az, POSE.el, _t, Hpx, tx, tanH, FIT_B)
        fitBand(P_HOUSE, cap, POSE.az, POSE.el, _t, Hpx, tx, tanH, FIT_H)
        const h = POSE.hop
        FIT_A.d = lerp(lerp(FIT_A.d, FIT_B.d, e), Math.max(FIT_H.d, lerp(FIT_A.d, FIT_B.d, e)), h)
        FIT_A.sx = lerp(lerp(FIT_A.sx, FIT_B.sx, e), FIT_H.sx, h)
        FIT_A.sy = lerp(lerp(FIT_A.sy, FIT_B.sy, e), FIT_H.sy, h)
      }
      dist = FIT_A.d
      _shift.makeTranslation(FIT_A.sx, FIT_A.sy, 0)
    } else {
      const S = SAFE_WIDE
      const fit = Math.max(POSE.fh / (2 * tanH * (S.y1 - S.y0)), POSE.fw / (2 * tanH * aspect * (S.x1 - S.x0)))
      dist = fit * hop
      const visH = 2 * dist * tanH
      _shift.makeTranslation(((S.x0 + S.x1) / 2 - 0.5) * visH * aspect, (0.5 - (S.y0 + S.y1) / 2) * visH, 0)
    }
    _tgt.set(POSE.tx, POSE.ty, POSE.tz)
    _eye.set(
      POSE.tx + dist * Math.sin(az) * Math.cos(el),
      POSE.ty + dist * Math.sin(el),
      POSE.tz + dist * Math.cos(az) * Math.cos(el),
    )
    _view.lookAt(_eye, _tgt, _up).setPosition(_eye).invert()

    // The kit camera never moves; the house is placed where it would appear
    // from the virtual camera: world = camera · shift · view⁻¹.
    cam.updateMatrixWorld()
    g.matrix.copy(cam.matrixWorld)
    // Narrow screens dolly far out for the wide shots; scale the house toward
    // the camera instead (same picture) so it stays in front of the ground.
    if (narrow && dist > DMAX) {
      const k = DMAX / dist
      g.matrix.multiply(_scale.makeScale(k, k, k))
    }
    g.matrix.multiply(_shift).multiply(_view)
    g.matrixWorldNeedsUpdate = true
  })

  const onMove = (e) => {
    if (fromLink(e)) return
    hover.room = roomAt(e.point, group.current)
    document.body.style.cursor = 'pointer'
  }
  const onOut = () => {
    hover.room = -1
    document.body.style.cursor = ''
  }
  const onClick = (e) => {
    if (fromLink(e)) return
    e.stopPropagation()
    scrollToStop(roomAt(e.point, group.current) + 1)
  }

  return (
    <group ref={group} matrixAutoUpdate={false}>
      <primitive object={lightTarget} position={[0, 1.4, -0.4]} />
      <directionalLight ref={sun} position={[-3.2, 6.5, 5.5]} intensity={0} target={lightTarget} />
      <group ref={model} visible={false}>
        <mesh material={kit.shadow.mat} position={[0.25, -0.17, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[7.6, 4.8, 1]} renderOrder={-4.5}>
          <planeGeometry />
        </mesh>
        <mesh ref={backing} geometry={kit.shellGeo} material={kit.backingMat} renderOrder={-4} />
        <mesh
          geometry={kit.shellGeo}
          material={kit.shellMat}
          renderOrder={-3}
          onPointerMove={onMove}
          onPointerOut={onOut}
          onClick={onClick}
        />
        <mesh geometry={kit.baseGeo} material={kit.baseMat} renderOrder={-3} />
        <Rooms kit={kit} />
      </group>
    </group>
  )
}

/* ── Mark and plate ─────────────────────────────────────────────────── */

function Mark() {
  const size = useThree((s) => s.size)
  const ref = useRef()
  const key = useRef()
  useFrame(() => {
    const c = getChapter(ID)
    const on = c.visible && c.progress < 0.235
    if (ref.current) ref.current.visible = on
    // A soft frontal key while the mark holds, so its faces read as the
    // brand's true mint rather than the env's shadowed green.
    const q = markProgress()
    if (key.current) key.current.intensity = on ? 2.1 * smooth(0.16, 0.26, q) * (1 - smooth(0.6, 0.7, q)) : 0
  })
  const aspect = size.width / size.height
  return (
    <>
      <directionalLight ref={key} position={[1.5, 2.5, 10]} intensity={0} />
      <group ref={ref}>
        <VoxelMark src={`${BASE}mh-mark.png`} cell={6} getProgress={markProgress} heightFrac={Math.min(0.6, 0.8 * aspect)} invert={0} />
      </group>
    </>
  )
}

// The coast plate stays faint behind the house and comes forward in Miami.
function plateAlpha(p) {
  trackAt(p, TR)
  const miami = roomLight(3, TR)
  const tour = smooth(0.27, 0.32, p) * (1 - smooth(0.82, 0.88, p))
  return presenceAt(p) * (0.17 - 0.07 * tour + 0.24 * miami * tour)
}

function Plate() {
  const url = useImageOr(`${BASE}plate_miami_coast.webp`, 'pendingCoast')
  const ref = useRef()
  useFrame(() => {
    const m = ref.current?.children[0]
    if (m?.material?.uniforms) m.material.uniforms.uInkAlpha.value = plateAlpha(getChapter(ID).progress)
  })
  if (!url) return null
  return (
    <group ref={ref}>
      <Suspense fallback={null}>
        <LinePlate id={ID} src={url} invert={0} z={-4} drift={0.9} black={0.0} white={0.46} opacity={0} />
      </Suspense>
    </group>
  )
}

/** Bounce from below so ceilings stay plaster, not soot. World-space, so it
 *  lives outside the flown group; only on while this chapter is on screen. */
function Fill() {
  const ref = useRef()
  // Lights never toggle `visible` (that changes light counts and recompiles
  // every material); they fade through intensity instead.
  useFrame(() => {
    if (ref.current) ref.current.intensity = getChapter(ID).visible ? 0.9 * U.presence.value : 0
  })
  return <hemisphereLight ref={ref} args={['#f4f1ea', '#c9c4ba', 0]} />
}

import StageFollow from '../../kit/StageFollow'

export default function Scene() {
  return (
    <>
      <GroundPlane id={ID} color={PAPER} />
      <Plate />
      <StageFollow id={ID}>
        <Fill />
        <House />
        <Mark />
      </StageFollow>
    </>
  )
}
