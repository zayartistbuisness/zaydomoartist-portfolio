import { useRef } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import WorldCanvas from './WorldCanvas'
import EmblemSculpture from './EmblemSculpture'

export default function BetweenFrames() {
  const ref = useRef(null)
  return (
    <section ref={ref} id="between" className="world-between" aria-labelledby="between-title">
      <div className="world-between-meta"><span>01 / A different perspective</span><span>Keep looking <ArrowDownRight size={16} /></span></div>
      <div className="world-between-copy">
        <span className="world-small-cross" aria-hidden="true">+</span>
        <h2 id="between-title">Somewhere between<br /><em>real &amp; imagined.</em></h2>
        <p>I’m drawn to the space between who we are<br className="world-desktop-break" /> and who we could become. That’s where the story starts.</p>
      </div>
      <div className="world-contact-sheet">
        <a href="#acting" className="world-frame world-frame-portrait">
          <img src="/headshots/headshot-1.jpg" alt="Zay by a studio window — explore portraits and credits" loading="lazy" />
          <span>Presence / Portraits <ArrowUpRight size={15} /></span>
        </a>
        <a href="#reel" className="world-frame world-frame-screen">
          <img src="/reel/reel-poster.jpg" alt="A scene from the acting reel" loading="lazy" />
          <span>Performance / Scene work <ArrowUpRight size={15} /></span>
        </a>
        <div className="world-artifact">
          <EmblemSculpture />
          <span>One artist.<br />Many dimensions.</span>
        </div>
      </div>
      <div className="world-between-atmosphere"><WorldCanvas hero={false} sceneRef={ref} /></div>
      <div className="world-between-footer">
        <p>Actor by instinct.<br /><em>Artist by nature.</em></p>
        <a href="#about">The story so far <ArrowUpRight size={18} /></a>
      </div>
    </section>
  )
}
