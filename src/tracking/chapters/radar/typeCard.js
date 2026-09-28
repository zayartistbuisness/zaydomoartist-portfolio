import * as THREE from 'three'

const BONE = '#E8E4DB'
const SERIF = '"Instrument Serif", serif'
const MONO = '"JetBrains Mono", ui-monospace, monospace'

/** Largest size (≤ maxSize) at which `text` spans maxW. */
function fit(g, text, font, maxSize, maxW) {
  g.font = font.replace('{s}', 100)
  const w = g.measureText(text).width
  return Math.min(maxSize, Math.floor((100 * maxW) / w))
}

/**
 * A typographic card: bone type on a transparent ground, so the ink grid
 * keeps the letterforms' silhouette (no rectangle). Used for the two records
 * and as the stand-in for photo cards that have not been delivered yet.
 * Resolves to a THREE.CanvasTexture once the site's faces are loaded.
 */
export async function makeTypeTexture(type) {
  try {
    await Promise.all([
      document.fonts.load(`400 160px ${SERIF}`),
      document.fonts.load(`italic 400 160px ${SERIF}`),
      document.fonts.load(`400 32px ${MONO}`),
    ])
  } catch {
    /* fall back to whatever face is available */
  }
  // The figure sits low: in line form the ink thins a card's lower third, so
  // its base dissolves into the scope it rises from.
  const wide = !!type.wide
  const W = wide ? 1400 : 1000
  const H = wide ? 700 : type.stack ? 940 : 900
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')
  g.fillStyle = BONE
  g.strokeStyle = BONE
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'

  // Small mono caps above and below, a hairline rule, the figure between.
  const mono = (text, y, size) => {
    g.font = `400 ${size}px ${MONO}`
    if ('letterSpacing' in g) g.letterSpacing = `${Math.round(size * 0.14)}px`
    g.fillText(text.toUpperCase(), W / 2, y)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
  }
  // Kicker and rule sit just above the figure's cap height.
  let capY = 0
  const head = (capTop) => {
    capY = (capTop - 100) / H
    mono(type.kicker, capTop - 64, wide ? 34 : 36)
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(W * 0.46, capTop - 36)
    g.lineTo(W * 0.54, capTop - 36)
    g.stroke()
  }

  if (type.stack) {
    const words = type.big.split(' ')
    const size = Math.min(...words.map((w) => fit(g, w, `italic 400 {s}px ${SERIF}`, 290, W * 0.74)))
    g.font = `italic 400 ${size}px ${SERIF}`
    const lead = size * 0.84
    const last = H * 0.85
    words.forEach((w, i) => g.fillText(w, W / 2, last - (words.length - 1 - i) * lead))
    head(last - (words.length - 1) * lead - size * 0.7)
  } else {
    const size = fit(g, type.big, `400 {s}px ${SERIF}`, wide ? 380 : 700, W * (wide ? 0.78 : 0.62))
    g.font = `400 ${size}px ${SERIF}`
    const base = H * (wide ? 0.76 : 0.8)
    g.fillText(type.big, W / 2, base)
    head(base - size * 0.72)
  }
  mono(type.foot, H * 0.95, wide ? 30 : 34)

  const tex = new THREE.CanvasTexture(c)
  tex.userData.aspect = W / H
  tex.userData.capY = Math.max(0, capY) // caption line, as a fraction from the top
  return tex
}
