// Optional assets: images that may not exist yet (still being produced).
// The dev server answers unknown paths with index.html (200), so check the
// content-type rather than the status alone.
const cache = new Map()

export function assetExists(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url, { method: 'HEAD' })
        .then((r) => r.ok && (r.headers.get('content-type') || '').startsWith('image/'))
        .catch(() => false),
    )
  }
  return cache.get(url)
}

/** Resolves to a decoded HTMLImageElement, or null if the file isn't there. */
export async function loadOptionalImage(url) {
  if (!(await assetExists(url))) return null
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}
