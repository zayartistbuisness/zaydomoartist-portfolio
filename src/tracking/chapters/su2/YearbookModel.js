import * as THREE from 'three'
import { inkify } from '../../ink/inkChunk'
import { loadOptionalImage } from '../../kit/assets'
import * as P from './pages'

// Leaves in binding order. Each leaf has a front (right-hand page before it
// turns) and a back (left-hand page after it turns).
const LEAVES = [
  { front: P.drawCover, back: P.drawEndpaper, cover: true },
  { front: P.drawTitle, back: P.drawStaff },
  { front: P.drawBroadcast, back: P.drawNumbers },
  { front: P.drawGraduation, back: P.drawColophon },
]

// Scroll schedule (chapter progress). Voxel mark runs 0–0.30.
export const ARRIVE = [0.17, 0.32]
export const TURNS = [[0.34, 0.42], [0.47, 0.55], [0.6, 0.68], [0.73, 0.81]]
export const HOLDS = [0.325, 0.445, 0.575, 0.705, 0.86]

const ASSETS = {
  monogram: '/tracking/chapters/su2/su-monogram.png',
  portrait: '/tracking/chapters/su2/su2_yearbook_portrait.webp',
  // Real event photographs from the official SU 2026 yearbook (see
  // assets/event-photos/MANIFEST.md). Only the staff portrait is illustrated.
  classroom: '/tracking/chapters/su2/event/class.webp',
  hall: '/tracking/chapters/su2/event/hall.webp',
  crowd: '/tracking/chapters/su2/event/crowd.webp',
}

const SEG = 36
const PAGE_W = 0.75
const PAGE_H = 1
const COVER_W = 0.77
const COVER_H = 1.03

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (v) => Math.min(1, Math.max(0, v))
const range = (a, b, q) => clamp01((q - a) / (b - a))

function canvasTexture(flip) {
  const c = document.createElement('canvas')
  c.width = P.PAGE_W
  c.height = P.PAGE_H
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  if (flip) {
    // Back faces are seen mirrored; flip u so the artwork reads correctly.
    t.wrapS = THREE.RepeatWrapping
    t.repeat.x = -1
    t.offset.x = 1
  }
  return t
}

function leafGeometry(w, h) {
  const g = new THREE.PlaneGeometry(w, h, SEG, 1)
  g.translate(w / 2, 0, 0)
  const n = g.attributes.position.count
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3))
  return g
}

function pageMaterial(map, side) {
  const m = new THREE.MeshBasicMaterial({ map, vertexColors: true, side })
  inkify(m, { resolve: 0 })
  return m
}

/**
 * Imperative model for the yearbook: owns textures, geometry and meshes,
 * and poses everything from chapter progress each frame. Kept outside React
 * state so per-frame mutation is plain object work.
 */
