import { useEffect, useRef, useState } from 'react'
import { useChapterSection, getChapter } from '../../kit/chapterStore'
import { voice } from '../../content/voice'
import { ID, MOMENTS, EMBED_47 } from './moments'
import { NARROW_MQ, TL, smooth, window4 } from './timeline'
import { radar, setRadar, useRadarState } from './radarStore'
import VideoModal from './VideoModal'
import './radar.css'

// Facts: site/research/featured-projects-brief.md §4 (event-level, sourced).
// Mafiathon 3 is Kai Cenat's production; On The Radar ran the freestyles.
// Art-first: the title block, his words, and one short line for the moment
// on the scope. Sources and photo credits: content/credits.js (Contact footer).
export default function Section() {
  const ref = useRef()
  const stageRef = useRef()
  const colRef = useRef()
  const datesRef = useRef()
  const nowRef = useRef()
  const [video, setVideo] = useState(false)
  const { focus, shown } = useRadarState()
  useChapterSection(ID, ref)

  // Scroll-driven CSS variables (no React renders per frame).
  useEffect(() => {
    let raf
    const last = { r: -1, q: -1, a: -1 }
    const set = (k, name, v) => {
      const q = Math.round(v * 1000) / 1000
      if (q !== last[k]) {
        last[k] = q
        stageRef.current?.style.setProperty(name, String(q))
      }
    }
    const tick = () => {
      const p = getChapter(ID).progress
      set('r', '--reveal', smooth(TL.text[0], TL.text[1], p))
      set('q', '--quote', window4(TL.quote, p))
      set('a', '--after', smooth(TL.quote[0], TL.quote[1], p))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  // Narrow layout for the scene (phones and portrait tablets): the table and
  // the rising card fit between the headline block and the moment line (the
  // lines share one grid cell, sized by the tallest, so the scope never moves
  // between contacts). Offsets ignore the reveal transform.
  useEffect(() => {
    const stage = stageRef.current
    const col = colRef.current
    const dates = datesRef.current
    const now = nowRef.current
    if (!stage || !col || !dates || !now) return undefined
    const mq = window.matchMedia(NARROW_MQ)
    const L = radar.layout
    const measure = () => {
      L.on = mq.matches
      if (!mq.matches) return
      L.head = col.offsetTop + dates.offsetTop + dates.offsetHeight
      L.foot = col.offsetTop + now.offsetTop
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(col)
    ro.observe(now)
    mq.addEventListener('change', measure)
    document.fonts?.ready.then(measure)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', measure)
      L.on = false
    }
  }, [])

  // Esc lets go of a clicked contact (the modal handles its own Esc).
  useEffect(() => {
    if (focus < 0 || video) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setRadar({ focus: -1 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focus, video])

  const openVideo = () => setVideo(true)

  const { role, lines } = voice.radar

  return (
    <section ref={ref} className="c-radar" aria-labelledby="c-radar-title">
      <div ref={stageRef} className="c-radar-stage">
        <div ref={colRef} className="c-radar-col">
          <h2 id="c-radar-title" className="c-radar-title">
            <span>Mafiathon 3 /</span> <em>On The Radar</em>
          </h2>
          {/* Role from content/voice.js: drafted for Zay at his request, his to confirm or strike.
              No public source names his role; pitch-deck claims are not used. */}
          <p className="c-radar-role">
            <i className="rec" aria-hidden="true" /> {role}
          </p>
          <p ref={datesRef} className="c-radar-dates">September 1–30, 2025 · Twitch</p>
          <p className="c-radar-standfirst">
            A freestyle booth inside a month-long stream, where newer rappers and established names took the same mic.
          </p>

          {/* Phones and portrait tablets: the moment on the scope, one line
              (wide screens label the card itself, below). Lines that aren't
              on stage are visibility-hidden, so only the live one is reachable. */}
          <div ref={nowRef} className="c-radar-now">
            {MOMENTS.map((m, i) => (
              <div key={m.n} className={`c-radar-now-m${shown === i ? ' is-on' : ''}`}>
                <strong>{m.label}</strong>
                <span>
                  {m.short}
                  <time dateTime={m.dateTime}>{m.date}</time>
                </span>
                {m.video && (
                  <button type="button" className="c-radar-watch" onClick={openVideo}>
                    Watch the freestyle
                  </button>
                )}
              </div>
            ))}
          </div>

          <ol className="tlab-sr" aria-label="On the radar: four moments">
            {MOMENTS.map((m) => (
              <li key={m.n}>
                {m.date}: {m.line}
              </li>
            ))}
          </ol>
        </div>

        {/* Zay's own words (content/voice.js). Shown before any contact is on
            the scope, so it never sits beside an event-wide figure. */}
        <blockquote className="c-radar-quote">
          {lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <footer>Zay “Domo” Artist</footer>
        </blockquote>

        {MOMENTS.map((m, i) => (
          <div
            key={m.n}
            ref={(el) => {
              radar.caps[i] = el
            }}
            className="c-radar-cap"
          >
            <strong>{m.label}</strong>
            <span>
              {m.short}
              <time dateTime={m.dateTime}>{m.date}</time>
            </span>
            {m.video && (
              <button type="button" className="c-radar-watch" onClick={openVideo}>
                Watch the freestyle
              </button>
            )}
          </div>
        ))}
      </div>

      <VideoModal
        open={video}
        onClose={() => setVideo(false)}
        src={EMBED_47}
        title="Mafiathon Freestyle #47: A Boogie Wit da Hoodie and Don Q"
      />
    </section>
  )
}
