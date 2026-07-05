import Eyebrow from './ui/Eyebrow'

const brands = [
  { name: 'Netflix', src: '/brands/netflix.png' },
  { name: 'Universal Pictures', src: '/brands/universal.png' },
  { name: 'Nike', src: '/brands/nike.png' },
  { name: 'GQ', src: '/brands/gq.png' },
  { name: 'Teen Vogue', src: '/brands/teenvogue.webp' },
  { name: 'The Washington Post', src: '/brands/washingtonpost.svg' },
  { name: 'IMDbPro', src: '/brands/imdbpro.png' },
  { name: 'Walmart', src: '/brands/walmart.webp' },
]

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
 * A quiet recognition strip — press logos and screen credits drifting past,
 * like plates on a gallery wall. No shouting, no tickers.
 */
export default function Marquee() {
  const doubledBrands = [...brands, ...brands]
  const doubledCredits = [...credits, ...credits, ...credits]

  return (
    <section id="signal" className="relative py-20 md:py-28 overflow-hidden bg-obsidian border-y border-ivory/[0.05]">
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 mb-12 md:mb-16">
        <Eyebrow>Featured In</Eyebrow>
      </div>

      {/* Press logos */}
      <div className="relative mask-fade-lr">
        <div className="flex animate-marquee items-center" style={{ width: 'max-content' }}>
          {doubledBrands.map((brand, i) => (
            <div
              key={`${brand.name}-${i}`}
              data-cursor={brand.name}
              className="flex-shrink-0 mx-10 md:mx-16 flex items-center justify-center h-8 md:h-11 group"
            >
              <img
                src={brand.src}
                alt={brand.name}
                className="h-full w-auto object-contain brightness-0 invert opacity-30 group-hover:opacity-70 transition-opacity duration-700 max-w-[160px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Screen credits */}
      <div className="relative mask-fade-lr mt-14 md:mt-20 border-t border-ivory/[0.05] pt-14 md:pt-20">
        <div className="flex animate-marquee-fast items-center" style={{ width: 'max-content' }}>
          {doubledCredits.map((credit, i) => (
            <span
              key={`${credit}-${i}`}
              className="font-editorial italic text-2xl md:text-4xl text-bone/35 whitespace-nowrap flex items-center gap-10 pr-10"
            >
              {credit}
              <span className="text-gold/40 text-xs not-italic">◦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
