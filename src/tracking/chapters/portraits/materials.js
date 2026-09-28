import * as THREE from 'three'
import { createInkUniforms, inkCommon } from '../../ink/inkChunk'

// Display-space colours straight into the shaders (the ink pass works in
// sRGB values, like inkGlobals).
export const srgb = (hex) => {
  const c = new THREE.Color()
  c.setHex(hex, THREE.NoColorSpace)
  return new THREE.Vector3(c.r, c.g, c.b)
}
export const GROUND = '#0f0f0e'
const BONE = 0xe8e4db
const REC = 0xd7331f
const SHEET = 0x141413

// 1×1 transparent texture for prints without a cut-out.
const EMPTY = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1)
EMPTY.needsUpdate = true

/**
 * A plane bent onto the inside of a vertical cylinder of radius R: the
 * centre stays at the origin, the sides curve toward +z (toward the axis,
 * where the viewer stands). Shared shape for prints, cut-outs, captions and
 * the title, so everything hangs on one wall.
 */
export function bentPlane(w, h, R, seg = 40) {
  const g = new THREE.PlaneGeometry(w, h, seg, 1)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const a = p.getX(i) / R
    p.setXYZ(i, Math.sin(a) * R, p.getY(i), R - Math.cos(a) * R)
  }
  p.needsUpdate = true
  g.computeVertexNormals()
  g.computeBoundingSphere()
  return g
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Shared fragment helpers: cell-centre uv on the shared ink lattice, and a
// mip level that pre-filters one texel footprint per ink cell (so the ink
// version never aliases, however small the print gets on screen).
const cellHelpers = /* glsl */ `
  vec2 cellUv(vec2 uv, vec2 frag, out vec2 cellPx) {
    vec2 size = inkCellSize();
    float shift = inkTrackingShift(frag.y);
    vec2 g = vec2(frag.x + shift, frag.y) / size;
    vec2 cf = (floor(g) + 0.5) * size - vec2(shift, 0.0);
    cellPx = size;
    return uv + dFdx(uv) * (cf.x - frag.x) + dFdy(uv) * (cf.y - frag.y);
  }
  float cellLod(vec2 uv, vec2 texSize, vec2 cellPx) {
    float t = max(length(dFdx(uv) * texSize), length(dFdy(uv) * texSize));
    return log2(max(1.0, t * sqrt(cellPx.x * cellPx.y) * 0.7));
  }
  // Ink → photo in stepped vertical bars, driven only by scroll/centring
  // (deliberately not by the cursor lens: nothing here reveals on hover).
  float barsResolve(vec2 frag, float r) {
    vec2 cell = floor(frag / inkCellSize());
    float t = inkHash(vec2(cell.x, floor(cell.y / 4.0)) + 17.0);
    return step(t, r * 1.02 - 0.01);
  }
`

/**
 * A print on the wall: dark paper sheet with the photograph inset. Away from
 * the centre it is an engraving (bone strokes on the sheet); as it reaches
 * the centre it develops into the photograph in stepped bars.
 * Colour prints engrave in a warm bone; `redLight` (REC: lit by a red lamp
 * only) takes its tone from the brightest channel so the red glow engraves.
 * With a cut-out, uStep punches his silhouette out of the print (he has
 * stepped forward) and drops a soft shadow onto it.
 */
