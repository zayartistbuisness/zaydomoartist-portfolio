import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import About from './components/About'
import Acting from './components/Acting'
import Music from './components/Music'
import Business from './components/Business'
import Directing from './components/Directing'
import Contact from './components/Contact'
import Loader from './components/Loader'
import Navbar from './components/Navbar'
import Cursor from './components/ui/Cursor'

function App() {
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    if (loading) return
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
  }, [loading])

  return (
    <div className="film-grain vignette">
      <Cursor />

      <AnimatePresence mode="wait">
        {loading && <Loader key="loader" onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          <Navbar />
          <main>
            <Hero />
            <Marquee />
            <About />
            <Acting />
            <Music />
            <Business />
            <Directing />
            <Contact />
          </main>
        </>
      )}
    </div>
  )
}

export default App
