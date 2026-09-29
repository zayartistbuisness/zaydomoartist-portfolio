import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import GroundPlane from '../../kit/GroundPlane'
import StageFollow from '../../kit/StageFollow'
import { getChapter } from '../../kit/chapterStore'
import { smooth } from '../../kit/space'
import { pointer } from '../../ink/pointer'
import { ID, useShots } from './shots'
import { openPrint, wall, wheelAt } from './timeline'
import {
  GROUND,
  MAX_SPOTS,
  bentPlane,
  createCutMaterial,
  createPrintMaterial,
  createTitleMaterial,
  createWallMaterial,
} from './materials'
import { fitSource, fontsReady, loadImage, makeTexture, titleCanvas } from './textures'

// PORTRAITS · "The Rotunda": a curved wall of large prints around the
// viewer. Scroll (or drag) turns the wall; the print that reaches the centre
// develops out of the ink into the photograph and comes forward; the two
// with cut-outs let him step out of the frame. Nothing reveals on hover:
// prints develop only by arriving at the centre. No wall labels: the prints
// hang uncaptioned (alt text and the lightbox title carry the words).

const TITLE = 'Portraits'
const CREDIT = 'Zay “Domo” Artist'
const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const isDomControl = (e) => !!e.nativeEvent?.target?.closest?.('a, button, dialog, [role="dialog"], .c-portraits-list')

// Frame state written by the director (priority -1), read by every piece.
const F = { visible: false, wheel: -1, arc: 0, n: 0, lean: new THREE.Vector2(), leanTarget: [0, 0] }

/** Wall geometry for the current viewport (world units at the front wall, z = 0). */
function layoutFor(vpW, vpH, height, list, titleAspect, creditAspect) {
  const narrow = vpW / vpH < 0.82
  const pxW = vpH / height // world units per CSS px
  const H = narrow ? Math.min(vpH * 0.54, vpW * 0.8 * 1.5) : vpH * 0.6
  // The viewer stands off-axis (camera at z = 10, axis at z = R), so the
  // prints to the sides visibly turn and wrap round. Phones: flatter wall,
  // one print at a time.
  const R = narrow ? 13 : 6.3
  const gap = narrow ? H * 0.3 : H * 0.36
  const margin = H * 0.028
  const titleW = narrow ? vpW * 0.88 : Math.min(vpW * 0.7, vpH * 1.75)
  const creditW = narrow ? vpW * 0.7 : Math.min(vpW * 0.215, vpH * 0.56)
  const prints = list.map((s) => {
    const aspect = s.w && s.h ? s.w / s.h : 2 / 3
    const ih = aspect > 1 ? H * 0.74 : H
    const iw = ih * aspect
    const sw = iw + margin * 2
    const sh = ih + margin * 2
    return { iw, ih, sw, sh, ix: margin / sw, iy: margin / sh }
  })
  // Arc position of each slot along the wall; slot 0 is the title.
  const arcs = [0]
  let half = titleW / 2
  prints.forEach((p, i) => {
    arcs.push(arcs[i] + half + (i === 0 ? H * 0.16 : gap) + p.sw / 2)
    half = p.sw / 2
  })
  return {
    narrow,
    pxW,
    H,
    R,
    gap,
    prints,
    arcs,
    titleW,
    titleH: titleW / titleAspect,
    creditW,
    creditH: creditW / creditAspect,
    creditArc: arcs[arcs.length - 1] + half + gap * 0.55 + creditW / 2,
    y0: narrow ? vpH * 0.03 : vpH * 0.034,
    floorY: -H * 0.5 - vpH * (narrow ? 0.135 : 0.122),
    vpW,
    vpH,
  }
}

function arcAt(arcs, w) {
  const x = w + 1
  const last = arcs.length - 1
  if (last <= 0) return 0
  if (x <= 0) return arcs[0] + x * (arcs[1] - arcs[0])
  if (x >= last) return arcs[last] + (x - last) * (arcs[last] - arcs[last - 1])
  const i = Math.floor(x)
  return arcs[i] + (x - i) * (arcs[i + 1] - arcs[i])
}

function useLayout(list, titleAspect, creditAspect) {
  const size = useThree((s) => s.size)
  const camera = useThree((s) => s.camera)
  const viewport = useThree((s) => s.viewport)
  const vp = viewport.getCurrentViewport(camera, [0, 0, 0])
  return useMemo(
    () => layoutFor(vp.width, vp.height, size.height, list, titleAspect, creditAspect),
    [vp.width, vp.height, size.height, list, titleAspect, creditAspect],
  )
}