export function createPrintMaterial(map, { cut = null, color = false, redLight = false, inset = [0.04, 0.03] } = {}) {
  map.colorSpace = THREE.NoColorSpace
  const tint = srgb(BONE).lerp(srgb(REC), redLight ? 0.42 : color ? 0.2 : 0)
  const uniforms = {
    ...createInkUniforms({ resolve: 0, invert: 1, alpha: 0 }),
    uMap: { value: map },
    uCut: { value: cut || EMPTY },
    uHasCut: { value: cut ? 1 : 0 },
    uTexSize: { value: new THREE.Vector2(map.image.width, map.image.height) },
    uLevels: { value: new THREE.Vector2(redLight ? 0.03 : 0.06, redLight ? 0.62 : 0.9) },
    uChroma: { value: redLight ? 1 : color ? 0.3 : 0 },
    uInset: { value: new THREE.Vector2(...inset) },
    uSheet: { value: srgb(SHEET) },
    uTint: { value: tint },
    uBone: { value: 0.7 },
    uStep: { value: 0 },
    uShadow: { value: new THREE.Vector2(0.018, 0.022) },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform sampler2D uCut;
      uniform float uHasCut;
      uniform vec2 uTexSize;
      uniform vec2 uLevels;
      uniform float uChroma;
      uniform vec2 uInset;
      uniform vec3 uSheet;
      uniform vec3 uTint;
      uniform float uBone;
      uniform float uStep;
      uniform vec2 uShadow;
      varying vec2 vUv;
      ${inkCommon}
      ${cellHelpers}

      vec2 toImg(vec2 uv) { return (uv - uInset) / (1.0 - 2.0 * uInset); }
      float inside(vec2 p) { vec2 s = step(vec2(0.0), p) * step(p, vec2(1.0)); return s.x * s.y; }
      // Cut-out influence fades out at the frame edges, where the cut-out
      // meets the edge of the photograph (so no hard seam ever shows).
      float edgeW(vec2 p) {
        return smoothstep(0.0, 0.08, p.y) * smoothstep(1.0, 0.95, p.y) * smoothstep(0.0, 0.05, p.x) * smoothstep(1.0, 0.95, p.x);
      }

      void main() {
        vec2 frag = gl_FragCoord.xy;
        if (inkClipped(frag)) discard;
        vec2 cellPx;
        vec2 pF = toImg(vUv);
        vec2 pC = toImg(cellUv(vUv, frag, cellPx));
        float inF = inside(pF);
        float inC = inside(pC);

        float lod = cellLod(pF, uTexSize, cellPx);
        vec4 sC = texture2DLodEXT(uMap, clamp(pC, 0.0, 1.0), lod);
        float lum = mix(dot(sC.rgb, vec3(0.2126, 0.7152, 0.0722)), max(sC.r, max(sC.g, sC.b)), uChroma);
        float tone = smoothstep(0.04, 0.96, smoothstep(uLevels.x, uLevels.y, lum)) * inC;
        float cov = inkCoverage(frag, tone);
        vec3 inked = mix(uSheet, mix(uSheet, uTint, uBone), cov);

        vec3 photo = texture2D(uMap, clamp(pF, 0.0, 1.0)).rgb;
        if (uHasCut > 0.5) {
          vec2 q = clamp(pF, 0.0, 1.0);
          float k = uStep * edgeW(q);
          float hole = texture2D(uCut, q).a;
          float shade = texture2DLodEXT(uCut, clamp(q - uShadow, 0.0, 1.0), 4.0).a;
          photo *= 1.0 - 0.62 * shade * k;
          photo = mix(photo, uSheet * 0.7, hole * k);
        }
        vec3 surf = mix(uSheet, photo, inF);
        float r = barsResolve(frag, uResolve);
        gl_FragColor = vec4(mix(inked, surf, r), uInkAlpha);
        if (gl_FragColor.a < 0.004) discard;
      }
    `,
  })
}

/** The cut-out of Zay that steps out of its print (straight alpha). */
export function createCutMaterial(map) {
  map.colorSpace = THREE.NoColorSpace
  const uniforms = {
    ...createInkUniforms({ resolve: 1, invert: 1, alpha: 0 }),
    uMap: { value: map },
    uTexSize: { value: new THREE.Vector2(map.image.width, map.image.height) },
    uTint: { value: srgb(BONE) },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec2 uTexSize;
      uniform vec3 uTint;
      varying vec2 vUv;
      ${inkCommon}
      ${cellHelpers}
      void main() {
        vec2 frag = gl_FragCoord.xy;
        if (inkClipped(frag)) discard;
        vec2 cellPx;
        vec2 uvC = clamp(cellUv(vUv, frag, cellPx), 0.0, 1.0);
        vec4 sC = texture2DLodEXT(uMap, uvC, cellLod(vUv, uTexSize, cellPx));
        float lum = dot(sC.rgb, vec3(0.2126, 0.7152, 0.0722));
        float cov = inkCoverage(frag, smoothstep(0.06, 0.9, lum)) * step(0.5, sC.a);
        vec4 photo = texture2D(uMap, vUv);
        vec4 o = mix(vec4(uTint, cov), photo, barsResolve(frag, uResolve));
        // Dissolve into the print at the frame edges (the cut-out is cropped
        // there exactly like the photograph behind it).
        o.a *= uInkAlpha * smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.95, vUv.y)
             * smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
        if (o.a < 0.004) discard;
        gl_FragColor = o;
      }
    `,
  })
}

/** Big serif title painted on the wall: engraved bone strokes, lens resolves it solid. */
export function createTitleMaterial(map) {
  map.colorSpace = THREE.NoColorSpace
  const uniforms = {
    ...createInkUniforms({ resolve: 0, invert: 1, alpha: 0 }),
    uMap: { value: map },
    uTexSize: { value: new THREE.Vector2(map.image.width, map.image.height) },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec2 uTexSize;
      varying vec2 vUv;
      ${inkCommon}
      ${cellHelpers}
      void main() {
        vec2 frag = gl_FragCoord.xy;
        if (inkClipped(frag)) discard;
        vec2 cellPx;
        vec2 uvC = clamp(cellUv(vUv, frag, cellPx), 0.0, 1.0);
        float aC = texture2DLodEXT(uMap, uvC, cellLod(vUv, uTexSize, cellPx)).a;
        float cov = inkCoverage(frag, smoothstep(0.1, 0.75, aC));
        float solid = texture2D(uMap, vUv).a;
        vec4 o = mix(vec4(uPaperColor, cov), vec4(uPaperColor, solid), barsResolve(frag, uResolve));
        o.a *= uInkAlpha;
        if (o.a < 0.004) discard;
        gl_FragColor = o;
      }
    `,
  })
}

/** Wall label: crisp bone type (not inked, so it stays legible). */
export function createCaptionMaterial(map) {
  map.colorSpace = THREE.NoColorSpace
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uTint: { value: srgb(BONE) },
      uOpacity: { value: 0 },
      uClipY: { value: new THREE.Vector2(-1e6, 1e6) },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uTint;
      uniform float uOpacity;
      uniform vec2 uClipY;
      varying vec2 vUv;
      void main() {
        if (gl_FragCoord.y < uClipY.x || gl_FragCoord.y > uClipY.y) discard;
        float a = texture2D(uMap, vUv).a * uOpacity;
        if (a < 0.004) discard;
        gl_FragColor = vec4(uTint, a);
      }
    `,
  })
}

