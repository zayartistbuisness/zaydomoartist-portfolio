import { useEffect, useRef } from 'react'
import { useChapterSection } from '../../kit/chapterStore'
import { voice } from '../../content/voice'
import { ID, O, P, SLOTS, keonStore, progressForSlot, stripOffset } from './timeline'
import './keon.css'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// Zay's own words: voice.keon (content/voice.js). Drafted with Zay on
// 2026-09-28; he strikes anything untrue there, not here.
const { role, lines } = voice.keon

function sectionGeometry(el) {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const travel = Math.max(1, r.height - vh)
  return { top: r.top + window.scrollY, travel, p: clamp01(-r.top / travel) }
}

export default function KeonSection() {
  const ref = useRef()
  const stageRef = useRef()
  useChapterSection(ID, ref)

  // Per-frame DOM sync: reveal vars and the drag cursor. No renders.
  // Art-first: no frame captions or counters; the strip speaks for itself.
  useEffect(() => {
    const el = ref.current
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      const { p } = sectionGeometry(el)
      const head = smooth(P.markEnd - 0.03, P.threadTo, p) * (1 - smooth(0.975, 1, p))
      // The strip is in the gate (and can be dragged) between these marks.
      const live = smooth(P.threadTo - 0.02, P.threadTo + 0.02, p) * (1 - smooth(P.framesTo + 0.02, P.framesTo + 0.05, p))
      el.style.setProperty('--k-head', head.toFixed(3))
      stageRef.current?.classList.toggle('is-live', live > 0.5)
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

  return (
    <section ref={ref} id="keon" className="c-keon" aria-labelledby="c-keon-title">
      <div ref={stageRef} className="c-keon-stage">
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

        <ol className="c-keon-sr">
          {SLOTS.filter((s) => !s.beat).map((s) => (
            <li key={s.n}>Frame {s.n}, {s.group.toLowerCase()}: {s.title}. Visual development concept frame, not a production still.</li>
          ))}
        </ol>

      </div>
    </section>
  )
}
