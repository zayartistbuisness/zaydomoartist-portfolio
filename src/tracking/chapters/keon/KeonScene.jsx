import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import GroundPlane from '../../kit/GroundPlane'
import LinePlate from '../../kit/LinePlate'
import { makeChrome } from '../../kit/chrome'
import { getChapter } from '../../kit/chapterStore'
import { smooth, viewportAt } from '../../kit/space'
import VoxelMark from '../../three/VoxelMark'
import { buildRibbon, buildGateGeometry, createBeamMaterial, createStripMaterial, MM } from './filmstrip'
import { BASE, BEAT, FILM, ID, O, P, SLOTS, isNarrow, keonStore, markProgress, stripOffset } from './timeline'

const GROUND = '#0f0f0e'
const PLATE = `${BASE}/plate_boxing_gym.webp`
const ATLAS = `${BASE}/keon-atlas.webp`
const MARK = `${BASE}/keon-mark.png`

const getMarkProgress = () => markProgress(getChapter(ID).progress)

/**
 * Gate frame width in world units for the current viewport. Narrow (the same
 * test as keon.css): the gate spans most of a phone's width; on taller or
 * wider narrow screens (portrait tablets, landscape phones) it is capped by
 * height, leaving the title above and the quote and rail below it clear.
 */
function useLayout() {
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera)
  const viewport = useThree((s) => s.viewport)
  const vp = viewport.getCurrentViewport(camera, [0, 0, 0])
  const aspect = size.width / Math.max(1, size.height)
  const narrow = isNarrow(size.width, size.height)
  const fw = narrow
    ? Math.min(vp.width * 0.78, vp.height * 0.46)
    : Math.min(vp.width * 0.33, vp.height * 0.52 * (MM.frameW / MM.stock))
  return { aspect, fw, narrow, vp, size }
}

// Frame-by-frame state the pieces share, written once per frame by <Driver>.
const live = { p: 0, visible: false, offset: O.threadFrom, reveal: 0, bulge: 0, focus: 0, beam: 0, flicker: 0 }

function Driver() {
  useFrame((state, dt) => {
    const c = getChapter(ID)
    live.visible = c.visible
    live.p = c.progress
    const p = c.progress
    // Drag nudge: follow the finger closely, glide home after release.
    easing.damp(keonStore, 'nudge', keonStore.nudgeTarget, keonStore.dragging ? 0.06 : 0.22, dt)
    const o = stripOffset(p) + keonStore.nudge
    live.offset = o
    live.reveal = smooth(P.threadFrom, P.threadFrom + 0.05, p)
    // Resolve and swell only while frames are stepping through the gate.
    const framing = smooth(P.threadTo - 0.03, P.threadTo, p) * (1 - smooth(P.framesTo, P.framesTo + 0.015, p))
    const centred = 1 - smooth(0.08, 0.42, Math.abs(o - Math.round(o)))
    live.focus = framing
    easing.damp(live, 'bulge', framing * centred, 0.12, dt)
    // Lamp: on once threaded, fuller through the clear beat frame and once
    // the tail has run out, with a faint projector flicker.
    const beat = 1 - smooth(0.1, 0.5, Math.abs(o - BEAT))
    const empty = smooth(FILM.tail - 0.4, FILM.tail + 0.6, o)
    const t = state.clock.elapsedTime
    live.flicker = Math.sin(t * 47.0) * Math.sin(t * 7.3)
    live.beam = live.reveal * (0.62 + 0.3 * beat + 0.45 * empty) * (1 + 0.035 * live.flicker)
  }, -1)
  return null
}

function Strip({ fw, aspect, hiRes }) {
  const atlas = useLoader(THREE.TextureLoader, ATLAS)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const built = useMemo(() => buildRibbon(aspect, fw), [aspect, fw])
  const material = useMemo(() => createStripMaterial(atlas), [atlas])
  const mesh = useRef()
  const textures = useRef([])

  useEffect(() => () => built.geometry.dispose(), [built])
  useEffect(() => () => material.dispose(), [material])

  // Full-resolution stills for the frame in the gate (desktop only). They
  // load after the atlas and are uploaded one by one, off the scroll path.
  useEffect(() => {
    if (!hiRes) return undefined
    let live = true
    const loader = new THREE.TextureLoader()
    const list = SLOTS.map((s, i) => [i, s.img]).filter(([, img]) => img)
    let k = 0
    const next = () => {
      if (!live || k >= list.length) return
      const [slot, img] = list[k++]
      loader.load(`${BASE}/${img}.webp`, (tex) => {
        if (!live) { tex.dispose(); return }
        tex.colorSpace = THREE.NoColorSpace
        tex.anisotropy = 8
        gl.initTexture(tex)
        textures.current[slot] = tex
        next()
      }, undefined, next)
    }
    next()
    const store = textures.current
    return () => {
      live = false
      store.forEach((t) => t && t.dispose())
      store.length = 0
    }
  }, [hiRes, gl])

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    m.visible = live.visible && live.reveal > 0.001
    if (!m.visible) return
    const u = m.material.uniforms
    u.uInkAlpha.value = live.reveal
    u.uOffset.value = live.offset
    u.uFocus.value = live.focus
    u.uBulge.value = live.bulge
    u.uGateS.value = built.gateS
    u.uPitchW.value = built.pitchW
    u.uLift.value = fw * 0.1
    u.uFlicker.value = live.flicker * 0.012 * live.focus

    // Bind the full-res stills for the two slots nearest the gate.
    const o = live.offset
    const a = Math.round(o)
    const b = o >= a ? a + 1 : a - 1
    const ta = textures.current[a]
    const tb = textures.current[b]
    u.uGateA.value = ta || u.uAtlas.value
    u.uGateB.value = tb || u.uAtlas.value
    u.uGateIdx.value.set(a, b, ta ? 1 : 0, tb ? 1 : 0)

    // On-screen width of one frame pitch at the gate, for drag scaling.
    const vp = viewportAt(state, camera, 0)
    keonStore.framePx = (built.pitchW / vp.width) * state.size.width
  })

  return <mesh ref={mesh} geometry={built.geometry} material={material} renderOrder={0} frustumCulled={false} />
}

