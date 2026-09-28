import { MOMENTS } from './moments'

// Chapter progress (0..1 across the pinned travel) → beats.
//   0.00–0.26  the On The Radar mark assembles in voxels, resolves to its
//              own green and black, then opens like doors
//   0.19–0.29  the logo's white ring swings back and becomes the scope
//   0.26–1.00  the sweep: four contacts, each pinged and raised in turn
export const MARK_END = 0.36 // VoxelMark progress q = p / MARK_END

export const TL = {
  ring: [0.02, 0.09],
  doors: [0.19, 0.29],
  reveal: [0.24, 0.34],
  text: [0.235, 0.3],
  quote: [0.285, 0.305, 0.375, 0.395],
  markCap: [0.07, 0.1, 0.17, 0.195],
}

// Sweep keyframes [progress, bearing°]: the arm crosses each contact at its
// key, crawls between them (held pacing) and runs on past the last.
const KEYS = [[0.26, -168], ...MOMENTS.map((m, i) => [0.4 + i * 0.155, m.bearing]), [1, 186]]

export const DEG = Math.PI / 180

/** Target sweep bearing (radians, unwrapped) at progress p. */
export function sweepAt(p) {
  if (p <= KEYS[0][0]) return KEYS[0][1] * DEG
  for (let i = 1; i < KEYS.length; i++) {
    const [p1, b1] = KEYS[i]
    if (p <= p1) {
      const [p0, b0] = KEYS[i - 1]
      return (b0 + ((p - p0) / (p1 - p0)) * (b1 - b0)) * DEG
    }
  }
  return KEYS[KEYS.length - 1][1] * DEG
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** Fade in over [a,b], hold, fade out over [c,d]. */
export const window4 = ([a, b, c, d], v) => smooth(a, b, v) * (1 - smooth(c, d, v))
