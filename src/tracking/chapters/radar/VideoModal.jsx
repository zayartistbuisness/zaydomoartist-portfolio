import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

/**
 * Native <dialog> (modal: the page behind is inert), plus an explicit Tab
 * trap, Esc to close, click on the backdrop to close, focus returned to the
 * control that opened it, and page scroll held while open. The iframe only
 * mounts while open, so nothing loads from YouTube until asked.
 */
export default function VideoModal({ open, onClose, src, title }) {
  const dlg = useRef()
  const closeBtn = useRef()
  const opener = useRef(null)

  useEffect(() => {
    const d = dlg.current
    if (!d) return undefined
    if (open && !d.open) {
      opener.current = document.activeElement
      d.showModal()
      closeBtn.current?.focus()
      document.documentElement.classList.add('c-radar-lock')
    } else if (!open && d.open) {
      d.close()
    }
    if (!open) return undefined
    // Wheel/touch over the dialog must not scroll the page underneath.
    const stop = (e) => e.preventDefault()
    d.addEventListener('wheel', stop, { passive: false })
    d.addEventListener('touchmove', stop, { passive: false })
    return () => {
      d.removeEventListener('wheel', stop)
      d.removeEventListener('touchmove', stop)
      document.documentElement.classList.remove('c-radar-lock')
      const back = opener.current
      if (back && typeof back.focus === 'function') back.focus({ preventScroll: true })
    }
  }, [open])

  const onKeyDown = (e) => {
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
      className="c-radar-modal"
      aria-labelledby="c-radar-modal-title"
      data-lenis-prevent=""
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === dlg.current) onClose()
      }}
      onKeyDown={onKeyDown}
    >
      <div className="c-radar-modal-box">
        <header className="c-radar-modal-head">
          <h3 id="c-radar-modal-title">{title}</h3>
          <button ref={closeBtn} type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="c-radar-modal-frame">
          {open && (
            <iframe
              src={`${src}?autoplay=1&rel=0`}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