function Beam({ fw }) {
  const material = useMemo(() => createBeamMaterial(), [])
  const mesh = useRef()
  const camera = useThree((s) => s.camera)
  useEffect(() => () => material.dispose(), [material])
  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    m.visible = live.visible && live.beam > 0.002
    if (!m.visible) return
    const z = -fw * 0.45
    const vp = viewportAt(state, camera, z)
    m.position.set(0, 0, z)
    m.scale.set(vp.width * 1.05, vp.height * 1.05, 1)
    // Gate footprint (one pitch × stock, swollen) seen through to this depth.
    const k = (camera.position.z - z) / camera.position.z
    const s = 1 + 0.05 * live.bulge
    const u = m.material.uniforms
    u.uHalf.value.set(((fw * MM.pitch) / MM.frameW / 2) * s * k, ((fw * MM.stock) / MM.frameW / 2) * s * k)
    u.uAmt.value = live.beam
    u.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh ref={mesh} material={material} renderOrder={-3}>
      <planeGeometry />
    </mesh>
  )
}

function Gate({ fw }) {
  const geometry = useMemo(() => buildGateGeometry(fw), [fw])
  const material = useMemo(() => makeChrome({ resolve: 0, invert: 1, alpha: 0 }), [])
  const mesh = useRef()
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const p = live.p
    const a = smooth(P.threadFrom + 0.02, P.threadTo - 0.02, p)
    m.visible = live.visible && a > 0.002
    if (!m.visible) return
    const ink = m.material.userData.ink
    ink.uInkAlpha.value = a
    // Draws in as ink lines, then develops into chrome as the leader parks.
    ink.uResolve.value = smooth(P.threadTo - 0.04, P.threadTo + 0.01, p)
    const t = state.clock.elapsedTime
    m.position.set(0, 0, fw * 0.1 * live.bulge + fw * 0.02)
    m.rotation.set(Math.sin(t * 0.21) * 0.012, Math.sin(t * 0.17 + 1.2) * 0.018, 0)
  })
  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={1} />
}

// VoxelMark ships a satin finish; KEON's mark resolves to chrome white. Its
// material is re-tuned in place once the instanced mesh exists: a brighter
// chrome, plus a glow proportional to each voxel's own colour, so the bone
// cubes read white while the REC tally stays true red.
const CHROME_WHITE = { metalness: 0.5, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.8 }

function finishMark(voxels) {
  if (!voxels.instanceColor) return false
  const m = voxels.material
  Object.assign(m, CHROME_WHITE)
  const inked = m.onBeforeCompile
  m.onBeforeCompile = (shader, renderer) => {
    inked(shader, renderer)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      #ifdef USE_COLOR
        totalEmissiveRadiance += vColor * 0.34;
      #endif`,
    )
  }
  m.customProgramCacheKey = () => 'ink-v1-keon-white'
  m.needsUpdate = true
  return true
}

function Mark({ narrow, aspect }) {
  const group = useRef()
  useFrame(() => {
    const g = group.current
    if (!g) return
    g.visible = live.visible && live.p < P.markEnd + 0.01
    const voxels = g.children[0]
    if (voxels && !voxels.userData.keonFinish) voxels.userData.keonFinish = finishMark(voxels)
  })
  // Width as a share of the viewport: VoxelMark sizes by height, and the
  // mark is 114 cells wide, so width = heightFrac / 0.8 viewport heights.
  // Narrow: 86% of the width, but never taller than 60% of a short
  // (landscape-phone) screen.
  const heightFrac = narrow ? Math.min(0.8 * 0.86 * aspect, 0.6) : 0.8 * 0.56 * aspect
  return (
    <group ref={group}>
      <VoxelMark src={MARK} cell={6} getProgress={getMarkProgress} heightFrac={heightFrac} invert={1} />
    </group>
  )
}

/** Mounts the background plate only once it actually exists on the server. */
function GuardedPlate() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let alive = true
    let tries = 0
    let timer
    const check = () => {
      fetch(PLATE, { method: 'HEAD' })
        .then((r) => {
          const type = r.headers.get('content-type') || ''
          if (!alive) return
          if (r.ok && type.startsWith('image/')) setOk(true)
          else if (++tries < 6) timer = setTimeout(check, 20000)
        })
        .catch(() => { if (alive && ++tries < 6) timer = setTimeout(check, 20000) })
    }
    check()
    return () => { alive = false; clearTimeout(timer) }
  }, [])
  if (!ok) return null
  return (
    <Suspense fallback={null}>
      <LinePlate id={ID} src={PLATE} invert={1} z={-4} drift={0.5} black={0.36} white={1.0} opacity={0.15} />
    </Suspense>
  )
}

import StageFollow from '../../kit/StageFollow'

export default function KeonScene() {
  const { aspect, fw, narrow, size } = useLayout()
  const hiRes = size.width >= 760
  return (
    <>
      <GroundPlane id={ID} color={GROUND} />
      <Driver />
      <GuardedPlate />
      <StageFollow id={ID}>
        <Beam fw={fw} />
        <Suspense fallback={null}>
          <Strip fw={fw} aspect={aspect} hiRes={hiRes} />
        </Suspense>
        <Gate fw={fw} />
        <Mark narrow={narrow} aspect={aspect} />
      </StageFollow>
    </>
  )
}
