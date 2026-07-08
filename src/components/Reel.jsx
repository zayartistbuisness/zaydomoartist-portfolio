import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion'
import SectionHeader from './ui/SectionHeader'
import { easeLux, prefersReducedMotion } from '../lib/motion'

/**
 * The screening room. One feature presentation, shown whole — and when it
 * plays, the house lights go down: everything but the screen falls into
 * darkness. Below the screen, three scenes loop silently like monitors on
 * a video wall; choosing one seats you at that moment of the feature.
 */
const scenes = [
  { src: '/reel/scene-a.mp4', t: 45, label: 'Scene 01', code: '00:45' },
  { src: '/reel/scene-b.mp4', t: 190, label: 'Scene 02', code: '03:10' },
  { src: '/reel/scene-c.mp4', t: 348, label: 'Scene 03', code: '05:48' },
]

export default function Reel() {
  const videoRef = useRef(null)
  const stripRef = useRef(null)
  const sectionRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  const reduce = prefersReducedMotion()
  // the loops only decode while the strip is near the viewport
  const stripNear = useInView(stripRef, { margin: '300px 0px' })

  // faint lateral drift on the scene wall as the room scrolls past
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], [24, -24])

  const start = () => {
    const v = videoRef.current
    if (!v) return
    v.play()
    setPlaying(true)
  }

  const seekTo = (t) => {
    const v = videoRef.current
    if (!v) return
    // play() must be called inside the click gesture or the browser blocks
    // it — it also kicks off loading, so no explicit load() is needed
    const p = v.play()
    if (p) p.catch(() => setPlaying(false))
    if (v.readyState >= 1) v.currentTime = t
    else v.addEventListener('loadedmetadata', () => { v.currentTime = t }, { once: true })
    setPlaying(true)
  }

  return (
    <section
      ref={sectionRef}
      id="reel"
      style={{ zIndex: playing ? 45 : 'auto' }}
      className="relative py-28 md:py-44 px-6 md:px-16 overflow-visible bg-obsidian border-t border-ivory/[0.05]"
    >
      {/* house lights — pointer-events pass through so the room stays usable */}
      <AnimatePresence>
        {playing && (
          <motion.div
            key="houselights"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/85 pointer-events-none z-[5]"
          />
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto">
        <SectionHeader
          index="III"
          label="The Reel"
          title={[{ text: 'Scene' }, { text: 'work', gold: true }]}
          note="Self-tape and scene selections, updated 2026."
        />

        {/* the screen — kept above the house lights */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.3, ease: easeLux }}
          className="relative z-[6] overflow-hidden border border-ivory/[0.08] bg-onyx"
        >
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              src="/reel/reel-web.mp4"
              poster="/reel/reel-poster.jpg"
              preload="none"
              playsInline
              controls={playing}
              onEnded={() => setPlaying(false)}
              onPause={() => setPlaying(false)}
              onError={() => setPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover bg-obsidian"
            />

            {!playing && (
              <button
                onClick={start}
                data-cursor="PLAY"
                aria-label="Play acting reel"
                className="group absolute inset-0 flex items-center justify-center"
              >
                {/* dim wash so the invitation reads over any poster frame */}
                <span className="absolute inset-0 bg-obsidian/40 group-hover:bg-obsidian/25 transition-colors duration-700" />
                <span className="relative flex flex-col items-center gap-5">
                  <span className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border border-gold/50 group-hover:border-gold group-hover:scale-105 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <span className="ml-1 w-0 h-0 border-y-[9px] border-y-transparent border-l-[14px] border-l-ivory group-hover:border-l-gold transition-colors duration-500" />
                  </span>
                  <span className="text-[10px] tracking-[0.45em] uppercase font-light text-bone/70 group-hover:text-ivory transition-colors duration-500">
                    Play Reel
                  </span>
                </span>
              </button>
            )}
          </div>

          {/* placard */}
          {!playing && (
            <div className="absolute bottom-5 left-5 pointer-events-none hidden md:flex items-center gap-3">
              <span className="font-serif italic text-gold-metallic text-xl">Reel</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-bone/60">Zay “Domo” Artist · 2026</span>
            </div>
          )}
        </motion.div>

        {/* the scene wall — three silent loops; choosing one seats you there */}
        <motion.div
          ref={stripRef}
          style={{ x: reduce ? 0 : drift }}
          className="mt-4 md:mt-6 grid grid-cols-3 gap-3 md:gap-5"
        >
          {scenes.map((s) => (
            <button
              key={s.src}
              onClick={() => seekTo(s.t)}
              data-cursor="PLAY"
              aria-label={`Play reel from ${s.label} at ${s.code}`}
              className="group relative aspect-video overflow-hidden border border-ivory/[0.08] hover:border-gold/50 transition-colors duration-700 bg-graphite"
            >
              {stripNear && !reduce ? (
                <video
                  src={s.src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="w-full h-full object-cover opacity-55 group-hover:opacity-100 transition-opacity duration-700"
                />
              ) : (
                <span className="absolute inset-0 bg-graphite" />
              )}
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-3 md:bottom-3 md:left-4 flex items-baseline gap-2 md:gap-3">
                <span className="font-serif italic text-gold-metallic text-xs md:text-base">{s.label}</span>
                <span className="hidden md:inline text-[9px] tracking-[0.3em] text-bone/50">{s.code}</span>
              </span>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
