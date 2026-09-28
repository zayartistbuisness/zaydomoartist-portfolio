import { useEffect, useState, useSyncExternalStore } from 'react'

// Shared, render-free state between the DOM section and the R3F scene.
//   active  last contact the sweep has passed (-1 before the first)
//   focus   contact the visitor clicked (-1 = follow the sweep)
//   hover   contact under the pointer or keyboard focus
//   caps    floating DOM captions, positioned by the scene each frame
// Discrete changes notify subscribers (the Section re-renders on them);
// per-frame values never do.
export const radar = { active: -1, focus: -1, hover: -1, caps: [] }

const listeners = new Set()
let snapshot = '-1|-1|-1'

export function setRadar(patch) {
  let changed = false
  for (const k in patch) {
    if (radar[k] !== patch[k]) {
      radar[k] = patch[k]
      changed = true
    }
  }
  if (!changed) return
  snapshot = `${radar.active}|${radar.focus}|${radar.hover}`
  listeners.forEach((l) => l())
}

/** The contact currently on stage: a clicked one wins over the sweep. */
export const shownIndex = () => (radar.focus >= 0 ? radar.focus : radar.active)

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** DOM side: { active, focus, hover, shown } as React state. */
export function useRadarState() {
  const snap = useSyncExternalStore(subscribe, () => snapshot)
  const [active, focus, hover] = snap.split('|').map(Number)
  return { active, focus, hover, shown: focus >= 0 ? focus : active }
}

// HEAD-check an image before any texture is mounted: the dev server answers
// a missing file with index.html (200, text/html), so the content type is
// what counts. Retries in dev while other agents are still delivering files.
const headCache = new Map()
function headImage(url) {
  if (!headCache.has(url)) {
    headCache.set(
      url,
      fetch(url, { method: 'HEAD', cache: 'no-store' })
        .then((r) => r.ok && (r.headers.get('content-type') || '').startsWith('image/'))
        .catch(() => false)
        .then((ok) => {
          if (!ok) headCache.delete(url)
          return ok
        }),
    )
  }
  return headCache.get(url)
}

export function useImageReady(url) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (!url) return undefined
    let live = true
    let timer
    const check = () =>
      headImage(url).then((found) => {
        if (!live) return
        if (found) setOk(true)
        else if (import.meta.env.DEV) timer = setTimeout(check, 12000)
      })
    check()
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [url])
  return ok
}
