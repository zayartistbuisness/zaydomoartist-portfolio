import * as THREE from 'three'
import { inkGlobals } from './inkGlobals'

// Shared screen-space ink grid. Every inked surface (chrome, photographs)
// computes its lines on the same device-pixel lattice, so separate objects
// read as one printed material rather than individually filtered layers.
export const inkCommon = /* glsl */ `
uniform vec2 uInkRes;
uniform float uInkPitch;
uniform float uInkTime;
uniform float uInkDpr;
uniform vec2 uLensPos;
uniform float uLensRadius;
uniform float uLensStrength;
uniform float uTracking;
uniform vec3 uInkColor;
uniform vec3 uPaperColor;
uniform float uResolve;
uniform float uInvert;
uniform float uInkAlpha;
// Device-px band (gl_FragCoord.y, bottom-up) outside which nothing draws:
// keeps a chapter's 3D inside its own section as the page scrolls.
uniform vec2 uClipY;
bool inkClipped(vec2 frag) { return frag.y < uClipY.x || frag.y > uClipY.y; }

float inkHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Tall cells: the grid reads as engraved vertical strokes, not square pixels.
vec2 inkCellSize() { return vec2(uInkPitch, uInkPitch * 2.6); }

// Horizontal displacement per band: a slow continuous wobble plus sparse
// bands that jump for a few frames, like a VHS deck losing tracking.
float inkTrackingShift(float fragY) {
  float band = floor(fragY / (uInkPitch * 5.0));
  float tick = floor(uInkTime * 12.0);
  float jump = step(0.968, inkHash(vec2(band, tick)));
  float drift = sin(fragY * 0.011 + uInkTime * 0.8) * 0.16;
  return (drift + jump * (inkHash(vec2(tick, band)) - 0.5) * 2.4) * uInkPitch * uTracking;
}

// tone 0 = bare paper, 1 = solid ink. Width is quantized to a few steps and
// dithered per cell so gradients break into stepped vertical bars.
float inkCoverage(vec2 frag, float tone) {
  vec2 size = inkCellSize();
  vec2 g = vec2(frag.x + inkTrackingShift(frag.y), frag.y) / size;
  vec2 cell = floor(g);
  vec2 f = fract(g);
  float levels = 6.0;
  float q = floor(clamp(tone, 0.0, 1.0) * levels + inkHash(cell) * 0.85) / levels;
  float aa = 1.0 / size.x;
  // Max width stops short of the cell so even solid shadows keep a hairline
  // of paper between strokes, like an engraving rather than a fill.
  float halfWidth = 0.43 * q;
  float line = 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, abs(f.x - 0.5));
  float gap = step(0.08, f.y);
  return line * gap * step(0.001, q);
}

// 0 = ink, 1 = true surface. Cells flip in vertical runs of four so the
// dissolve reads as bars sliding in and out, never as a crossfade.
float inkResolveWith(vec2 frag, float base) {
  vec2 size = inkCellSize();
  vec2 cell = floor(frag / size);
  vec2 center = (cell + 0.5) * size;
  float d = length(center - uLensPos);
  float lens = (1.0 - smoothstep(uLensRadius * 0.5, uLensRadius, d)) * uLensStrength;
  float r = clamp(max(base, lens), 0.0, 1.0);
  float t = inkHash(vec2(cell.x, floor(cell.y / 4.0)) + 17.0);
  return step(t, r * 1.02 - 0.01);
}
float inkResolveAt(vec2 frag) { return inkResolveWith(frag, uResolve); }

vec4 inkComposite(vec4 surface, float lum, vec2 frag) {
  float tone = mix(1.0 - lum, lum, uInvert);
  tone = smoothstep(0.06, 0.94, tone);
  float cov = inkCoverage(frag, tone);
  vec3 lineColor = mix(uInkColor, uPaperColor, uInvert);
  vec4 inked = vec4(lineColor, cov * surface.a);
  vec4 outColor = mix(inked, surface, inkResolveAt(frag));
  outColor.a *= uInkAlpha;
  return outColor;
}
`

// Per-material uniforms; globals are shared by reference.
export function createInkUniforms({ resolve = 0, invert = 0, alpha = 1 } = {}) {
  return {
    ...inkGlobals,
    uResolve: { value: resolve },
    uInvert: { value: invert },
    uInkAlpha: { value: alpha },
    uClipY: { value: new THREE.Vector2(-1e6, 1e6) },
  }
}