/** Print textures (and cut-outs), loaded in wall order, uploaded as they land. */
function useTextures(list, maxH) {
  const gl = useThree((s) => s.gl)
  const cache = useRef(null)
  const [tex, setTex] = useState({})

  useEffect(() => {
    if (!cache.current) cache.current = new Map()
    const store = cache.current
    let live = true
    ;(async () => {
      for (const s of list) {
        const key = `${s.src}|${s.cutout || ''}`
        let entry = store.get(key)
        if (!entry) {
          const img = await loadImage(s.src)
          if (!live) return
          if (!img) continue // missing or broken: the print just isn't hung
          const map = makeTexture(fitSource(img, maxH), gl)
          const ci = s.cutout ? await loadImage(s.cutout) : null
          const cut = ci ? makeTexture(fitSource(ci, maxH), gl, 4) : null
          entry = { map, cut }
          store.set(key, entry)
          if (!live) return
        }
        const e = entry
        setTex((prev) => (prev[s.id] === e ? prev : { ...prev, [s.id]: e }))
      }
    })()
    return () => {
      live = false
    }
  }, [list, maxH, gl])

  useEffect(
    () => () => {
      cache.current?.forEach(({ map, cut }) => {
        map.dispose()
        cut?.dispose()
      })
      cache.current?.clear()
    },
    [],
  )
  return tex
}

/** Serif type for the wall (title, closing credit), once the font is in. */
function useWallType(text, italic) {
  const gl = useThree((s) => s.gl)
  const [type, setType] = useState(null)
  useEffect(() => {
    let live = true
    let tex = null
    fontsReady().then(() => {
      if (!live) return
      const c = titleCanvas(text, italic)
      tex = makeTexture(c, gl, 8)
      setType({ tex, aspect: c.width / c.height })
    })
    return () => {
      live = false
      tex?.dispose()
    }
  }, [gl, text, italic])
  return type
}

