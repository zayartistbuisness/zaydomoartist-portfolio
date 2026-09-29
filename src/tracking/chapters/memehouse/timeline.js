import { getChapter } from '../../kit/chapterStore'
import { clamp01, range, smooth } from '../../kit/space'

export const ID = 'memehouse'
export const BASE = '/tracking/chapters/memehouse/'

/*
 * Facts: every fact on this chapter is event-level and comes from
 * site/research/featured-projects-brief.md §3 (MemeHouse). Nothing here is a
 * personal credit. The sources and the event-photo credits for the rooms
 * (assets/event-photos/MANIFEST.md) live in content/credits.js, rendered in
 * the Contact footer; on screen the chapter stays art-first.
 */

/*
 * Camera stops, in chapter progress. `hold` is where the camera rests; the
 * gaps between holds are the dolly moves. `t` is the look-at point in house
 * units, az/el the orbit angles (radians) and fw/fh the box that must fit in
 * the layout's safe area, from which the dolly distance is solved.
 */
export const KEYS = [
  { key: 'arrive', hold: [0, 0.12], t: [0, 1.85, 0.3], az: -0.66, el: 0.36, fw: 9.5, fh: 8.4 },
  { key: 'house', hold: [0.205, 0.26], t: [0, 1.85, 0.3], az: -0.36, el: 0.22, fw: 5.7, fh: 5.25 },
  // Room framing is solved at the cut plane (z ≈ 0.6) so the poché frame fits.
  { key: 'debut', room: 0, hold: [0.32, 0.39], t: [-1.1, 0.8, 0.6], az: 0.36, el: 0.1, fw: 2.75, fh: 1.95 },
  { key: 'capaholics', room: 1, hold: [0.45, 0.52], t: [1.1, 0.8, 0.6], az: -0.3, el: 0.12, fw: 2.75, fh: 1.95 },
  { key: 'studio', room: 2, hold: [0.58, 0.65], t: [-1.1, 2.7, 0.6], az: 0.38, el: -0.03, fw: 2.75, fh: 2.85 },
  { key: 'miami', room: 3, hold: [0.71, 0.79], t: [1.1, 2.7, 0.6], az: 0.3, el: -0.02, fw: 2.75, fh: 2.85 },
  { key: 'section', hold: [0.87, 1.01], t: [0, 1.95, 0], az: 0.0, el: 0.035, fw: 5.3, fh: 4.75 },
]

/*
 * DOM captions, one per stop after the arrival: the room's name and one
 * short line. `body` is the sourced, event-level context, kept for screen
 * readers only. The studio stop carries his pull-quote (voice.memehouse).
 */
export const STOPS = [
  {
    key: 'house',
    title: 'The house',
    line: 'Los Angeles',
    body: 'MemeHouse is a Los Angeles live-production company that stages and streams creator events, from festival houses to multi-day marathons.',
  },
  {
    key: 'debut',
    room: 0,
    title: 'The Debut',
    line: 'Nov 24 – Dec 7, 2025',
    body: 'Isaac Francis’s numbered fifty-day Twitch series. The closing run, Days 46–50, stopped in New York on Black Friday and wrapped with Day 50/50 at Miami Art Basel on December 7, 2025.',
  },
  {
    key: 'capaholics',
    room: 1,
    title: 'Capaholics',
    line: 'Oct 2, 2025 · TwitchCon weekend 2025',
    body: 'A streaming collective whose members include DDG, Deshae Frost and Dub. It launched a stream-a-thon with a party in Los Angeles on October 2, 2025. During TwitchCon weekend, MemeHouse LA hosted Capaholics at its La Jolla mansion studio, a company production.',
  },
  {
    key: 'studio',
    room: 2,
    title: 'The studio',
    line: 'La Jolla · TwitchCon weekend 2025',
    // Renders voice.memehouse.lines as a pull-quote.
    quote: true,
    body: 'MemeHouse LA’s mansion studio in La Jolla over TwitchCon weekend 2025, a company production. The people pictured aren’t named by the source.',
  },
  {
    key: 'miami',
    room: 3,
    title: 'Art Basel / Miami',
    line: 'Dec 7, 2025',
    body: 'The Debut’s last stop. Day 50/50 streamed from Miami as the “Miami Art Basel Party” and closed the fifty-day run.',
  },
  {
    key: 'section',
    title: 'In section',
    line: 'Four rooms',
    body: 'The Debut, Capaholics, the studio and Miami, drawn as one house. Company productions are MemeHouse’s credits, not Zay’s.',
  },
]

