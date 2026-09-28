import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { easing } from 'maath'
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff?url'
import GroundPlane from '../../kit/GroundPlane'
import LinePlate from '../../kit/LinePlate'
import InkCard from '../../kit/InkCard'
import { getChapter } from '../../kit/chapterStore'
import VoxelMark from '../../three/VoxelMark'
import { createInkPhotoMaterial } from '../../ink/inkChunk'
import { ID, ASSETS, MOMENTS } from './moments'
import { MARK_END, TL, DEG, sweepAt, smooth, clamp01 } from './timeline'
import { radar, setRadar, shownIndex, useImageReady } from './radarStore'
import { makeScopeMaterial, R_IN, EXT } from './scopeMaterial'
import { makeTypeTexture } from './typeCard'

const GROUND = '#0e0f0e'
const BONE = '#E8E4DB'
const TILT = -1.0 // the table, seen from the chair
// radar-mark.png grid, and the logo ring in grid units (see build-mark.py).
const GRID = { cols: 120, rows: 56, cx: -0.308, cy: 0.462, outer: 44.615 }
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Per-frame state shared by the parts of the scene. Written by the director
// (priority -1), read by everything else; never triggers React renders.
const F = {
  p: 0,
  visible: false,
  narrow: false,
  sweep: -168 * DEG,
  cw: 1,
  speed: 0,
  sweepOn: 0,
  morph: 0,
  S: 2,
  pos: new THREE.Vector3(),
  rot: new THREE.Euler(),
  scale: 1,
  band: 0.04,
  blips: MOMENTS.map(() => new THREE.Vector3()),
  bright: MOMENTS.map(() => 0),
  mark: MOMENTS.map(() => 0),
  pingAt: MOMENTS.map(() => -99),
  time: 0,
}
const ORIGIN = new THREE.Vector3()
const _pose = new THREE.Object3D()
const _off = new THREE.Vector3()
const _eul = new THREE.Euler()
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t) => 1 - (1 - t) ** 3
const lerp = THREE.MathUtils.lerp
// Contact positions on the scope, in bezel units (computed once).
const BLIP = MOMENTS.map((m) => [Math.sin(m.bearing * DEG) * m.range * R_IN, Math.cos(m.bearing * DEG) * m.range * R_IN])

const isDomControl = (e) => !!e.nativeEvent?.target?.closest?.('a, button, dialog, [role="dialog"]')
const toggleFocus = (i) => setRadar({ focus: radar.focus === i ? -1 : i })

/** Mark scale, shared by VoxelMark (heightFrac) and the ring's logo pose. */
function markUnit(vp) {
  return Math.min((vp.height * 0.6) / 96, (vp.width * 0.86) / GRID.cols)
}

/** The director: runs first each frame (priority -1) and writes F. */
function direct(state, dt, g, camera) {
  const c = getChapter(ID)
  F.visible = c.visible && !!c.rect
  if (!g) return
  g.visible = F.visible
  if (!F.visible) return
  const p = c.progress
  F.p = p
  F.time = state.clock.elapsedTime
  const vp = state.viewport.getCurrentViewport(camera, ORIGIN)
  const vh = state.size.height

  // Pinned stage: follow the section while it slides in and out.
  const shift = c.rect.top > 0 ? c.rect.top : Math.min(0, c.rect.bottom - vh)
  g.position.y = (-shift / vh) * vp.height

  const narrow = vp.width / vp.height < 0.8
  F.narrow = narrow
  const unit = markUnit(vp)

  // Logo pose: the ring sits a little behind the voxel slab and turns with it.
  const q = clamp01(p / MARK_END)
  const yaw = Math.sin((q - 0.12) * Math.PI * 1.4) * 0.55
  const pitch = 0.18
  _eul.set(pitch, yaw, 0)
  _off.set(GRID.cx * unit, GRID.cy * unit, -3 * unit).applyEuler(_eul)
  const logoScale = GRID.outer * unit

  // Table pose.
  const S = narrow ? vp.width * 0.47 : Math.min(vp.height * 0.43, vp.width * 0.255)
  F.S = S
  const tx = narrow ? 0 : vp.width * 0.165
  const ty = narrow ? -vp.height * 0.085 : -vp.height * 0.15

  const t = easeInOut(smooth(TL.doors[0], TL.doors[1], p))
  F.morph = t
  F.pos.set(lerp(_off.x, tx, t), lerp(_off.y, ty, t), lerp(_off.z, 0, t))
  F.rot.set(lerp(pitch, TILT, t), lerp(yaw, 0, t), 0)
  F.scale = lerp(logoScale, S, t)
  F.band = lerp(0.042, 0, smooth(0, 0.6, t))

  // Sweep: follows scroll through a critically damped spring.
  const prev = F.sweep
  easing.damp(F, 'sweep', sweepAt(p), 0.16, dt)
  const v = (F.sweep - prev) / Math.max(dt, 1e-3)
  if (Math.abs(v) > 0.03) easing.damp(F, 'cw', v > 0 ? 1 : 0, 0.12, dt)
  easing.damp(F, 'speed', Math.min(Math.abs(v), 3), 0.25, dt)
  F.sweepOn = smooth(0.25, 0.3, p)

  // Contacts: pinged when the arm crosses them, discovered once passed.
  _pose.position.copy(F.pos)
  _pose.rotation.copy(F.rot)
  _pose.scale.setScalar(F.scale)
  _pose.updateMatrix()
  let active = -1
  const show = shownIndex()
  for (let i = 0; i < MOMENTS.length; i++) {
    const m = MOMENTS[i]
    const b = m.bearing * DEG
    if (F.sweepOn > 0.5 && (prev - b) * (F.sweep - b) < 0) F.pingAt[i] = F.time
    const found = F.sweep >= b
    if (F.sweep >= b + 1.5 * DEG) active = i
    const behind = F.sweep - b
    F.bright[i] = found ? (0.42 + 0.58 * Math.exp(-behind / 1.1)) * F.sweepOn : 0
    const want = found && (radar.hover === i || show === i) ? 1 : 0
    easing.damp(F.mark, i, want, 0.15, dt)
    F.blips[i].set(BLIP[i][0], BLIP[i][1], 0).applyMatrix4(_pose.matrix)
  }
  if (active !== radar.active) setRadar({ active, focus: -1 })
}

