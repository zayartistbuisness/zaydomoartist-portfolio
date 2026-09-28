import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useWorldMotion } from '../world/WorldMotion'
import './creative-strategy.css'

// Project scope follows asset-studio/BRIEF.md and the supplied portfolio.
// Public-source verification establishes provenance, not individual results.
const CHAPTERS = [
  {
    id: 'university',
    nav: 'SU2',
    title: 'Streamer University 2',
    category: 'Live narrative',
    period: 'July 15–20, 2026',
    summary: 'Six days of creative strategy. A campus-wide storyline, from confrontation to payoff.',
    contribution: 'Creative strategy across the full event, including the Suburb Baby arc: a staged clash, an escape, a bounty and a live resolution.',
    boundary: 'Creative strategy: July 15–20, 2026. “Head of Creative Strategy” applies to July 15 only. The storyline is staged entertainment.',
    poster: '/strategy/projects/image7.jpeg',
    posterAlt: 'Official Suburbbaby thumbnail for the staged confrontation with Dean Kai at Streamer University 2.',
    caption: 'Suburbbaby / “Suburb Confronts Dean Kai Cenat.” Official project thumbnail, July 15, 2026.',
    sourceUrl: 'https://www.youtube.com/watch?v=Bp2Erheq1qc',
    sourceLabel: 'Watch the original',
    mark: '/strategy/marks/streamer-university-2/mark-pixel-color.png',
    markName: 'Streamer University',
    markNote: '2026 project identity',
    threshold: '/strategy/transitions/campus-grid/threshold.png',
    ink: [99, 38, 51],
    beatLabel: 'The story arc',
    beats: [
      { title: 'Confrontation', text: 'A staged clash with Dean Kai.' },
      { title: 'Escalation', text: 'A campus-police arrest and escape.' },
      { title: 'Stakes', text: 'A bounty and campus-wide pursuit.' },
      { title: 'Payoff', text: 'A live capture that resolves the arc.' },
    ],
  },
  {
    id: 'memehouse',
    nav: 'MemeHouse',
    title: 'MemeHouse',
    category: 'Concept & direction',
    period: 'Project-based collaboration',
    summary: 'Creative strategy for Isaac Francis’s “The Debut” and Capaholics. Specific projects, not a blanket company credit.',
    contribution: 'Led creative strategy for The Debut, originating stream concepts and content direction—including a beach-themed U-Haul DJ set on a tight budget. Creative strategy, concept development and direction for Capaholics.',
    boundary: 'Personal scope: The Debut and Capaholics. The Scene / Coachella, TwitchCon and Twinathon are company portfolio context, not personal credits.',
    poster: '/strategy/projects/image9.jpeg',
    posterAlt: 'Official Isaac Francis / The Debut stream thumbnail at a Miami Art Basel party.',
    caption: 'Isaac Francis / The Debut. Official stream thumbnail; a context frame, not the beach U-Haul DJ set.',
    sourceUrl: 'https://www.twitch.tv/isaacfranciss/clip/CulturedPunchyBatShadyLulu-5rmRr51rRIdzKKia',
    sourceLabel: 'View the source clip',
    mark: '/strategy/marks/memehouse/mark-pixel-color.png',
    markName: 'MemeHouse Productions',
    markNote: 'Company identity / project-based work',
    threshold: '/strategy/transitions/studio-doors/threshold.png',
    ink: [188, 211, 187],
    beatLabel: 'The creative scope',
    beats: [
      { title: 'The brief', text: 'Isaac Francis / The Debut.' },
      { title: 'The concept', text: 'A beach-themed U-Haul DJ set.' },
      { title: 'The direction', text: 'Stream concepts and content direction.' },
      { title: 'Another collaboration', text: 'Capaholics: strategy, concepts and direction.' },
    ],
  },
  {
    id: 'mafiathon',
    nav: 'Mafiathon 3',
    title: 'Mafiathon 3',
    category: 'Artist planning',
    period: 'On The Radar / 2025',
    summary: 'Creative planning and artist coordination for On The Radar’s Mafiathon 3 freestyle segments.',
    contribution: 'Creative planning, artist coordination and emerging-talent scouting for the freestyle segments, including planning for A Boogie’s surprise appearance.',
    boundary: 'Scope: On The Radar freestyle segments, not overall Mafiathon production. The displayed mark belongs to On The Radar; it is not a Mafiathon 3 logo.',
    poster: '/strategy/projects/image4.jpeg',
    posterAlt: 'Official On The Radar thumbnail featuring A Boogie and Don Q at the Mafiathon 3 freestyle microphones.',
    caption: 'On The Radar / A Boogie + Don Q. Official freestyle #47 thumbnail, September 29, 2025.',
    sourceUrl: 'https://www.youtube.com/watch?v=5GDjmkATEFk',
    sourceLabel: 'Watch the freestyle',
    mark: '/strategy/marks/on-the-radar/mark-pixel-color.png',
    markName: 'On The Radar',
    markNote: 'Freestyle-series identity, not the event logo',
    threshold: '/strategy/transitions/sound-bands/threshold.png',
    ink: [32, 42, 37],
    beatLabel: 'The approach',
    beats: [
      { title: 'Plan the segment', text: 'Freestyle-led programming.' },
      { title: 'Scout the voices', text: 'Emerging talent alongside established artists.' },
      { title: 'Coordinate artists', text: 'Artist planning and coordination.' },
      { title: 'Build the reveal', text: 'A Boogie surprise appearance.' },
    ],
  },
]

