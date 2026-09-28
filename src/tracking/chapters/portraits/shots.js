import { useSyncExternalStore } from 'react'
import { assetExists } from '../../kit/assets'

export const ID = 'portraits'

// Zay's approved set lives in public/tracking/editorial/final/manifest.json.
// This copy is only the first paint (so the section has its real height
// before anything loads); the live manifest is fetched and wins if it differs.
const MANIFEST_URL = '/tracking/editorial/final/manifest.json'
const F = '/tracking/editorial/final'
const FALLBACK = [
  { id: 'rec', src: `${F}/rec.webp`, label: 'REC', styling: 'Colour · red tally light, sheer black shirt, curb chain', color: true, w: 1024, h: 1536 },
  { id: 'tailored', src: `${F}/tailored.webp`, label: 'TAILORED', styling: 'Charcoal suit, black shirt', color: false, w: 1342, h: 2000 },
  { id: 'chrome', src: `${F}/chrome.webp`, label: 'CHROME', styling: 'Oversized black jacket, bone knit, silver rings', color: false, w: 1024, h: 1536, cutout: `${F}/chrome-cutout.webp` },
  { id: 'skates', src: `${F}/skates.webp`, label: 'SKATES', styling: 'Colour · striped tee, roller rink', color: true, w: 1342, h: 2000 },
  { id: 'suit', src: `${F}/suit.webp`, label: 'SUIT', styling: 'Black suit, black turtleneck, hard light', color: false, w: 1024, h: 1536 },
  { id: 'paper', src: `${F}/paper.webp`, label: 'PAPER', styling: 'Charcoal suit through torn seamless', color: false, w: 1024, h: 1536, cutout: `${F}/paper-cutout.webp` },
  { id: 'blinds', src: `${F}/blinds.webp`, label: 'BLINDS', styling: 'White ribbed tank, slatted light', color: false, w: 1024, h: 1536 },
  { id: 'double', src: `${F}/double.webp`, label: 'DOUBLE', styling: 'Leather jacket, bone knit, pleated trousers', color: false, w: 1024, h: 1536 },
  { id: 'turn', src: `${F}/turn.webp`, label: 'TURN', styling: 'Black knit, long exposure', color: false, w: 1024, h: 1536 },
  { id: 'water', src: `${F}/water.webp`, label: 'WATER', styling: 'Wet skin, heavy curb chain', color: false, w: 1024, h: 1536 },
]

// What each frame shows, for screen readers and the lightbox <img alt>.
const ALT = {
  rec: 'Colour portrait of Zay in a dark studio, lit only by a small red tally light held beside his face. Red light on his cheek, a sheer black shirt open over a silver curb chain, eyes on the lens.',
  tailored: 'Black-and-white studio portrait of Zay in a charcoal suit and black shirt, looking straight into the lens against a grey backdrop.',
  chrome: 'Black-and-white portrait of Zay in an oversized black jacket and bone knit, holding a mirror-chrome spiked star against his cheek and looking off to the side.',
  skates: 'Colour photograph of Zay on roller skates in a red-and-white striped tee and cream trousers, gliding across a roller rink under warm lights.',
  suit: 'Black-and-white full-length portrait of Zay in a black suit and black turtleneck on a white studio sweep, one hand in his pocket, hard light throwing his shadow across the floor.',
  paper: 'Black-and-white full-length portrait of Zay in a charcoal suit stepping through a tear in a sheet of seamless paper, eyes down, torn scraps on the floor.',
  blinds: 'Black-and-white portrait of Zay in a white ribbed tank top, bands of slatted light falling across his face, shoulders and the wall behind him.',
  double: 'Black-and-white portrait of Zay in a leather jacket, bone knit and pleated trousers, hand in pocket, his profile shadow thrown large on the wall behind him.',
  turn: 'Black-and-white portrait of Zay in a black knit facing the lens, a long exposure trailing a blurred second profile of his head beside him.',
  water: 'Black-and-white close-up of Zay, water on his bare skin and a heavy silver curb chain at his collarbone, a direct, steady gaze.',
}

const withAlt = (s) => ({ ...s, alt: ALT[s.id] || `Portrait of Zay: ${s.label.toLowerCase()}, ${s.styling}.` })

// ── Store (render-free for the scene, useSyncExternalStore for React) ──
// list: the shots that actually exist, in series order.
let snap = { list: FALLBACK.map(withAlt) }
const subs = new Set()
let started = false

function publish(list) {
  const same = list.length === snap.list.length && list.every((s, i) => s.src === snap.list[i].src && s.cutout === snap.list[i].cutout)
  if (same) return
  snap = { list }
  subs.forEach((fn) => fn())
}

async function refresh() {
  let entries = FALLBACK
  try {
    const r = await fetch(MANIFEST_URL, { cache: 'no-cache' })
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
      const json = await r.json()
      if (Array.isArray(json) && json.length) entries = json
    }
  } catch { /* keep the bundled copy */ }
  // Graceful fallback: a missing print drops out of the wall, a missing
  // cut-out just means that print stays flat.
  const checked = await Promise.all(
    entries.map(async (s) => {
      if (!s?.src || !(await assetExists(s.src))) return null
      const cut = s.cutout && (await assetExists(s.cutout)) ? s.cutout : undefined
      return withAlt({ ...s, cutout: cut })
    }),
  )
  publish(checked.filter(Boolean))
}

function subscribe(fn) {
  subs.add(fn)
  if (!started) {
    started = true
    refresh()
  }
  return () => subs.delete(fn)
}

export const useShots = () => useSyncExternalStore(subscribe, () => snap).list
export const shotsNow = () => snap.list
export const pad2 = (n) => String(n).padStart(2, '0')
