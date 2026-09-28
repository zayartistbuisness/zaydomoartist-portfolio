import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useWorldMotion } from '../world/WorldMotion'
import PixelScene from './PixelScene'
import Icon from './Icon'

export default function ExperienceHero() {
  const ref = useRef(null)
  const { still } = useWorldMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const portraitY = useTransform(scrollYProgress, [0, .6], ['0%', '12%'])
  const typeY = useTransform(scrollYProgress, [0, .6], ['0%', '-28%'])
  const typeOpacity = useTransform(scrollYProgress, [0, .3, .54], [1, 1, 0])
  const flockX = useTransform(scrollYProgress, [0, .75], ['-7%', '22%'])
  const cloudY = useTransform(scrollYProgress, [0, .55, 1], ['18%', '-18%', '-42%'])
  return (
    <section id="hero" className="experience-hero" ref={ref} aria-labelledby="experience-name">
      <div className="experience-hero-stage">
        <motion.div className="experience-portrait-field" style={still ? undefined : { y: portraitY }}>
          <img className="experience-portrait" src="/strategy/portrait/editorial.webp" alt="Zay Domo Artist in an editorial portrait, with an etched cloud backdrop." fetchPriority="high" />
        </motion.div>
        <div className="experience-hero-shade" />
        <div className="experience-hero-overline"><span>Actor &amp; creative strategist</span><span>Los Angeles / working everywhere</span></div>
        <motion.div className="experience-hero-intro" style={still ? undefined : { y: typeY, opacity: typeOpacity }}>
          <span className="experience-coordinate">PORTFOLIO — 2026</span>
          <p>On screen.<br />Behind the scenes.</p>
          <a href="#work" className="experience-enter">Explore the work <Icon name="scroll" size={19} /></a>
        </motion.div>
        <motion.h1 className="experience-name" id="experience-name" style={still ? undefined : { y: typeY, opacity: typeOpacity }}>
          <span>ZAY DOMO</span><span className="experience-artist-label">ARTIST</span>
        </motion.h1>
        <motion.div className="experience-flock-front" style={still ? undefined : { x: flockX }}>
          <PixelScene src="/strategy/motion/avian-flight/loop-mobile.mp4" poster="/strategy/motion/avian-flight/poster.webp" color="#28332b" grid={3.2} threshold={.15} />
        </motion.div>
        <motion.div className="experience-hero-cloud" style={still ? undefined : { y: cloudY }} aria-hidden="true" />
        <div className="experience-hero-foot"><span>Performance / Creative direction / Live production</span><a href="#work"><span>Scroll to discover</span><Icon name="scroll" size={14} /></a></div>
      </div>
    </section>
  )
}
