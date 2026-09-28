// Screen ↔ world helpers for a perspective camera looking down -Z.
// All DOM measurements are CSS px from getBoundingClientRect().

/** Visible world width/height of the plane at depth z. */
export function viewportAt(state, camera, z = 0) {
  return state.viewport.getCurrentViewport(camera, [0, 0, z])
}

/** Map a DOM rect onto the plane at depth z → { x, y, w, h } (centre + size). */
export function rectToWorld(rect, state, camera, z = 0) {
  const vp = viewportAt(state, camera, z)
  const { width, height } = state.size
  return {
    x: ((rect.left + rect.width / 2) / width - 0.5) * vp.width,
    y: (0.5 - (rect.top + rect.height / 2) / height) * vp.height,
    w: (rect.width / width) * vp.width,
    h: (rect.height / height) * vp.height,
  }
}

/** Map a CSS-px y (from viewport top) to world y on the plane at depth z. */
export function screenYToWorld(y, state, camera, z = 0) {
  const vp = viewportAt(state, camera, z)
  return (0.5 - y / state.size.height) * vp.height
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** Remap progress q from [a,b] to 0..1 (clamped, linear). */
export const range = (a, b, q) => clamp01((q - a) / (b - a))

/**
 * How far a chapter's pinned stage is displaced from the viewport, in world
 * units at depth z: positive before the pin engages (stage still rising into
 * view), negative after it releases (stage scrolling away). Add it to the y of
 * anything that should travel with the stage.
 */
export function stageShift(c, state, camera, z = 0) {
  if (!c.rect) return 0
  const vh = state.size.height
  let px = 0
  if (c.rect.top > 0) px = c.rect.top
  else if (c.rect.bottom < vh) px = c.rect.bottom - vh
  return -px * (viewportAt(state, camera, z).height / vh)
}
