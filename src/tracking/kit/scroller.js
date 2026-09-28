// The page's smooth-scroll instance, so scenes can drive navigation
// (e.g. click a yearbook page to advance) without importing the page.
let instance = null

export function setScroller(lenis) {
  instance = lenis
}

export function scrollToY(y, opts = {}) {
  if (instance) instance.scrollTo(y, { duration: 1.1, ...opts })
  else window.scrollTo({ top: y, behavior: opts.immediate ? 'instant' : 'smooth' })
}
