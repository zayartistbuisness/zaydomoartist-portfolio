import { useEffect, useRef } from 'react'
import { useChapterSection, getChapter } from '../../kit/chapterStore'
import { SPREAD_LABELS, SPREAD_PAGES } from './pages'
import { ARRIVE, spreadAt } from './YearbookModel'
import './su2.css'

const ID = 'su2'

// Rail text per spread, read off the same spreadAt() the book is posed by:
// the folios printed on the pages in view, and their names ("00 / 06 Cover",
// "01 / 06 Title page", "02–03 / 06 Staff · Behind the broadcast" …).
const pad2 = (n) => String(n).padStart(2, '0')
const LAST = pad2(SPREAD_LABELS.length - 1)
const RAIL = SPREAD_PAGES.map((pages) => ({
  count: `${pages.map(pad2).join('–')} / ${LAST}`,
  label: pages.map((i) => SPREAD_LABELS[i]).join(' · '),
}))

// Facts: site/research/featured-projects-brief.md §1 (event-level, sourced).
// Zay's own contribution lines are pending — he hasn't supplied them yet.
export default function Section() {
  const ref = useRef()
  const stageRef = useRef()
  const labelRef = useRef()
  const countRef = useRef()
  useChapterSection(ID, ref)

  useEffect(() => {
    let raf
    let last = -1
    const tick = () => {
      const q = getChapter(ID).progress
      const spread = spreadAt(q)
      if (spread !== last && labelRef.current && countRef.current) {
        last = spread
        labelRef.current.textContent = RAIL[spread].label
        countRef.current.textContent = RAIL[spread].count
      }
      stageRef.current?.style.setProperty('--book', String(Math.min(1, Math.max(0, (q - ARRIVE[0]) / (ARRIVE[1] - ARRIVE[0])))))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={ref} className="c-su2" aria-labelledby="c-su2-title">
      <div ref={stageRef} className="c-su2-stage">
        <header className="c-su2-head">
          <span>Featured · 01 / 04</span>
          <span>The Yearbook</span>
        </header>

        <div className="c-su2-intro">
          <h2 id="c-su2-title">Streamer University <em>2</em></h2>
          <p className="c-su2-role"><i className="rec" aria-hidden="true" /> Assistant Creative Strategist</p>
          <p className="c-su2-meta">July 15–20, 2026 · Hendrix College, Conway, Arkansas</p>
        </div>

        <footer className="c-su2-rail">
          <span><b ref={countRef}>{RAIL[0].count}</b> <span ref={labelRef}>{RAIL[0].label}</span></span>
          <span className="c-su2-hint">Scroll, or click the book to turn the page</span>
        </footer>

        {/* The chapter's words and sources for screen readers. Hidden, but
            its links are real tab stops, so keyboard focus opens it as a
            small panel on the stage instead of landing somewhere unseen. */}
        <div className="tlab-sr c-su2-sr">
          <p>Six days on a college campus in Arkansas, streamed almost without a break.</p>
          <p>
            Streamer University is Kai Cenat&rsquo;s in-person boot camp for content creators. Its second edition ran
            July 15–20, 2026 at Hendrix College in Conway, Arkansas, with 120 students and near-continuous livestreaming.
          </p>
          <h3>Event-wide figures, all channels</h3>
          <ul>
            <li>56.79M hours watched and 1.45M peak viewers across roughly 6,000 channels (<a href="https://streamscharts.com/news/streamer-university-2026-results">Streams Charts, July 21, 2026</a>).</li>
            <li>July 20, 2026: Suburb Baby named MVP; MeesterKeem named Valedictorian (Streams Charts).</li>
            <li>Next edition announced for Europe (<a href="https://www.complex.com/pop-culture/a/backwoodsaltar/kai-cenat-streamer-university-europe">Complex, July 20, 2026</a>).</li>
          </ul>
          <p>
            Event photographs from the official <a href="https://streameruniversity.com/yearbook">Streamer University 2026 yearbook</a>{' '}
            (photographer not credited). The staff portrait is an illustration made for this portfolio.
          </p>
        </div>
      </div>
    </section>
  )
}
