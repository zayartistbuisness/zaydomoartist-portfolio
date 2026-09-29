import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
// Keys that would scroll the page underneath the overlay.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/**
 * Full-screen viewer for one print: the real file at full resolution.
 * Native modal <dialog> (the page behind goes inert), an explicit Tab trap,
 * Esc / backdrop to close, ← → to step, focus returned to the opener.
 * Scroll is held by swallowing wheel, touch and scroll keys on the overlay
 * (and data-lenis-prevent), never by stopping Lenis, which would unpin the
 * sticky stages.
 */
export default function Lightbox({ list, index, onClose, onStep, fallbackFocus }) {
  const dlg = useRef()
  const closeBtn = useRef()
  const opener = useRef(null)
  const open = index >= 0 && index < list.length
  const shot = open ? list[index] : null
  const [loaded, setLoaded] = useState('')

  useEffect(() => {
    const d = dlg.current
    if (!d || !open) return undefined
    if (!d.open) {
      opener.current = document.activeElement
      d.showModal()
      closeBtn.current?.focus({ preventScroll: true })
    }
    const stop = (e) => e.preventDefault()
    d.addEventListener('wheel', stop, { passive: false })
    d.addEventListener('touchmove', stop, { passive: false })
    return () => {
      d.removeEventListener('wheel', stop)
      d.removeEventListener('touchmove', stop)
    }
  }, [open])

  // Close: hand focus back without scrolling the page.
  useEffect(() => {
    if (open) return
    const d = dlg.current
    if (d?.open) {
      d.close()
      const back = opener.current
      const target = back && back !== document.body && back.isConnected ? back : fallbackFocus?.current
      target?.focus?.({ preventScroll: true })
    }
  }, [open, fallbackFocus])

  // Warm the neighbours so stepping is instant.
  useEffect(() => {
    if (!open) return
    for (const k of [index - 1, index + 1]) {
      const s = list[(k + list.length) % list.length]
      if (s) {
        const img = new Image()
        img.src = s.src
      }
    }
  }, [open, index, list])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onStep(-1)
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      onStep(1)
      return
    }
    if (SCROLL_KEYS.has(e.key) && !(e.key === ' ' && e.target.closest('button'))) e.preventDefault()
    if (e.key !== 'Tab') return
    const items = [...dlg.current.querySelectorAll(FOCUSABLE)]
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <dialog
      ref={dlg}
      className={`c-portraits-box${shot?.color ? ' is-colour' : ''}`}
      aria-labelledby="c-portraits-box-title"
      data-lenis-prevent=""
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dlg.current || e.target.classList.contains('c-portraits-box-stage')) onClose()
      }}
      onKeyDown={onKeyDown}
    >
      {shot && (
        <>
          {/* No caption or counter: the print alone. The title is for
              screen readers; arrows step, Close (or Esc) leaves. */}
          <header className="c-portraits-box-head">
            <h3 id="c-portraits-box-title" className="c-portraits-sr">
              {shot.label}
            </h3>
            {list.length > 1 && (
              <nav aria-label="Portraits">
                <button type="button" onClick={() => onStep(-1)} aria-label="Previous print">
                  <span aria-hidden="true">←</span>
                </button>
                <button type="button" onClick={() => onStep(1)} aria-label="Next print">
                  <span aria-hidden="true">→</span>
                </button>
              </nav>
            )}
            <button ref={closeBtn} type="button" onClick={onClose}>
              Close
            </button>
          </header>

          <div className="c-portraits-box-stage">
            <img
              key={shot.src}
              className={loaded === shot.src ? 'is-in' : ''}
              src={shot.src}
              alt={shot.alt}
              width={shot.w}
              height={shot.h}
              decoding="async"
              onLoad={() => setLoaded(shot.src)}
            />
          </div>
        </>
      )}
    </dialog>,
    document.body,
  )
}
