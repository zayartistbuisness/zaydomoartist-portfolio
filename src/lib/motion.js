/**
 * Shared motion language — cinematic, restrained.
 * One set of easings + variants so the whole site moves with the same rhythm.
 */

// Signature easings (expo-style out, symmetric in-out)
export const easeLux = [0.16, 1, 0.3, 1]
export const easeInOutLux = [0.83, 0, 0.17, 1]
export const easeSoft = [0.22, 1, 0.36, 1]

// Durations (seconds)
export const dur = {
  fast: 0.5,
  base: 0.9,
  slow: 1.3,
  reveal: 1.1,
}

/** Fade + rise — the default section reveal. */
export const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.reveal, ease: easeLux },
  },
}

/** Fade only. */
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: dur.slow, ease: easeLux } },
}

/** Subtle scale-in for media / cards. */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: dur.reveal, ease: easeLux } },
}

/** Line-mask reveal (clip up). */
export const maskUp = {
  hidden: { opacity: 0, y: '110%' },
  show: { opacity: 1, y: '0%', transition: { duration: dur.reveal, ease: easeLux } },
}

/** Container that staggers its children. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

/** Standard in-view props for one-shot reveals. */
export const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, margin: '-12% 0px -12% 0px' },
}

/** True when the user prefers reduced motion (guarded for SSR/build). */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
