import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Acting from './components/Acting'
import Reel from './components/Reel'
import Directing from './components/Directing'
import Press from './components/Press'
import Contact from './components/Contact'
import useLenis from './lib/useLenis'
import Loader from './components/Loader'
import Navbar from './components/Navbar'
import SectionRail from './components/ui/SectionRail'

const Music = lazy(() => import('./components/Music'))
const Business = lazy(() => import('./components/Business'))

function HeavySectionPlaceholder({ id, label }) {
  return (
    <section
      id={id}
      aria-label={label}
      aria-busy="true"
      className="min-h-[55vh] bg-obsidian border-t border-ivory/[0.05]"
    />
  )
}

function App() {
  const [loading, setLoading] = useState(() => {
    try {
      return window.sessionStorage.getItem('zay-intro-seen') !== '1'
    } catch {
      return true
    }
  })
  const [introBlocking, setIntroBlocking] = useState(loading)
  const [activeSection, setActiveSection] = useState('hero')
  const [heavyReady, setHeavyReady] = useState(false)

  useLenis()

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.35 }
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [heavyReady])

  useEffect(() => {
    const revealHeavySections = () => setHeavyReady(true)
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(revealHeavySections, { timeout: 1800 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(revealHeavySections, 700)
    return () => window.clearTimeout(id)
  }, [])

  const finishIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem('zay-intro-seen', '1')
    } catch {
      // Storage can be disabled; the intro still completes normally.
    }
    setLoading(false)
  }, [])

  return (
    <div className="film-grain vignette">
      <AnimatePresence mode="wait" onExitComplete={() => setIntroBlocking(false)}>
        {loading && <Loader key="loader" onComplete={finishIntro} />}
      </AnimatePresence>

      <div aria-hidden={introBlocking || undefined} inert={introBlocking || undefined}>
        <Navbar />
        <SectionRail active={activeSection} />
        <main>
          <Hero />
          <Marquee />
          <About />
          <Acting />
          <Reel />
          {heavyReady ? (
            <Suspense fallback={<HeavySectionPlaceholder id="music" label="Music" />}>
              <Music />
            </Suspense>
          ) : (
            <HeavySectionPlaceholder id="music" label="Music" />
          )}
          {heavyReady ? (
            <Suspense fallback={<HeavySectionPlaceholder id="business" label="MOSS Algorithm" />}>
              <Business />
            </Suspense>
          ) : (
            <HeavySectionPlaceholder id="business" label="MOSS Algorithm" />
          )}
          <Directing />
          <Press />
          <Contact />
        </main>
      </div>
    </div>
  )
}

export default App
