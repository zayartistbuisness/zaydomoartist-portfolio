import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useWorldMotion } from '../world/WorldMotion'
import PixelScene from './PixelScene'
import Icon from './Icon'

export default function WorkPrologue() {
  const ref = useRef(null)
  const { still } = useWorldMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['-15%', '20%'])
  return (
    <section className="experience-prologue" ref={ref} aria-labelledby="work-intro-title">
      <div className="experience-prologue-kicker"><span className="experience-symbol" /><span>01 / Selected work</span></div>
      <h2 id="work-intro-title">The idea is only<br /><em>the beginning.</em></h2>
      <p>For live shows, I work on the creative plan, the artists involved, and what happens when the cameras are on.</p>
      <div className="experience-project-index">
        <a href="#university"><span>01</span>Streamer University 2<Icon size={17} /></a>
        <a href="#memehouse"><span>02</span>MemeHouse<Icon size={17} /></a>
        <a href="#mafiathon"><span>03</span>Mafiathon 3 / On The Radar<Icon size={17} /></a>
      </div>
      <motion.div className="experience-prologue-creature" style={still ? undefined : { x }}>
        <PixelScene src="/strategy/motion/fox-stride/loop-mobile.mp4" poster="/strategy/motion/fox-stride/poster.webp" color="#b7bda4" grid={3.8} threshold={.17} />
      </motion.div>
      <div className="experience-prologue-exit" aria-hidden="true" />
    </section>
  )
}
