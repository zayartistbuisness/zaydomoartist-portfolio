import { useEffect, useRef } from 'react'
import { useChapterSection } from '../../kit/chapterStore'
import { scrollToY } from '../../kit/scroller'
import { smooth } from '../../kit/space'
import { ID, useShots } from './shots'
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
  const countRef = useRef(list.length)
  useChapterSection(ID, ref)

  useEffect(() => {
    countRef.current = list.length
  }, [list])

  // Scroll → the wall position every frame: the standfirst's exit. No renders.
  // Art-first: no counter, rail or captions; the prints carry the chapter.
  useEffect(() => {
    const el = ref.current
    const stage = stageRef.current
    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      const w = wheelAt(sectionGeometry(el).p, countRef.current) + wall.nudge
      stage.style.setProperty('--intro', (1 - smooth(-0.97, -0.76, w)).toFixed(3))
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
  const stepBox = (dir) => openPrint((openIndex + dir + n) % n)
  const closeBox = () => {
    // Leave the wall on the print that was last open.
    if (openIndex >= 0) goTo(openIndex, true)
    closePrint()
  }

  return (
    <section ref={ref} className="c-portraits" aria-labelledby="c-portraits-title" style={{ height: `${sectionVh(n)}vh` }}>
      <div ref={stageRef} className="c-portraits-stage">
        {/* The engraved wall title is the visible heading. */}
        <h2 id="c-portraits-title" className="tlab-sr">Portraits</h2>

        <p className="c-portraits-intro">Selected editorial work, 2026.</p>

        {/* Every print as a real button, for keyboard and screen readers:
            hidden until keyboard focus lands in it, then shown as a small
            index of titles. Focus turns the wall; Enter opens the print. */}
        <ol className="c-portraits-list" aria-label="Prints in this series">
          {list.map((s, i) => (
            <li key={s.src}>
              <button type="button" onClick={() => openPrint(i)} onFocus={() => goTo(i)}>
                {s.label}
                <span className="c-portraits-sr">
                  . {s.alt} Opens full screen.
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Lightbox list={list} index={openIndex} onClose={closeBox} onStep={stepBox} />
    </section>
  )
}
