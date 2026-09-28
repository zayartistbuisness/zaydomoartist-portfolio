# Tracking chapter kit

Shared building blocks for the featured-project chapters of Zay "Domo" Artist's
portfolio ("Tracking" direction; see `../../../../TRACKING-PLAN.md`).

## The look (non-negotiable)

- **Bone & ink.** Paper `#E8E4DB`, ink `#111110`, one tiny REC red `#D7331F`.
  A chapter may own one accent colour taken from its project's real brand, and
  it appears only at a key moment (e.g. the voxel logo resolving).
- **One ink.** Photos, chrome and plates render through the shared screen-space
  line grid (`../ink/inkChunk.js`), so everything reads as one printed material.
  Never put a flat rectangular photo on a flat background. Use `InkCard`
  (cut-outs keep their silhouette; images resolve from lines on hover/scroll)
  and `LinePlate` backgrounds.
- **3D and explorable.** Every chapter is its own art piece with a different
  3D concept and interaction. Nothing corny, childish or "obviously AI".
  References: Roni Levi (chrome objects woven through type, curtain
  transitions) and sondaven.com (line-field backgrounds, tilted collage cards,
  slow held pacing).
- **Honest copy.** Event-level facts come from
  `site/research/featured-projects-brief.md`, with sources. Zay's own role and
  contribution lines are placeholders until he supplies them. **Never use the
  pitch deck** (`asset-studio/sources/deck`, `public/strategy/projects/*`): its
  images and claims are out.

## Chapter contract

`src/tracking/chapters/<id>/index.jsx` default-exports:

```js
export default { id: 'keon', title: 'KEON', Section, Scene }
```

- `Section`: DOM. A `<section>` registered with `useChapterSection(id, ref)`.
  It is usually tall (e.g. `height: 320vh`) with a `position: sticky` stage
  inside. It holds all real text (headings, captions, links) for SEO and a11y,
  and has a **transparent background**: the ground colour is drawn in WebGL by
  `GroundPlane`. Keep the chapter's CSS in its own file, class-prefixed with
  `c-<id>-`.
- `Scene`: R3F. It is rendered inside the HUD pass, so it draws over earlier
  chapters. Read `getChapter(id)` each frame (`progress`, `enter`, `visible`,
  `rect`). Always mount a `<GroundPlane id color>` first. Hide everything when
  `!visible`.

Test in isolation at `http://127.0.0.1:5173/lab/chapter/<id>` (dev server
already running). Dev hook for exact scroll: `window.__lenis.scrollTo(y, { immediate: true })`.

## Kit

| Module | Use |
|---|---|
| `chapterStore.js` | `useChapterSection(id, ref)` (DOM), `getChapter(id)` (scene) |
| `ChapterDriver.jsx` | Already mounted by the harness / page |
| `GroundPlane.jsx` | `<GroundPlane id color="#131312" />`: the chapter's background band |
| `LinePlate.jsx` | `<LinePlate id src invert drift black white />`: a monochrome plate drawn entirely as line field; parallax |
| `InkCard.jsx` | `<InkCard src width position rotation getResolve hoverResolve invert onClick />`: a photo in the scene |
| `chrome.js` | `makeChrome({ resolve, invert, alpha })`: liquid chrome through the ink; animate `mesh.material.userData.ink.uResolve/uInkAlpha/uInvert` |
| `ChromeEnv.jsx` | Already mounted in the HUD pass |
| `space.js` | `viewportAt`, `rectToWorld`, `screenYToWorld`, `smooth`, `range`, `clamp01` |
| `../three/VoxelMark.jsx` | Voxel logo transition: `<VoxelMark src cell getProgress heightFrac invert />` (pixel-grid PNG, one colour per `cell` px) |
| `../ink/pointer.js` | `pointer` (CSS px, `active`, `touch`) for cursor-reactive work |

Camera: perspective, fov 30, at z = 10 looking at the origin. At z = 0 the
visible height is about 5.36 world units. Canvas events use the page root
(`eventSource`), so R3F `onPointerOver`/`onClick` work under the DOM.

## Quality bar

- 60 fps on a desktop GPU. Use one `InstancedMesh` rather than thousands of
  meshes, and don't allocate in `useFrame`.
- Mobile (390 px wide) must still read. Simplify rather than shrink.
- `npx eslint src/tracking` must pass. The React-compiler lint rules forbid
  mutating hook values: mutate through `ref.current` or `mesh.material`
  instead of memoized objects.
- Verify by screenshots at several progress points before calling it done.
