import { useEffect } from 'react'
import Lenis from 'lenis'

let scrollLocks = 0
let restoreOverflow = []
let resumeLenis = null
const unlockListeners = new Set()

/** Lock native scrolling as well as Lenis, including with reduced motion. */
export function lockPageScroll() {
  if (scrollLocks === 0) {
    restoreOverflow = [document.documentElement, document.body].flatMap((element) =>
      ['overflow-x', 'overflow-y'].map((property) => {
        const value = element.style.getPropertyValue(property)
        const priority = element.style.getPropertyPriority(property)
        element.style.setProperty(property, 'hidden', 'important')
        return () => {
          // Do not overwrite a style another owner has since changed.
          if (element.style.getPropertyValue(property) === 'hidden' &&
              element.style.getPropertyPriority(property) === 'important') {
            element.style.setProperty(property, value, priority)
          }
        }
      }),
    )
    resumeLenis = window.lenis && !window.lenis.isStopped ? window.lenis : null
    window.lenis?.stop()
  }
  scrollLocks += 1

  let released = false
  return () => {
    if (released) return
    released = true
    scrollLocks -= 1
    if (scrollLocks > 0) return

    restoreOverflow.forEach((restore) => restore())
    restoreOverflow = []
    if (window.lenis === resumeLenis) resumeLenis?.start()
    resumeLenis = null
    unlockListeners.forEach((listener) => listener())
  }
}

/**
 * Touch stays native. Reduced-motion changes disable inertia immediately;
 * skip links always move focus and scroll immediately, without the glide.
 */
export default function useLenis() {
  useEffect(() => {
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    let lenis = null
    let rafId = 0
    let navigationFrame = 0
    let pendingNavigation = null
    let restoreTabIndex = null

    const raf = (time) => {
      if (!lenis) return
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    const destroyLenis = () => {
      cancelAnimationFrame(rafId)
      if (!lenis) return
      if (window.lenis === lenis) delete window.lenis
      if (resumeLenis === lenis) resumeLenis = null
      lenis.destroy()
      lenis = null
    }

    const syncMotion = () => {
      if (motionQuery?.matches) {
        destroyLenis()
      } else if (!lenis) {
        lenis = new Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        })
        window.lenis = lenis
        if (scrollLocks > 0) {
          resumeLenis = lenis
          lenis.stop()
        }
        rafId = requestAnimationFrame(raf)
      }
    }

    const focusTarget = (target) => {
      restoreTabIndex?.()
      if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
        target.setAttribute('tabindex', '-1')
        const restore = () => {
          if (target.getAttribute('tabindex') === '-1') target.removeAttribute('tabindex')
          target.removeEventListener('blur', restore)
          if (restoreTabIndex === restore) restoreTabIndex = null
        }
        restoreTabIndex = restore
        target.addEventListener('blur', restore, { once: true })
      }
      target.focus({ preventScroll: true })
    }

    const navigate = () => {
      navigationFrame = 0
      // A menu link may bubble before React's close effect releases its lock.
      // Final unlock schedules this again; never force scrolling through a modal.
      if (!pendingNavigation || scrollLocks > 0 || lenis?.isStopped) return
      const { target, hash, instant } = pendingNavigation
      pendingNavigation = null
      if (!target.isConnected) return

      if (window.location.hash !== hash) {
        window.history.pushState(window.history.state, '', hash)
      }
      focusTarget(target)
      if (lenis) {
        lenis.scrollTo(target, { duration: 1.4, immediate: instant })
      } else {
        target.scrollIntoView({ behavior: 'instant', block: 'start' })
      }
    }

    const scheduleNavigation = () => {
      if (pendingNavigation && !navigationFrame) navigationFrame = requestAnimationFrame(navigate)
    }

    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element
        ? event.target.closest('a[href^="#"]')
        : null
      if (!anchor || anchor.hasAttribute('download') ||
          (anchor.target && anchor.target !== '_self')) return

      const hash = anchor.hash
      if (!hash || hash === '#') return
      let id
      try {
        id = decodeURIComponent(hash.slice(1))
      } catch {
        // Malformed escapes and unmatched fragments keep native behavior.
        return
      }
      const target = document.getElementById(id)
      if (!(target instanceof HTMLElement)) return
      if (anchor.closest('dialog')?.contains(target)) return
      if (lenis?.isStopped && scrollLocks === 0) return

      event.preventDefault()
      pendingNavigation = {
        target,
        hash,
        instant: anchor.classList.contains('world-skip') || id === 'main',
      }
      cancelAnimationFrame(navigationFrame)
      navigationFrame = 0
      scheduleNavigation()
    }

    syncMotion()
    motionQuery?.addEventListener('change', syncMotion)
    unlockListeners.add(scheduleNavigation)
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      motionQuery?.removeEventListener('change', syncMotion)
      unlockListeners.delete(scheduleNavigation)
      cancelAnimationFrame(navigationFrame)
      pendingNavigation = null
      restoreTabIndex?.()
      destroyLenis()
    }
  }, [])
}
