import { useEffect, useRef } from 'react'
import { useChapterSection } from '../../kit/chapterStore'
import { scrollToY } from '../../kit/scroller'
import { smooth } from '../../kit/space'
import { ID, pad2, useShots } from './shots'
import { closePrint, openPrint, progressForSlot, sectionVh, useOpenPrint, wall, wheelAt } from './timeline'
import Lightbox from './Lightbox'
import './portraits.css'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function sectionGeometry(el) {
  const r = el.getBoundingClientRect()
  const travel = Math.max(1, r.height - window.innerHeight)
  return { top: r.top + window.scrollY, travel, p: clamp(-r.top / travel, 0, 1) }
}

export default function Section() {
  const list = useShots()
  const openIndex = useOpenPrint()
  const ref = useRef()
  const stageRef = useRef()
  const numRef = useRef()
  const ticksRef = useRef()
  const viewRef = useRef()
  const countRef = useRef(list.length)
  useChapterSection(ID, ref)

  useEffect(() => {
    countRef.current = list.length
  }, [list])

  // Scroll → the wall position every frame: CSS vars, counter, rail. No renders.
  useEffect(() => {
    const el = ref.current
    const stage = stageRef.current
    let raf
    let shown = -9
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      const n = countRef.current
      const w = wheelAt(sectionGeometry(el).p, n) + wall.nudge
      const rail = smooth(-0.55, -0.15, w)
      stage.style.setProperty('--intro', (1 - smooth(-0.97, -0.76, w)).toFixed(3))
      stage.style.setProperty('--rail', rail.toFixed(3))
      stage.classList.toggle('is-live', rail > 0.5)
      const k = n ? clamp(Math.round(w), 0, n - 1) : -1
      if (k !== shown && k >= 0) {
        shown = k
        numRef.current.textContent = pad2(k + 1)
        const ticks = ticksRef.current?.children || []
        for (let i = 0; i < ticks.length; i++) ticks[i].classList.toggle('is-on', i === k)
      }
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  // Drag turns the wall. Past half a print, release commits the turn into the
  // page scroll, so the wall stays where it was left.
  useEffect(() => {
    const el = ref.current
    const stage = stageRef.current
    let drag = null
    const onDown = (e) => {
      wall.moved = false
      if (e.button !== 0 || e.target.closest('button, a, .c-portraits-list')) return
      if (wheelAt(sectionGeometry(el).p, countRef.current) < -0.6) return
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, live: false }
    }
    const onMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return
      const dx = e.clientX - drag.x
      if (!drag.live) {
        // Only clearly horizontal gestures; vertical ones stay scroll.
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - drag.y)) return
        drag.live = true
        wall.dragging = true
        wall.moved = true
        try {
          stage.setPointerCapture(e.pointerId)
        } catch {
          /* pointer already gone */
        }
      }
      // Grab the wall: dragging left brings the next print round.
      const raw = -dx / Math.max(90, wall.pitchPx)
      wall.nudgeTarget = Math.sign(raw) * Math.min(Math.abs(raw), 1.6 + Math.log1p(Math.max(0, Math.abs(raw) - 1.6)) * 0.4)
    }
    const onUp = () => {
      if (!drag) return
      const wasLive = drag.live
      drag = null
      wall.dragging = false
      if (!wasLive) return
      const n = countRef.current
      const g = sectionGeometry(el)
      const base = wheelAt(g.p, n)
      const target = clamp(Math.round(base + wall.nudgeTarget), 0, Math.max(0, n - 1))
      wall.nudgeTarget = 0
      if (target !== Math.round(base)) {
        scrollToY(g.top + progressForSlot(target, n) * g.travel, { immediate: true })
        // Same instant: fold the jump back into the nudge so nothing pops;
        // the nudge then glides home with the print centred.
        wall.nudge = base + wall.nudge - target
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

  const n = list.length
  const goTo = (i, immediate = false) => {
    const g = sectionGeometry(ref.current)
    scrollToY(g.top + progressForSlot(i, n) * g.travel, immediate ? { immediate: true } : undefined)
  }
  const current = () => clamp(Math.round(wheelAt(sectionGeometry(ref.current).p, n)), 0, Math.max(0, n - 1))
  const step = (dir) => {
    const now = Math.round(wheelAt(sectionGeometry(ref.current).p, n))
    goTo(clamp(Math.max(0, now) + (now < 0 && dir > 0 ? 0 : dir), 0, n - 1))
  }
  const stepBox = (dir) => openPrint((openIndex + dir + n) % n)
  const closeBox = () => {
    // Leave the wall on the print that was last open.
    if (openIndex >= 0) goTo(openIndex, true)
    closePrint()
  }

  return (
    <section ref={ref} className="c-portraits" aria-labelledby="c-portraits-title" style={{ height: `${sectionVh(n)}vh` }}>
      <div ref={stageRef} className="c-portraits-stage">
        <header className="c-portraits-tag">
          <h2 id="c-portraits-title">Portraits</h2>
          <span className="c-portraits-hint" aria-hidden="true">
            Scroll or drag to turn the wall · click a print to view
          </span>
          <span aria-hidden="true">{pad2(n)} prints</span>
        </header>

        <p className="c-portraits-intro">Selected editorial work, 2026.</p>

        <div className="c-portraits-rail">
          <p className="c-portraits-count" aria-hidden="true">
            <span ref={numRef}>01</span>
            <small> / {pad2(n)}</small>
          </p>
          <ol ref={ticksRef} className="c-portraits-ticks" aria-hidden="true">
            {list.map((s) => (
              <li key={s.src} className={s.color ? 'is-colour' : undefined} />
            ))}
          </ol>
          <div className="c-portraits-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous print">
              Prev
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next print">
              Next
            </button>
            <button ref={viewRef} type="button" className="c-portraits-view" onClick={() => openPrint(current())}>
              View <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>

        {/* Every print as real content: hidden until keyboard focus lands in
            it, then shown as a small index. Focus turns the wall. */}
        <ol className="c-portraits-list" aria-label="Prints in this series">
          {list.map((s, i) => (
            <li key={s.src}>
              <button type="button" onClick={() => openPrint(i)} onFocus={() => goTo(i)}>
                <span className="c-portraits-list-n">{pad2(i + 1)}</span>
                <span className="c-portraits-list-w">{s.label}</span>
                <span className="c-portraits-list-s">{s.styling}</span>
                <span className="c-portraits-sr">
                  . {s.alt} Opens full screen.
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Lightbox list={list} index={openIndex} onClose={closeBox} onStep={stepBox} fallbackFocus={viewRef} />
    </section>
  )
}