/**
 * Patch a built-in lit material (MeshPhysical/Standard) so its final,
 * display-space color is re-drawn through the ink grid.
 * Returns the per-material uniforms for animation.
 */
export function inkify(material, opts) {
  const uniforms = createInkUniforms(opts)
  material.transparent = true
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `${inkCommon}\nvoid main() {`)
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        {
          if (inkClipped(gl_FragCoord.xy)) discard;
          float inkLum = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          gl_FragColor = inkComposite(gl_FragColor, inkLum, gl_FragCoord.xy);
        }`,
      )
  }
  material.customProgramCacheKey = () => 'ink-v1'
  material.userData.ink = uniforms
  return uniforms
}

/**
 * Photograph / cut-out material. The ink version samples the texture once
 * per grid cell (true stepped pixels, stepped silhouette); the resolved
 * version shows the untouched full-resolution photo.
 *
 * uFade (uv.y from → to) keeps the upper photo true and lets the lower part
 * dissolve into the line field, so a portrait bleeds into the page instead
 * of sitting on it as a rectangle. Raise both values to let the ink climb.
 */
export function createInkPhotoMaterial(map, opts = {}) {
  map.colorSpace = THREE.NoColorSpace
  map.anisotropy = 4
  const uniforms = {
    ...createInkUniforms(opts),
    uMap: { value: map },
    uLevels: { value: new THREE.Vector2(opts.black ?? 0.08, opts.white ?? 0.9) },
    uFade: { value: new THREE.Vector2(opts.fadeFrom ?? -1, opts.fadeTo ?? -0.5) },
    // Border band (uv fraction) where a full-frame photo gives way to ink
    // lines and then to bare paper, so it never reads as a pasted rectangle.
    uEdge: { value: opts.edge ?? 0 },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec2 uLevels;
      uniform vec2 uFade;
      uniform float uEdge;
      varying vec2 vUv;
      ${inkCommon}
      void main() {
        vec2 frag = gl_FragCoord.xy;
        if (inkClipped(frag)) discard;
        vec2 size = inkCellSize();
        float shift = inkTrackingShift(frag.y);
        vec2 g = vec2(frag.x + shift, frag.y) / size;
        vec2 centerFrag = (floor(g) + 0.5) * size - vec2(shift, 0.0);
        vec2 uvCell = vUv + dFdx(vUv) * (centerFrag.x - frag.x) + dFdy(vUv) * (centerFrag.y - frag.y);
        vec4 cellSample = texture2D(uMap, clamp(uvCell, 0.0, 1.0));
        vec4 fullSample = texture2D(uMap, vUv);

        float lum = dot(cellSample.rgb, vec3(0.2126, 0.7152, 0.0722));
        lum = smoothstep(uLevels.x, uLevels.y, lum);
        float tone = smoothstep(0.06, 0.94, mix(1.0 - lum, lum, uInvert));
        // Thin the strokes toward the frame edges so a cropped photo never
        // reads as a rectangle: the image thins out into bare paper.
        vec2 e = clamp(uvCell, 0.0, 1.0);
        tone *= smoothstep(0.0, 0.3, e.y) * smoothstep(0.0, 0.16, e.x) * smoothstep(1.0, 0.84, e.x);
        float border = min(min(e.x, 1.0 - e.x), min(e.y, 1.0 - e.y));
        float edgeKeep = uEdge > 0.0 ? smoothstep(uEdge * 0.35, uEdge, border) : 1.0;
        // With an edge band, the strokes also thin out toward the top so the
        // frame dissolves into paper on every side, not just the bottom.
        if (uEdge > 0.0) tone *= smoothstep(1.0, 1.0 - uEdge * 1.3, e.y);
        float cov = inkCoverage(frag, tone) * step(0.5, cellSample.a);
        vec4 inked = vec4(mix(uInkColor, uPaperColor, uInvert), cov);

        vec4 photo = fullSample;
        // Field measured at the cell centre so the boundary stays stepped.
        float field = smoothstep(uFade.x, uFade.y, clamp(uvCell.y, 0.0, 1.0)) * edgeKeep;
        gl_FragColor = mix(inked, photo, inkResolveWith(frag, uResolve * field));
        gl_FragColor.a *= uInkAlpha;
        if (gl_FragColor.a < 0.004) discard;
      }
    `,
  })
}
