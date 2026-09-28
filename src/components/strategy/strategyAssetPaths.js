/**
 * Stable public URLs for the strategy asset handoff.
 * Provenance, byte counts, hashes, and credit caveats live in /strategy/manifest.json.
 */
export const strategyAssetPaths = Object.freeze({
  manifest: '/strategy/manifest.json',

  portrait: {
    editorial: '/strategy/portrait/editorial.webp',
  },

  projects: {
    onTheRadar: '/strategy/projects/image4.jpeg',
    streamerUniversity2: '/strategy/projects/image7.jpeg',
    memehouse: '/strategy/projects/image9.jpeg',
  },

  transitions: {
    campusGrid: {
      threshold: '/strategy/transitions/campus-grid/threshold.png',
      poster: '/strategy/transitions/campus-grid/poster-50.png',
    },
    studioDoors: {
      threshold: '/strategy/transitions/studio-doors/threshold.png',
      poster: '/strategy/transitions/studio-doors/poster-50.png',
    },
    soundBands: {
      threshold: '/strategy/transitions/sound-bands/threshold.png',
      poster: '/strategy/transitions/sound-bands/poster-50.png',
    },
  },

  marks: {
    onTheRadar: {
      display: '/strategy/marks/on-the-radar/mark-display.png',
      pixelColor: '/strategy/marks/on-the-radar/mark-pixel-color.png',
      pixelInk: '/strategy/marks/on-the-radar/mark-pixel-ink.png',
      pixelInkSvg: '/strategy/marks/on-the-radar/mark-pixel-ink.svg',
    },
    memehouse: {
      display: '/strategy/marks/memehouse/mark-display.png',
      pixelColor: '/strategy/marks/memehouse/mark-pixel-color.png',
      pixelInk: '/strategy/marks/memehouse/mark-pixel-ink.png',
      pixelInkSvg: '/strategy/marks/memehouse/mark-pixel-ink.svg',
    },
    streamerUniversity2: {
      display: '/strategy/marks/streamer-university-2/mark-display.png',
      pixelColor: '/strategy/marks/streamer-university-2/mark-pixel-color.png',
      pixelInk: '/strategy/marks/streamer-university-2/mark-pixel-ink.png',
      pixelInkSvg: '/strategy/marks/streamer-university-2/mark-pixel-ink.svg',
    },
  },

  motion: {
    apertureAssembly: {
      src: '/strategy/motion/aperture-assembly/loop.mp4',
      mp4: '/strategy/motion/aperture-assembly/loop.mp4',
      webm: '/strategy/motion/aperture-assembly/loop.webm',
      mobileMp4: '/strategy/motion/aperture-assembly/loop-mobile.mp4',
      poster: '/strategy/motion/aperture-assembly/poster.webp',
    },
    avianFlight: {
      src: '/strategy/motion/avian-flight/loop.mp4',
      mp4: '/strategy/motion/avian-flight/loop.mp4',
      webm: '/strategy/motion/avian-flight/loop.webm',
      mobileMp4: '/strategy/motion/avian-flight/loop-mobile.mp4',
      poster: '/strategy/motion/avian-flight/poster.webp',
    },
    foxStride: {
      src: '/strategy/motion/fox-stride/loop.mp4',
      mp4: '/strategy/motion/fox-stride/loop.mp4',
      webm: '/strategy/motion/fox-stride/loop.webm',
      mobileMp4: '/strategy/motion/fox-stride/loop-mobile.mp4',
      poster: '/strategy/motion/fox-stride/poster.webp',
    },
  },

  brand: {
    icons: {
      sprite: '/strategy/brand/icons/sprite.svg',
      standalone: {
        arrowDiagonal: '/strategy/brand/icons/arrow-diagonal.svg',
        close: '/strategy/brand/icons/close.svg',
        contact: '/strategy/brand/icons/contact.svg',
        creativeStrategy: '/strategy/brand/icons/creative-strategy.svg',
        external: '/strategy/brand/icons/external.svg',
        film: '/strategy/brand/icons/film.svg',
        index: '/strategy/brand/icons/index.svg',
        pause: '/strategy/brand/icons/pause.svg',
        play: '/strategy/brand/icons/play.svg',
        project: '/strategy/brand/icons/project.svg',
        scroll: '/strategy/brand/icons/scroll.svg',
        soundOff: '/strategy/brand/icons/sound-off.svg',
      },
    },
    marks: {
      emblemSteppedMaster32: '/strategy/brand/marks/emblem-stepped-master-32.svg',
    },
  },
});
