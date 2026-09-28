// Yearbook page artwork, typeset on 2D canvases and wrapped onto the 3D
// pages. Facts: site/research/featured-projects-brief.md (event-level only).
// Event photographs come from the official Streamer University 2026 yearbook;
// the staff portrait is an illustration. The colophon says so on the page.

import { voice } from '../../content/voice'

export const PAGE_W = 1200
export const PAGE_H = 1600

const INK = '#151412'
const PAPER = '#efe9dd'
const BURGUNDY = '#5a0e18'
const GOLD = '#d9a441'
const SERIF = "'Instrument Serif', Georgia, serif"
const MONO = "'JetBrains Mono', ui-monospace, monospace"

// Deterministic grain so pages don't shimmer between redraws.
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function grain(ctx, alpha, seed, color = '0,0,0') {
  const r = rng(seed)
  ctx.fillStyle = `rgba(${color},${alpha})`
  for (let i = 0; i < 9000; i++) ctx.fillRect(r() * PAGE_W, r() * PAGE_H, 1.4, 1.4)
}

function paper(ctx, seed, tone = PAPER) {
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  grain(ctx, 0.05, seed)
  // gutter shadow is added in 3D; a faint deckle at the outer edge only
}

function mono(ctx, text, x, y, { size = 22, align = 'left', color = INK, spacing = 3, alpha = 1 } = {}) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `${size}px ${MONO}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.letterSpacing = `${spacing}px`
  ctx.fillText(text.toUpperCase(), x, y)
  ctx.restore()
}

function serif(ctx, text, x, y, { size = 96, align = 'left', color = INK, italic = false } = {}) {
  ctx.save()
  ctx.font = `${italic ? 'italic ' : ''}${size}px ${SERIF}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.letterSpacing = `${-size * 0.02}px`
  ctx.fillText(text, x, y)
  ctx.restore()
}

function wrap(ctx, text, x, y, maxW, lineH, font, color = INK) {
  ctx.save()
  ctx.font = font
  ctx.fillStyle = color
  const words = text.split(' ')
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y)
      line = w
      y += lineH
    } else line = test
  }
  if (line) ctx.fillText(line, x, y)
  ctx.restore()
  return y
}

function wrapCentered(ctx, text, cx, y, maxW, lineH, font, color = INK) {
  ctx.save()
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  const words = text.split(' ')
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, y)
      line = w
      y += lineH
    } else line = test
  }
  if (line) ctx.fillText(line, cx, y)
  ctx.restore()
  return y
}

