import { useEffect, useState } from 'react'

/*
 * Images for the house, and the drawn cards used beside (or until) them.
 * Event photos live in public/tracking/chapters/memehouse/event/ (real,
 * credited stills; see assets/event-photos/MANIFEST.md). Every image is
 * HEAD-checked (the dev server answers missing files with index.html, so
 * the content type must be image/*) before anything tries to load it.
 */

const SERIF = '"Instrument Serif", Georgia, serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'
const PAPER = '#ece8e0'
const INK = '#111110'
const SCREEN = '#121211'
const BONE = '#e8e4db'

const found = new Map() // url -> true | false (false = checked, missing)

function headIsImage(url) {
  return fetch(url, { method: 'HEAD', cache: 'no-store' })
    .then((r) => r.ok && (r.headers.get('content-type') || '').startsWith('image/'))
    .catch(() => false)
}

/** Returns `url` once it exists as an image, else null. Polls in dev. */
export function useAsset(url) {
  const [ok, setOk] = useState(() => found.get(url) === true)
  useEffect(() => {
    if (found.get(url) === true) return undefined
    let live = true
    let timer
    const check = () => {
      headIsImage(url).then((yes) => {
        if (!live) return
        found.set(url, yes)
        if (yes) setOk(true)
        else if (import.meta.env.DEV) timer = setTimeout(check, 6000)
      })
    }
    check()
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [url])
  return ok ? url : null
}

/* ── Drawn cards (canvas → blob URL, made once) ─────────────────────────── */

let fontsReady = null
function loadFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load(`400 120px ${SERIF}`),
      document.fonts.load(`italic 400 120px ${SERIF}`),
      document.fonts.load(`400 24px ${MONO}`),
    ]).catch(() => null)
  }
  return fontsReady
}

function canvas(w, h, bg) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  return { c, ctx }
}

function mono(ctx, text, x, y, size, color, align = 'left', spacing = 0.12) {
  ctx.font = `400 ${size}px ${MONO}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * spacing)}px`
  ctx.fillText(text.toUpperCase(), x, y)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

function serif(ctx, text, x, y, size, color, { italic = false, align = 'left' } = {}) {
  ctx.font = `${italic ? 'italic ' : ''}400 ${size}px ${SERIF}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(-size * 0.02)}px`
  ctx.fillText(text, x, y)
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

// Faint raster lines so a screen reads as a screen once it resolves.
function scanlines(ctx, w, h) {
  ctx.fillStyle = 'rgba(232, 228, 219, 0.035)'
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2)
}

const DRAW = {
  // The Debut: fifty numbered days; the closing run (46–50) set in ink.
  debutDays() {
    const W = 1200
    const Hh = 900
    const { c, ctx } = canvas(W, Hh, PAPER)
    serif(ctx, 'The Debut', 64, 150, 118, INK, { italic: true })
    mono(ctx, 'Isaac Francis · Twitch', W - 64, 86, 22, INK, 'right')
    mono(ctx, 'Fifty days', W - 64, 124, 22, INK, 'right')
    const x0 = 64
    const y0 = 214
    const cw = (W - 128) / 10
    const ch = 104
    ctx.lineWidth = 2
    for (let i = 0; i < 50; i++) {
      const x = x0 + (i % 10) * cw
      const y = y0 + Math.floor(i / 10) * ch
      const closing = i >= 45
      ctx.fillStyle = closing ? INK : PAPER
      ctx.fillRect(x + 4, y + 4, cw - 8, ch - 8)
      ctx.strokeStyle = INK
      ctx.strokeRect(x + 4, y + 4, cw - 8, ch - 8)
      mono(ctx, String(i + 1).padStart(2, '0'), x + 16, y + 38, 22, closing ? PAPER : INK, 'left', 0.04)
    }
    mono(ctx, 'Days 46–50 · Nov 24 – Dec 7, 2025', 64, Hh - 52, 22, INK)
    return c
  },

  miamiScreen() {
    const W = 1600
    const Hh = 900
    const { c, ctx } = canvas(W, Hh, SCREEN)
    scanlines(ctx, W, Hh)
    serif(ctx, 'Day 50 / 50', W / 2, Hh / 2 + 70, 270, BONE, { align: 'center' })
    mono(ctx, 'Miami Art Basel Party · Dec 7, 2025', W / 2, Hh / 2 + 180, 30, BONE, 'center')
    return c
  },

  // Grey seascape in tone only: horizon, swell, sky.
  pendingCoast() {
    const W = 1800
    const Hh = 1000
    const { c, ctx } = canvas(W, Hh, PAPER)
    const sky = ctx.createLinearGradient(0, 0, 0, Hh * 0.58)
    sky.addColorStop(0, '#dcd8cf')
    sky.addColorStop(1, '#b9b4aa')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, Hh * 0.58)
    const sea = ctx.createLinearGradient(0, Hh * 0.58, 0, Hh)
    sea.addColorStop(0, '#6f6b64')
    sea.addColorStop(1, '#3d3b37')
    ctx.fillStyle = sea
    ctx.fillRect(0, Hh * 0.58, W, Hh * 0.42)
    ctx.fillStyle = 'rgba(232,228,219,0.18)'
    for (let i = 0; i < 26; i++) {
      const y = Hh * 0.6 + i * i * 0.6
      ctx.fillRect(0, y, W, 1 + i * 0.12)
    }
    return c
  },
}

const drawn = new Map() // key -> Promise<string>

function drawCard(key) {
  if (!drawn.has(key)) {
    drawn.set(
      key,
      loadFonts().then(
        () => new Promise((resolve) => {
          DRAW[key]().toBlob((b) => resolve(URL.createObjectURL(b)), 'image/png')
        }),
      ),
    )
  }
  return drawn.get(key)
}

/** Blob URL of a drawn card, once drawn. */
export function useDrawn(key) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let live = true
    drawCard(key).then((u) => live && setUrl(u))
    return () => { live = false }
  }, [key])
  return url
}

/** A real image when it exists, else the drawn stand-in. */
export function useImageOr(url, fallbackKey) {
  const real = useAsset(url)
  const drawnUrl = useDrawn(fallbackKey)
  return real || drawnUrl
}
