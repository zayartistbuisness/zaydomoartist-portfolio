# Between Frames: asset provenance, reproduction and QA

**Status: exploratory artwork and motion study, not an approved/final artist
identity.** A passing file check is not visual approval, a trademark clearance,
proof of facial-identity preservation, or browser/performance sign-off.
The September 27, 2026 rerendered candidate uses the refined
`swept-wings-v2` bird, 64-sample emblem render and 24-sample bird renders.
Initial visual issues and their refinement status are distinguished below.

The only retained changes from this bounded QA pass are
`scripts/verify-world-assets.py` and this document. No images were
generated/uploaded, no model was invoked, no assets were rebuilt, and Blender
and the shared browser were not touched by this checker task. No further
portrait generation is needed. A separate `py_compile` syntax check
unexpectedly wrote `scripts/__pycache__/verify-world-assets.cpython-312.pyc`
despite `-B`; that exact file and its newly created empty directory were
removed and their absence checked. The verifier itself is read-only.
Paths below are relative to `site/` unless prefixed with `../`.

## Existing sources and prompts

The three existing `generation.json` records identify
**`gpt-image-2.5-sunburst`, quality `max`**, and record successful responses.
That is recorded provenance, not a new model call or an independent assessment
of output quality. Both the original prompt and the effective prompt with
quality instructions are retained in each manifest.

| Asset | Retained master and exact prompt manifest directory | Recorded route | Actual master |
| --- | --- | --- | --- |
| Editorial portrait | `../assets/generated/portrait-world-master-b12af7dc02/` (`portrait-world-master.png`, `generation.json`) | Edit | 1536 x 1024 RGB; 2,862,441 bytes |
| Folded-aperture concept | `../assets/generated/artist-emblem-concept-6360610e81/` (`artist-emblem-concept.png`, `generation.json`) | Generate | 1254 x 1254 RGBA; 293,970 bytes |
| Cloud atmosphere | `../assets/generated/cloud-atmosphere-master-748f36d402/` (`cloud-atmosphere-master.png`, `generation.json`) | Generate | 1536 x 1024 RGBA; 1,430,934 bytes |

The recorded endpoints use `https://cheapvibecode.ru/v1`: the portrait used
`/images/edits`; the other two used `/images/generations`. These are historical
records only; do not rerun paid generation as part of verification.

The emblem request was **1024 x 1024**, but the retained response is **1254 x
1254**; its manifest explicitly warns about this difference. Preserve the
returned pixels rather than relabeling or upscaling them. The cloud prompt
asked for white clouds on black; the actual response has transparency. Its
maximum alpha is 253, and the prepared cloud retains that alpha.

### Portrait provenance and original casting photographs

The portrait prompt describes an identity-anchored edit of “Image 1,” preserving
the face, hair, expression and dark clothing while adding a pale editorial
environment. **The provider's `generation.json` does not record that edit
input's path or hash and has been preserved unchanged.** The main agent
confirmed the actual edit-tool input and added a separate
`portrait_edit_input` record to `source-assets/world/asset-manifest.json`:

- Workspace-relative path: `site/public/headshots/headshot-3.jpg`.
- SHA-256: `cf3f0c9394025759eb51303307f44fb6c3e9fa23bc25a3732503ce44eac0e5c9`.
- Provenance: input supplied to the actual `creative.edit_image` call,
  confirmed by the main agent, not inferred from a resemblance comparison.

The verifier checks that project record against the current retained photo.
It did not replay or independently observe the original edit call.
`pack-world-frames.py` now preserves this known path in the project manifest
and recomputes its current hash; that generated record alone is not an
immutable pre-generation baseline. The measured Git comparison below remains
separate evidence. Do not claim exact facial-identity preservation solely
from either manifest. This is edited editorial artwork, not an unmodified
casting photograph.

The six existing casting photographs remain at
`public/headshots/headshot-1.jpg` through `headshot-6.jpg`. Their observed hashes
are below. They are observations, **not an invented pre-generation baseline**.
During inspection, all six matched the actual local Git blobs at commit
`cffc44f8c1442334a4d1baaa041117f49591fd5c`. That establishes equality to that
specific committed version, not provenance back to a photographer's originals.
The verifier measures HEAD again when available and also compares start/end
hashes to detect changes during its own run. It never restores or overwrites
headshots.

