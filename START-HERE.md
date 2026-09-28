# Between Frames — first working direction

This is an **iterative creative prototype**, not a finalized identity or a
published replacement. The existing public-facing name, casting headshots,
credits, reel, music, contact functionality, and `/moss` route remain.

## Preview

From `site`:

```powershell
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`. No production deployment has been run.

### Try it

- Scroll through the portrait: its photographic texture becomes printed ink.
- Watch the separately phased Blender wingbeat sprites and moving cloud layers.
- Continue into **Between real & imagined** for foreground overlap and the
  interactive metal emblem. Hover the sculpture or choose **Turn the emblem**.
- Open the reel directly from the hero. Escape closes the native dialog.
- Use **Index** to reach the preserved archive sections.
- Choose **Living scene** to pause. With a system reduced-motion preference,
  the first load is static; **Enable motion** deliberately opts into the artwork
  for this visit only.

## Art assets

- `public/world/`: optimized web assets, GLB models, sprite atlas and vector mark.
- `source-assets/world/between-frames.blend`: editable, isolated Blender scene.
- `source-assets/world/swift-frames/`: sixteen original transparent renders.
- `../assets/generated/*/generation.json`: exact original/effective image prompts,
  provider/model/quality, hashes and actual returned dimensions.
- `source-assets/world/asset-manifest.json`: edit-input provenance and web
  derivative inventory.
- `source-assets/world/PRODUCTION.md`: independent asset verification details
  and honest limitations.

Portrait, emblem concept and cloud source were created through the creative
MCP using `gpt-image-2.5-sunburst`, quality `max`. WebP derivatives are delivery
optimizations, **not** claims of improved source quality. Casting photographs
were not replaced. The emblem is exploratory, not an approved final logo.

## Verification

```powershell
npm run lint
npm run build
python scripts/verify-world-assets.py
node scripts/verify-world-browser.cjs
```

The browser verifier uses the installed CVC Playwright runtime and local Chrome;
its runtime path is specific to this workstation. Run **browser verification
before asset verification**, not concurrently: the asset verifier intentionally
detects every file modification, including newly captured QA screenshots.
Reports/screenshots are under `source-assets/world/qa/`.

The new scene supports image fallback, reduced motion, explicit pause,
visibility-based rendering, bounded WebGL buffers and context-loss recovery.
The Three.js sculpture is loaded near its viewport. Music and MOSS chapter code
are also deferred until nearby. A production-build warning remains for the
lazy-loaded Three.js bundle size. Desktop/phone-sized Chromium testing does not
claim real-device Safari or low-end-phone performance certification.

## Scope and next decisions

The opening world, transition chapter and navigation establish the new
direction. Existing later sections are retained with a coordinated palette;
they are **not yet all rebuilt as custom pixel scenes**. The next creative
review should decide the portrait treatment, desired creature vocabulary,
emblem shape and public name before extending this language throughout.
