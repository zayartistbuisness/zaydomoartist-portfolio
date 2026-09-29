import { useEffect, useRef } from 'react'
import { useChapterSection, getChapter } from '../../kit/chapterStore'
import { scrollToY } from '../../kit/scroller'
import { profile, reps } from '../../content/profile'
import { setAboutSlot } from './store'
import './about.css'

const ID = 'about'

function jump(e, id) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY)
}

export default function Section() {
  const ref = useRef()
  const slotRef = useRef()
  useChapterSection(ID, ref)

  useEffect(() => {
    setAboutSlot(slotRef.current)
    let raf
    const tick = () => {
      // 0 → 1 as the section rises through the lower two thirds of the screen
      const e = getChapter(ID).enter
      ref.current?.style.setProperty('--in', String(Math.min(1, Math.max(0, (e - 0.15) / 0.55))))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={ref} className="c-about" aria-labelledby="c-about-title">
      <div className="c-about-grid">
        <div className="c-about-copy">
          <p className="c-about-kicker">About</p>
          <h2 id="c-about-title" className="c-about-title">
            <span>From foster care</span>
            <em>to the frame.</em>
          </h2>
          <div className="c-about-bio">
            {profile.bio.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
          </div>

          <dl className="c-about-facts">
            <div><dt>Based in</dt><dd>{profile.based}</dd></div>
            <div><dt>Works in</dt><dd>{profile.disciplines.join(' · ')}</dd></div>
            <div>
              <dt>Representation</dt>
              <dd>
                {reps.filter((r) => r.role !== 'Press').map((r) => (
                  <a key={r.role} href={`mailto:${r.email}`}>{r.name} <span>{r.role}</span></a>
                ))}
              </dd>
            </div>
          </dl>

          <nav className="c-about-links" aria-label="About shortcuts">
            <a href={profile.imdb} target="_blank" rel="noreferrer">IMDb ↗</a>
            <a href="#contact" onClick={(e) => jump(e, 'contact')}>Casting &amp; contact ↓</a>
          </nav>
        </div>

        <div className="c-about-portrait">
          <div ref={slotRef} className="c-about-slot" role="img" aria-label="Zay Domo Artist, black-and-white portrait, his head turning in a long exposure" />
        </div>
      </div>
    </section>
  )
}