// ── The wall itself: a full cylinder, so turning it never shows an end ──
function Wall({ lay, list }) {
  const ref = useRef()
  const geometry = useMemo(() => new THREE.CylinderGeometry(lay.R + 0.02, lay.R + 0.02, lay.vpH * 3.2, 240, 1, true), [lay.R, lay.vpH])
  const material = useMemo(() => createWallMaterial(), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  // Colour prints spill their light onto the wall when centred. REC's comes
  // from the tally lamp left of his face; others glow from the print itself.
  const washes = useMemo(
    () =>
      list.flatMap((s, i) => {
        const p = lay.prints[i]
        if (!s.color || !p) return []
        const rec = s.id === 'rec'
        const x = lay.arcs[i + 1] - (rec ? 0.24 * p.iw : 0)
        return [{ i, x, y: rec ? 0.11 * p.ih : 0.15 * p.ih, r: lay.H * (rec ? 0.95 : 1.1), k: rec ? 1 : 0.62 }]
      }),
    [list, lay],
  )

  useEffect(() => {
    const u = ref.current.material.uniforms
    let k = 0
    u.uSpots.value[k++].set(0, lay.titleW * 0.42, lay.H * 0.08, lay.H * 0.62)
    lay.prints.forEach((p, i) => {
      if (k < MAX_SPOTS - 1) u.uSpots.value[k++].set(lay.arcs[i + 1], p.sw * 0.56, p.sh * 0.2, p.sh * 0.66)
    })
    u.uSpots.value[k++].set(lay.creditArc, lay.creditW * 0.5, lay.H * 0.05, lay.H * 0.5)
    u.uSpotCount.value = k
    u.uR.value = lay.R
    u.uFloorY.value = lay.floorY
  }, [lay])

  useFrame((state) => {
    const m = ref.current
    if (!m || !F.visible) return
    const u = m.material.uniforms
    u.uFadeBottom.value = 74 * state.gl.getPixelRatio()
    let best = null
    let amt = 0
    for (const wsh of washes) {
      const a = (1 - smooth(0.05, 0.75, Math.abs(F.wheel - wsh.i))) * wsh.k
      if (a > amt) {
        amt = a
        best = wsh
      }
    }
    if (best) u.uRecAt.value.set(best.x, best.y, best.r)
    u.uRec.value = amt
    wall.rec = amt
    u.uAlpha.value = lay.narrow ? 0.8 : 1
  })
  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={-4} frustumCulled={false} />
}

// ── Serif on the wall: the title, engraved and swept away as the wall
//    starts turning, and the closing credit beside the last print, set
//    solid like vinyl lettering (small type doesn't survive the engraving) ──
function WallType({ lay, type, kind }) {
  const ref = useRef()
  const title = kind === 'title'
  const w = title ? lay.titleW : lay.creditW
  const h = title ? lay.titleH : lay.creditH
  const arc = title ? 0 : lay.creditArc
  const geometry = useMemo(() => bentPlane(w, h, lay.R, 64), [w, h, lay.R])
  const material = useMemo(() => createTitleMaterial(type.tex), [type.tex])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame(() => {
    const m = ref.current
    if (!m) return
    const a = title
      ? (1 - smooth(-0.62, -0.14, F.wheel)) * smooth(0.25, 0.85, getChapter(ID).enter)
      : smooth(F.n - 1.9, F.n - 1.05, F.wheel) * 0.82
    m.visible = F.visible && a > 0.002
    if (!m.visible) return
    m.material.uniforms.uInkAlpha.value = a
    // Phones: the engraving is too coarse for the title at that size, so it's set solid.
    m.material.uniforms.uResolve.value = title && !lay.narrow ? 0 : 1
  })
  return (
    <group rotation-y={-arc / lay.R}>
      <mesh ref={ref} geometry={geometry} material={material} position={[0, lay.H * (title ? 0.04 : 0.02), -lay.R]} renderOrder={0} />
    </group>
  )
}

// ── One print: sheet and optional cut-out ──
function Print({ shot, index, lay, tex }) {
  const p = lay.prints[index]
  const arc = lay.arcs[index + 1]
  const pivot = useRef()
  const body = useRef()
  const cutRef = useRef()
  const anim = useRef({ c: 0, a: 0, hover: 0 })

  const geometry = useMemo(() => bentPlane(p.sw, p.sh, lay.R), [p.sw, p.sh, lay.R])
  const cutGeometry = useMemo(() => (tex.cut ? bentPlane(p.iw, p.ih, lay.R) : null), [tex.cut, p.iw, p.ih, lay.R])
  const material = useMemo(
    () => createPrintMaterial(tex.map, { cut: tex.cut, color: !!shot.color, redLight: shot.id === 'rec', inset: [p.ix, p.iy] }),
    [tex.map, tex.cut, shot.color, shot.id, p.ix, p.iy],
  )
  const cutMaterial = useMemo(() => (tex.cut ? createCutMaterial(tex.cut) : null), [tex.cut])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => cutGeometry?.dispose(), [cutGeometry])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => cutMaterial?.dispose(), [cutMaterial])

  useFrame((state, dt) => {
    const pv = pivot.current
    const m = body.current
    if (!pv || !m) return
    const phi = (arc - F.arc) / lay.R
    pv.visible = F.visible && Math.abs(phi) < 1.75
    if (!pv.visible) return
    const a = anim.current
    const centred = 1 - smooth(0.05, 0.62, Math.abs(F.wheel - index))
    easing.damp(a, 'c', centred, 0.11, dt)
    easing.damp(a, 'hover', wall.hover === index && !wall.dragging ? 1 : 0, 0.14, dt)
    easing.damp(a, 'a', 1, 0.45, dt)
    const c = a.c

    // Centre: develops, swells a touch and comes off the wall. Hover only
    // lifts the print and brightens its engraving; it never reveals it.
    const s = 1 + 0.05 * c
    const lift = 0.3 * c + 0.08 * a.hover
    m.scale.setScalar(s)
    m.position.z = -lay.R + lift
    const u = m.material.uniforms
    u.uResolve.value = smooth(0.2, 0.92, c)
    u.uBone.value = 0.44 + 0.56 * Math.max(c, a.hover * 0.7)
    u.uInkAlpha.value = a.a

    // Cut-out: fades in registered over the photo, then steps forward.
    const k = cutRef.current
    if (k) {
      const step = smooth(0.72, 1, c)
      const show = smooth(0.5, 0.78, c) * a.a
      k.visible = show > 0.002
      u.uStep.value = step
      if (k.visible) {
        const reach = 0.5 * step
        const depth = 10 - lift - reach
        // Cancel most of the perspective growth, so he steps out rather than balloons.
        k.scale.setScalar(s * (1 - (reach / depth) * 0.55))
        k.position.set(F.lean.x * 0.06 * step, F.lean.y * -0.035 * step - 0.012 * step, -lay.R + lift + reach)
        k.rotation.set(F.lean.y * 0.05 * step, F.lean.x * 0.1 * step, 0)
        const ku = k.material.uniforms
        ku.uInkAlpha.value = show
        ku.uResolve.value = u.uResolve.value
        u.uShadow.value.set(0.016 + F.lean.x * 0.012 * step, 0.024 - F.lean.y * 0.01 * step)
      }
    }
  })

  // The pointer hand is the one quiet hint that a print opens (kit/cursor.js
  // shows it while body.style.cursor is 'pointer').
  const over = (e) => {
    e.stopPropagation()
    wall.hover = index
    document.body.style.cursor = 'pointer'
  }
  const out = () => {
    if (wall.hover === index) wall.hover = -1
    document.body.style.cursor = ''
  }
  const click = (e) => {
    if (wall.moved || isDomControl(e)) return
    e.stopPropagation()
    openPrint(index)
  }

  return (
    <group ref={pivot} rotation-y={-arc / lay.R}>
      <mesh
        ref={body}
        geometry={geometry}
        material={material}
        position={[0, 0, -lay.R]}
        renderOrder={0}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      />
      {cutMaterial && <mesh ref={cutRef} geometry={cutGeometry} material={cutMaterial} position={[0, 0, -lay.R]} renderOrder={2} visible={false} />}
    </group>
  )
}

