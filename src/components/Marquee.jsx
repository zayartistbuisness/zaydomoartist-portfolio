import { useState } from 'react'
import Eyebrow from './ui/Eyebrow'

const workBrands = [
  { name: 'Netflix', src: '/brands/netflix.png' },
  { name: 'Universal Pictures', src: '/brands/universal.png' },
  { name: 'Nike', src: '/brands/nike.png' },
  { name: 'Walmart', src: '/brands/walmart.webp' },
]

const recognitionBrands = [
  { name: 'GQ', src: '/brands/gq.png' },
  { name: 'Teen Vogue', src: '/brands/teenvogue.webp' },
  { name: 'The Washington Post', src: '/brands/washingtonpost.svg' },
]

const industryProfile = { name: 'IMDbPro', src: '/brands/imdbpro.png' }

const credits = [
  'HBO — The Last of Us',
  'Kingdom of the Planet of the Apes',
  'A Quiet Place: Day One',
  'Call of Duty: WWII',
  'Fortnite',
  'Overwatch 2',
  'Master of Dreams',
  'Momma I Gotta Job',
  'LA Jesus',
]

/**
 * A quiet proof strip — selected work, collaborations, and recognition are
 * labeled separately so the logos never imply a relationship they do not have.
 */
function LogoRail({ brands, label, duration = '40s', paused }) {
  return (
    <div className="relative mask-fade-lr" aria-label={label}>
      <div
        className="flex w-max animate-marquee items-center motion-reduce:animate-none"
        style={{ animationDuration: duration, animationPlayState: paused ? 'paused' : 'running' }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            role={copy === 0 ? 'list' : undefined}
            aria-hidden={copy === 1 ? 'true' : undefined}
            className="flex min-w-[100vw] shrink-0 items-center justify-around"
          >
            {brands.map((brand) => (
              <div
                key={`${copy}-${brand.name}`}
                role={copy === 0 ? 'listitem' : undefined}
                data-cursor={brand.name}
                className="group mx-6 flex h-8 shrink-0 items-center justify-center md:mx-12 md:h-11"
              >
                <img
                  src={brand.src}
                  alt={copy === 0 ? brand.name : ''}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-auto max-w-[160px] object-contain brightness-0 invert opacity-30 transition-opacity duration-700 group-hover:opacity-70"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function RailLabel({ children, note }) {
  return (
    <div className="mx-auto mb-7 flex max-w-[1600px] items-end justify-between gap-6 px-6 md:px-16">
      <p className="text-[10px] uppercase tracking-[0.3em] text-bone/70">{children}</p>
      {note && <span className="hidden text-[9px] uppercase tracking-[0.22em] text-silver md:block">{note}</span>}
    </div>
  )
}

export default function Marquee() {
  const [railsPaused, setRailsPaused] = useState(false)

  return (
    <section id="signal" className="relative py-20 md:py-28 overflow-hidden bg-obsidian border-y border-ivory/[0.05]">
      <div className="mx-auto mb-12 flex max-w-[1600px] items-center justify-between gap-8 px-6 md:mb-16 md:px-16">
        <Eyebrow>Selected Work · Recognition</Eyebrow>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setRailsPaused((paused) => !paused)}
            aria-pressed={railsPaused}
            data-cursor={railsPaused ? 'RESUME' : 'PAUSE'}
            className="border border-ivory/15 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-bone/60 transition-colors hover:border-gold/50 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {railsPaused ? 'Resume motion' : 'Pause motion'}
          </button>
          <div className="hidden items-center gap-4 border-l border-ivory/[0.08] pl-5 md:flex" aria-label="Industry profile on IMDbPro">
            <span className="text-[8px] uppercase tracking-[0.24em] text-silver">Industry profile</span>
            <img
              src={industryProfile.src}
              alt={industryProfile.name}
              loading="lazy"
              decoding="async"
              className="h-5 w-auto max-w-[90px] object-contain brightness-0 invert opacity-45"
            />
          </div>
        </div>
      </div>

      <RailLabel note="Studios · campaigns · platforms">Selected work &amp; collaborations</RailLabel>
      <LogoRail brands={workBrands} label="Selected work and collaboration logos" duration="44s" paused={railsPaused} />

      {/* Screen credits */}
      <div className="relative mt-12 border-t border-ivory/[0.05] pt-12 md:mt-16 md:pt-16">
        <RailLabel note="Film · television · games">Selected screen credits</RailLabel>
        <div className="relative mask-fade-lr" aria-label="Selected screen credits">
          <div
            className="flex w-max animate-marquee items-center motion-reduce:animate-none"
            style={{ animationDuration: '25s', animationPlayState: railsPaused ? 'paused' : 'running' }}
          >
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1 ? 'true' : undefined} className="flex shrink-0 items-center">
                {credits.map((credit) => (
                  <span
                    key={`${copy}-${credit}`}
                    className="flex items-center gap-10 whitespace-nowrap pr-10 font-editorial text-4xl italic text-bone/35 md:text-6xl"
                  >
                    {credit}
                    <span className="text-xs not-italic text-gold/40" aria-hidden="true">◦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-12 border-t border-ivory/[0.05] pt-12 md:mt-16 md:pt-16">
        <RailLabel note="Editorial coverage">Press &amp; recognition</RailLabel>
        <LogoRail brands={recognitionBrands} label="Press and recognition logos" duration="36s" paused={railsPaused} />
      </div>

      <div className="mx-auto mt-10 flex max-w-[1600px] items-center gap-4 px-6 md:hidden" aria-label="Industry profile on IMDbPro">
        <span className="text-[8px] uppercase tracking-[0.24em] text-silver">Industry profile</span>
        <img
          src={industryProfile.src}
          alt={industryProfile.name}
          loading="lazy"
          decoding="async"
          className="h-5 w-auto max-w-[90px] object-contain brightness-0 invert opacity-45"
        />
      </div>
    </section>
  )
}
