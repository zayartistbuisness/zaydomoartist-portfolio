// One timeline for the DOM and the scene, both derived from the chapter's
// scroll progress p (0..1) and the number of prints n, so the caption rail,
// the buttons and the wall can never disagree.
//
// The wall position is the "wheel" w, in print slots: w = -1 is the title,
// w = i puts print i dead centre.
import { useSyncExternalStore } from 'react'

// Scroll budget in vh. Height adapts to the set, so pacing stays the same
// whether the wall holds two prints or ten (10 prints ≈ 430vh).
export const VH = { hold: 10, intro: 34, step: 28, tail: 34 }
export const travelVh = (n) => VH.hold + VH.intro + VH.step * Math.max(0, n - 1) + VH.tail
export const sectionVh = (n) => 100 + travelVh(n)

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Each print dwells at the centre for a stretch of scroll, then the wall
 * turns to the next one (with a little residual drift so it never feels
 * dead under the wheel).
 */
export function dwell(o) {
  const k = Math.round(o)
  const g = o - k
  const w = Math.max(0, (Math.abs(g) - 0.14) / 0.36)
  return k + g * 0.1 + Math.sign(g) * 0.45 * w * w
}

export function wheelAt(p, n) {
  const u = p * travelVh(n)
  if (u <= VH.hold) return -1
  const a = VH.hold + VH.intro
  if (u <= a) return -1 + easeInOut((u - VH.hold) / VH.intro)
  if (n <= 1) return 0
  const k = (u - a) / VH.step
  return k >= n - 1 ? n - 1 : dwell(k)
}

/** Progress at which print i sits centred (i = -1: the title). */
export const progressForSlot = (i, n) => (i < 0 ? 0 : (VH.hold + VH.intro + VH.step * i) / travelVh(n))

// Render-free state shared by the DOM and the scene.
//   nudge / nudgeTarget  drag offset in slots (DOM writes the target)
//   pitchPx              on-screen distance between print centres (scene)
//   wheel                current wall position incl. nudge (scene)
//   hover                print under the cursor, -1 for none (scene)
//   rec                  0..1 how centred the colour print is (scene)
//   moved                the last pointer gesture was a drag, not a click
export const wall = { nudge: 0, nudgeTarget: 0, dragging: false, moved: false, pitchPx: 420, wheel: -1, hover: -1, rec: 0 }

// Lightbox state: index into the shots list, -1 when closed.
let box = -1
const boxSubs = new Set()
export function openPrint(i) {
  box = i
  boxSubs.forEach((fn) => fn())
}
export const closePrint = () => openPrint(-1)
export const useOpenPrint = () =>
  useSyncExternalStore(
    (fn) => {
      boxSubs.add(fn)
      return () => boxSubs.delete(fn)
    },
    () => box,
  )
