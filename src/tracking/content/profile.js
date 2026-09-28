// Who Zay is — the casting-facing facts. Sources:
//   credits  site/research/bio-research-2026-09-28.md (IMDb / TV Guide / AllMovie)
//   reps     current live site contact section (self-reported; confirm with Zay)
//   roles    content/voice.js (approved by Zay 2026-09-28)
// No deck-only claims, no audience numbers, no superlatives.

export const profile = {
  name: 'Zay “Domo” Artist',
  descriptor: 'Actor, writer and creative strategist.',
  based: 'Los Angeles',
  disciplines: ['Film', 'Television', 'Live production'],
  // Biography. Life story is Zay's own account from his interviews (Staffa
  // Corner, May 2025; PopSize UK, Sept 2024) — self-reported, stated as his
  // story. Credits are database-verified. See research/bio-research-*.md.
  bio: [
    'Zay “Domo” Artist grew up in Florida and entered the foster care system at twelve. Movies were his escape — and, with no drama school to speak of, his first acting class.',
    'He started out in voice work for video games before pushing onto the screen. While still in care, he was granted a court’s permission to fly to Australia to film Kingdom of the Planet of the Apes. He finished high school early through virtual school, worked full-time at McDonald’s, and moved to Los Angeles at eighteen. During the 2023 strikes he cold-emailed managers and agents himself, and signed mid-strike.',
    'His screen work includes HBO’s The Last of Us, Kingdom of the Planet of the Apes and A Quiet Place: Day One. Off camera he builds the stories live shows run on — as Assistant Creative Strategist at Kai Cenat’s Streamer University 2, on creative strategy and direction for MemeHouse, and on the freestyle side of Mafiathon 3’s On The Radar.',
    'He speaks openly about growing up in care and about opening doors for foster youth in entertainment, including on a panel at the Real to Reel Global Youth Film Festival in 2024. He is now developing KEON, a boxing drama set in Central Florida that he wrote and plans to direct and star in.',
  ],
  imdb: 'https://www.imdb.com/name/nm14198614/',
  // Official profiles — keep in sync with the JSON-LD sameAs in index.html.
  social: [
    { label: 'IMDb', url: 'https://www.imdb.com/name/nm14198614/' },
    { label: 'Instagram', url: 'https://www.instagram.com/zaydomoartist/' },
    { label: 'YouTube', url: 'https://www.youtube.com/@Zaydomoartist' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@zaydomoartist' },
  ],
}

// Titles are italicised in the UI. `detail` is what a casting reader needs.
export const credits = [
  { year: '2024', title: 'A Quiet Place: Day One', role: 'Young Bryan', detail: 'Feature · Paramount' },
  { year: '2024', title: 'Kingdom of the Planet of the Apes', role: 'Milo (Young Ape)', detail: 'Feature · 20th Century Studios' },
  { year: '2023', title: 'The Last of Us', role: 'Young Rebel Boy', detail: 'HBO · S1 E4' },
  { year: 'Post', title: 'LA Jesus', role: 'Basketball Player 1', detail: 'Feature · post-production' },
  { year: '—', title: 'Momma I Gotta Job', role: 'David', detail: 'Feature · Dust House Films' },
  { year: '2017', title: 'On the Run', role: 'Jaiden', detail: 'Short' },
]

export const inDevelopment = { title: 'KEON', role: 'Writer · Director · Lead', detail: 'Boxing drama · in development', anchor: '#keon' }

export const reps = [
  { role: 'Management', name: 'Schuller Talent', email: 'schullertalent@gmail.com' },
  { role: 'Theatrical', name: 'Coast to Coast Talent', email: 'coastyouth@ctctalent.com' },
  { role: 'Press', name: 'Lisa — Lynk PR', email: 'lisa@lynkpr.com' },
]

export const press = [
  { outlet: 'The Staffa Corner', label: 'Podcast interview', year: '2025', url: 'https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview' },
  { outlet: 'PopSize UK', label: 'Interview', year: '2024', url: 'https://popsize.co.uk/news/2024/09/the-last-of-us-and-a-quiet-place-day-one-actor-zay-domo-artist-talks-about-helping-adopted-children-get-started-in-the-acting-industry/' },
  { outlet: 'Real to Reel Global Youth Film Festival', label: 'Panelist', year: '2024', url: 'https://www.einpresswire.com/article/772993754/10th-annual-real-to-reel-global-youth-film-festival-inspires-filmmakers-and-announces-winners' },
]

export const INQUIRY_TYPES = ['Casting', 'Creative direction', 'Press', 'General']
