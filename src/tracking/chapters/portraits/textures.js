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

/**
 * A museum wall label, drawn at S× CSS px:
 *   04 ─ PAPER
 *   CHARCOAL SUIT THROUGH TORN SEAMLESS
 * Returns the canvas plus its size in CSS px.
 */
export function captionCanvas({ num, label, styling, maxW = 340, S = 3 }) {
  const mono = '"JetBrains Mono", ui-monospace, monospace'
  const f1 = 11.5
  const f2 = 9.5
  const probe = document.createElement('canvas').getContext('2d')
  const setFont = (ctx, size, track) => {
    ctx.font = `400 ${size * S}px ${mono}`
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * track * S}px`
  }

  // Wrap the styling line to the label width.
  setFont(probe, f2, 0.05)
  const words = styling.toUpperCase().split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (cur && probe.measureText(next).width / S > maxW) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  const lineW = Math.max(...lines.map((l) => probe.measureText(l).width / S))
  setFont(probe, f1, 0.12)
  const numW = probe.measureText(num).width / S
  const labW = probe.measureText(label).width / S
  const rule = 16
  const headW = numW + 8 + rule + 8 + labW

  const wCss = Math.ceil(Math.max(headW, lineW) + 4)
  const row2 = f2 * 1.45
  const hCss = Math.ceil(f1 * 1.25 + 7 + row2 * lines.length + 3)
  const c = document.createElement('canvas')
  c.width = wCss * S
  c.height = hCss * S
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'alphabetic'

  const base1 = f1 * 1.0 * S
  setFont(ctx, f1, 0.12)
  ctx.globalAlpha = 0.52
  ctx.fillText(num, 0, base1)
  ctx.globalAlpha = 0.4
  ctx.fillRect((numW + 8) * S, base1 - f1 * 0.36 * S, rule * S, Math.max(1, S * 0.75))
  ctx.globalAlpha = 1
  ctx.fillText(label, (numW + 8 + rule + 8) * S, base1)

  setFont(ctx, f2, 0.05)
  ctx.globalAlpha = 0.6
  lines.forEach((l, i) => ctx.fillText(l, 0, (f1 * 1.25 + 7 + f2 + row2 * i) * S))
  return { canvas: c, wCss, hCss }
}