const clamp = (value) => Math.max(0, Math.min(1, value))
const number = (value) => String(value + 1).padStart(2, '0')

/**
 * Paint ONLY the ink above the real DOM photograph. The threshold map supplies
 * timing, never display colors. Removing this canvas always reveals the poster.
 * Native mask resolution, nearest-neighbor sampling, no clock/video/randomness.
 */
function PixelRevealCanvas({ progress, threshold, ink, enabled }) {
  const ref = useRef(null)
  const nearby = useInView(ref, { margin: '240px 0px' })
  const [red, green, blue] = ink

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !enabled || !nearby) return

    let context
    try {
      context = canvas.getContext('2d')
    } catch {
      canvas.dataset.revealState = 'fallback'
      return
    }
    if (!context) {
      canvas.dataset.revealState = 'fallback'
      return
    }

    let disposed = false
    let frame = 0
    let thresholds
    let output
    let lastProgress = -1
    const alpha = new Uint8ClampedArray(256)
    const image = new Image()
    canvas.dataset.revealState = 'loading'

    const draw = () => {
      frame = 0
      if (disposed || !thresholds || document.hidden) return
      const p = clamp(progress.get())
      if (p === lastProgress) return
      lastProgress = p

      // asset-studio/transitions: w=8/255, smoothstep, exact 0/1 endpoints.
      // A 256-entry lookup avoids evaluating smoothstep for every source pixel.
      for (let value = 0; value < 256; value += 1) {
        const u = clamp((p * 255 - value + 4) / 8)
        const revealed = p === 0 ? 0 : p === 1 ? 255 : Math.floor(u * u * (3 - 2 * u) * 255 + 0.5)
        alpha[value] = 255 - revealed
      }
      for (let i = 0; i < thresholds.length; i += 1) {
        output.data[i * 4 + 3] = alpha[thresholds[i]]
      }
      context.putImageData(output, 0, 0)
      canvas.dataset.revealProgress = p.toFixed(3)
      canvas.dataset.revealState = 'ready'
    }

    const schedule = () => {
      if (!frame && !document.hidden && !disposed) frame = requestAnimationFrame(draw)
    }

    image.onload = () => {
      if (disposed) return
      try {
        // Bounded allocation even if a content override supplies a larger map.
        canvas.width = Math.min(image.naturalWidth, 1024)
        canvas.height = Math.max(1, Math.round(canvas.width * image.naturalHeight / image.naturalWidth))
        if (canvas.height > 1024 || !canvas.width) throw new Error('Invalid threshold dimensions')
        context.imageSmoothingEnabled = false
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const source = context.getImageData(0, 0, canvas.width, canvas.height).data
        thresholds = new Uint8Array(canvas.width * canvas.height)
        output = context.createImageData(canvas.width, canvas.height)
        for (let i = 0; i < thresholds.length; i += 1) {
          thresholds[i] = source[i * 4]
          // A restrained, deterministic engraved line in the otherwise flat ink.
          const line = Math.floor(i / canvas.width) % 4 === 0 ? 5 : 0
          output.data[i * 4] = Math.max(0, red - line)
          output.data[i * 4 + 1] = Math.max(0, green - line)
          output.data[i * 4 + 2] = Math.max(0, blue - line)
        }
        context.clearRect(0, 0, canvas.width, canvas.height)
        schedule()
      } catch {
        canvas.dataset.revealState = 'fallback'
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    image.onerror = () => {
      if (!disposed) canvas.dataset.revealState = 'fallback'
    }
    image.crossOrigin = 'anonymous'
    image.src = threshold

    const unsubscribe = progress.on('change', schedule)
    const onVisibility = () => {
      cancelAnimationFrame(frame)
      frame = 0
      if (!document.hidden) schedule()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
      image.onload = null
      image.onerror = null
      // Fail open: pausing, leaving view, or unmounting never hides the source.
      canvas.dataset.revealState = 'idle'
      context.clearRect(0, 0, canvas.width, canvas.height)
      canvas.width = 1
      canvas.height = 1
    }
  }, [enabled, nearby, threshold, progress, red, green, blue])

  return (
    <canvas
      ref={ref}
      className="strategy-transition-ink transition-ink"
      width="1"
      height="1"
      aria-hidden="true"
      data-reveal-renderer="luma"
      data-threshold-src={threshold}
      data-reveal-state="idle"
      data-reveal-progress={enabled ? undefined : '1'}
    />
  )
}

