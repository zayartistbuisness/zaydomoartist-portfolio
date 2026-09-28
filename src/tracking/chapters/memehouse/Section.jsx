import { useEffect, useRef, useState } from 'react'
import { getChapter, useChapterSection } from '../../kit/chapterStore'
import { smooth } from '../../kit/space'
import { voice } from '../../content/voice'
import { ID, ROOMS, SOURCES, STOPS, scrollToStop, stopAt } from './timeline'
import './memehouse.css'

function Sources({ keys }) {
  if (!keys.length) return null
  return (
    <p className="c-memehouse-src">
      <span>Sources</span>
      {keys.map((k) => (
        <a key={k} href={SOURCES[k].href} target="_blank" rel="noopener noreferrer">
          {SOURCES[k].label}
          <span aria-hidden="true"> ↗</span>
        </a>
      ))}
    </p>
  )
}

/** Captions for a room's event photos: what, when, and whose. */
function Photos({ list }) {
  if (!list?.length) return null
  return list.map((ph) => (
    <p key={ph.href + ph.shows} className="c-memehouse-photo">
      {ph.label}: {ph.shows} · {ph.date} ·{' '}
      <a href={ph.href} target="_blank" rel="noopener noreferrer">
        {ph.credit}
      </a>
    </p>
  ))
}

export default function Section() {
  const ref = useRef()
  const stageRef = useRef()
  const [active, setActive] = useState(0)
  useChapterSection(ID, ref)

  // Captions follow the camera: the stop that owns the current progress.
  useEffect(() => {
    let raf
    let last = -1
    let lastReveal = -1
    let lastCap = -1
    const tick = () => {
      const c = getChapter(ID)
      const stage = stageRef.current
      if (c.visible && stage) {
        const p = c.progress
        const reveal = Math.round(smooth(0.165, 0.225, p) * 1000) / 1000
        const cap = Math.round(smooth(0.19, 0.235, p) * 1000) / 1000
        if (reveal !== lastReveal) stage.style.setProperty('--mh-reveal', String((lastReveal = reveal)))
        if (cap !== lastCap) stage.style.setProperty('--mh-cap', String((lastCap = cap)))
        const s = stopAt(p)
        if (s !== last) {
          last = s
          setActive(s)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  const mh = voice.memehouse

  return (
    <section ref={ref} className="c-memehouse" aria-labelledby="c-memehouse-title">
      <div ref={stageRef} className="c-memehouse-stage">
        <p className="c-memehouse-kicker">Featured · 03 / 04</p>

        <nav className="c-memehouse-rooms" aria-label="MemeHouse rooms">
          <ol>
            {ROOMS.map((r) => {
              const i = STOPS.indexOf(r)
              return (
                <li key={r.key}>
                  <button type="button" aria-current={i === active ? 'step' : undefined} onClick={() => scrollToStop(i)}>
                    <span className="c-memehouse-rooms-n">{r.n}</span>
                    <span className="c-memehouse-rooms-t">{r.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <header className="c-memehouse-head">
          <h2 id="c-memehouse-title" className="c-memehouse-title">MemeHouse</h2>
          {/*
            Role label: Zay's own line from content/voice.js (drafted with him,
            his to strike). Never the pitch deck's wording ("lead creative
            strategy", the U-Haul set, view counts).
          */}
          <p className="c-memehouse-role">
            <i className="rec" aria-hidden="true" />
            {mh.role}
          </p>
          <p className="c-memehouse-standfirst">
            Work with a Los Angeles live-production house that turns creator events into streams.
          </p>
        </header>

        <div className="c-memehouse-captions">
          {STOPS.map((s, i) => (
            <article
              key={s.key}
              className={`c-memehouse-cap${i === active ? ' is-on' : ''}`}
              aria-labelledby={`c-memehouse-cap-${s.key}`}
            >
              <header className="c-memehouse-cap-head">
                <span className="c-memehouse-cap-n">{s.n}</span>
                <h3 id={`c-memehouse-cap-${s.key}`}>{s.title}</h3>
              </header>
              <p className="c-memehouse-cap-date">{s.date}</p>
              {s.quote && (
                <blockquote className="c-memehouse-quote">
                  <p>{mh.lines.join(' ')}</p>
                  <footer>Zay</footer>
                </blockquote>
              )}
              <p className="c-memehouse-cap-body">{s.body}</p>
              <Photos list={s.photos} />
              <Sources keys={s.sources} />
            </article>
          ))}
        </div>

        <p className="c-memehouse-fine">
          Event-level facts; not personal metrics. The voxel mark is an unofficial editorial treatment.
        </p>
      </div>
    </section>
  )
}