| File in `public/headshots/` | Dimensions | Bytes | Observed SHA-256 |
| --- | --- | ---: | --- |
| `headshot-1.jpg` | 2000 x 2999 | 307,312 | `65a47b30ca48cfc7681e2cbb22f450ce6c74ec92418d7eea56997fe4897d2b01` |
| `headshot-2.jpg` | 2000 x 2999 | 659,929 | `8cf496c93731e88e49c51d49d09e7375df261c09c19886521dacb19d844f6f52` |
| `headshot-3.jpg` | 2000 x 2981 | 577,229 | `cf3f0c9394025759eb51303307f44fb6c3e9fa23bc25a3732503ce44eac0e5c9` |
| `headshot-4.jpg` | 1449 x 2160 | 152,332 | `947d86613710f10e0d88ef60c373f912833a482711472e453564862920d7c891` |
| `headshot-5.jpg` | 1449 x 2160 | 331,820 | `957650dd413eb226b6ae7b6c3013ec9f98507008039d4a637253d5d2f251f12c` |
| `headshot-6.jpg` | 2000 x 2999 | 455,749 | `237e3325b8c46028c080d75d6d623d20e41512f7dbd143cb0846c19634bef44e` |

## Rerendered candidate file inventory

Byte counts are the inspected on-disk snapshot, not network-transfer or GPU
memory measurements. The verifier prints current sizes of every file in
`public/world`, `source-assets/world`, and the parent `assets/generated`, plus
the pipeline scripts and six casting photographs.
Concurrent main-agent artifacts under `source-assets/world/qa/`, when
present, are inventoried for size/stability only; this pass does not claim
to have performed or signed off that browser QA.

| File in `public/world/` | Dimensions / structure | Alpha | Bytes |
| --- | --- | --- | ---: |
| `portrait-world.webp` | 1536 x 1024 | Opaque RGB | 320,620 |
| `portrait-world-mobile.webp` | 945 x 1024 | Opaque RGB | 250,088 |
| `clouds.webp` | 1024 x 683 | 0..253 | 118,948 |
| `emblem.png` | 576 x 576 | 0..249 | 61,597 |
| `emblem.svg` | 576 x 576 viewBox; four contours in one even-odd path | Unpainted background | 11,721 |
| `aperture-render.png` | 640 x 640 | 0..255 | 270,492 |
| `aperture-render.webp` | 640 x 640 | 0..255 | 24,566 |
| `aperture.glb` | Four mesh nodes; static | Material data | 605,148 |
| `swift-atlas.webp` | 1024 x 1024; 4 x 4 row-major tiles of 256 x 256 | 0..255 | 30,606 |
| `swift-atlas.json` | 16 frames, 12 fps | N/A | 172 |
| `swift.glb` | Six meshes; two wingbeat clips, one rotation channel each | Material data | 29,524 |

The two GLBs contain only the named asset mesh nodes, not the default
Cube/Camera/Light or studio camera/lights. Swift consists of breast, head,
beak, forked tail, and left/right wings. Each wing's exported action contains
17 quaternion samples, including the closing boundary, spanning 1.333333
seconds. **A GLB consumer must play both actions together**; playing only the
first clip animates only one wing. The atlas already renders both wings.

The v2 refinement retains the six **object/node** names, while three **mesh
datablock** names intentionally change. The verifier checks these exact
node-to-mesh bindings, not simply a six-mesh count:

- `AA | forked tail` -> `AA | subtle forked tail v2`
- `AA | left articulated wing` -> `AA | left swept feathers v2`
- `AA | right articulated wing` -> `AA | right swept feathers v2`
- `AA | swift beak`, `AA | swift breast`, and `AA | swift head` each retain
  their identically named mesh.

The current swift export has eight primitives, 783 exported vertices and
1,205 triangles; the aperture has four primitives, 14,383 exported vertices
and 23,504 triangles. These are decoded export counts, not GPU profiling.

### Editable and intermediate files

The editable source is `source-assets/world/between-frames.blend`
(1,647,671 bytes). It is a **Blender data library**, written with
`bpy.data.libraries.write`, not a Save As of the user's working project.
Its saved scene is `AA | Between Frames`; its collections are:

- `AA_WORLD | folded aperture`
- `AA_WORLD | swift`
- `AA_WORLD | studio`

