import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerspectiveCamera, Text } from '@react-three/drei'
import HudPass from '../kit/HudPass'
import * as THREE from 'three'
import { easing } from 'maath'
import { inkify, createInkPhotoMaterial } from '../ink/inkChunk'
import { InkDriver } from '../ink/InkDriver'
import { pointer } from '../ink/pointer'
import { loadFormGeometry } from '../three/forms'
import ChapterDriver from '../kit/ChapterDriver'
import ChapterMount from '../kit/ChapterMount'
import ClipBand from '../kit/ClipBand'
import { CHAPTERS } from '../kit/chapters'
import { labStore, FONTS, ROWS } from './labStore'

const INK = '#111110'

function useFormGeometry(name) {
  const [geo, setGeo] = useState(null)
  useEffect(() => {
    let live = true
    loadFormGeometry(name).then((r) => live && setGeo(r.geometry))
    return () => { live = false }
  }, [name])
  return geo
}

function makeChrome(opts) {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#f4f2ec',
    metalness: 1,
    roughness: 0.07,
    clearcoat: 0.35,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.1,
  })
  inkify(m, opts)
  return m
}

// Monochrome studio for the chrome: pale room, white softboxes, dark bands
// so the metal carries graphic contrast. Rendered once into a cube map.
function ChromeEnv() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#cbc8c1']} />
      <Lightformer form="rect" intensity={2.6} position={[0, 5, -1]} rotation-x={Math.PI / 2} scale={[12, 5, 1]} />
      <Lightformer form="rect" intensity={1.7} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[2.5, 9, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[5, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[1.5, 9, 1]} />
      <Lightformer form="ring" intensity={1.3} position={[2.5, 2, 6]} scale={3} />
      <mesh position={[0, -3, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#171716" />
      </mesh>
      <mesh position={[-1.5, 0, -6]}>
        <planeGeometry args={[2.2, 30]} />
        <meshBasicMaterial color="#0d0d0c" />
      </mesh>
      <mesh position={[3, 0, 6]} rotation-y={Math.PI}>
        <planeGeometry args={[1.2, 30]} />
        <meshBasicMaterial color="#0d0d0c" />
      </mesh>
    </Environment>
  )
}

function LayoutDriver() {
  useFrame(() => {
    const el = labStore.heroEl
    if (!el) return
    const r = el.getBoundingClientRect()
    const travel = Math.max(1, r.height - window.innerHeight)
    labStore.heroProgress = THREE.MathUtils.clamp(-r.top / travel, 0, 1)
  }, -1)
  return null
}

// `sway` (radians) swings a flat piece back and forth instead of spinning it,
// so a relief like the sigil never turns edge-on to the camera.
function ChromeForm({ name, at, z, size, phase = 0, spin = 0.22, sway = 0, tilt = [0, 0, 0], rise = 0.3 }) {
  const geo = useFormGeometry(name)
  const mat = useMemo(() => makeChrome({ resolve: 1 }), [])
  const ref = useRef()
  const lean = useRef(new THREE.Vector3())
  const projected = useMemo(() => new THREE.Vector3(), [])
  const camera = useThree((s) => s.camera)

  useFrame((state, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    const p = labStore.heroProgress
    const vp = state.viewport.getCurrentViewport(camera, [0, 0, z])
    const bx = at[0] * vp.width
    const by = at[1] * vp.height + Math.sin(t * 0.55 + phase) * vp.height * 0.012 + p * vp.height * rise

    // Lean away from the cursor with a damped spring; strongest up close.
    projected.set(bx, by, z).project(camera)
    const sx = (projected.x * 0.5 + 0.5) * state.size.width
    const sy = (0.5 - projected.y * 0.5) * state.size.height
    const dx = sx - pointer.x
    const dy = sy - pointer.y
    const dist = Math.hypot(dx, dy) || 1
    const reach = Math.min(state.size.width, state.size.height) * 0.3
    const push = pointer.active ? Math.max(0, 1 - dist / reach) ** 2 : 0
    const k = push * vp.height * 0.08
    easing.damp3(lean.current, [(dx / dist) * k, (-dy / dist) * k, 0], 0.32, dt)

    mesh.position.set(bx + lean.current.x, by + lean.current.y, z)
    mesh.scale.setScalar(size * vp.height * 0.5)
    mesh.rotation.set(
      tilt[0] + Math.sin(t * 0.3 + phase) * 0.22 + lean.current.y * 0.9,
      tilt[1] + (sway ? Math.sin(t * 0.32 + phase) * sway + p * 0.5 : t * spin + p * 2.4),
      tilt[2] - lean.current.x * 0.7,
    )

    // Mostly chrome at rest with an occasional signal dropout; it breaks
    // down into ink lines as the next chapter slides over the hero.
    const dropout = 0.35 * Math.max(0, Math.sin(t * 0.42 + phase * 2.7)) ** 12
    const leave = THREE.MathUtils.smoothstep(p, 0.12, 0.8)
    mesh.material.userData.ink.uResolve.value = Math.max(0, 0.97 - dropout - leave)
  })

  if (!geo) return null
  return <mesh ref={ref} geometry={geo} material={mat} />
}

function Portrait({ src }) {
  const tex = useLoader(THREE.TextureLoader, src)
  const mat = useMemo(() => createInkPhotoMaterial(tex, { resolve: 1, black: 0.04, white: 0.9 }), [tex])
  const ref = useRef()
  const born = useRef(null)
  const camera = useThree((s) => s.camera)
  useFrame((state) => {
    const mesh = ref.current
    const z = -1.4
    const vp = state.viewport.getCurrentViewport(camera, [0, 0, z])
    const aspect = tex.image.width / tex.image.height
    const narrow = vp.width / vp.height < 1
    const h = vp.height * (narrow ? 0.76 : 0.9)
    const p = labStore.heroProgress
    mesh.scale.set(h * aspect, h, 1)
    mesh.position.set(vp.width * (narrow ? 0 : 0.05), -vp.height * 0.5 + h * 0.5 + p * vp.height * 0.1, z)

    // Face and shoulders stay photographic; the lower body bleeds into the
    // line field. On load he develops up out of the lines; on scroll the
    // lines climb back over him as the curtain arrives.
    if (born.current === null) born.current = state.clock.elapsedTime
    const intro = THREE.MathUtils.smoothstep(state.clock.elapsedTime - born.current, 0.2, 2.6)
    const climb = (1 - intro) * 1.1 + THREE.MathUtils.smoothstep(p, 0.05, 0.75) * 1.1
    mesh.material.uniforms.uFade.value.set(0.1 + climb, 0.5 + climb)
  })
  return (
    <mesh ref={ref} material={mat} renderOrder={-2}>
      <planeGeometry />
    </mesh>
  )
}

function HeroType({ font }) {
  const f = FONTS[font]
  const viewport = useThree((s) => s.viewport)
  const group = useRef()
  const W = viewport.width
  const H = viewport.height
  const narrow = W / H < 1
  const fs = narrow ? W * 0.27 : Math.min(H * 0.31, W * 0.165)
  // A bone knockout outline: invisible on paper, but where a letter crosses
  // the dark suit it cuts a clean edge so the word stays legible.
  const common = { fontSize: fs, letterSpacing: f.letterSpacing, color: INK, anchorY: 'middle', renderOrder: 1, outlineWidth: fs * 0.009, outlineBlur: fs * 0.006, outlineColor: '#e8e4db', outlineOpacity: 0.85 }
  // Three staggered lines: the nickname sits in italics, in its quotes,
  // pushed to the opposite margin so the portrait shows between the words.
  const lines = narrow
    ? [
        { text: 'Zay', font: f.roman, anchorX: 'left', x: -W * 0.44, y: H * 0.3 },
        { text: '“Domo”', font: f.italic, anchorX: 'right', x: W * 0.44, y: H * 0.02 },
        { text: 'Artist', font: f.roman, anchorX: 'left', x: -W * 0.44, y: -H * 0.26 },
      ]
    : [
        { text: 'Zay', font: f.roman, anchorX: 'left', x: -W * 0.46, y: H * 0.2 },
        { text: '“Domo”', font: f.italic, anchorX: 'right', x: W * 0.47, y: -H * 0.1 },
        { text: 'Artist', font: f.roman, anchorX: 'left', x: -W * 0.4, y: -H * 0.3 },
      ]

  useFrame(() => {
    if (group.current) group.current.position.y = labStore.heroProgress * H * 0.2
  })

  return (
    <group ref={group}>
      {lines.map((l) => (
        <Text key={l.text} {...common} font={l.font} anchorX={l.anchorX} position={[l.x, l.y, 0]}>
          {l.text}
        </Text>
      ))}
    </group>
  )
}

function HeroForms() {
  const viewport = useThree((s) => s.viewport)
  const narrow = viewport.width / viewport.height < 1
  if (narrow) {
    return (
      <>
        <ChromeForm name="domo_sigil" at={[0.3, 0.26]} z={-0.4} size={0.26} phase={0.4} sway={0.42} />
        <ChromeForm name="soft_form" at={[-0.3, 0.02]} z={-0.5} size={0.17} phase={2.2} />
        <ChromeForm name="film_twist" at={[0.24, -0.3]} z={0.7} size={0.18} phase={4.1} tilt={[0.6, 0, 0.3]} />
      </>
    )
  }
  return (
    <>
      <ChromeForm name="spike_star" at={[-0.2, 0.33]} z={0.9} size={0.17} phase={0.4} rise={0.42} />
      <ChromeForm name="soft_form" at={[-0.36, -0.03]} z={-0.6} size={0.22} phase={2.2} rise={0.22} />
      <ChromeForm name="film_twist" at={[-0.13, 0.04]} z={0.75} size={0.17} phase={4.1} tilt={[0.7, 0, 0.35]} rise={0.36} />
      {/* His sigil: the one chrome piece that faces you, swaying, never spinning. */}
      <ChromeForm name="domo_sigil" at={[0.35, 0.2]} z={-0.9} size={0.36} phase={1.3} sway={0.45} tilt={[0.12, 0, 0]} rise={0.16} />
      <ChromeForm name="molten_glove" at={[0.3, -0.37]} z={0.5} size={0.17} phase={3.3} rise={0.48} />
    </>
  )
}

/* ── Curtain chapter (HUD pass: drawn after, and over, the hero) ── */

function Curtain() {
  const ref = useRef()
  const camera = useThree((s) => s.camera)
  useFrame((state) => {
    const el = labStore.curtainEl
    if (!el || !ref.current) return
    const r = el.getBoundingClientRect()
    const vp = state.viewport.getCurrentViewport(camera, [0, 0, 0])
    const H = state.size.height
    const top = Math.max(r.top, -4)
    const bottom = Math.min(r.bottom, H + 4)
    ref.current.visible = r.top < H && r.bottom > 0
    const yTop = (0.5 - top / H) * vp.height
    const h = ((bottom - top) / H) * vp.height
    ref.current.scale.set(vp.width * 1.1, Math.max(h, 0.0001), 1)
    ref.current.position.set(0, yTop - h / 2, 0)
  })
  return (
    <mesh ref={ref} renderOrder={-1}>
      <planeGeometry />
      <meshBasicMaterial color="#131312" depthWrite={false} />
    </mesh>
  )
}

function IndexArtifact({ row }) {
  const geo = useFormGeometry(row.form)
  const mat = useMemo(() => makeChrome({ resolve: 0, invert: 1, alpha: 0 }), [])
  const ref = useRef()
  const anim = useRef({ a: 0, r: 0, spin: row.id.length * 1.7 })
  const camera = useThree((s) => s.camera)

  useFrame((state, dt) => {
    const mesh = ref.current
    const el = labStore.slotEl
    if (!mesh || !el) return
    const on = labStore.activeRow === row.id
    const s = anim.current
    easing.damp(s, 'a', on ? 1 : 0, on ? 0.1 : 0.08, dt)
    // Lines arrive first, then the chrome resolves out of them.
    easing.damp(s, 'r', on && s.a > 0.8 ? 1 : 0, on ? 0.3 : 0.05, dt)
    const ink = mesh.material.userData.ink
    ink.uInkAlpha.value = s.a
    ink.uResolve.value = s.r
    mesh.visible = s.a > 0.003

    const r = el.getBoundingClientRect()
    const vp = state.viewport.getCurrentViewport(camera, [0, 0, 0])
    mesh.position.set(
      ((r.left + r.width / 2) / state.size.width - 0.5) * vp.width,
      (0.5 - (r.top + r.height / 2) / state.size.height) * vp.height,
      0,
    )
    mesh.scale.setScalar((r.height / state.size.height) * vp.height * 0.4 * (0.8 + 0.2 * s.a))
    s.spin += dt * (0.45 + (1 - s.a) * 4)
    mesh.rotation.set(0.3, s.spin, 0.1)
  })

  if (!geo) return null
  return <mesh ref={ref} geometry={geo} material={mat} />
}

export default function LabScene({ font, portrait }) {
  return (
    <>
      <InkDriver />
      <ChapterDriver />
      <LayoutDriver />
      <ChromeEnv />
      <Suspense fallback={null}>
        <Portrait src={portrait} />
        <HeroType font={font} />
      </Suspense>
      <HeroForms />

      <HudPass renderPriority={1}>
        <PerspectiveCamera makeDefault fov={30} position={[0, 0, 10]} />
        <ChromeEnv />
        <Curtain />
        {ROWS.map((row) => (
          <IndexArtifact key={row.id} row={row} />
        ))}
        {CHAPTERS.map((ch, i) => (
          // Page order = draw order, so each chapter's ground curtains the last.
          <group key={ch.id} renderOrder={i + 1}>
            <ChapterMount id={ch.id}>
              <ClipBand id={ch.id}>
                <ch.Scene />
              </ClipBand>
            </ChapterMount>
          </group>
        ))}
      </HudPass>
    </>
  )
}