/*
 * The one definition of the narrow layout: phones, plus any portrait screen
 * (tablets held upright). memehouse.css uses the same media query, and the
 * scene reads it through LAYOUT.on, so the camera framing and the DOM
 * layout always switch together.
 */
export const NARROW_MQ = '(max-width: 760px), (max-aspect-ratio: 1/1)'

/*
 * Narrow layout, measured from the DOM by Section (CSS px from the top of
 * the pinned stage): where the header copy ends and where each stop's
 * caption begins. On narrow screens the camera fits the house between the
 * two. `on` is true only while NARROW_MQ matches.
 */
export const LAYOUT = { on: false, top: 0, caps: STOPS.map(() => 0) }

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * Where the camera is along the KEYS track: segment index, whether it is
 * holding, and the eased blend toward the next key.
 */
export function trackAt(p, out) {
  const last = KEYS.length - 1
  for (let i = 0; i < last; i++) {
    const a = KEYS[i]
    const b = KEYS[i + 1]
    if (p <= a.hold[1]) {
      out.i = i
      out.hold = true
      out.h = range(a.hold[0], a.hold[1], p)
      out.e = 0
      return out
    }
    if (p < b.hold[0]) {
      out.i = i
      out.hold = false
      out.h = 1
      out.e = easeInOut(range(a.hold[1], b.hold[0], p))
      return out
    }
  }
  const k = KEYS[last]
  out.i = last
  out.hold = true
  out.h = range(k.hold[0], k.hold[1], p)
  out.e = 0
  return out
}

const STOP_TR = { i: 0, hold: true, h: 0, e: 0 }

/** Index into STOPS of the caption that owns progress p (switches mid-move). */
export function stopAt(p) {
  const tr = trackAt(p, STOP_TR)
  const k = tr.hold ? tr.i : tr.e < 0.5 ? tr.i : tr.i + 1
  return Math.max(0, k - 1)
}

/** 0..1: how "lit" room r is at progress p (1 while its stop holds). */
export function roomLight(r, tr) {
  const k = r + 2
  const last = KEYS.length - 1
  let v = 0
  if (tr.hold) {
    if (tr.i === k || tr.i === last) v = 1
  } else {
    // Cross-handoff: the room being left dims as the next one comes up.
    if (tr.i + 1 === k || tr.i + 1 === last) v = smooth(0.18, 0.9, tr.e)
    if (tr.i === k) v = Math.max(v, 1 - smooth(0.1, 0.82, tr.e))
  }
  return v
}

/** 0..1: how far into the room-by-room tour (0 on the wide shots). */
export const tourAt = (p) => smooth(0.262, 0.3, p) * (1 - smooth(0.8, 0.86, p))

/** Ink strength of room r: full on wide shots, faint unless lit on the tour. */
export function roomFocusAlpha(r, tr, p) {
  return 1 - tourAt(p) * (1 - Math.max(0.24, roomLight(r, tr)))
}

/** The house fades in behind the voxel doors. */
export const presenceAt = (p) => smooth(0.13, 0.2, p)

/** Voxel mark timeline, compressed into the chapter's opening. */
export const markProgress = () => clamp01(getChapter(ID).progress / 0.22) * 0.72

/** Dolly to a stop by scrolling the page to it (keeps DOM and camera in sync). */
export function scrollToStop(i) {
  const el = getChapter(ID).el
  if (!el) return
  const r = el.getBoundingClientRect()
  const travel = Math.max(1, r.height - window.innerHeight)
  const [a, b] = KEYS[i + 1].hold
  const y = r.top + window.scrollY + travel * (a + (Math.min(b, 1) - a) * 0.3)
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  // The lab exposes its Lenis instance in dev; production should get a kit
  // helper for this (see the chapter report).
  const lenis = window.__lenis
  if (lenis) lenis.scrollTo(y, reduce ? { immediate: true } : { duration: 1.8 })
  else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' })
}