The source scene intentionally includes its own camera and lighting.
The initial `blender-report.json` records meters, 14 objects, four emblem
objects and six bird objects. Its `mesh_vertices` count predates refinement
and must not be treated as a revised geometry measurement. The build script
sets metric scale 1. The
current verifier checks the `.blend` signature and embedded scene/collection
names without opening it; it does not independently evaluate its Blender
datablocks, geometry or reported units.

Other retained files:

| File in `source-assets/world/` | Bytes |
| --- | ---: |
| `asset-manifest.json` | 1,441 |
| `blender-report.json` | 680 |
| `emblem-contours.json` | 14,044 |
| `emblem-proof.jpg` (576 x 576) | 26,229 |
| `swift-contact-sheet.jpg` (1024 x 1024) | 61,849 |
| `render.log` | 5,814 |
| `swift-frames/swift-01.png` | 20,223 |
| `swift-frames/swift-02.png` | 20,544 |
| `swift-frames/swift-03.png` | 20,778 |
| `swift-frames/swift-04.png` | 22,445 |
| `swift-frames/swift-05.png` | 22,220 |
| `swift-frames/swift-06.png` | 22,418 |
| `swift-frames/swift-07.png` | 20,921 |
| `swift-frames/swift-08.png` | 20,668 |
| `swift-frames/swift-09.png` | 20,025 |
| `swift-frames/swift-10.png` | 20,147 |
| `swift-frames/swift-11.png` | 20,168 |
| `swift-frames/swift-12.png` | 20,141 |
| `swift-frames/swift-13.png` | 20,238 |
| `swift-frames/swift-14.png` | 20,225 |
| `swift-frames/swift-15.png` | 20,224 |
| `swift-frames/swift-16.png` | 20,112 |

All 16 source frames are 256 x 256 RGBA. The three generation manifests are
5,263 bytes (portrait), 3,534 bytes (emblem), and 3,412 bytes (clouds).
The initial preparation manifest omitted the aperture renders and swift atlas.
The revised packing step now refreshes all seven raster dimension entries,
records the confirmed portrait input, and records the 64/24 sample settings
and `swept-wings-v2` revision. The verifier also checks the files directly.

## Reproducible local workflow

The existing scripts were inspected, **not executed**, in this QA task.
Future rebuilding writes many files outside this task's two-file write scope
and requires separate authorization. Work in an isolated copy/process, not
the shared Blender session.

1. **Prepare retained generated pixels.** `scripts/prepare-world-assets.py`
   reads the three PNG masters without replacing them:
   - Desktop portrait: RGB WebP, quality 91, method 6, original 1536 x 1024.
   - Mobile portrait: crop `(525, 0, 1470, 1024)` from the same master;
     WebP quality 90, method 6. This is a crop, not a new pose.
   - Clouds: RGBA thumbnail bounded by 1024 x 683, Lanczos; WebP quality 92,
     method 6.
   - Emblem: darkness multiplied by original alpha; content cropped using
     threshold 100; thumbnail bounded by 512 x 512 on a centered 576 x 576
     transparent canvas. Boundary extraction at threshold 100 and
     Ramer-Douglas-Peucker epsilon 0.7 create the four contours and SVG.
     The raster fallback uses RGB `(32, 36, 31)` with the unthresholded mask.
2. **Build the Blender library/GLBs.** `scripts/build-world-assets.py`
   creates a separate scene and named collections. It extrudes the four
   contour ribbons (0.075 m, bevel 0.014 m), builds the swift from procedural
   ellipsoid meshes and polygon wings, and keys both wings on frames 1..17.
   The scene range is 1..16 at 12 fps. Exports use selected asset objects and
   the active asset scene, excluding studio objects. The script restores
   the original active scene in `finally`, but still adds data to the
   process; do not run it in the shared session for QA.
   It refuses to create a duplicate `AA | Between Frames` scene.
   **Its `ROOT` is hard-coded to this Windows workspace**; review/change it
   in an authorized isolated copy before relocating the pipeline.
3. **Refine once from the original build.** `scripts/refine-world-assets.py`
   replaces the two wing meshes with swept continuous curves and three
   subtle terminal notches, shortens/narrows the forked tail, increases breast
   width by 12% and head width by 10%, and retains the existing object names
   and wing animation. It exports `swift.glb` and rewrites only the named
   asset library. This script also has a hard-coded `ROOT`; it is not
   idempotent because rerunning it scales breast/head widths again. Rebuild
   from the original scene first for a reproducible fresh v2 result; do not
   rerun it over the retained refined library merely for QA.
