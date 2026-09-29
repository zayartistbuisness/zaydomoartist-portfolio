import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import HudPass from './HudPass'
import Lenis from 'lenis'
import { setScroller } from './scroller'
import { InkDriver } from '../ink/InkDriver'
import { usePointerTracking } from '../ink/pointer'
import { useXpCursor } from './cursor'
import ChapterDriver from './ChapterDriver'
import ChromeEnv from './ChromeEnv'
import ClipBand from './ClipBand'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/jetbrains-mono/400.css'
import '../lab/lab.css'
import './chapter-lab.css'

// Each chapter lives in src/tracking/chapters/<id>/index.jsx and default-
// exports { id, title, Section, Scene }. This harness mounts one in
// isolation at /lab/chapter/<id> exactly as the full page will: Scene inside
// the HUD pass (drawn over earlier chapters), Section in the DOM flow.
const modules = import.meta.glob('../chapters/*/index.jsx')

export default function ChapterLab() {
  const { id } = useParams()
  const [chapter, setChapter] = useState(null)
  const rootRef = useRef()
  const missing = !modules[`../chapters/${id}/index.jsx`]
  usePointerTracking()
  useXpCursor(rootRef)

  useEffect(() => {
    const load = modules[`../chapters/${id}/index.jsx`]
    if (load) load().then((m) => setChapter(m.default))
  }, [id])

  useEffect(() => {
    document.documentElement.classList.add('tlab-html')
    const lenis = new Lenis({ autoRaf: true, lerp: 0.075, wheelMultiplier: 0.8, touchMultiplier: 1.1 })
    if (import.meta.env.DEV) window.__lenis = lenis
    setScroller(lenis)
    return () => {
      lenis.destroy()
      document.documentElement.classList.remove('tlab-html')
    }
  }, [])

  const Scene = chapter?.Scene
  const Section = chapter?.Section

  return (
    <div ref={rootRef} className="tlab tchap">
      <Canvas
        className="tlab-canvas"
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 30, position: [0, 0, 10], near: 0.1, far: 200 }}
        eventSource={document.getElementById('root')}
        eventPrefix="client"
      >
        <InkDriver />
        <ChapterDriver />
        <HudPass renderPriority={1}>
          <PerspectiveCamera makeDefault fov={30} position={[0, 0, 10]} near={0.1} far={200} />
          <ChromeEnv />
          {Scene && (
            <ClipBand id={id}>
              <Scene />
            </ClipBand>
          )}
        </HudPass>
      </Canvas>

      <div className="tlab-grain" aria-hidden="true" />
      <main>
        <section className="tchap-spacer">
          <p>Chapter lab · {chapter?.title || id}</p>
          <p>{missing ? `No chapter "${id}" in src/tracking/chapters/` : 'Scroll ↓'}</p>
        </section>
        {Section && <Section />}
        <section className="tchap-spacer">
          <p>End of chapter</p>
        </section>
      </main>
    </div>
  )
}