function SourceMark({ chapter }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="strategy-source-mark" data-reveal-slot="source-mark">
      <div className="strategy-source-mark__art" aria-hidden="true" data-missing={failed || !chapter.mark}>
        {!failed && chapter.mark
          ? <img src={chapter.mark} alt="" width="100" height="80" loading="lazy" decoding="async" onError={() => setFailed(true)} />
          : <span>↗</span>}
      </div>
      <div>
        <p className="strategy-label">Source identity</p>
        <p className="strategy-source-mark__name">{chapter.markName}</p>
        <p className="strategy-source-mark__note">{chapter.markNote}</p>
      </div>
    </div>
  )
}

function ProjectPoster({ chapter, progress, still }) {
  const [status, setStatus] = useState('loading')
  return (
    <figure className="strategy-figure" data-reveal-slot="poster" data-poster-state={status}>
      <div className="strategy-poster" data-poster-src={chapter.poster}>
        <div
          className="strategy-poster__fallback"
          role={status === 'error' ? 'img' : undefined}
          aria-label={status === 'error' ? `${chapter.title}. Project image unavailable.` : undefined}
          aria-hidden={status !== 'error'}
        >
          <span className="strategy-label">Project archive</span>
          <span className="strategy-poster__fallback-title">{chapter.title}</span>
          <span className="strategy-poster__fallback-note">
            {status === 'error' ? 'Image unavailable. The original source is linked below.' : 'Loading the project photograph…'}
          </span>
        </div>
        <img
          className="strategy-poster__image"
          src={chapter.poster}
          alt={chapter.posterAlt}
          width="1280"
          height="720"
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
        <PixelRevealCanvas
          progress={progress}
          threshold={chapter.threshold}
          ink={chapter.ink}
          enabled={!still && status === 'loaded'}
        />
        <span className="strategy-poster__registration" aria-hidden="true">+</span>
      </div>
      <figcaption className="strategy-caption">
        <p>{chapter.caption}</p>
        {chapter.sourceUrl && (
          <a href={chapter.sourceUrl} target="_blank" rel="noopener noreferrer">
            {chapter.sourceLabel}<span aria-hidden="true">↗</span>
            <span className="strategy-sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </figcaption>
      <SourceMark key={chapter.mark} chapter={chapter} />
    </figure>
  )
}

function StrategyChapter({ chapter, index, active, still }) {
  const ref = useRef(null)
  const [beat, setBeat] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 85%'] })
  const revealProgress = useTransform(scrollYProgress, [0.08, 0.49], [0, 1])
  const copyLift = useTransform(scrollYProgress, [0, 0.24], [14, 0])
  const count = chapter.beats.length

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const next = Math.min(count - 1, Math.floor(clamp((value - 0.18) / 0.72) * count))
    if (!still) setBeat((previous) => previous === next ? previous : next)
    if (ref.current) ref.current.dataset.caseProgress = still ? '1' : value.toFixed(3)
  })

  return (
    <article
      ref={ref}
      id={chapter.id}
      className={`strategy-chapter strategy-chapter--${chapter.id}`}
      data-case={chapter.id}
      data-case-active={active}
      data-case-progress={still ? '1' : undefined}
      data-active-beat={still ? 'all' : beat + 1}
      tabIndex={-1}
      aria-labelledby={`${chapter.id}-title`}
    >
      <header className="strategy-chapter__heading">
        <div className="strategy-chapter__title-block">
          <p className="strategy-label strategy-chapter__eyebrow">
            <span>{number(index)} / {chapter.category}</span>
            <span className="strategy-chapter__cross" aria-hidden="true">+</span>
          </p>
          <h3 id={`${chapter.id}-title`} className="strategy-title">{chapter.title}</h3>
        </div>
        <div className="strategy-chapter__opening">
          <p className="strategy-chapter__summary">{chapter.summary}</p>
          <p className="strategy-label strategy-chapter__period">{chapter.period}</p>
        </div>
      </header>

      <div className="strategy-chapter__scene" data-case-scene={chapter.id}>
        <ProjectPoster key={chapter.poster} chapter={chapter} progress={revealProgress} still={still} />
        <div className="strategy-story">
          <motion.div
            className="strategy-contribution"
            data-reveal-slot="contribution"
            style={{ y: still ? 0 : copyLift }}
          >
            <h4 className="strategy-label">My contribution</h4>
            <p>{chapter.contribution}</p>
          </motion.div>

          <aside className="strategy-beat-rail" aria-labelledby={`${chapter.id}-beats`} data-reveal-slot="beat-rail">
            <div className="strategy-beat-rail__heading">
              <h4 id={`${chapter.id}-beats`} className="strategy-label">{chapter.beatLabel}</h4>
              <span className="strategy-label" aria-hidden="true">{still ? '01—' : `${number(beat)} / `}{number(count - 1)}</span>
            </div>
            <ol>
              {chapter.beats.map((item, position) => (
                <li
                  key={`${position}-${item.title}`}
                  className="strategy-beat"
                  data-beat={position + 1}
                  data-active={!still && position === beat}
                  aria-current={!still && position === beat ? 'step' : undefined}
                >
                  <span className="strategy-beat__number" aria-hidden="true">{number(position)}</span>
                  <div>
                    <p className="strategy-beat__title">{item.title}</p>
                    <p className="strategy-beat__text">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>

          <div className="strategy-boundary" data-reveal-slot="credit-boundary">
            <h4 className="strategy-label">Credit boundary</h4>
            <p>{chapter.boundary}</p>
          </div>
        </div>
        <div className="strategy-progress" aria-hidden="true">
          <motion.span style={{ scaleX: still ? 1 : scrollYProgress }} />
        </div>
      </div>
    </article>
  )
}

/**
 * <CreativeStrategy content={projectCopy} />
 * Optional copy is keyed by university / memehouse / mafiathon. Each object is
 * a partial CHAPTERS entry; unspecified fields retain the documented fallback.
 * artist.js's contributions[] is supported alongside a single contribution.
 * Section copy may use heading, eyebrow and intro. No content module coupling.
 * Hooks: [data-case], [data-case-scene], [data-reveal-slot], .transition-ink.
 * Set --strategy-nav-top on .strategy-work to match the integrating header.
 */
export default function CreativeStrategy({ content }) {
  const ref = useRef(null)
  const [active, setActive] = useState('university')
  const { still, reduced } = useWorldMotion()
  const motionOff = still || reduced
  const chapters = CHAPTERS.map((chapter) => {
    const override = content?.[chapter.id]
    const merged = { ...chapter, ...(override && typeof override === 'object' ? override : {}), id: chapter.id }
    if (!override?.contribution && Array.isArray(override?.contributions)) {
      merged.contribution = override.contributions.filter((text) => typeof text === 'string').join(' ') || chapter.contribution
    }
    // A partial content handoff must not turn an entire chapter into an empty rail.
    if (!Array.isArray(merged.beats) || !merged.beats.length) merged.beats = chapter.beats
    return merged
  })

  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.dataset.case)
      }
    }, { rootMargin: '-32% 0px -57% 0px', threshold: 0 })
    ref.current.querySelectorAll('.strategy-chapter').forEach((chapter) => observer.observe(chapter))
    return () => observer.disconnect()
  }, [])

  // Keep real fragments / modifier clicks and honor both sticky headers.
  // Reuse an existing Lenis instance when present; never create another one.
  const onChapterLink = (event, id) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (window.lenis?.isStopped) return
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    setActive(id === 'work' ? 'university' : id)
    if (window.location.hash !== `#${id}`) window.history.pushState(window.history.state, '', `#${id}`)
    target.focus({ preventScroll: true })
    if (typeof window.lenis?.scrollTo === 'function') {
      const offset = -(parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0)
      window.lenis.scrollTo(target, { offset, immediate: motionOff, duration: 1.1 })
    } else {
      target.scrollIntoView({ behavior: motionOff ? 'instant' : 'smooth', block: 'start' })
    }
  }

  return (
    <section
      ref={ref}
      id="work"
      className="strategy-work"
      aria-labelledby="strategy-heading"
      data-motion={motionOff ? 'still' : 'live'}
      data-active-case={active}
      tabIndex={-1}
    >
      <header className="strategy-intro">
        <p className="strategy-label">{content?.eyebrow ?? 'Selected collaborations / 01—03'}</p>
        <div className="strategy-intro__row">
          <h2 id="strategy-heading">{content?.heading ?? 'Creative strategy'}</h2>
          <p>{content?.intro ?? 'Live story arcs, stream concepts and artist planning. Three projects, with the contribution made clear.'}</p>
        </div>
      </header>

      <nav className="strategy-index" aria-label="Creative strategy chapters">
        <span className="strategy-index__label strategy-label" aria-hidden="true">In this section <span>↓</span></span>
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                onClick={(event) => onChapterLink(event, chapter.id)}
                aria-current={active === chapter.id ? 'location' : undefined}
                data-case-link={chapter.id}
              >
                <span className="strategy-index__number">{number(index)}</span>
                <span>{chapter.nav}</span>
                <span className="strategy-index__arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {chapters.map((chapter, index) => (
        <StrategyChapter key={chapter.id} chapter={chapter} index={index} active={active === chapter.id} still={motionOff} />
      ))}
      <footer className="strategy-footnote">
        <p>Project scope follows the supplied portfolio. Source images and identities remain credited to their owners.</p>
        <a href="#work" onClick={(event) => onChapterLink(event, 'work')}>Back to selected work <span aria-hidden="true">↑</span></a>
      </footer>
    </section>
  )
}
