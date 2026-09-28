// Every chapter module in src/tracking/chapters/*, placed in page order.
// `ground` tells the page chrome (header) whether a chapter sits on paper or ink.
const mods = import.meta.glob('../chapters/*/index.jsx', { eager: true })
const byId = Object.fromEntries(Object.values(mods).map((m) => [m.default.id, m.default]))

const pick = (list) => list.filter(([id]) => byId[id]).map(([id, extra]) => ({ ...byId[id], ...extra }))

// Before the work index: who he is and what he looks like.
export const INTRO = pick([
  ['about', { ground: 'light' }],
  ['portraits', { ground: 'dark' }],
])

// The featured work, after the index.
export const FEATURED = pick([
  ['su2', { ground: 'light' }],
  ['keon', { ground: 'dark' }],
  ['memehouse', { ground: 'light' }],
  ['radar', { ground: 'dark' }],
])

export const OUTRO = pick([['contact', { ground: 'dark' }]])

export const CHAPTERS = [...INTRO, ...FEATURED, ...OUTRO]