function Rotunda({ list }) {
  const title = useWallType(TITLE, false)
  const credit = useWallType(CREDIT, true)
  const lay = useLayout(list, title?.aspect ?? 3.3, credit?.aspect ?? 5)
  const [maxH] = useState(() => (window.innerWidth < 760 ? 1024 : 1536))
  const tex = useTextures(list, maxH)
  const rig = useRef()
  const rot = useRef()

  // The director: runs before every piece, writes F and the shared store.
  useFrame((state, dt) => {
    const c = getChapter(ID)
    F.visible = c.visible && !!c.rect
    const g = rig.current
    if (!g) return
    g.visible = F.visible
    if (!F.visible) return
    const n = list.length
    F.n = n
    easing.damp(wall, 'nudge', wall.nudgeTarget, wall.dragging ? 0.05 : 0.2, dt)
    const w = Math.min(n - 1 + 0.4, Math.max(-1.4, wheelAt(c.progress, n) + wall.nudge))
    // The wall turns under a still cursor: re-run the pointer raycast so
    // hover follows whichever print is actually under it now.
    if (Math.abs(w - F.wheel) > 1e-4 && pointer.active && !pointer.touch) state.events.update?.()
    F.wheel = w
    wall.wheel = w
    F.arc = arcAt(lay.arcs, w)
    rot.current.rotation.y = F.arc / lay.R

    // Slow parallax: the room leans a hair with the cursor (no reveal).
    const live = pointer.active && !pointer.touch && !reduceMotion
    F.leanTarget[0] = live ? (pointer.x / state.size.width) * 2 - 1 : 0
    F.leanTarget[1] = live ? (pointer.y / state.size.height) * 2 - 1 : 0
    easing.damp2(F.lean, F.leanTarget, 0.4, dt)
    g.rotation.set(F.lean.y * 0.014, F.lean.x * 0.02, 0)

    const pitch = lay.prints.length ? lay.prints[0].sw + lay.gap : 1
    wall.pitchPx = (pitch / lay.vpW) * state.size.width
  }, -1)

  return (
    <group ref={rig}>
      <group ref={rot} position={[0, lay.y0, lay.R]}>
        <Wall lay={lay} list={list} />
        {title && <WallType lay={lay} type={title} kind="title" />}
        {credit && <WallType lay={lay} type={credit} kind="credit" />}
        {list.map((s, i) =>
          tex[s.id] ? <Print key={s.src} shot={s} index={i} lay={lay} tex={tex[s.id]} /> : null,
        )}
      </group>
    </group>
  )
}

export default function Scene() {
  const list = useShots()
  return (
    <>
      <GroundPlane id={ID} color={GROUND} />
      <StageFollow id={ID}>
        <Rotunda list={list} />
      </StageFollow>
    </>
  )
}