4. **Render offline.** The revised `scripts/render-world-assets.py` explicitly
   selects `AA | Between Frames`, uses Cycles, denoising, Standard view
   transform inherited from the build, transparent RGBA PNG, and an
   orthographic camera. It hides the bird and uses **64 samples** for the
   640 x 640 aperture render, then hides the mark and uses **24 samples**
   for swift frames 1..16 at 256 x 256. These settings appear in the inspected
   script and project manifest, and the main agent confirmed the rerender.
   They cannot be inferred from PNG pixels by this checker.
   The retained log records Blender 5.2.2 LTS, the library-file “loading empty
   scene” warning, every saved frame, and `WORLD_RENDER_COMPLETE`. The existing
   log is UTF-16 with a byte-order mark; the verifier detects that encoding
   rather than assuming UTF-8.
   The renderer selects the library scene by name after loading; the warning
   alone does not mean the recorded renders failed.
5. **Pack delivery assets.** `scripts/pack-world-frames.py` expects exactly
   16 sorted PNGs and composites them row-major into a 1024-square lossless
   WebP atlas (method 6). It also saves the dark-background JPEG contact
   sheet, the 16-frame/12-fps JSON, and aperture WebP at quality 94, method 6.
   The revised packer refreshes dimension/provenance/render metadata in the
   project `asset-manifest.json`; it does not modify provider generation
   manifests or original source photographs.
6. **Verify without writes.** The commands in the next section are the only
   workflow steps executed by this QA task.

For a separately authorized rebuild in an isolated workspace, the intended
order is prepare -> build -> refine once -> render -> pack -> verify. A typical background
render invocation, after locating the installed Blender executable, is:

```powershell
& $BlenderExe --background 'source-assets/world/between-frames.blend' --python 'scripts/render-world-assets.py'
```

Do not run a build over this existing library merely to verify it. Keep the
masters, exact prompts, editable library and source PNG frames. Blender/render
outputs are not promised to be bit-identical across Blender versions, devices
or sampling implementations. Pillow/libwebp versions can affect encoded
bytes, too. The verifier performs four re-encodes in memory and reports
whether they are byte-identical under the current runtime; it never saves them.

## Read-only verification

From `site/`:

```powershell
$Python = 'C:\Users\zaydo\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $Python -B 'scripts/verify-world-assets.py' --self-test
& $Python -B 'scripts/verify-world-assets.py'
```

The default root is derived from the verifier's location, not the shell's
working directory; `--root` can select an isolated site copy. The inspected
runtime is Python 3.12.14, Pillow 12.3.0, numpy 2.3.5. No packages were installed.
Exit 0 means the structural checks passed; exit 1 means a hard failure.
Warnings remain visible on a successful run and must not be treated as
production approval. Output is stdout/stderr only.

Observed rerendered-candidate run on September 27, 2026:

```text
Ran 14 tests ... OK
SUMMARY: 47 checks passed, 0 failed, 6 warnings.
RESULT: PASS (with documented limitations)
```

All six current headshots matched the measured Git reference. All 16 atlas
tiles matched the visible source-frame pixels and had distinct silhouettes;
the smallest successive silhouette change was 417 pixels. All four in-memory
WebP re-encodes were byte-identical. `public/world` totaled 1,723,482 bytes.
The first verifier run exposed the UTF-16 log decoding issue; the reader was
corrected and a log-encoding regression test added. After refinement, an
unexpected-mesh failure correctly exposed the changed datablock names.
Exact v2 node-to-mesh expectations were then checked against the refinement
script and real GLB, with positive and negative regression tests. No
Cube/Camera/Light, animation or geometry checks were weakened to get a pass.
The earlier pre-refinement run (47 passes, 8 warnings) is superseded.

Checks include:

- Required files exist, are nonempty and decode at expected dimensions.
  Alpha checks distinguish opaque portraits, meaningful transparency, and
  completely blank images; alpha is not assumed to reach 255 on soft masks.
- Master hashes, sizes, modes and dimensions match the existing generation
  records; original/effective prompt fields and recorded model/quality exist.
- Current casting-headshot hashes are reported. When available, actual Git
  reference blobs are compared rather than assuming a baseline. The project
  edit-input path/hash is checked separately from the untouched provider
  manifest; declared render metadata must record 64/24 samples and v2.
