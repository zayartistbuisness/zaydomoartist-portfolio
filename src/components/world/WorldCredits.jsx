import { ArrowUpRight } from 'lucide-react'

export default function WorldCredits() {
  return (
    <section id="signal" className="world-credits" aria-label="Selected work and recognition">
      <div>
        <p>Selected work &amp; collaborations</p>
        <div className="world-studio-list">
          <img src="/brands/netflix.png" alt="Netflix" loading="lazy" />
          <img src="/brands/universal.png" alt="Universal Pictures" loading="lazy" />
          <img src="/brands/nike.png" alt="Nike" loading="lazy" />
          <img src="/brands/walmart.webp" alt="Walmart" loading="lazy" />
        </div>
      </div>
      <a href="#acting">Explore the work <ArrowUpRight size={18} /></a>
    </section>
  )
}
