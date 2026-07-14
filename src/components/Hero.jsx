import { useEffect, useRef, useState } from 'react'
import {
  motion as Motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { easeLux } from '../lib/motion'

const actionLinks = [
  { label: 'View Reel', href: '#reel', cursor: 'REEL', primary: true },
  { label: 'Credits', href: '#acting', cursor: 'CREDITS' },
  {
    label: 'IMDb',
    href: 'https://www.imdb.com/name/nm14198614/',
    cursor: 'IMDb',
    external: true,
  },
  {
    label: 'Contact Rep',
    href: 'mailto:coastyouth@ctctalent.com?subject=Casting%20Inquiry%20for%20Zay%20Domo%20Artist',
    cursor: 'EMAIL',
  },
]

/**
 * Keep moving media opt-in. The poster is always the first frame, and the
 * scene never downloads or plays when the visitor requests less motion/data.
 */
function useAmbientScene() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dataQuery = window.matchMedia('(prefers-reduced-data: reduce)')
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

    const update = () => {
      const constrainedConnection = connection?.saveData || connection?.effectiveType?.includes('2g')
      setEnabled(!motionQuery.matches && !dataQuery.matches && !constrainedConnection)
    }

    update()
    motionQuery.addEventListener?.('change', update)
    dataQuery.addEventListener?.('change', update)
    connection?.addEventListener?.('change', update)

    return () => {
      motionQuery.removeEventListener?.('change', update)
      dataQuery.removeEventListener?.('change', update)
      connection?.removeEventListener?.('change', update)
    }
  }, [])

  return enabled
}

