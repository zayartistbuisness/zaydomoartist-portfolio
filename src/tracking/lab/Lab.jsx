import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Lenis from 'lenis'
import { setScroller, scrollToY } from '../kit/scroller'
import { INTRO, FEATURED, OUTRO } from '../kit/chapters'
import ChapterBoundary from '../kit/ChapterBoundary'
import { getChapter } from '../kit/chapterStore'
import LabScene from './LabScene'
import { FONTS, ROWS, setActiveRow, clearActiveRow, registerLabElements } from './labStore'
import { usePointerTracking } from '../ink/pointer'
import { useXpCursor } from '../kit/cursor'
import { inkSettings } from '../ink/inkGlobals'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/fraunces/300.css'
import '@fontsource/fraunces/300-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import './lab.css'

const PORTRAITS = {
  suit34: '/tracking/portrait/zay-suit-34.webp',
  suit: '/tracking/portrait/zay-suit-bw.webp',
  bw: '/tracking/portrait/zay-tank-bw.webp',
  color: '/tracking/portrait/zay-tank-color.webp',
}

const pad = (n) => String(n).padStart(2, '0')

// Scroll position as tape time: 24 fps, four scrolled pixels per frame.
function timecode(px) {
  const f = Math.floor(px / 4)
  const s = Math.floor(f / 24)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % 24)}`
}

const NAV = [['about', 'About'], ['portraits', 'Portraits'], ['work', 'Work'], ['contact', 'Contact']]

function ChapterBlock({ ch }) {
  return (
    <div id={ch.id} className="tlab-chapter" data-ground={ch.ground}>
      <ChapterBoundary id={ch.id}>
        <ch.Section />
      </ChapterBoundary>
    </div>
  )
}

// In-page jumps go through Lenis so they glide like the rest of the scroll.
function jumpTo(e, id) {
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  scrollToY(el.getBoundingClientRect().top + window.scrollY)
}

function Row({ row, on, onEnter, onLeave }) {
  return (
    <a
      href={`#${row.id}`}
      className={`tlab-row${on ? ' is-on' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={(e) => {
        e.preventDefault()
        const el = getChapter(row.id).el
        if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY)
      }}
    >
      <sup>{row.year}</sup>
      <span className="tlab-row-title" aria-label={row.title}>
        {[...row.title].map((ch, i) => (
          <span key={i} className="ch" style={{ '--i': i }} aria-hidden="true">
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </span>
      <small>{row.tag}</small>
    </a>
  )
}

function Panel({ font, setFont, portrait, setPortrait }) {
  const [open, setOpen] = useState(true)
  const [, force] = useState(0)
  const slider = (key, label, min, max, step) => (
    <label>
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={inkSettings[key]}
        onChange={(e) => { inkSettings[key] = Number(e.target.value); force((n) => n + 1) }}
      />
      <output>{inkSettings[key]}</output>
    </label>
  )
  return (
    <aside className={`tlab-panel${open ? '' : ' is-closed'}`}>
      <button type="button" onClick={() => setOpen((o) => !o)}>{open ? 'Lab controls —' : 'Lab controls +'}</button>
      {open && (
        <div className="tlab-panel-body">
          {slider('pitchCss', 'Ink pitch', 3, 12, 1)}
          {slider('tracking', 'Tracking', 0, 2, 0.1)}
          <label>
            <span>Type</span>
            <select value={font} onChange={(e) => setFont(e.target.value)}>
              {Object.entries(FONTS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}
            </select>
          </label>
          <label>
            <span>Portrait</span>
            <select value={portrait} onChange={(e) => setPortrait(e.target.value)}>
              <option value="suit34">Suit, three-quarter</option>
              <option value="suit">Suit (B&amp;W)</option>
              <option value="bw">Tank (B&amp;W)</option>
              <option value="color">Colour shoot</option>
            </select>
          </label>
        </div>
      )}
    </aside>
  )
}

export default function Lab() {
  const [font, setFont] = useState('instrument')
  const [portrait, setPortrait] = useState('suit34')
  // Tuning panel is a dev-only aid: hidden unless the URL carries ?tune.
  const [tune] = useState(() => new URLSearchParams(window.location.search).has('tune'))
  const [active, setActive] = useState(null)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (!menu) return
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false) }
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    window.__tlabLenis?.stop()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      html.style.overflow = prev
      window.__tlabLenis?.start()
    }
  }, [menu])
  const heroRef = useRef()
  const curtainRef = useRef()
  const slotRef = useRef()
  const tcRef = useRef()
  const rootRef = useRef()
  usePointerTracking()
  useXpCursor(rootRef)

  useEffect(() => {
    document.documentElement.classList.add('tlab-html')
    // Reduced motion: native scrolling, no smooth-scroll glide.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = reduced ? null : new Lenis({ autoRaf: true, lerp: 0.13, wheelMultiplier: 1.15, touchMultiplier: 1.4 })
    if (import.meta.env.DEV) window.__lenis = lenis // lets browser QA jump to exact scroll positions
    window.__tlabLenis = lenis
    setScroller(lenis)
    registerLabElements({ heroEl: heroRef.current, curtainEl: curtainRef.current, slotEl: slotRef.current })
    let raf
    const tick = () => {
      if (tcRef.current) tcRef.current.textContent = timecode(window.scrollY)
      // HUD reads ink-on-paper or paper-on-ink from whatever ground sits
      // under the header line.
      let dark = false
      for (const el of rootRef.current?.querySelectorAll('[data-ground]') || []) {
        const r = el.getBoundingClientRect()
        if (r.top <= 40 && r.bottom > 40) { dark = el.dataset.ground === 'dark'; break }
      }
      rootRef.current?.classList.toggle('is-dark', dark)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
      lenis?.destroy()
      document.documentElement.classList.remove('tlab-html')
    }
  }, [])

  const enter = (id) => { setActiveRow(id); setActive(id) }
  const leave = (id) => { clearActiveRow(id); setActive((a) => (a === id ? null : a)) }

  return (
    <div ref={rootRef} className="tlab" style={{ '--display': FONTS[font].css }}>
      <Canvas
        className="tlab-canvas"
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 100 }}
        eventSource={document.getElementById('root')}
        eventPrefix="client"
        aria-hidden="true"
      >
        <LabScene font={font} portrait={PORTRAITS[portrait]} />
      </Canvas>

      {/* Film grain over everything, like the stock the photographs were shot on. */}
      <div className="tlab-grain" aria-hidden="true" />

      <header className="tlab-hud">
        <a className="tlab-mark" href="#top"><span className="tlab-sigil" aria-hidden="true" />Zay “Domo” Artist<i className="rec" aria-hidden="true" /></a>
        <nav aria-label="Primary">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={(e) => jumpTo(e, id)}>{label}</a>
          ))}
        </nav>
        <button type="button" className="tlab-menu-btn" aria-expanded={menu} aria-controls="tlab-menu" onClick={() => setMenu((m) => !m)}>
          {menu ? 'Close' : 'Menu'}
        </button>
        <a className="tlab-casting" href="#representation" onClick={(e) => jumpTo(e, 'representation')}>Casting ↗</a>
        <div className="tlab-tc" aria-hidden="true">
          <i className="rec" /> <span ref={tcRef}>00:00:00:00</span>
        </div>
      </header>

      {/* Phone menu: full-screen index of the page. */}
      <nav id="tlab-menu" className={`tlab-menu${menu ? ' is-open' : ''}`} aria-label="Menu" aria-hidden={!menu} inert={!menu}>
        <ol>
          {[['top', 'Home'], ...NAV, ['su2', 'Streamer University 2'], ['keon', 'KEON'], ['memehouse', 'MemeHouse'], ['radar', 'On The Radar']].map(([id, label], i) => (
            <li key={id} className={i > 4 ? 'is-sub' : ''}>
              <a href={`#${id}`} onClick={(e) => { setMenu(false); jumpTo(e, id) }}>{label}</a>
            </li>
          ))}
        </ol>
        <a className="tlab-menu-casting" href="#representation" onClick={(e) => { setMenu(false); jumpTo(e, 'representation') }}>Casting &amp; representation ↗</a>
      </nav>

      <main>
        <section id="top" ref={heroRef} className="tlab-hero" data-ground="light">
          <h1 className="tlab-sr">Zay “Domo” Artist — actor, writer and creative strategist</h1>
          <div className="tlab-hero-meta">
            <p>Actor · Writer · Creative Strategist</p>
            <p className="tlab-cue">Scroll ↓</p>
          </div>
        </section>

        {INTRO.map((ch) => <ChapterBlock key={ch.id} ch={ch} />)}

        <section id="work" ref={curtainRef} className="tlab-curtain" data-ground="dark">
          <div className="tlab-index">
            <div className="tlab-index-head">
              <span>Selected work</span>
              <span>01 — 04</span>
            </div>
            <div className="tlab-index-grid">
              <div className="tlab-rows">
                {ROWS.map((row) => (
                  <Row key={row.id} row={row} on={active === row.id} onEnter={() => enter(row.id)} onLeave={() => leave(row.id)} />
                ))}
              </div>
              <div className="tlab-slot-wrap">
                <div ref={slotRef} className="tlab-slot" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {FEATURED.map((ch) => <ChapterBlock key={ch.id} ch={ch} />)}
        {OUTRO.map((ch) => <ChapterBlock key={ch.id} ch={ch} />)}
      </main>

      {tune && <Panel font={font} setFont={setFont} portrait={portrait} setPortrait={setPortrait} />}
    </div>
  )
}
