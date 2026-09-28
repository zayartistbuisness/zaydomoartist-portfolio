import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, Play, Pause } from 'lucide-react'
import WorldCanvas from './WorldCanvas'
import ReelDialog from './ReelDialog'
import { useWorldMotion } from './WorldMotion'

export default function WorldHero() {
  const sceneRef = useRef(null)
  const [reelOpen, setReelOpen] = useState(false)
  const { still, reduced, toggle } = useWorldMotion()
  useEffect(() => {
    const scene = sceneRef.current
    let raf = 0
    const update = () => {
      raf = 0
      const r = scene.getBoundingClientRect()
      const p = still ? 0 : Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)))
      scene.style.setProperty('--scene-progress', p.toFixed(4))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [still])

  return (
    <>
      <section ref={sceneRef} id="hero" className="world-hero" aria-labelledby="world-name">
        <div className="world-stage">
          <picture className="world-portrait">
            <source media="(max-width: 900px)" srcSet="/world/portrait-world-mobile.webp" />
            <img src="/world/portrait-world.webp" alt="An editorial portrait of Zay Domo Artist, blending into clouds and ink." fetchPriority="high" />
          </picture>
          <WorldCanvas sceneRef={sceneRef} />
          <div className="world-hero-wash" />

          <div className="world-hero-content">
            <div className="world-kicker"><span className="world-dot" />Actor. Producer. Director.</div>
            <h1 id="world-name" className="world-name">
              <span>Zay</span><span>Domo<span className="world-name-period">.</span></span>
              <em>Artist</em>
            </h1>
            <p className="world-hero-line">A life in motion.<br />A mind elsewhere.</p>
            <button className="world-reel-button" type="button" onClick={() => setReelOpen(true)}>
              <span className="world-play-icon"><Play size={16} fill="currentColor" strokeWidth={0} /></span>
              <span>Watch the reel<small>Step into a different story</small></span>
              <ArrowUpRight size={21} strokeWidth={1.4} />
            </button>
          </div>
          <span className="world-side-note">Real presence. Other worlds.</span>
          <div className="world-coordinate">LOS ANGELES, CA<br /><span>Available worldwide</span></div>
          <div className="world-bottom-bar">
            <a href="#between" className="world-enter">Enter the world <ArrowDown size={15} /></a>
            <span className="world-edition">Portfolio / 2026</span>
            <button
              type="button"
              className="world-motion-toggle"
              aria-label={reduced ? 'Enable scene animation' : still ? 'Resume scene animation' : 'Pause scene animation'}
              aria-pressed={still}
              onClick={toggle}
            >
              {still ? <Play size={12} /> : <Pause size={12} />}
              {reduced ? 'Enable motion' : still ? 'Still mode' : 'Living scene'}
            </button>
          </div>
          <div className="world-scroll-line" aria-hidden="true"><span /></div>
        </div>
      </section>
      <ReelDialog open={reelOpen} onClose={() => setReelOpen(false)} />
    </>
  )
}
