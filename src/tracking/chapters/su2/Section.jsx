import { useEffect, useRef } from 'react'
import { useChapterSection, getChapter } from '../../kit/chapterStore'
import { ARRIVE } from './YearbookModel'
import './su2.css'

const ID = 'su2'

// Facts: site/research/featured-projects-brief.md §1 (event-level, sourced).
// Art-first: on screen only the title, his role and the dates. The book
// carries the rest; photo credits and sources are in content/credits.js
// (rendered in the Contact footer).
export default function Section() {
  const ref = useRef()
  const stageRef = useRef()
  useChapterSection(ID, ref)

  useEffect(() => {
    let raf
    const tick = () => {
      const q = getChapter(ID).progress
      stageRef.current?.style.setProperty('--book', String(Math.min(1, Math.max(0, (q - ARRIVE[0]) / (ARRIVE[1] - ARRIVE[0])))))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={ref} className="c-su2" aria-labelledby="c-su2-title">
      <div ref={stageRef} className="c-su2-stage">
        <div className="c-su2-intro">
          <h2 id="c-su2-title">Streamer University <em>2</em></h2>
          <p className="c-su2-role"><i className="rec" aria-hidden="true" /> Assistant Creative Strategist</p>
          <p className="c-su2-meta">July 15–20, 2026 · Hendrix College, Conway, Arkansas</p>
        </div>

        {/* The chapter's words for screen readers (the book's pages are
            canvas). Plain text only, no tab stops. */}
        <div className="tlab-sr">
          <p>Six days on a college campus in Arkansas, streamed almost without a break.</p>
          <p>
            Streamer University is Kai Cenat&rsquo;s in-person boot camp for content creators. Its second edition ran
            July 15–20, 2026 at Hendrix College in Conway, Arkansas, with 120 students and near-continuous livestreaming.
          </p>
          <p>
            Event-wide, across all channels: 56.79M hours watched and 1.45M peak viewers across roughly 6,000 channels.
            Suburb Baby was named MVP and MeesterKeem Valedictorian on July 20, 2026. The next edition was announced for Europe.
          </p>
        </div>
      </div>
    </section>
  )
}
