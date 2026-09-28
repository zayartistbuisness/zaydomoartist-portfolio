// The four blips. Event-level facts only, quoted from
// site/research/featured-projects-brief.md §4 (Mafiathon 3 / On The Radar),
// each with its source. None of this measures Zay's own work.

const DIR = '/tracking/chapters/radar'
const EVENT = `${DIR}/event`

export const ID = 'radar'

export const ASSETS = {
  mark: `${DIR}/radar-mark.png`,
  plate: `${DIR}/plate_city_night.webp`,
}

export const EMBED_47 = 'https://www.youtube-nocookie.com/embed/5GDjmkATEFk'

/**
 * bearing: degrees clockwise from the scope's far edge ("north").
 * range: distance from centre as a fraction of the scope's inner ring.
 * photo: optional event photograph for the card (guarded; falls back to
 *   `type` until it exists). Official public stills, cropped to the clean
 *   picture (see assets/event-photos/MANIFEST.md). The caption says what it
 *   shows, its date and its publisher. They are event context: none of them
 *   documents Zay's own work, and captions never name him.
 * type: the procedural card, set in the site's own faces.
 */
export const MOMENTS = [
  {
    n: '01',
    date: 'Sep 3, 2025',
    dateTime: '2025-09-03',
    label: 'Freestyle #1',
    line: 'The series opens: Mafiathon Freestyle #1, with 41 (Kyle Richh, Jenn Carter and Tata).',
    sources: [{ label: 'On The Radar Radio, YouTube', href: 'https://www.youtube.com/watch?v=QtNvOzEFlwI' }],
    photo: {
      src: `${EVENT}/otr-freestyle-01-sep-03.webp`,
      shows: 'Mafiathon Freestyle #1 at the On The Radar table',
      date: 'Sep 3, 2025',
      credit: 'On The Radar Radio / YouTube',
      href: 'https://www.youtube.com/watch?v=QtNvOzEFlwI',
    },
    type: { kicker: 'Mafiathon Freestyle', big: '#1', foot: 'Sep 3, 2025' },
    bearing: -76,
    range: 0.64,
  },
  {
    n: '02',
    date: 'Sep 29, 2025',
    dateTime: '2025-09-29',
    label: 'Freestyle #47',
    line: 'A Boogie Wit da Hoodie and Don Q, Mafiathon Freestyle #47.',
    sources: [
      { label: 'On The Radar Radio, YouTube', href: 'https://www.youtube.com/watch?v=5GDjmkATEFk' },
      { label: 'Vibe', href: 'https://www.vibe.com/lists/kai-cenat-mafiathon-3-stream-every-celebrity-guest-list/' },
    ],
    // Not the booth: A Boogie's visit to the main stream the same day.
    photo: {
      src: `${EVENT}/a-boogie-kai-cenat-stream-sep-29.webp`,
      shows: 'A Boogie Wit da Hoodie on Kai Cenat’s stream, the day of #47',
      date: 'Sep 29, 2025',
      credit: 'Kai Cenat Live / YouTube',
      href: 'https://www.youtube.com/watch?v=2X3jG1DIWJM',
    },
    type: { kicker: 'Mafiathon Freestyle', big: '#47', foot: 'Sep 29, 2025' },
    video: true,
    bearing: -24,
    range: 0.4,
  },
  {
    n: '03',
    date: 'Sep 30, 2025',
    dateTime: '2025-09-30',
    label: 'Guinness World Records',
    line: 'Guinness World Records: “Most subscribers on a Twitch channel”, 1,095,265, set by KaiCenat on the last day of Mafiathon 3.',
    sources: [{ label: 'Guinness World Records', href: 'https://www.guinnessworldrecords.com/world-records/779754-most-subscribers-on-a-twitch-channel' }],
    // No official image of Sep 30 exists (the 1M-subs frame is Sep 27), so
    // this one stays typographic.
    type: { kicker: 'Guinness World Records', big: '1,095,265', foot: 'Most subscribers on a Twitch channel · KaiCenat', wide: true },
    bearing: 28,
    range: 0.56,
  },
  {
    n: '04',
    date: 'Dec 6, 2025',
    dateTime: '2025-12-06',
    label: 'The Streamer Awards',
    line: 'Mafiathon 3 takes Best Marathon Stream at The Streamer Awards.',
    sources: [
      { label: 'The Streamer Awards on X', href: 'https://x.com/StreamerAwards/status/1997514308453040590' },
      { label: 'Wikipedia', href: 'https://en.wikipedia.org/wiki/2025_Streamer_Awards' },
    ],
    // Kai Cenat won three awards that night; the frame doesn't show which.
    photo: {
      src: `${EVENT}/streamer-awards-dec-06.webp`,
      shows: 'Kai Cenat on stage with a Streamer Awards trophy, the Wiltern, Los Angeles',
      date: 'Dec 6, 2025',
      credit: 'Kai Cenat Live / YouTube',
      href: 'https://www.youtube.com/watch?v=_8Probyi86w',
    },
    type: { kicker: 'The Streamer Awards', big: 'Best Marathon Stream', foot: 'Dec 6, 2025', stack: true },
    bearing: 76,
    range: 0.46,
  },
]
