import { Fragment, useEffect, useRef, useState } from 'react'
import { useChapterSection, getChapter } from '../../kit/chapterStore'
import { voice } from '../../content/voice'
import { ID, MOMENTS, EMBED_47 } from './moments'
import { NARROW_MQ, TL, smooth, window4 } from './timeline'
import { radar, setRadar, useRadarState } from './radarStore'
import VideoModal from './VideoModal'
import './radar.css'

const M47 = MOMENTS.find((m) => m.video)

function Sources({ list }) {
  return (
    <p className="c-radar-src">
      Source:{' '}
      {list.map((s, i) => (
        <Fragment key={s.href}>
          {i > 0 && ' · '}
          <a href={s.href} target="_blank" rel="noreferrer">
            {s.label}
          </a>
        </Fragment>
      ))}
    </p>
  )
}

/** Caption for a card's event photo: what it shows, when, and whose it is. */
function PhotoCredit({ photo }) {
  return (
    <p className="c-radar-photo">
      Photo: {photo.shows} · {photo.date} ·{' '}
      <a href={photo.href} target="_blank" rel="noreferrer">
        {photo.credit}
      </a>
    </p>
  )
}

// Facts: site/research/featured-projects-brief.md §4 (event-level, sourced).
// Mafiathon 3 is Kai Cenat's production; On The Radar ran the freestyles.
export default function Section() {
  const ref = useRef()
  const stageRef = useRef()
  const colRef = useRef()
  const datesRef = useRef()
  const logRef = useRef()
  const [video, setVideo] = useState(false)
  const { focus, hover, shown } = useRadarState()
  useChapterSection(ID, ref)

  // Scroll-driven CSS variables (no React renders per frame).
  useEffect(() => {
    let raf
    const last = { r: -1, q: -1, m: -1, a: -1 }
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
      set('m', '--mark', window4(TL.markCap, p))
      set('a', '--after', smooth(TL.quote[0], TL.quote[1], p))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  // Narrow layout for the scene (phones and portrait tablets): the table and
  // the rising card fit between the headline block and the log row (the
  // tallest one, so the scope never moves between contacts). Offsets ignore
  // the reveal transform.
  useEffect(() => {
    const stage = stageRef.current
    const col = colRef.current
    const dates = datesRef.current
    const log = logRef.current
    if (!stage || !col || !dates || !log) return undefined
    const mq = window.matchMedia(NARROW_MQ)
    const L = radar.layout
    const measure = () => {
      L.on = mq.matches
      if (!mq.matches) return
      L.head = col.offsetTop + dates.offsetTop + dates.offsetHeight
      let tall = 0
      for (const li of log.children) tall = Math.max(tall, li.offsetHeight)
      L.foot = col.offsetTop + log.offsetTop + log.offsetHeight - tall
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(stage)
    ro.observe(col)
    for (const li of log.children) ro.observe(li)
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

  const toggle = (i) => setRadar({ focus: radar.focus === i ? -1 : i })
  const lean = (i) => setRadar({ hover: i })
  const unlean = (i) => radar.hover === i && setRadar({ hover: -1 })
  const openVideo = () => setVideo(true)

  const { role, lines } = voice.radar

  return (
    <section ref={ref} className="c-radar" aria-labelledby="c-radar-title">
      <div ref={stageRef} className="c-radar-stage">
        <header className="c-radar-head">
          <span>Featured · 04 / 04</span>
          <span>On The Radar × Mafiathon 3</span>
        </header>

        <p className="c-radar-markcap" aria-hidden="true">
          On The Radar mark · unofficial editorial treatment
        </p>

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

          <ol ref={logRef} className="c-radar-log" aria-label="On the radar: four moments">
            {MOMENTS.map((m, i) => (
              <li
                key={m.n}
                className={`${shown === i ? 'is-on' : ''}${hover === i ? ' is-lean' : ''}`}
                onMouseEnter={() => lean(i)}
                onMouseLeave={() => unlean(i)}
              >
                <button
                  type="button"
                  className="c-radar-go"
                  aria-pressed={focus === i}
                  onClick={() => toggle(i)}
                  onFocus={() => lean(i)}
                  onBlur={() => unlean(i)}
                >
                  <span className="c-radar-n">{m.n}</span>
                  <time dateTime={m.dateTime}>{m.date}</time>
                  <span className="c-radar-line">{m.line}</span>
                </button>
                <div className="c-radar-meta">
                  <Sources list={m.sources} />
                  {m.photo && <PhotoCredit photo={m.photo} />}
                  {m.video && (
                    <button type="button" className="c-radar-watch" onClick={openVideo}>
                      Watch the freestyle
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="c-radar-fine">
            Event-level facts; not personal metrics. Photos are event context, © the credited channels.
          </p>
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
            aria-hidden="true"
          >
            <span>
              {m.n} · {m.date}
            </span>
            <strong>{m.label}</strong>
            {m.photo && (
              <small>
                Photo: {m.photo.shows} · {m.photo.date} · {m.photo.credit}
              </small>
            )}
            {m.video && (
              <button type="button" tabIndex={-1} onClick={openVideo}>
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
        source={M47.sources[0]}
      />
    </section>
  )
}