- Atlas layout/fps and all 16 numbered source frames agree. All 16 visible
  RGBA tiles and all 16 thresholded silhouettes are distinct; each successive
  silhouette, including frame 16 -> 1, must change at least 64 pixels.
  This prevents hidden RGB or render noise alone from masquerading as motion.
- Atlas/source alpha and visible RGB match exactly. RGB differences beneath
  zero alpha are deliberately ignored: WebP packing discards those invisible
  source values, so a raw RGBA byte comparison would give a false failure.
- GLB magic/version/length, JSON/BIN chunk boundaries, embedded buffers,
  bufferViews and accessor bounds are checked. Scene/node/mesh sets must
  match the isolated assets, including exact v2 node-to-mesh bindings.
  Default or typed camera/light nodes are rejected.
  Swift must have six meshes, two animated wing targets, changing normalized
  quaternion samples, and closing loop boundaries.
- SVG data matches the saved contours; the fallback alpha reproduces the
  retained emblem master's extraction recipe.
- `.blend` signature/named scene strings and recorded render completion
  exist. Every inventoried file is rehashed at the end to detect concurrent
  changes or accidental mutation.

The self-tests are in-memory fixtures, including malformed/truncated GLBs,
buffer/accessor overflows, default/typed studio-node leaks, duplicate frames,
RGB-only “motion,” invisible RGB normalization, and static quaternion sign
flips. The additional v2 tests accept the exact revised mesh identities and
reject unexpected names or swapped node-to-mesh bindings. They do not alter
production files or use temporary folders.

## Concrete visual issues and main-agent follow-up

Local inspection covered the actual `swift-atlas.webp`,
`swift-contact-sheet.jpg`, `emblem-proof.jpg`, and `aperture-render.webp`.
The revised contact sheet and aperture WebP were inspected again after the
main agent's rerender; this is local file review, not live browser approval.

1. **Initial saw-tooth wings, weak body and exaggerated fork have been
   refined.** The v2 contact sheet visibly has swept wings with far fewer
   terminal notches, a shorter fork, and stronger body/head proportions.
   It reads more clearly as a bird, but remains a stylized silhouette.
   The sprite points head-down in the unrotated atlas; confirm the shader's
   rotations make its apparent travel direction credible.
2. **Swift highlights are nearly flat white.** Depending on frame, about
   66–99% of near-opaque pixels have all RGB channels at least 250. There is
   little body/feather shading, and the upstroke/downstroke poses read
   differently in silhouette. The current shader samples bird alpha rather
   than RGB, so shading refinement alone would not change that integration.
   Distinct frames do not prove a smooth or convincing loop in motion.
3. **The mark is a four-part pinwheel/leaf-like swirl, not the prompted
   two-ribbon form.** The large negative space is clear, but the tapered tips
   and narrow gaps still need favicon-size tests. Do not label it an approved,
   original-in-the-legal-sense or final brand identity.
4. **Initial low-sample emblem noise was addressed with the 64-sample
   rerender.** The revised file was inspected; pale gray-green faces,
   bright bevel highlights and some visible edge roughness/halo remain.
   Do not equate the increased sample setting with guaranteed final quality.
   It is still rotated relative to the flat proof. Inspect at intended
   presentation size before accepting it as a hero render.
5. **Clouds reach both side edges.** Prepared alpha maxima are
   top/bottom/left/right = `0/1/245/248`, contrary to the prompt's request
   for resolved outer edges. The renderer agent's revised shader now applies
   `smoothstep` feathering on both axes; the texture pixels remain unchanged.
   The checker deliberately still warns about raw edge alpha. Confirm the
   shader-level mitigation during actual movement rather than replacing
   the original cloud master.
6. **Project provenance and dimension gaps have been addressed.** The main
   agent recorded the confirmed headshot-3 edit input and refreshed the full
   raster dimension list. The provider record stays unchanged; there is no
   need for further portrait generation. The GLB's two separate animation
   clips still need to be played together by any GLB consumer.

**Still required from the main agent:** actual desktop/mobile browser
inspection; portrait crop/face fidelity and live-text contrast; atlas UV
orientation, temporal loop, small-screen readability and texture-edge seams;
reduced-motion/no-WebGL fallbacks; scroll/input behavior; network requests and
caching; real frame time/GPU/CPU/memory measurements on target devices; and
an independently authorized Blender reopen/render check if needed.
On-disk sizes and passing static checks do not substitute for any of these.
