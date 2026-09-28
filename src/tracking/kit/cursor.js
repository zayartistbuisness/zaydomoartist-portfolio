import { useEffect } from 'react'
import * as THREE from 'three'

// Pixel cursors in the spirit of the classic XP set (drawn for this site,
// public/tracking/cursors). Each maps a CSS keyword to an image + hotspot.
const C = '/tracking/cursors'
const set = (name, x, y, fallback) => {
  const ok = typeof CSS !== 'undefined' && CSS.supports('cursor', `image-set(url(${C}/${name}.png) 1x) ${x} ${y}, ${fallback}`)
  return ok
    ? `image-set(url(${C}/${name}.png) 1x, url(${C}/${name}@2x.png) 2x) ${x} ${y}, ${fallback}`
    : `url(${C}/${name}.png) ${x} ${y}, ${fallback}`
}

export const CURSORS = {
  arrow: () => set('arrow', 0, 0, 'default'),
  hand: () => set('hand', 5, 0, 'pointer'),
  text: () => set('text', 3, 8, 'text'),
  busy: () => set('busy', 0, 0, 'progress'),
  grab: () => set('grab', 8, 6, 'grab'),
}

const MAP = {
  pointer: 'hand', 'zoom-in': 'hand', 'zoom-out': 'hand',
  grab: 'grab', grabbing: 'grab', move: 'grab',
  text: 'text', wait: 'busy', progress: 'busy', default: 'arrow', auto: null,
}

// Rewrite keyword cursors in every same-origin stylesheet, so chapter CSS
// (cursor: pointer / grab / …) picks up the pixel set without edits.
function patchSheets() {
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules) walk(rule.cssRules)
      const c = rule.style?.cursor
      if (!c || c.includes('url(')) continue
      const key = MAP[c.trim()]
      if (key) rule.style.setProperty('cursor', CURSORS[key](), rule.style.getPropertyPriority('cursor'))
    }
  }
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules) } catch { /* cross-origin sheet */ }
  }
}

/**
 * Installs the pixel cursor on `root`: base arrow, hand on links/buttons and
 * on 3D objects that ask for a pointer, text beam in fields, and the
 * arrow-plus-hourglass while textures and models are loading.
 */
export function useXpCursor(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const vars = { '--cur-arrow': CURSORS.arrow(), '--cur-hand': CURSORS.hand(), '--cur-text': CURSORS.text(), '--cur-busy': CURSORS.busy(), '--cur-grab': CURSORS.grab() }
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)

    patchSheets()
    const mo = new MutationObserver(patchSheets) // HMR / lazy chapter CSS
    mo.observe(document.head, { childList: true, subtree: true, characterData: true })

    // Busy while three.js loaders are working (textures, GLBs).
    const lm = THREE.DefaultLoadingManager
    const prev = { onStart: lm.onStart, onLoad: lm.onLoad, onError: lm.onError }
    let pending = 0
    let timer
    const setBusy = (b) => {
      clearTimeout(timer)
      if (b) root.classList.add('xp-busy')
      else timer = setTimeout(() => root.classList.remove('xp-busy'), 150)
    }
    lm.onStart = (...a) => { pending++; setBusy(true); prev.onStart?.(...a) }
    lm.onLoad = (...a) => { pending = 0; setBusy(false); prev.onLoad?.(...a) }
    lm.onError = (...a) => { setBusy(false); prev.onError?.(...a) }

    // 3D hovers set document.body.style.cursor = 'pointer' (R3F convention).
    let raf
    const tick = () => {
      root.classList.toggle('xp-hand', document.body.style.cursor === 'pointer')
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      mo.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      Object.assign(lm, prev)
      root.classList.remove('xp-busy', 'xp-hand')
      void pending
    }
  }, [rootRef])
}