function rule(ctx, x1, y, x2, alpha = 0.35) {
  ctx.save()
  ctx.strokeStyle = `rgba(21,20,18,${alpha})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
  ctx.restore()
}

function folio(ctx, n, side) {
  mono(ctx, String(n).padStart(2, '0'), side === 'left' ? 90 : PAGE_W - 90, PAGE_H - 70, { size: 20, align: side === 'left' ? 'left' : 'right', alpha: 0.6 })
  mono(ctx, 'Streamer University · Class of 2026', side === 'left' ? PAGE_W - 90 : 90, PAGE_H - 70, { size: 16, align: side === 'left' ? 'right' : 'left', alpha: 0.45 })
}

// A mounted photograph: cover-fit, greyscale, with black photo corners.
// Missing images become a hatched plate until the file arrives.
function photo(ctx, img, x, y, w, h, { rotate = 0, caption, color = false } = {}) {
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate(rotate)
  ctx.fillStyle = 'rgba(0,0,0,0.16)'
  ctx.fillRect(-w / 2 + 8, -h / 2 + 12, w, h)
  if (img) {
    const s = Math.max(w / img.width, h / img.height)
    const iw = img.width * s
    const ih = img.height * s
    ctx.save()
    ctx.beginPath()
    ctx.rect(-w / 2, -h / 2, w, h)
    ctx.clip()
    ctx.filter = color ? 'contrast(1.03)' : 'grayscale(1) contrast(1.06)'
    ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih)
    ctx.restore()
  } else {
    ctx.save()
    ctx.beginPath()
    ctx.rect(-w / 2, -h / 2, w, h)
    ctx.clip()
    ctx.fillStyle = '#dcd4c5'
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.strokeStyle = 'rgba(21,20,18,0.14)'
    ctx.lineWidth = 3
    for (let i = -h; i < w; i += 16) {
      ctx.beginPath()
      ctx.moveTo(-w / 2 + i, h / 2)
      ctx.lineTo(-w / 2 + i + h, -h / 2)
      ctx.stroke()
    }
    ctx.restore()
    mono(ctx, 'Photograph in production', 0, 8, { size: 18, align: 'center', alpha: 0.55 })
  }
  // photo corners
  ctx.fillStyle = INK
  const c = Math.min(w, h) * 0.09
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    ctx.beginPath()
    ctx.moveTo(sx * w / 2, sy * h / 2)
    ctx.lineTo(sx * w / 2 - sx * c, sy * h / 2)
    ctx.lineTo(sx * w / 2, sy * h / 2 - sy * c)
    ctx.closePath()
    ctx.fill()
  }
  if (caption) mono(ctx, caption, -w / 2, h / 2 + 40, { size: 17, alpha: 0.6 })
  ctx.restore()
}

// Tint a monogram image a flat colour (foil stamp).
function stamp(ctx, img, x, y, w, color, alpha = 1) {
  if (!img) return
  const h = (img.height / img.width) * w
  const off = document.createElement('canvas')
  off.width = Math.ceil(w)
  off.height = Math.ceil(h)
  const o = off.getContext('2d')
  o.drawImage(img, 0, 0, w, h)
  o.globalCompositeOperation = 'source-in'
  o.fillStyle = color
  o.fillRect(0, 0, w, h)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.drawImage(off, x - w / 2, y - h / 2)
  ctx.restore()
}

/* ── Page sides ─────────────────────────────────────────────────────── */

export function drawCover(ctx, a) {
  ctx.fillStyle = BURGUNDY
  ctx.fillRect(0, 0, PAGE_W, PAGE_H)
  grain(ctx, 0.07, 11)
  grain(ctx, 0.035, 12, '255,220,200')
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 3
  ctx.strokeRect(70, 70, PAGE_W - 140, PAGE_H - 140)
  ctx.lineWidth = 1.5
  ctx.strokeRect(86, 86, PAGE_W - 172, PAGE_H - 172)
  mono(ctx, 'Streamer University', PAGE_W / 2, 250, { size: 30, align: 'center', color: GOLD, spacing: 12 })
  stamp(ctx, a.monogram, PAGE_W / 2, 760, 560, GOLD)
  serif(ctx, 'Class of 2026', PAGE_W / 2, 1270, { size: 104, align: 'center', color: GOLD, italic: true })
  mono(ctx, 'Hendrix College · Conway, Arkansas', PAGE_W / 2, 1360, { size: 22, align: 'center', color: GOLD, spacing: 6 })
}

export function drawEndpaper(ctx, a) {
  paper(ctx, 21, '#e6dccb')
  if (!a.monogram) return
  for (let y = 60; y < PAGE_H; y += 180) {
    for (let x = (Math.round(y / 180) % 2) * 110; x < PAGE_W + 100; x += 220) {
      stamp(ctx, a.monogram, x, y, 110, BURGUNDY, 0.09)
    }
  }
}

export function drawTitle(ctx) {
  paper(ctx, 31)
  mono(ctx, 'The Yearbook', 90, 150, { size: 22 })
  mono(ctx, 'Vol. II', PAGE_W - 90, 150, { size: 22, align: 'right' })
  rule(ctx, 90, 180, PAGE_W - 90)
  serif(ctx, 'Streamer', 86, 520, { size: 250 })
  serif(ctx, 'University', 86, 740, { size: 250 })
  serif(ctx, 'Two', 90, 950, { size: 250, italic: true, color: BURGUNDY })
  rule(ctx, 90, 1080, PAGE_W - 90)
  mono(ctx, 'July 15 – 20, 2026', 90, 1140, { size: 24 })
  mono(ctx, 'Hendrix College · Conway, Arkansas', 90, 1182, { size: 24 })
  wrap(ctx, 'Six days on a college campus in Arkansas, streamed almost without a break.', 90, 1320, PAGE_W - 180, 70, `italic 58px ${SERIF}`)
  folio(ctx, 1, 'right')
}

export function drawStaff(ctx, a) {
  paper(ctx, 41)
  mono(ctx, 'Staff', 90, 150, { size: 22 })
  mono(ctx, 'Creative', PAGE_W - 90, 150, { size: 22, align: 'right' })
  rule(ctx, 90, 180, PAGE_W - 90)
  // Real SU yearbook portraits are colour flash photos; keep this one in colour.
  photo(ctx, a.portrait, 290, 260, 620, 780, { rotate: -0.012, color: true })
  serif(ctx, 'Zay “Domo” Artist', PAGE_W / 2, 1180, { size: 92, align: 'center' })
  mono(ctx, voice.su2.role, PAGE_W / 2, 1244, { size: 24, align: 'center', color: BURGUNDY, spacing: 5 })
  ctx.save()
  ctx.textAlign = 'center'
  let qy = 1340
  for (const line of voice.su2.lines) {
    qy = wrapCentered(ctx, `“${line}”`.replace('““', '“'), PAGE_W / 2, qy, PAGE_W - 260, 50, `italic 40px ${SERIF}`) + 58
  }
  ctx.restore()
  folio(ctx, 2, 'left')
}

export function drawBroadcast(ctx, a) {
  paper(ctx, 51)
  mono(ctx, 'Behind the broadcast', 90, 150, { size: 22 })
  rule(ctx, 90, 180, PAGE_W - 90)
  photo(ctx, a.classroom, 110, 250, 760, 510, { rotate: -0.03, caption: 'A class filmed from the back · Day 2' })
  photo(ctx, a.hall, 330, 860, 760, 510, { rotate: 0.022, caption: 'Lecture hall · Day 2' })
  folio(ctx, 3, 'right')
}

const NUMBERS = [
  ['56.79M', 'hours watched'],
  ['1.45M', 'peak viewers'],
  ['~6,000', 'channels carrying coverage'],
  ['120', 'students'],
  ['6', 'days on campus'],
]

export function drawNumbers(ctx) {
  paper(ctx, 61)
  mono(ctx, 'Superlatives', 90, 150, { size: 22 })
  mono(ctx, 'Event-wide, all channels', PAGE_W - 90, 150, { size: 18, align: 'right', alpha: 0.6 })
  rule(ctx, 90, 180, PAGE_W - 90)
  let y = 400
  for (const [num, label] of NUMBERS) {
    serif(ctx, num, 90, y, { size: 170 })
    mono(ctx, label, PAGE_W - 90, y - 20, { size: 22, align: 'right' })
    rule(ctx, 90, y + 50, PAGE_W - 90, 0.18)
    y += 225
  }
  mono(ctx, 'Source · Streams Charts, July 21, 2026', 90, PAGE_H - 150, { size: 17, alpha: 0.6 })
  folio(ctx, 4, 'left')
}

export function drawGraduation(ctx, a) {
  paper(ctx, 71)
  mono(ctx, 'Graduation', 90, 150, { size: 22 })
  mono(ctx, 'July 20, 2026', PAGE_W - 90, 150, { size: 22, align: 'right' })
  rule(ctx, 90, 180, PAGE_W - 90)
  photo(ctx, a.crowd, 90, 250, PAGE_W - 180, 640, { rotate: 0, caption: 'The auditorium · Day 1' })
  const rows = [
    ['MVP', 'Suburb Baby'],
    ['Valedictorian', 'MeesterKeem'],
    ['Next', 'Europe, announced'],
  ]
  let y = 1090
  for (const [k, v] of rows) {
    mono(ctx, k, 90, y - 18, { size: 20, alpha: 0.6 })
    serif(ctx, v, PAGE_W - 90, y, { size: 84, align: 'right' })
    rule(ctx, 90, y + 36, PAGE_W - 90, 0.18)
    y += 140
  }
  folio(ctx, 5, 'right')
}

export function drawColophon(ctx, a) {
  paper(ctx, 81)
  mono(ctx, 'Notes', 90, 150, { size: 22 })
  rule(ctx, 90, 180, PAGE_W - 90)
  let y = 300
  const note = (t) => { y = wrap(ctx, t, 90, y, PAGE_W - 180, 46, `28px ${MONO}`) + 90 }
  note('Figures on these pages describe the event as a whole, across all channels. They are not personal metrics.')
  note('Audience, graduation: Streams Charts, July 21, 2026. Europe: Complex, July 20, 2026.')
  note('Event photographs: official Streamer University 2026 yearbook, streameruniversity.com/yearbook (photographer not credited). The staff portrait is an illustration made for this portfolio.')
  note('The Streamer University monogram belongs to its owners. Shown here to identify the project.')
  stamp(ctx, a.monogram, PAGE_W / 2, PAGE_H - 330, 220, BURGUNDY, 0.5)
  folio(ctx, 6, 'left')
}

// Page names by folio (the number printed on each page; 0 is the cover).
export const SPREAD_LABELS = ['Cover', 'Title page', 'Staff', 'Behind the broadcast', 'Superlatives', 'Graduation', 'Notes']

// Folios visible at each spread of the book (YearbookModel spreadAt): the
// closed cover, then left | right pages as the leaves turn. Endpapers carry
// no folio, so the first and last spreads show a single numbered page.
export const SPREAD_PAGES = [[0], [1], [2, 3], [4, 5], [6]]
