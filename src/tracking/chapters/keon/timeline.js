// KEON · "The Filmstrip": one timeline shared by the DOM (Section) and the
// WebGL scene, both derived from the chapter's scroll progress p (0..1), so
// the caption rail and the strip can never disagree.
import { clamp01 } from '../../kit/space'

export const ID = 'keon'
export const BASE = '/tracking/chapters/keon'

// The one definition of the narrow layout, used by keon.css
// (`@media (max-width: 760px), (max-aspect-ratio: 1/1)`) and by the 3D:
// phones, plus any portrait screen (tablets held upright).
export const isNarrow = (w, h) => w <= 760 || w <= h

// Strip slots in running order. Slot 6 is a clear frame: the
// "Behind the camera" beat between the on-screen and BTS frames.
// Titles are moods, not scenes (featured-projects-brief.md §2).
export const SLOTS = [
  { n: '01', title: 'The corner', img: 'keon-01-corner', group: 'On screen' },
  { n: '02', title: 'Hand wraps', img: 'keon-02-handwraps', group: 'On screen' },
  { n: '03', title: 'Roadwork', img: 'keon-03-roadwork', group: 'On screen' },
  { n: '04', title: 'Ring walk', img: 'keon-04-ringwalk', group: 'On screen' },
  { n: '05', title: 'Heavy bag', img: 'keon-05-heavybag', group: 'On screen' },
  { n: '06', title: 'Mirror', img: 'keon-06-mirror', group: 'On screen' },
  { n: '—', title: 'Behind the camera', img: null, group: 'Changeover', beat: true },
  { n: '07', title: 'At the monitor', img: 'keon-07-bts-monitor', group: 'Behind the camera' },
  { n: '08', title: 'Blocking', img: 'keon-08-bts-blocking', group: 'Behind the camera' },
  { n: '09', title: 'Handheld', img: 'keon-09-bts-handheld', group: 'Behind the camera' },
]
export const BEAT = 6
export const LAST = SLOTS.length - 1

// Progress landmarks (fraction of the pinned travel).
//   0.00–0.20  title mark: voxels in → chrome white → doors open
//   0.15–0.26  the strip threads in from depth, leader parks in the gate
//   0.26–0.97  frames 01…09 step through the gate (projector dwell)
//   0.97–1.00  the strip starts to pull on as the stage scrolls away
export const P = { markEnd: 0.2, threadFrom: 0.15, threadTo: 0.26, framesTo: 0.97 }

// Strip offset in slots: slot i sits centred in the gate when offset === i.
export const O = { threadFrom: -21, lead: -1, last: LAST, end: LAST + 0.6 }
// Physical film extent (slots). Both ends are cut on a frame line.
export const FILM = { head: -10.5, tail: 12.5 }

const easeOut3 = (t) => 1 - (1 - t) ** 3

/**
 * Intermittent movement, like a projector's claw: each frame holds in the
 * gate for a stretch of scroll, then the strip pulls to the next one. Keeps a
 * little residual drift so the strip never feels dead under the wheel.
 */
export function dwell(o) {
  const n = Math.round(o)
  const g = o - n
  const w = Math.max(0, (Math.abs(g) - 0.16) / 0.34)
  return n + g * 0.12 + Math.sign(g) * 0.44 * w * w
}

/** Scroll-driven strip offset (slots), before any drag nudge. */
export function stripOffset(p) {
  if (p <= P.threadTo) {
    const t = clamp01((p - P.threadFrom) / (P.threadTo - P.threadFrom))
    return O.threadFrom + (O.lead - O.threadFrom) * easeOut3(t)
  }
  if (p <= P.framesTo) {
    const t = (p - P.threadTo) / (P.framesTo - P.threadTo)
    return dwell(O.lead + (O.last - O.lead) * t)
  }
  const t = clamp01((p - P.framesTo) / (1 - P.framesTo))
  return O.last + (O.end - O.last) * t * t
}

/** Progress at which slot i dwells in the gate. */
export function progressForSlot(i) {
  return P.threadTo + ((i - O.lead) / (O.last - O.lead)) * (P.framesTo - P.threadTo)
}

/** Title-mark progress for the shared VoxelMark (its doors are open by 0.7). */
export function markProgress(p) {
  return Math.min(1, (p / P.markEnd) * 0.74)
}

// Render-free state shared by DOM and scene (like labStore).
//   nudgeTarget  slots, written by the DOM while dragging
//   nudge        damped nudge, written by the scene; the DOM reads it too
//   framePx      on-screen pitch of one frame in the gate (CSS px)
export const keonStore = { nudge: 0, nudgeTarget: 0, dragging: false, framePx: 400 }