function AmbientSceneVideo() {
  const [ready, setReady] = useState(false)

  return (
    <video
      src="/reel/scene-b.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      tabIndex={-1}
      aria-hidden="true"
      onCanPlay={() => setReady(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
        ready ? 'opacity-80' : 'opacity-0'
      }`}
    />
  )
}

function SceneMonitor({ canPlay }) {

  return (
    <Motion.a
      href="#reel"
      data-cursor="REEL"
      aria-label="View Zay Domo Artist's acting reel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: easeLux, delay: 1.15 }}
      className="group relative z-20 mt-7 block w-full max-w-[19rem] overflow-hidden border border-ivory/15 bg-onyx shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:absolute md:bottom-24 md:right-16 md:mt-0 md:w-[clamp(17rem,24vw,23rem)]"
    >
      <span className="relative block aspect-video overflow-hidden bg-graphite">
        <img
          src="/reel/reel-poster.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-80 grayscale"
        />
        {canPlay && <AmbientSceneVideo />}

        <span className="absolute inset-0 bg-gradient-to-t from-obsidian/85 via-transparent to-obsidian/25" />
        <span className="absolute inset-x-3 top-3 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.22em] text-ivory/65 md:text-[9px]">
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${canPlay ? 'bg-[#d56a42]' : 'bg-gold/70'}`} />
            {canPlay ? 'Scene feed' : 'Scene still'}
          </span>
          <span>Take 02</span>
        </span>

        <span className="absolute inset-x-3 bottom-3 flex items-end justify-between">
          <span>
            <span className="block font-serif text-lg italic text-ivory">Screen test</span>
            <span className="mt-0.5 block text-[8px] uppercase tracking-[0.28em] text-bone/55 md:text-[9px]">
              Selected scene · no audio
            </span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/35 bg-obsidian/30 transition-all duration-500 group-hover:border-[#d56a42] group-hover:bg-[#d56a42]">
            <span className="ml-0.5 h-0 w-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-ivory" />
          </span>
        </span>
      </span>
    </Motion.a>
  )
}

/**
 * The living screen test: portrait first, casting essentials immediately
 * available, and one restrained moving frame as a glimpse of the reel.
 */
export default function Hero() {
  const sectionRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const canPlayScene = useAmbientScene()

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])
  const imageDim = useTransform(scrollYProgress, [0, 1], [0, 0.58])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])

  const nameLines = [
    { text: 'Zay', gold: false },
    { text: '“Domo”', gold: true },
    { text: 'Artist', gold: false },
  ]

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="hero-title"
      className="relative min-h-[100svh] w-full overflow-hidden bg-obsidian"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Motion.div
          className="absolute inset-[-3%]"
          style={{ y: reduceMotion ? 0 : imageY }}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.075 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.65, ease: easeLux }}
        >
          <Motion.img
            src="/headshots/headshot-3.jpg"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-[66%_18%] sm:object-[68%_20%]"
            style={{ filter: 'grayscale(100%) contrast(1.06) brightness(0.88)' }}
            animate={reduceMotion ? undefined : { scale: [1, 1.045] }}
            transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
          />
          <Motion.div className="absolute inset-0 bg-obsidian" style={{ opacity: reduceMotion ? 0 : imageDim }} />
        </Motion.div>

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, #060607 0%, rgba(6,6,7,.96) 22%, rgba(6,6,7,.72) 43%, rgba(6,6,7,.18) 70%, rgba(6,6,7,.04) 100%)',
          }}
        />
        <div
          className="absolute inset-0 md:hidden"
          style={{ background: 'linear-gradient(to top, #060607 4%, rgba(6,6,7,.8) 46%, rgba(6,6,7,.12) 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, #060607 0%, rgba(6,6,7,0) 30%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(120% 100% at 67% 38%, transparent 54%, rgba(6,6,7,.5) 100%)' }}
        />
      </div>

      {/* Quiet viewfinder marks make the page read as a screen test, not a game HUD. */}
      <div className="pointer-events-none absolute inset-x-6 top-24 z-10 flex items-start justify-between text-[8px] uppercase tracking-[0.3em] text-bone/40 md:inset-x-16 md:top-28 md:text-[9px]" aria-hidden="true">
        <span className="border-l border-t border-gold/35 pl-3 pt-3">Casting frame · 001</span>
        <span className="border-r border-t border-ivory/20 pr-3 pt-3 text-right">Los Angeles, CA<br />Available worldwide</span>
      </div>

      <Motion.div
        style={{ y: reduceMotion ? 0 : contentY }}
        className="relative z-10 flex min-h-[100svh] items-end px-6 pb-28 pt-40 sm:items-center sm:pb-24 md:px-16 md:pb-20 md:pt-32"
      >
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="max-w-[43rem] md:max-w-[50%]">
            <Motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: easeLux, delay: 0.2 }}
              className="mb-5 flex items-center gap-3 md:mb-7"
            >
              <span className="h-px w-8 bg-[#d56a42]/80" />
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-bone/60 md:text-[10px]">
                Actor · Producer · Director
              </span>
            </Motion.div>

            <h1
              id="hero-title"
              className="font-serif text-[clamp(3.45rem,9vw,8.8rem)] font-light leading-[0.82] tracking-tight text-ivory"
            >
              {nameLines.map((line, index) => (
                <span key={line.text} className="block overflow-hidden pb-[0.08em]">
                  <Motion.span
                    className={`inline-block ${line.gold ? 'pr-[0.1em] italic text-gold-metallic' : ''}`}
                    style={line.gold ? { marginLeft: '0.48em' } : undefined}
                    initial={reduceMotion ? false : { y: '112%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1.05, ease: easeLux, delay: 0.32 + index * 0.11 }}
                  >
                    {line.text}
                  </Motion.span>
                </span>
              ))}
            </h1>

            <Motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: easeLux, delay: 0.82 }}
              className="mt-5 max-w-md text-[12px] font-light leading-relaxed tracking-[0.08em] text-bone/65 md:mt-7 md:text-sm"
            >
              Character, story, and worlds built from an unexpected angle.
            </Motion.p>

            <Motion.nav
              aria-label="Casting actions"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.95, ease: easeLux, delay: 0.96 }}
              className="mt-6 grid max-w-xl grid-cols-2 gap-2 sm:flex sm:flex-wrap md:mt-8"
            >
              {actionLinks.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  target={action.external ? '_blank' : undefined}
                  rel={action.external ? 'noopener noreferrer' : undefined}
                  data-cursor={action.cursor}
                  className={`group relative inline-flex min-h-11 items-center justify-between gap-4 overflow-hidden border px-4 text-[9px] font-medium uppercase tracking-[0.22em] transition-colors duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:justify-center sm:px-5 md:min-h-12 md:text-[10px] ${
                    action.primary
                      ? 'border-ivory bg-ivory text-obsidian hover:border-[#d56a42] hover:bg-[#d56a42] hover:text-ivory'
                      : 'border-ivory/20 bg-obsidian/20 text-bone/75 backdrop-blur-sm hover:border-gold/60 hover:text-gold'
                  }`}
                >
                  <span>{action.label}</span>
                  {action.primary ? (
                    <span className="h-0 w-0 border-y-[4px] border-y-transparent border-l-[7px] border-l-current" aria-hidden="true" />
                  ) : (
                    <span className="text-current transition-transform duration-500 group-hover:translate-x-0.5" aria-hidden="true">↗</span>
                  )}
                </a>
              ))}
            </Motion.nav>

            <SceneMonitor canPlay={canPlayScene && !reduceMotion} />
          </div>
        </div>
      </Motion.div>

      <Motion.a
        href="#about"
        data-cursor="ENTER"
        aria-label="Continue to the portfolio"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.35 }}
        className="absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-2 text-[8px] uppercase tracking-[0.4em] text-bone/45 transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold md:flex"
      >
        <span>Enter portfolio</span>
        <Motion.span
          animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="h-7 w-px bg-gradient-to-b from-gold/70 to-transparent"
          aria-hidden="true"
        />
      </Motion.a>
    </section>
  )
}
