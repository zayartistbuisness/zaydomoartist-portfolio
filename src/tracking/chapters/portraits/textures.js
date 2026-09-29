import * as THREE from 'three'

/** Resolves to a decoded image, or null if it can't be loaded. */
export function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** The image itself when it's already small enough, else a high-quality downscale. */
export function fitSource(img, maxH) {
  if (img.naturalHeight <= maxH) return img
  const k = maxH / img.naturalHeight
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * k)
  c.height = maxH
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, c.width, c.height)
  return c
}

/** Mipmapped texture, uploaded now so it never stalls a scroll frame. */
export function makeTexture(source, gl, anisotropy = 8) {
  const t = new THREE.Texture(source)
  t.colorSpace = THREE.NoColorSpace
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.magFilter = THREE.LinearFilter
  t.generateMipmaps = true
  t.anisotropy = Math.min(anisotropy, gl.capabilities.getMaxAnisotropy())
  t.needsUpdate = true
  gl.initTexture(t)
  return t
}

export const fontsReady = () =>
  Promise.all([
    document.fonts?.load('400 120px "Instrument Serif"'),
    document.fonts?.load('400 12px "JetBrains Mono"'),
  ]).catch(() => null)

/** The wall title: white serif on transparent, cropped to the ink. */
export function titleCanvas(text, italic = false) {
  const px = 360
  const font = `${italic ? 'italic ' : ''}400 ${px}px "Instrument Serif", serif`
  const probe = document.createElement('canvas').getContext('2d')
  probe.font = font
  const m = probe.measureText(text)
  const pad = Math.round(px * 0.12)
  const asc = Math.ceil(m.actualBoundingBoxAscent || px * 0.72)
  const desc = Math.ceil(m.actualBoundingBoxDescent || px * 0.22)
  const left = Math.ceil(m.actualBoundingBoxLeft || 0)
  const w = Math.ceil((m.actualBoundingBoxRight || m.width) + left) + pad * 2
  const c = document.createElement('canvas')
  c.width = w
  c.height = asc + desc + pad * 2
  const ctx = c.getContext('2d')
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(text, pad + left, pad + asc)
  return c
}
