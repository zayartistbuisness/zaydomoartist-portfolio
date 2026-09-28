import { useEffect } from 'react'
import useLenis from './lib/useLenis'
import { useWorldMotion } from './components/world/WorldMotion'
import ExperienceHeader from './components/experience/ExperienceHeader'
import ExperienceHero from './components/experience/ExperienceHero'
import WorkPrologue from './components/experience/WorkPrologue'
import CreativeStrategy from './components/strategy/CreativeStrategy'
import { ArtistStory, ActingArchive } from './components/experience/ArtistStory'
import ContactPanel from './components/experience/ContactPanel'
import { artist, press, credits, projectCopy } from './content/artist'
import './experience.css'

/**
 * One authored scroll journey. Legacy source modules remain in the repository,
 * but music/reel and the generic brand rails are no longer part of this page.
 */
export default function PortfolioExperience() {
  const { still } = useWorldMotion()
  useLenis()

  useEffect(() => {
    let hash
    try { hash = decodeURIComponent(location.hash.slice(1)) } catch { return }
    const redirects = { music: 'work', reel: 'work', between: 'work', signal: 'work', press: 'about', business: 'contact', directing: 'work' }
    const id = redirects[hash] || hash
    if (!id) return
    const target = document.getElementById(id)
    if (target) {
      if (id !== hash) history.replaceState(history.state, '', `#${id}`)
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }))
    }
  }, [])

  return (
    <div className="portfolio" data-motion={still ? 'still' : 'live'}>
      <ExperienceHeader />
      <main id="main" tabIndex={-1}>
        <ExperienceHero />
        <WorkPrologue />
        <CreativeStrategy content={projectCopy} />
        <ArtistStory artist={artist} press={press} />
        <ActingArchive credits={credits} />
        <ContactPanel />
      </main>
    </div>
  )
}
