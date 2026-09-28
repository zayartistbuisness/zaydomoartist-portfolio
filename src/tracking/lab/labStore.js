// Mutable, render-free state shared between DOM and the R3F scene.
// DOM writes; useFrame reads. Nothing here triggers React renders.
export const labStore = {
  heroEl: null,
  curtainEl: null,
  slotEl: null,
  activeRow: null,
  heroProgress: 0,
}

export const setActiveRow = (id) => { labStore.activeRow = id }
export const clearActiveRow = (id) => { if (labStore.activeRow === id) labStore.activeRow = null }
export const registerLabElements = (els) => Object.assign(labStore, els)

export const FONTS = {
  instrument: {
    label: 'Instrument Serif',
    roman: '/tracking/fonts/instrument-serif-latin-400-normal.woff',
    italic: '/tracking/fonts/instrument-serif-latin-400-italic.woff',
    css: "'Instrument Serif', serif",
    letterSpacing: -0.035,
  },
  fraunces: {
    label: 'Fraunces',
    roman: '/tracking/fonts/fraunces-latin-300-normal.woff',
    italic: '/tracking/fonts/fraunces-latin-300-italic.woff',
    css: "'Fraunces', serif",
    letterSpacing: -0.055,
  },
}

export const ROWS = [
  // Order and ids match the featured chapters (src/tracking/kit/chapters.js).
  { id: 'su2', title: 'Streamer University 2', year: '2026', tag: 'Assistant creative strategist', form: 'lens_element' },
  { id: 'keon', title: 'Keon', year: 'Dev', tag: 'Feature · In development', form: 'molten_glove' },
  { id: 'memehouse', title: 'MemeHouse', year: '2025', tag: 'Creative strategy & direction', form: 'soft_form' },
  { id: 'radar', title: 'On The Radar', year: '2025', tag: 'Creative planning', form: 'spike_star' },
]