function Numeral({ text, x, y, size, order, kind }) {
  const ref = useRef()
  useFrame(() => {
    const t = ref.current
    if (!t) return
    if (kind === 'bearing') {
      t.fillOpacity = smooth(order * 0.06, order * 0.06 + 0.3, F.morph > 0.98 ? revealOf(F.p) : 0) * 0.5
    } else {
      t.fillOpacity = Math.min(1, F.bright[order] * 1.4) * 0.8 + F.mark[order] * 0.2
    }
  })
  return (
    <Text
      ref={ref}
      font={monoFont}
      fontSize={size}
      color={BONE}
      anchorX={kind === 'bearing' ? 'center' : 'left'}
      anchorY="middle"
      position={[x, y, 0.002]}
      fillOpacity={0}
      letterSpacing={0.06}
    >
      {text}
    </Text>
  )
}

const revealOf = (p) => smooth(TL.reveal[0], TL.reveal[1], p)

function Scope() {
  const group = useRef()
  const plane = useRef()
  const material = useMemo(() => makeScopeMaterial(), [])
  useEffect(() => () => material.dispose(), [material])

  useFrame(() => {
    const g = group.current
    const m = plane.current
    if (!g || !m || !F.visible) return
    g.position.copy(F.pos)
    g.rotation.copy(F.rot)
    g.scale.setScalar(F.scale)
    const u = m.material.uniforms
    u.uTime.value = F.time
    u.uBezel.value = smooth(TL.ring[0], TL.ring[1], F.p)
    u.uFill.value = 0.72 * smooth(TL.ring[0], TL.ring[1], F.p)
    u.uBand.value = F.band
    u.uReveal.value = revealOf(F.p)
    u.uSweep.value = F.sweep
    u.uSweepOn.value = F.sweepOn
    u.uCw.value = F.cw
    u.uTrail.value = 0.5 + Math.min(F.speed * 0.5, 0.9)
    u.uHum.value = reduceMotion ? 0 : 1
    u.uWave.value = 0.7 + Math.min(F.speed * 0.4, 0.8)
    for (let i = 0; i < MOMENTS.length; i++) {
      u.uBlip.value[i].set(BLIP[i][0], BLIP[i][1], F.bright[i], F.mark[i])
      const age = F.time - F.pingAt[i]
      u.uPing.value[i].set(age, MOMENTS[i].bearing * DEG, age < 4 ? 1 : 0, 0)
    }
  })

  const bearings = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = i * 30 * DEG
        return { text: String(i * 30).padStart(3, '0'), x: Math.sin(a) * R_IN * 0.87, y: Math.cos(a) * R_IN * 0.87, i }
      }),
    [],
  )

  return (
    <group ref={group}>
      <mesh ref={plane} material={material} renderOrder={1}>
        <planeGeometry args={[EXT * 2, EXT * 2]} />
      </mesh>
      {bearings.map((b) => (
        <Numeral key={b.text} kind="bearing" text={b.text} x={b.x} y={b.y} size={0.036} order={b.i} />
      ))}
      {MOMENTS.map((m, i) => {
        const [x, y] = BLIP[i]
        return (
          <group key={m.n}>
            <Numeral kind="blip" text={m.n} x={x + 0.034} y={y + 0.03} size={0.034} order={i} />
            <mesh
              position={[x, y, 0.004]}
              onPointerOver={(e) => {
                if (F.bright[i] <= 0) return
                e.stopPropagation()
                setRadar({ hover: i })
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                if (radar.hover === i) setRadar({ hover: -1 })
                document.body.style.cursor = ''
              }}
              onClick={(e) => {
                if (F.bright[i] <= 0 || isDomControl(e)) return
                e.stopPropagation()
                toggleFocus(i)
              }}
            >
              <circleGeometry args={[0.07, 20]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ── Cards: a moment rises out of the scope like a pop-up, hinged at its
   contact, and stands facing the viewer; its DOM caption rides with it. ── */

const LEAN = [
  { yaw: 0.2, roll: 0.03 },
  { yaw: -0.1, roll: -0.02 },
  { yaw: 0.12, roll: 0.02 },
  { yaw: -0.2, roll: -0.03 },
]
const _v = new THREE.Vector3()
const _cam = new THREE.Vector3()
// Per-card animation state (module level, like F).
const CARD = MOMENTS.map(() => ({ rise: 0, focus: 0, cap: -1, cx: 0, cy: 0, left: false }))

/** Base resolve: a card rises in lines and develops as it settles (mostly,
 *  leaving a scan of line bars); a clicked one resolves fully. */
const resolveOf = (i, settled) => () => {
  if (shownIndex() !== i) return 0
  return radar.focus === i ? 1 : settled * smooth(0.82, 1, CARD[i].rise)
}
const RESOLVE_TYPE = MOMENTS.map((_, i) => resolveOf(i, 0.72))
const RESOLVE_PHOTO = MOMENTS.map((_, i) => resolveOf(i, 0.38))

function CardRig({ i, aspect, capY = 0, children }) {
  const hinge = useRef()
  const lift = useRef()
  const camera = useThree((st) => st.camera)

  useFrame((state, dt) => {
    const h = hinge.current
    const inner = lift.current
    if (!h || !inner) return
    const st = CARD[i]
    const show = shownIndex()
    const on = F.visible && F.morph > 0.99 && show === i
    easing.damp(st, 'rise', on ? 1 : 0, on ? 0.45 : 0.28, dt)
    easing.damp(st, 'focus', on && radar.focus === i ? 1 : 0, 0.3, dt)
    const r = st.rise
    h.visible = r > 0.004
    const mesh = inner.children[0]
    if (mesh?.material?.uniforms) {
      mesh.material.uniforms.uInkAlpha.value = smooth(0, 0.3, r)
    }

    if (h.visible) {
      const k = easeOut(r)
      const w = F.S * (F.narrow ? 0.98 : 0.86) * (aspect > 1.4 ? 1.2 : 1)
      _v.copy(F.blips[i])
      _cam.copy(camera.position)
      h.parent.worldToLocal(_cam)
      _v.lerp(_cam, 0.07 * k + 0.16 * st.focus)
      h.position.set(_v.x, _v.y + k * F.S * 0.02, _v.z)
      h.rotation.set(lerp(TILT, -0.05, k), LEAN[i].yaw * k * (1 - st.focus), LEAN[i].roll * k * (1 - st.focus))
      h.scale.setScalar(w * (0.55 + 0.45 * k))
      inner.position.set(0, 0.5 / aspect, 0)
    } else {
      // R3F raycasts ignore visibility: collapse a lowered card so it can't be hovered.
      h.scale.setScalar(1e-6)
    }

    // Caption: pinned beside the card's top corner (right, or left when the
    // card stands near the right edge), in CSS px.
    const el = radar.caps[i]
    if (!el) return
    const o = F.narrow ? 0 : smooth(0.6, 0.95, r)
    if (o > 0.01) {
      h.updateMatrixWorld()
      const W = state.size.width
      const top = (0.5 - capY) / aspect
      _v.set(0.5, top, 0).applyMatrix4(inner.matrixWorld).project(camera)
      let x = (_v.x * 0.5 + 0.5) * W + 16
      let y = (0.5 - _v.y * 0.5) * state.size.height
      const left = x + 230 > W - 24
      if (left) {
        _v.set(-0.5, top, 0).applyMatrix4(inner.matrixWorld).project(camera)
        x = (_v.x * 0.5 + 0.5) * W - 16
        y = (0.5 - _v.y * 0.5) * state.size.height
      }
      x = Math.round(x)
      y = Math.round(Math.max(64, y))
      if (x !== st.cx || y !== st.cy || left !== st.left) {
        st.cx = x
        st.cy = y
        st.left = left
        el.style.transform = `translate3d(${x}px, ${y}px, 0)${left ? ' translateX(-100%)' : ''}`
        el.classList.toggle('is-left', left)
      }
    }
    const oq = Math.round(o * 100) / 100
    if (oq !== st.cap) {
      st.cap = oq
      el.style.opacity = String(oq)
      el.style.visibility = oq > 0 ? 'visible' : 'hidden'
    }
  })

  const onClick = (e) => {
    if (CARD[i].rise < 0.5 || isDomControl(e)) return
    e.stopPropagation()
    toggleFocus(i)
  }

  return (
    <group ref={hinge} visible={false}>
      <group ref={lift}>{children(onClick)}</group>
    </group>
  )
}

function PhotoCard({ i, src }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const aspect = tex.image.width / tex.image.height
  return (
    <CardRig i={i} aspect={aspect}>
      {(onClick) => (
        // The photo's base stays in lines, rooted in the scope it rose from.
        <InkCard src={src} width={1} invert={1} black={0.05} white={0.9} fadeFrom={0.16} fadeTo={0.58} getResolve={RESOLVE_PHOTO[i]} onClick={onClick} renderOrder={3} />
      )}
    </CardRig>
  )
}

function TypeMesh({ tex, getResolve, onClick }) {
  const material = useMemo(() => createInkPhotoMaterial(tex, { resolve: 0, invert: 1, black: 0.05, white: 0.9 }), [tex])
  const [hovered, setHovered] = useState(false)
  const anim = useRef({ r: 0 })
  const mesh = useRef()
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, dt) => {
    const target = Math.max(getResolve(), hovered ? 1 : 0)
    easing.damp(anim.current, 'r', target, hovered ? 0.18 : 0.3, dt)
    if (mesh.current) mesh.current.material.uniforms.uResolve.value = anim.current.r
  })
  const aspect = tex.userData.aspect
  return (
    <mesh
      ref={mesh}
      material={material}
      scale={[1, 1 / aspect, 1]}
      renderOrder={3}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = ''
      }}
      onClick={onClick}
    >
      <planeGeometry />
    </mesh>
  )
}

function TypeCard({ i, type }) {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    let live = true
    let made
    makeTypeTexture(type).then((t) => {
      made = t
      if (live) setTex(t)
      else t.dispose()
    })
    return () => {
      live = false
      made?.dispose()
    }
  }, [type])
  if (!tex) return null
  return (
    <CardRig i={i} aspect={tex.userData.aspect} capY={tex.userData.capY}>
      {(onClick) => <TypeMesh tex={tex} getResolve={RESOLVE_TYPE[i]} onClick={onClick} />}
    </CardRig>
  )
}