export default class YearbookModel {
  constructor() {
    this.group = new THREE.Group()
    this.book = new THREE.Group()
    this.group.add(this.book)
    this.assets = {}
    this.inks = []
    this.leaves = LEAVES.map((def, i) => {
      const w = def.cover ? COVER_W : PAGE_W
      const h = def.cover ? COVER_H : PAGE_H
      const geo = leafGeometry(w, h)
      const frontTex = canvasTexture(false)
      const backTex = canvasTexture(true)
      const front = new THREE.Mesh(geo, pageMaterial(frontTex, THREE.FrontSide))
      const back = new THREE.Mesh(geo, pageMaterial(backTex, THREE.BackSide))
      front.renderOrder = back.renderOrder = 10 + i
      this.book.add(front, back)
      this.inks.push(front.material.userData.ink, back.material.userData.ink)
      return { def, w, geo, frontTex, backTex, xs: new Float32Array(SEG + 1), zs: new Float32Array(SEG + 1), phis: new Float32Array(SEG + 1) }
    })

    // Back endpaper and the back board, resting under the right-hand stack.
    this.endTex = canvasTexture(false)
    const endGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H)
    endGeo.translate(PAGE_W / 2, 0, 0)
    // vertexColors needs a colour attribute; without one WebGL reads black.
    endGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(endGeo.attributes.position.count * 3).fill(0.93), 3))
    const end = new THREE.Mesh(endGeo, pageMaterial(this.endTex, THREE.FrontSide))
    end.position.z = -0.004
    end.renderOrder = 5
    const boardGeo = new THREE.PlaneGeometry(COVER_W, COVER_H)
    boardGeo.translate(COVER_W / 2, 0, 0)
    const boardMat = new THREE.MeshBasicMaterial({ color: '#4a0b14' })
    inkify(boardMat, { resolve: 0 })
    const board = new THREE.Mesh(boardGeo, boardMat)
    board.position.z = -0.008
    board.renderOrder = 4
    this.book.add(board, end)
    this.inks.push(end.material.userData.ink, board.material.userData.ink)

    this.pose = { yaw: 0, pitch: 0, arrive: 0 }
    this.poseLeaves(0)
  }

  /** Draw every page now, then redraw as fonts and optional images arrive. */
  load() {
    let live = true
    const draw = () => live && this.redraw()
    Promise.all([
      document.fonts.load("100px 'Instrument Serif'"),
      document.fonts.load("italic 100px 'Instrument Serif'"),
      document.fonts.load("20px 'JetBrains Mono'"),
    ]).finally(draw)
    for (const [key, url] of Object.entries(ASSETS)) {
      loadOptionalImage(url).then((img) => {
        if (img) {
          this.assets[key] = img
          draw()
        }
      })
    }
    return () => { live = false }
  }

  redraw() {
    for (const leaf of this.leaves) {
      leaf.def.front(leaf.frontTex.image.getContext('2d'), this.assets)
      leaf.def.back(leaf.backTex.image.getContext('2d'), this.assets)
      leaf.frontTex.needsUpdate = true
      leaf.backTex.needsUpdate = true
    }
    P.drawEndpaper(this.endTex.image.getContext('2d'), this.assets)
    this.endTex.needsUpdate = true
  }

  // Integrate each leaf's shape along its width: the spine turns first and
  // the free edge lags, so the page bows like paper instead of a hinged card.
  poseLeaves(q) {
    const n = this.leaves.length
    this.leaves.forEach((leaf, i) => {
      const t = ease(range(TURNS[i][0], TURNS[i][1], q))
      const A = t * Math.PI
      const curl = Math.sin(t * Math.PI) * (leaf.def.cover ? 0.25 : 0.9)
      const ds = leaf.w / SEG
      let x = 0
      let z = 0
      leaf.xs[0] = 0
      leaf.zs[0] = 0
      for (let s = 0; s < SEG; s++) {
        const u = (s + 0.5) / SEG
        const phi = Math.min(Math.PI, Math.max(0, A - curl * u * u))
        leaf.phis[s] = phi
        x += Math.cos(phi) * ds
        z += Math.sin(phi) * ds
        leaf.xs[s + 1] = x
        leaf.zs[s + 1] = z
      }
      leaf.phis[SEG] = leaf.phis[SEG - 1]
      const lift = ((n - i) * (1 - t) + i * t) * 0.0025
      const pos = leaf.geo.attributes.position
      const col = leaf.geo.attributes.color
      for (let row = 0; row <= 1; row++) {
        for (let s = 0; s <= SEG; s++) {
          const v = row * (SEG + 1) + s
          pos.setX(v, leaf.xs[s])
          pos.setZ(v, leaf.zs[s] + lift)
          // Upright paper catches less light; a soft gutter shadow at the spine.
          const u = s / SEG
          const gutter = 0.84 + 0.16 * Math.min(1, u / 0.1)
          const shade = (0.8 + 0.2 * Math.abs(Math.cos(leaf.phis[s]))) * gutter
          col.setXYZ(v, shade, shade, shade)
        }
      }
      pos.needsUpdate = true
      col.needsUpdate = true
    })
  }

  /** Current spread: 0 = closed cover … 4 = notes. */
  spreadAt(q) {
    return TURNS.reduce((n, [a, b]) => n + (q > (a + b) / 2 ? 1 : 0), 0)
  }

  update({ q, visible, vp, pointer, size, dt, shift = 0 }) {
    this.group.visible = visible && q > ARRIVE[0] - 0.02
    if (!this.group.visible) return

    const arrive = ease(range(ARRIVE[0], ARRIVE[1], q))
    const h = Math.min(vp.height * 0.66, vp.width * 0.42)
    const narrow = vp.width / vp.height < 1
    this.group.scale.setScalar(h)

    // Centre the spine on the open book's middle; the cover opens to the left.
    const opened = ease(range(TURNS[0][0], TURNS[0][1], q))
    const xShift = (narrow ? 0 : vp.width * 0.1) - PAGE_W * h * 0.5 * (1 - opened)
    this.group.position.set(xShift, -vp.height * (1 - arrive) * 0.95 - vp.height * 0.03 + shift, 0)

    // Lies back like a book on a table; leans gently toward the cursor.
    const px = pointer.active ? (pointer.x / size.width - 0.5) : 0
    const py = pointer.active ? (pointer.y / size.height - 0.5) : 0
    const k = 1 - Math.exp(-dt * 3)
    this.pose.yaw += (px * 0.16 - this.pose.yaw) * k
    this.pose.pitch += (py * 0.1 - this.pose.pitch) * k
    this.book.rotation.set(-0.42 - (1 - arrive) * 0.9 + this.pose.pitch, this.pose.yaw, (1 - arrive) * 0.25)

    // Drawn in ink lines while it rises, resolving to paper as it lands.
    const resolve = range(ARRIVE[0] + 0.06, ARRIVE[1], q)
    for (const ink of this.inks) ink.uResolve.value = resolve

    this.poseLeaves(q)
  }

  dispose() {
    this.group.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose()
        o.material.map?.dispose()
        o.material.dispose()
      }
    })
  }
}
