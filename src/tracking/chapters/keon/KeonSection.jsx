import { useEffect, useRef } from 'react'
import { useChapterSection } from '../../kit/chapterStore'
import { voice } from '../../content/voice'
import { BEAT, ID, LAST, O, P, SLOTS, keonStore, progressForSlot, stripOffset } from './timeline'
import './keon.css'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const clampSlot = (i) => Math.min(LAST, Math.max(0, i))

// Zay's own words: voice.keon (content/voice.js). Drafted with Zay on
// 2026-09-28; he strikes anything untrue there, not here.
const { role, lines } = voice.keon

function sectionGeometry(el) {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const travel = Math.max(1, r.height - vh)
  return { top: r.top + window.scrollY, travel, p: clamp01(-r.top / travel) }
}

// Eased programmatic scroll. Writes native scroll each frame, which Lenis
// follows (it syncs to native scroll whenever it isn't animating itself).
let tween = 0
function glideTo(y, ms = 750) {
  cancelAnimationFrame(tween)
  const from = window.scrollY
  const t0 = performance.now()
  const step = (now) => {
    const t = Math.min(1, (now - t0) / ms)
    const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
    window.scrollTo({ top: from + (y - from) * e, behavior: 'instant' })
    if (t < 1) tween = requestAnimationFrame(step)
  }
  tween = requestAnimationFrame(step)
}

export default function KeonSection() {
  const ref = useRef()
  const stageRef = useRef()
  const numRef = useRef()
  const titleRef = useRef()
  const groupRef = useRef()
  const ticksRef = useRef()
  useChapterSection(ID, ref)

  // Per-frame DOM sync: reveal vars and caption rail. No renders.
  useEffect(() => {
    const el = ref.current
    let raf
    let shown = -99
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      const { p } = sectionGeometry(el)
      const o = stripOffset(p) + keonStore.nudge
      const head = smooth(P.markEnd - 0.03, P.threadTo, p) * (1 - smooth(0.975, 1, p))
      const rail = smooth(P.threadTo - 0.02, P.threadTo + 0.02, p) * (1 - smooth(P.framesTo + 0.02, P.framesTo + 0.05, p))
      const beat = (1 - smooth(0.1, 0.36, Math.abs(o - BEAT))) * rail
      el.style.setProperty('--k-mark', String(1 - smooth(P.markEnd - 0.06, P.markEnd, p)))
      el.style.setProperty('--k-head', head.toFixed(3))
      el.style.setProperty('--k-rail', rail.toFixed(3))
      el.style.setProperty('--k-beat', beat.toFixed(3))
      stageRef.current?.classList.toggle('is-live', rail > 0.5)

      const slot = clampSlot(Math.round(o))
      if (slot !== shown) {
        shown = slot
        const s = SLOTS[slot]
        numRef.current.textContent = s.n
        titleRef.current.textContent = s.title
        groupRef.current.textContent = s.group
        const ticks = ticksRef.current.children
        for (let i = 0; i < ticks.length; i++) ticks[i].classList.toggle('is-on', i === slot)
      }

    }
    tick()
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [])

  // Drag to nudge the strip. Past half a frame, release commits the move
  // into the page scroll so the strip stays where it was left.
  useEffect(() => {
    const el = ref.current
    const stage = stageRef.current
    let drag = null
    const inFrames = () => {
      const { p } = sectionGeometry(el)
      return p > P.threadTo - 0.005 && p < P.framesTo + 0.005
    }
    const onDown = (e) => {
      if (e.button !== 0 || e.target.closest('button, a') || !inFrames()) return
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, live: false }
    }
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x
      if (!drag.live) {
        // Only claim clearly horizontal gestures; vertical ones stay scroll.
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - drag.y)) return
        drag.live = true
        keonStore.dragging = true
        try { stage.setPointerCapture(e.pointerId) } catch { /* pointer already gone */ }
        stage.classList.add('is-dragging')
      }
      // Grab the film: dragging left pulls the next frame into the gate.
      const raw = -dx / Math.max(80, keonStore.framePx)
      const soft = Math.sign(raw) * Math.min(Math.abs(raw), 1.5 + Math.log1p(Math.max(0, Math.abs(raw) - 1.5)) * 0.4)
      keonStore.nudgeTarget = soft
    }
    const onUp = () => {
      if (!drag) return
      const wasLive = drag.live
      drag = null
      keonStore.dragging = false
      stage.classList.remove('is-dragging')
      if (!wasLive) return
      const g = sectionGeometry(el)
      const base = stripOffset(g.p)
      const want = Math.round(base + keonStore.nudgeTarget)
      const target = Math.min(O.last, Math.max(O.lead, want))
      keonStore.nudgeTarget = 0
      if (target !== Math.round(base)) {
        const y = g.top + progressForSlot(target) * g.travel
        window.scrollTo({ top: y, behavior: 'instant' })
        // Same instant: fold the scroll jump back into the nudge so nothing
        // pops; the nudge then glides to zero with the frame in the gate.
        keonStore.nudge = base + keonStore.nudge - target
      }
    }
    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerup', onUp)
    stage.addEventListener('pointercancel', onUp)
    return () => {
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerup', onUp)
      stage.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const step = (dir) => {
    const g = sectionGeometry(ref.current)
    const now = Math.round(stripOffset(g.p))
    const target = clampSlot(Math.max(0, now) + dir)
    glideTo(g.top + progressForSlot(target) * g.travel)
  }

  return (
    <section ref={ref} id="keon" className="c-keon" aria-labelledby="c-keon-title">
      <div ref={stageRef} className="c-keon-stage">
        <p className="c-keon-tag">
          <span>Featured · 02 / 04</span>
          <span className="c-keon-hint" aria-hidden="true">Scroll to run the strip · drag to nudge</span>
          <span>In development</span>
        </p>

        <header className="c-keon-head">
          <h2 id="c-keon-title" className="c-keon-title">KEON</h2>
          <p className="c-keon-line">A feature in development</p>
          <p className="c-keon-role"><i className="c-keon-rec" aria-hidden="true" />{role}</p>
        </header>

        <figure className="c-keon-quote">
          <blockquote>
            {lines.map((l) => <p key={l}>{l}</p>)}
          </blockquote>
          <figcaption>Zay “Domo” Artist</figcaption>
        </figure>

        <p className="c-keon-beat" aria-hidden="true"><em>Behind the camera</em></p>

        <div className="c-keon-rail">
          <div className="c-keon-cap" aria-hidden="true">
            <span ref={numRef} className="c-keon-num">01</span>
            <span className="c-keon-dot">·</span>
            <span ref={titleRef} className="c-keon-ttl">The corner</span>
          </div>
          <div className="c-keon-meta">
            <span ref={groupRef}>On screen</span>
            <span className="c-keon-vd">Visual development · concept frames</span>
          </div>
          <div className="c-keon-foot">
            <ol ref={ticksRef} className="c-keon-ticks" aria-hidden="true">
              {SLOTS.map((s, i) => <li key={s.title} className={s.beat ? 'is-beat' : undefined} data-i={i} />)}
            </ol>
            <div className="c-keon-nav">
              <button type="button" onClick={() => step(-1)} aria-label="Previous frame">Prev</button>
              <button type="button" onClick={() => step(1)} aria-label="Next frame">Next</button>
            </div>
          </div>
        </div>

        <ol className="c-keon-sr">
          {SLOTS.filter((s) => !s.beat).map((s) => (
            <li key={s.n}>Frame {s.n}, {s.group.toLowerCase()}: {s.title}. Visual development concept frame, not a production still.</li>
          ))}
        </ol>

      </div>
    </section>
  )
}