function Card({ i, m }) {
  const photo = useImageReady(m.photo?.src)
  const fallback = <TypeCard i={i} type={m.type} />
  if (!photo) return fallback
  return (
    <Suspense fallback={fallback}>
      <PhotoCard i={i} src={m.photo.src} />
    </Suspense>
  )
}

function Mark() {
  const viewport = useThree((s) => s.viewport)
  const heightFrac = (markUnit(viewport) * 96) / viewport.height
  const wrap = useRef()
  useFrame(() => {
    if (wrap.current) wrap.current.visible = F.visible && F.p < MARK_END * 0.72
  })
  return (
    <group ref={wrap}>
      <VoxelMark src={ASSETS.mark} cell={6} getProgress={getMarkProgress} heightFrac={heightFrac} />
    </group>
  )
}
const getMarkProgress = () => clamp01(F.p / MARK_END)

function Plate() {
  const ok = useImageReady(ASSETS.plate)
  if (!ok) return null
  return (
    <Suspense fallback={null}>
      <LinePlate id={ID} src={ASSETS.plate} invert={1} z={-4} drift={0.9} opacity={0.17} black={0.14} white={0.92} />
    </Suspense>
  )
}

export default function Scene() {
  const root = useRef()
  const camera = useThree((s) => s.camera)
  useFrame((state, dt) => direct(state, dt, root.current, camera), -1)
  return (
    <>
      <GroundPlane id={ID} color={GROUND} />
      <Plate />
      <group ref={root} visible={false}>
        <Mark />
        <Scope />
        {MOMENTS.map((m, i) => (
          <Card key={m.n} i={i} m={m} />
        ))}
      </group>
    </>
  )
}
