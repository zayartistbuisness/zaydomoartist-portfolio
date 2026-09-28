import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useWorldMotion } from '../world/WorldMotion'
import PixelScene from './PixelScene'
import Icon from './Icon'

const portraits = [
  { src: '/headshots/headshot-2.jpg', label: 'Portrait 01 / Studio' },
  { src: '/headshots/headshot-1.jpg', label: 'Portrait 02 / Daylight' },
  { src: '/headshots/headshot-3.jpg', label: 'Portrait 03 / Black & white' },
  { src: '/headshots/headshot-6.jpg', label: 'Portrait 04 / Location' },
]

export function ArtistStory({ artist, press = [] }) {
  const ref = useRef(null)
  const { still } = useWorldMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const markRotate = useTransform(scrollYProgress, [0, 1], [-18, 15])
  const paragraphs = Array.isArray(artist?.bio) ? artist.bio : artist?.bio ? [artist.bio] : []
  return (
    <section className="experience-story" id="about" ref={ref} aria-labelledby="story-title">
      <div className="experience-story-top"><span>02 / The person</span><span>Orlando → Los Angeles</span></div>
      <div className="experience-story-layout">
        <div className="experience-story-portrait">
          <img src="/headshots/headshot-2.jpg" alt="Zay Domo Artist seated in the studio" loading="lazy" />
          <span>Between takes.</span>
        </div>
        <div className="experience-story-copy">
          <h2 id="story-title">I’m Zay.<br /><em>Actor first.</em></h2>
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="experience-story-links">
            {press.slice(0, 2).map((p) => (
              <a key={p.url} href={p.url} target="_blank" rel="noreferrer noopener">
                <span>{p.outlet}<small>{p.title}</small></span><Icon size={18} />
              </a>
            ))}
          </div>
        </div>
        <motion.div className="experience-story-mark" style={still ? undefined : { rotate: markRotate }}>
          <PixelScene src="/strategy/motion/aperture-assembly/loop-mobile.mp4" poster="/strategy/motion/aperture-assembly/poster.webp" color="#24332b" threshold={.33} grid={3} />
        </motion.div>
      </div>
    </section>
  )
}

export function ActingArchive({ credits = [] }) {
  const [selected, setSelected] = useState(0)
  return (
    <section id="acting" className="experience-acting" aria-labelledby="acting-title">
      <div className="experience-acting-heading"><span>03 / Acting</span><h2 id="acting-title">In the frame.</h2><a href="https://www.imdb.com/name/nm14198614/" target="_blank" rel="noreferrer noopener">Filmography on IMDb <Icon size={15} /></a></div>
      <div className="experience-acting-layout">
        <div className="experience-headshot">
          <img src={portraits[selected].src} alt={`Zay Domo Artist, ${portraits[selected].label.toLowerCase()}`} />
          <div className="experience-headshot-caption"><span>{portraits[selected].label}</span><a href={portraits[selected].src} download aria-label="Download this headshot"><Icon name="scroll" size={18} /></a></div>
        </div>
        <div className="experience-acting-detail">
          <div className="experience-headshot-tabs" role="group" aria-label="Choose a portrait">
            {portraits.map((p, index) => <button key={p.src} type="button" onClick={() => setSelected(index)} aria-pressed={index === selected} aria-label={`View ${p.label}`}><img src={p.src} alt="" loading="lazy" /><span>0{index + 1}</span></button>)}
          </div>
          <h3>Selected screen work</h3>
          <div className="experience-credit-list">
            {credits.map((credit) => <a key={credit.title} href={credit.source} target="_blank" rel="noreferrer noopener" aria-label={`${credit.title}, view credit listing`}><span>{credit.year}</span><p>{credit.title}<small>{credit.role || 'Screen performance'}</small></p><Icon size={13} /></a>)}
          </div>
          <p className="experience-credit-note">Years refer to the film’s release or the series premiere.</p>
          <a className="experience-rep-link" href="mailto:coastyouth@ctctalent.com">Acting inquiries / Coast to Coast Talent <Icon size={16} /></a>
        </div>
      </div>
    </section>
  )
}
