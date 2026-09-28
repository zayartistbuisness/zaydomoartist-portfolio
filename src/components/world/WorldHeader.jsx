import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { lockPageScroll } from '../../lib/useLenis'

const links = [
  ['Story', '#about'], ['Acting', '#acting'], ['Reel', '#reel'],
  ['Music', '#music'], ['Directing', '#directing'], ['Press', '#press'],
  ['MOSS', '/moss'], ['Contact', '#contact'],
]

export default function WorldHeader() {
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const closeRef = useRef(null)
  const backdropPressRef = useRef(false)
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)

  useEffect(() => {
    const update = () => {
      if (headerRef.current) headerRef.current.dataset.scrolled = window.scrollY > 90 ? 'true' : 'false'
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const trigger = triggerRef.current
    if (!dialog.open) dialog.showModal()
    const unlock = lockPageScroll()

    let active = true
    const close = () => {
      if (!active) return
      active = false
      const hadFocus = dialog.contains(document.activeElement)
      if (dialog.open) dialog.close()
      unlock()
      if (trigger?.isConnected && (hadFocus || document.activeElement === document.body)) {
        trigger.focus({ preventScroll: true })
      }
      closeRef.current = null
      backdropPressRef.current = false
    }
    closeRef.current = close
    return close
  }, [open])

  const closeMenu = () => {
    // Release synchronously, before a link's click reaches the Lenis listener.
    closeRef.current?.()
    setOpen(false)
  }

  const onNavigate = (event) => {
    if (!event.defaultPrevented && event.button === 0 &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) closeMenu()
  }

  const isBackdrop = (event) => {
    if (event.target !== event.currentTarget) return false
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
    return event.clientX < left || event.clientX > right ||
      event.clientY < top || event.clientY > bottom
  }

  return (
    <>
      <a className="world-skip" href="#main">Skip to content</a>
      <header ref={headerRef} className="world-header">
        <a href="#hero" className="world-brand" aria-label="Zay Domo Artist — home">
          <span className="world-emblem" aria-hidden="true" />
          <span>ZDA<span className="world-brand-plus" aria-hidden="true">+</span></span>
        </a>
        <nav aria-label="Primary navigation" className="world-nav">
          <a href="#acting">Selected work</a>
          <a href="#about">The artist</a>
          <a href="#contact" className="world-nav-contact">Let’s talk <ArrowUpRight size={14} /></a>
        </nav>
        <button ref={triggerRef} type="button" className="world-index-button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-controls="world-index" aria-expanded={open}>
          <span>Index</span><span className="world-menu-grid" aria-hidden="true"><i /><i /><i /><i /></span>
        </button>
      </header>
      <dialog
        id="world-index"
        className="world-menu"
        ref={dialogRef}
        aria-labelledby="world-index-title"
        data-lenis-prevent
        onCancel={(event) => { event.preventDefault(); closeMenu() }}
        onClose={(event) => { if (!event.currentTarget.open) closeMenu() }}
        onPointerDown={(event) => { backdropPressRef.current = event.button === 0 && isBackdrop(event) }}
        onPointerCancel={() => { backdropPressRef.current = false }}
        onClick={(event) => {
          const dismiss = backdropPressRef.current && isBackdrop(event)
          backdropPressRef.current = false
          if (dismiss) closeMenu()
        }}
      >
        <div className="world-menu-heading"><h2 id="world-index-title">The index</h2><button type="button" autoFocus aria-label="Close index" onClick={closeMenu}><X /></button></div>
        <nav aria-label="All portfolio sections">
          {links.map(([name, url], index) => url.startsWith('/') ? (
            <Link key={url} to={url} onClick={onNavigate}><small>0{index + 1}</small>{name}<ArrowUpRight aria-hidden="true" /></Link>
          ) : (
            <a key={url} href={url} onClick={onNavigate}><small>0{index + 1}</small>{name}<ArrowUpRight aria-hidden="true" /></a>
          ))}
        </nav>
        <p>Zay “Domo” Artist · Los Angeles</p>
      </dialog>
    </>
  )
}
