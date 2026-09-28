// Audited September 27, 2026. Evidence and exclusions:
// ../../research/zay-content-audit.md
// The bio is an array of paragraphs. Years are strings for display.
export const artist = {
  name: 'Zay Domo Artist',
  role: 'Actor & creative strategist',
  intro:
    "I'm Zay Domo Artist, an actor and creative strategist working in film, television and live streaming.",
  bio: [
    'I grew up in Florida and spent part of my childhood in foster care. I watched old movies on VHS with my grandmother, and films became an escape for me.',
    "On screen, I'm an actor. Behind a live show, I help plan artist appearances and coordinate the people taking part. I also develop storylines that unfold across a stream.",
  ],
}

// Published interviews, not independent verification of every career claim.
// Titles are editorial display labels, not exact source headlines; dates are in the audit.
export const press = [
  {
    outlet: 'The Staffa Corner',
    title: 'On acting and growing up in care',
    url: 'https://www.thestaffacorner.com/1395679/episodes/17219126-zay-domo-on-defying-the-odds-and-music-career-journey-exclusive-music-interview',
    year: '2025',
  },
  {
    outlet: 'PopSize UK',
    title: 'On Helping Adopted Children Get Started in Acting',
    url: 'https://popsize.co.uk/news/2024/09/the-last-of-us-and-a-quiet-place-day-one-actor-zay-domo-artist-talks-about-helping-adopted-children-get-started-in-the-acting-industry/',
    year: '2024',
  },
]

// TV Guide lists these titles under Actor; no character name or billing is inferred.
// Years identify the film's release / series premiere, not a verified work date,
// season, episode or ongoing appointment. See the audit before labeling the UI.
export const credits = [
  {
    title: 'Kingdom of the Planet of the Apes',
    role: 'Actor',
    year: '2024',
    source: 'https://www.tvguide.com/celebrities/zay-domo/credits/3060098117/',
  },
  {
    title: 'The Last of Us',
    role: 'Actor',
    year: '2023',
    source: 'https://www.tvguide.com/celebrities/zay-domo/credits/3060098117/',
  },
]

// Personal contributions below are supplied-deck / user-account claims.
// Public project coverage is context, not independent verification of Zay's role.
export const projectCopy = {
  university: {
    title: 'Streamer University 2',
    headline: 'Creative strategy across six days',
    summary:
      'I ran creative strategy across Streamer University 2, July 15–20, 2026, including work on the staged Suburb Baby storyline. My Head of Creative Strategy appointment applied to July 15, 2026 only.',
    role: 'Creative strategy, July 15–20, 2026; Head of Creative Strategy, July 15, 2026 only',
    contributions: [
      'I worked on creative strategy throughout the six-day event.',
      'I helped shape the Suburb Baby storyline, from a staged confrontation with Dean Kai through the arrest, escape, bounty and live capture.',
    ],
  },
  memehouse: {
    title: 'MemeHouse — selected projects',
    headline: 'The Debut and Capaholics',
    summary:
      "I worked with MemeHouse on a project basis, leading creative strategy for Isaac Francis's The Debut and contributing creative strategy, concept development and direction for Capaholics.",
    role: 'Project-based creative strategy & direction',
    contributions: [
      'For The Debut, I originated stream concepts and content direction.',
      'I developed a beach-themed U-Haul DJ set for The Debut around a tight budget.',
      'For Capaholics, I contributed creative strategy, concept development and direction.',
    ],
  },
  mafiathon: {
    title: 'Mafiathon 3 / On The Radar',
    headline: 'Artist planning for the freestyle segments',
    summary:
      "I helped plan On The Radar's freestyle segments during Mafiathon 3, coordinating artists, scouting emerging talent and contributing to A Boogie's surprise appearance.",
    role: 'Creative planning, artist coordination & talent scouting',
    contributions: [
      'I worked on artist planning and coordination for the On The Radar segments.',
      'I scouted emerging talent for the freestyle sessions.',
      "I helped coordinate A Boogie's surprise appearance.",
    ],
  },
}