export const MAX_SPOTS = 12

/**
 * The rotunda wall, seen from inside: a faint engraved studio. Each print
 * hangs in a pool from a ceiling track light; a skirting line marks the
 * floor; the pools fall onto the floor below. When the colour print is
 * centred, its red tally light spills onto the wall and warms the ground.
 * Everything is in the rotunda's own frame, so it all turns with the wheel.
 */
export function createWallMaterial() {
  const uniforms = {
    ...createInkUniforms({ resolve: 0, invert: 1, alpha: 1 }),
    uSpots: { value: Array.from({ length: MAX_SPOTS }, () => new THREE.Vector4()) },
    uSpotCount: { value: 0 },
    uR: { value: 6 },
    uFloorY: { value: -2 },
    uRecAt: { value: new THREE.Vector3(0, 0, 1) },
    uRec: { value: 0 },
    uAlpha: { value: 0.5 },
    uFadeBottom: { value: 0 },
    uRed: { value: srgb(REC) },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec4 uSpots[${MAX_SPOTS}];
      uniform int uSpotCount;
      uniform float uR;
      uniform float uFloorY;
      uniform vec3 uRecAt;
      uniform float uRec;
      uniform float uAlpha;
      uniform float uFadeBottom;
      uniform vec3 uRed;
      varying vec3 vPos;
      ${inkCommon}

      float pools(float arc, float y) {
        float t = 0.0;
        for (int i = 0; i < ${MAX_SPOTS}; i++) {
          if (i >= uSpotCount) break;
          vec4 s = uSpots[i];
          vec2 d = vec2((arc - s.x) / s.y, (y - s.z) / s.w);
          t += exp(-dot(d, d) * 2.4);
        }
        return t;
      }

      void main() {
        vec2 frag = gl_FragCoord.xy;
        if (inkClipped(frag)) discard;
        float arc = atan(vPos.x, -vPos.z) * uR;
        float y = vPos.y;
        float wallSide = step(uFloorY, y);

        // Wall: track-light pools. Floor: the same pools, stretched and
        // dimmer, like light landing on polished concrete. The hatch is
        // regular and only its strength follows the light, so the pools
        // fade like light instead of breaking into speckle.
        float yy = wallSide > 0.5 ? y : uFloorY - (uFloorY - y) * 2.4;
        float light = clamp(pools(arc, yy), 0.0, 1.0) * mix(0.45, 1.0, wallSide);
        // Engraver's hatch: every third column of the shared lattice, so it
        // reads as hatching on plaster, not as a screen.
        float column = floor((frag.x + inkTrackingShift(frag.y)) / inkCellSize().x);
        float hatch = inkCoverage(frag, 0.42) * step(mod(column, 3.0), 0.5);
        // Skirting: a fine engraved line where the wall meets the floor.
        float lineMask = 1.0 - smoothstep(0.004, 0.012, abs(y - uFloorY));
        // ...fading out before it can cross the DOM rail at the stage foot.
        float lineCov = inkCoverage(frag, 0.6) * lineMask * smoothstep(uFadeBottom, uFadeBottom + 40.0 * uInkDpr, frag.y);
        float cov = max(hatch * light * light * 0.24, lineCov * 0.5);

        // REC: red spill around the tally light, plus a faint warm ground.
        vec2 dr = vec2(arc - uRecAt.x, (y - uRecAt.y) * 1.25) / uRecAt.z;
        float glow = exp(-dot(dr, dr) * 1.4);
        float washA = uRec * (0.024 + 0.12 * glow);
        vec3 stroke = mix(uPaperColor, uRed, clamp(uRec * glow * 1.2, 0.0, 0.7));
        float inkA = cov * uAlpha;
        float a = inkA + washA * (1.0 - inkA);
        vec3 col = (stroke * inkA + uRed * washA * (1.0 - inkA)) / max(a, 1e-4);
        if (a < 0.003) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
  })
}
