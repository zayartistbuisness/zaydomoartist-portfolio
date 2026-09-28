import { useEffect, useRef, useState } from 'react'
import { lockPageScroll } from '../../lib/useLenis'
import { useWorldMotion } from '../world/WorldMotion'
import Icon from './Icon'

const entries = [
  ['01', 'Selected work', '#work'],
  ['02', 'The person', '#about'],
  ['03', 'Acting', '#acting'],
  ['04', 'Contact', '#contact'],
]

export default function ExperienceHeader() {
  const { still, reduced, toggle } = useWorldMotion()
  const header = useRef(null)
  const dialog = useRef(null)
  const trigger = useRef(null)
  const unlock = useRef(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const update = () => { if (header.current) header.current.dataset.scrolled = String(scrollY > 70) }
    update()
    addEventListener('scroll', update, { passive: true })
    return () => removeEventListener('scroll', update)
  }, [])
  useEffect(() => {
    if (!open) return
    const modal = dialog.current
    const button = trigger.current
    modal.showModal()
    const release = lockPageScroll()
    unlock.current = release
    return () => {
      release()
      unlock.current = null
      modal.close()
      button?.focus({ preventScroll: true })
    }
  }, [open])
  const close = () => {
    unlock.current?.()
    setOpen(false)
  }
  return (
    <>
      <a className="experience-skip world-skip" href="#main">Skip to content</a>
      <header className="experience-header" ref={header}>
        <a href="#hero" className="experience-signature" aria-label="Zay Domo Artist, home">
          <span className="experience-symbol" aria-hidden="true" />
          <span>Zay Domo<br /><b>Artist</b></span>
        </a>
        <nav className="experience-nav" aria-label="Primary navigation">
          <a href="#work">Selected work</a>
          <a href="#about">About</a>
          <a href="#contact">Get in touch <Icon size={12} /></a>
        </nav>
        <div className="experience-header-tools">
          <button className="experience-motion-button" type="button" onClick={toggle} aria-pressed={still}
            aria-label={reduced ? 'Enable animation' : still ? 'Resume animation' : 'Pause animation'}>
            <Icon name={still ? 'play' : 'pause'} size={13} /><span>{still ? 'Motion off' : 'Motion on'}</span>
          </button>
          <button ref={trigger} className="experience-menu-button" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="experience-index">
            <span>Index</span><Icon name="index" size={19} />
          </button>
        </div>
      </header>
      <dialog id="experience-index" className="experience-menu" ref={dialog} aria-labelledby="experience-index-title"
        data-lenis-prevent onCancel={(event) => { event.preventDefault(); close() }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const r = event.currentTarget.getBoundingClientRect()
          if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close()
        }}>
        <div className="experience-menu-top">
          <h2 id="experience-index-title">A few places to start.</h2>
          <button type="button" onClick={close} aria-label="Close index" autoFocus><Icon name="close" /></button>
        </div>
        <nav aria-label="Portfolio index">
          {entries.map(([n, label, href]) => <a key={href} href={href} onClick={close}><small>{n}</small>{label}<Icon /></a>)}
        </nav>
        <div className="experience-menu-work">
          <a href="#university" onClick={close}>Streamer University 2 <Icon size={13} /></a>
          <a href="#memehouse" onClick={close}>MemeHouse <Icon size={13} /></a>
          <a href="#mafiathon" onClick={close}>Mafiathon 3 / On The Radar <Icon size={13} /></a>
        </div>
        <p>Actor &amp; creative strategist<br />Los Angeles, California</p>
      </dialog>
    </>
  )
}
