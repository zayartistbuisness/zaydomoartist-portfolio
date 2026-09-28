import * as THREE from 'three'
import { createInkUniforms, inkCommon } from '../../ink/inkChunk'
import { FILM, BEAT } from './timeline'

// 35 mm still film, horizontal: 36×24 image, 8 KS perforations per 38 mm
// pitch, 35 mm stock. The shader works in these millimetres; the geometry
// maps them onto the spline so one frame is `fw` world units wide.
export const MM = { pitch: 38, frameW: 36, frameH: 24, stock: 35 }

// Spline control points in frame widths: [x, y, z, roll]. The strip is an
// arc, convex toward the lens: it comes in from depth at the upper right (the
// frames still to come), runs dead flat and square to camera through the
// gate at the origin, and falls away into depth at the lower left (the frames
// already shown). Five collinear points hold it flat through the gate.
const WIDE = [
  [3.45, 1.95, -6.0, 0.8],
  [2.12, 0.92, -2.2, 0.35],
  [1.22, 0.27, -0.6, 0.1],
  [0.66, 0.0, 0.0, 0.0],
  [0.55, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.0],
  [-0.55, 0.0, 0.0, 0.0],
  [-0.66, 0.0, 0.0, 0.0],
  [-1.25, -0.4, -0.6, -0.1],
  [-2.15, -1.15, -2.3, -0.35],
  [-3.3, -2.25, -6.5, -0.8],
]
// Portrait screens: the same arc turned upright, so it reads in a tall frame.
const TALL = [
  [1.25, 2.7, -9.0, 0.9],
  [1.05, 1.55, -3.5, 0.5],
  [0.82, 0.55, -0.8, 0.14],
  [0.75, 0.0, 0.0, 0.0],
  [0.55, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 0.0],
  [-0.55, 0.0, 0.0, 0.0],
  [-0.75, 0.0, 0.0, 0.0],
  [-0.82, -0.55, -0.8, -0.14],
  [-1.05, -1.55, -3.2, -0.45],
  [-1.25, -2.7, -8.0, -0.85],
]

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.min(1, Math.max(0, v))

/**
 * Ribbon geometry along the spline. Attributes: aS (arc length, world) and
 * aT (-0.5 … 0.5 across the stock). Returns the geometry plus the arc length
 * of the gate and the world size of one frame pitch.
 */
export function buildRibbon(aspect, fw, segments = 900) {
  const t = clamp01((aspect - 0.6) / (1.25 - 0.6))
  const ctrl = WIDE.map((w, i) => TALL[i].map((v, k) => lerp(v, w[k], t)))
  const curve = new THREE.CatmullRomCurve3(
    ctrl.map((c) => new THREE.Vector3(c[0] * fw, c[1] * fw, c[2] * fw)),
    false,
    'centripetal',
  )
  curve.arcLengthDivisions = 2400
  const lengths = curve.getLengths()
  const len = lengths[lengths.length - 1]
  // The gate is the middle control point → t = 0.5 → index 1200 of 2400.
  const gateS = lengths[1200]

  const rollAt = (tt) => {
    const x = tt * (ctrl.length - 1)
    const i = Math.min(ctrl.length - 2, Math.floor(x))
    const f = x - i
    const e = f * f * (3 - 2 * f)
    return lerp(ctrl[i][3], ctrl[i + 1][3], e)
  }

  const half = (fw * MM.stock) / MM.frameW / 2
  const n = segments + 1
  const pos = new Float32Array(n * 2 * 3)
  const aS = new Float32Array(n * 2)
  const aT = new Float32Array(n * 2)
  const P = new THREE.Vector3()
  const T = new THREE.Vector3()
  const W = new THREE.Vector3()
  const X = new THREE.Vector3()
  const up = new THREE.Vector3(0, 1, 0)
  for (let j = 0; j < n; j++) {
    const u = j / segments
    curve.getPointAt(u, P)
    curve.getTangentAt(u, T)
    // Width axis: world-up made perpendicular to the tangent, then banked.
    W.copy(up).addScaledVector(T, -up.dot(T)).normalize()
    const roll = rollAt(curve.getUtoTmapping(u))
    X.crossVectors(T, W)
    W.multiplyScalar(Math.cos(roll)).addScaledVector(X, Math.sin(roll))
    for (let side = 0; side < 2; side++) {
      const k = j * 2 + side
      const sgn = side === 0 ? 1 : -1
      pos[k * 3] = P.x + W.x * half * sgn
      pos[k * 3 + 1] = P.y + W.y * half * sgn
      pos[k * 3 + 2] = P.z + W.z * half * sgn
      aS[k] = u * len
      aT[k] = 0.5 * sgn
    }
  }
  const index = []
  for (let j = 0; j < segments; j++) {
    const a = j * 2
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geometry.setAttribute('aS', new THREE.BufferAttribute(aS, 1))
  geometry.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
  geometry.setIndex(index)
  geometry.computeBoundingSphere()
  return { geometry, gateS, pitchW: (fw * MM.pitch) / MM.frameW, half }
}

const sdBox = /* glsl */ `
float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
`

/**
 * The strip material. Away from the gate everything is the shared ink line
 * field (bone strokes on the dark ground); the frame dwelling in the gate
 * resolves to the photograph and to real film (black base, cut
 * perforations).
 */
export function createStripMaterial(atlas) {
  atlas.colorSpace = THREE.NoColorSpace
  atlas.anisotropy = 8
  const uniforms = {
    ...createInkUniforms({ resolve: 0, invert: 1, alpha: 0 }),
    uAtlas: { value: atlas },
    uGateA: { value: atlas },
    uGateB: { value: atlas },
    // x, y: slots carried by uGateA / uGateB · z, w: 1 when loaded
    uGateIdx: { value: new THREE.Vector4(-99, -99, 0, 0) },
    uOffset: { value: -12 },
    uExtent: { value: new THREE.Vector2(FILM.head, FILM.tail) },
    uLevels: { value: new THREE.Vector2(0.05, 0.88) },
    uFocus: { value: 0 },
    uLoupe: { value: 1.0 }, // no cursor loupe (site-wide rule)
    uGateS: { value: 0 },
    uPitchW: { value: 1 },
    uBulge: { value: 0 },
    uLift: { value: 0.3 },
    uFlicker: { value: 0 },
  }
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute float aS;
      attribute float aT;
      uniform float uGateS;
      uniform float uPitchW;
      uniform float uBulge;
      uniform float uLift;
      varying vec2 vFilm;
      void main() {
        float ds = (aS - uGateS) / uPitchW;
        // The frame in the gate swells a touch and lifts toward the lens.
        float w = 1.0 - smoothstep(0.5, 1.45, abs(ds));
        vec3 p = position * (1.0 + 0.05 * uBulge * w);
        p.z += uLift * uBulge * w;
        vFilm = vec2(-ds * 38.0, aT * 35.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas;
      uniform sampler2D uGateA;
      uniform sampler2D uGateB;
      uniform vec4 uGateIdx;
      uniform float uOffset;
      uniform vec2 uExtent;
      uniform vec2 uLevels;
      uniform float uFocus;
      uniform float uLoupe;
      uniform float uFlicker;
      varying vec2 vFilm;
      ${inkCommon}
      ${sdBox}

      const float PITCH = 38.0;
      const float BEAT = ${BEAT.toFixed(1)};

      // slot → atlas cell; -1 leader, -2 the clear "Behind the camera" frame
      float photoOf(float i) {
        if (i < -0.5 || i > 9.5) return -1.0;
        if (abs(i - BEAT) < 0.5) return -2.0;
        return i < BEAT ? i : i - 1.0;
      }

      // Atlas: 3×3 slots of 1024×684 px, image 1020×680 inside a 2 px gutter.
      vec2 atlasUV(float k, vec2 uv) {
        float col = mod(k, 3.0);
        float row = floor(k / 3.0 + 0.001);
        uv = clamp(uv, 0.0, 1.0);
        return vec2(
          (col * 1024.0 + 2.0 + uv.x * 1020.0) / 3072.0,
          1.0 - (row * 684.0 + 2.0 + (1.0 - uv.y) * 680.0) / 2052.0
        );
      }

      // Film layout at film coords f (mm). Returns
      //   x: 1 on the stock, 0 off it or inside a perforation
      //   y: 1 inside the 36×24 image area
      //   z: ink tone of the bare stock (rebate hatch, heavier at the edges)
      vec3 filmLayout(vec2 f, out float slot, out vec2 uv, out float cue) {
        slot = floor(f.x / PITCH + 0.5);
        float lx = f.x - slot * PITCH;
        uv = vec2(lx / 36.0 + 0.5, f.y / 24.0 + 0.5);
        float ay = abs(f.y);
        float on = step(ay, 17.5)
          * step(uExtent.x * PITCH, f.x) * step(f.x, uExtent.y * PITCH);
        float px = mod(lx + 19.0, 4.75) - 2.375;
        float hole = step(sdBox(vec2(px, ay - 14.1), vec2(0.99, 1.4), 0.42), 0.0);
        float img = step(abs(lx), 18.0) * step(ay, 12.0);
        // Changeover cue: a small dark ring, upper right of the clear frame.
        float c = length(vec2(lx - 13.4, f.y - 8.2));
        cue = 1.0 - step(abs(c - 1.05), 0.34);
        float tone = ay > 16.7 ? 0.62 : 0.3;
        return vec3(on * (1.0 - hole), img, tone);
      }

      void main() {
        if (inkClipped(gl_FragCoord.xy)) discard;
        vec2 frag = gl_FragCoord.xy;
        vec2 f = vFilm + vec2(uOffset * PITCH, 0.0);
        vec2 fx = dFdx(f);
        vec2 fy = dFdy(f);

        // Loupe: inside the lens, film coords pull toward the lens centre.
        float dl = length(frag - uLensPos);
        float mw = (1.0 - smoothstep(uLensRadius * 0.5, uLensRadius * 0.76, dl)) * uLensStrength;
        vec2 toC = (uLensPos - frag) * (1.0 - 1.0 / uLoupe) * mw;
        f += fx * toC.x + fy * toC.y;
        float jac = 1.0 - (1.0 - 1.0 / uLoupe) * mw;

        // Ink cell centre on the shared lattice → stepped silhouettes.
        vec2 size = inkCellSize();
        float shift = inkTrackingShift(frag.y);
        vec2 g = vec2(frag.x + shift, frag.y) / size;
        vec2 cf = (floor(g) + 0.5) * size - vec2(shift, 0.0);
        vec2 fc = f + (fx * (cf.x - frag.x) + fy * (cf.y - frag.y)) * jac;

        float slotC; vec2 uvC; float cueC;
        vec3 Lc = filmLayout(fc, slotC, uvC, cueC);
        float slotF; vec2 uvF; float cueF;
        vec3 Lf = filmLayout(f, slotF, uvF, cueF);
        float kC = photoOf(slotC);
        float kF = photoOf(slotF);

        // One pre-filtered sample per ink cell (lod ≈ texels under a cell).
        float mmPerPx = max(length(fx), length(fy)) * jac;
        float lodC = log2(max(1.0, mmPerPx * 28.3 * sqrt(size.x * size.y)));
        vec4 sC = texture2DLodEXT(uAtlas, atlasUV(max(kC, 0.0), uvC), lodC);
        vec4 sF = texture2D(uAtlas, atlasUV(max(kF, 0.0), uvF));
        vec4 sA = texture2D(uGateA, clamp(uvF, 0.0, 1.0));
        vec4 sB = texture2D(uGateB, clamp(uvF, 0.0, 1.0));
        float useA = step(abs(slotF - uGateIdx.x), 0.1) * uGateIdx.z;
        float useB = step(abs(slotF - uGateIdx.y), 0.1) * uGateIdx.w;
        vec3 photo = mix(mix(sF.rgb, sB.rgb, useB), sA.rgb, useA);

        // ── Resolved surface: real film ──
        vec3 base = vec3(0.083, 0.08, 0.074);
        vec3 lamp = vec3(0.93, 0.912, 0.87);
        // Leader is dense black stock: the lamp only just glows through it.
        vec2 lq = (uvF - 0.5) * vec2(1.5, 1.0);
        vec3 leader = mix(vec3(0.04), vec3(0.15, 0.145, 0.135), exp(-dot(lq, lq) * 5.0));
        vec3 inImg = kF >= 0.0 ? photo * (1.0 + uFlicker) : (kF < -1.5 ? mix(base, lamp, cueF) : leader);
        vec3 surf = mix(base, inImg, Lf.y);

        // ── Ink: bone strokes (invert) ──
        float lum = smoothstep(uLevels.x, uLevels.y, sC.r);
        float toneImg = kC >= 0.0 ? lum : (kC < -1.5 ? 0.92 * cueC : 0.1);
        float tone = mix(Lc.z, toneImg, Lc.y);
        tone = smoothstep(0.04, 0.96, tone);
        // The stock is opaque: bone strokes engraved into a dark film base,
        // so nothing behind reads through except at the perforations.
        float cov = inkCoverage(frag, tone);
        vec3 stockInk = vec3(0.074, 0.072, 0.067);
        // Strokes quieten away from the gate so the frame in it leads.
        float near = 1.0 - smoothstep(0.5, 1.6, abs(slotC - uOffset));
        vec3 stroke = mix(stockInk, mix(uInkColor, uPaperColor, uInvert), 0.74 + 0.26 * near);
        vec4 inked = vec4(mix(stockInk, stroke, cov), Lc.x);

        // The frame in the gate resolves; the lens resolves anything.
        float rBase = uFocus * (1.0 - smoothstep(0.1, 0.42, abs(slotC - uOffset)));
        float r = inkResolveWith(frag, rBase);
        vec4 outC = mix(inked, vec4(surf, Lf.x), r);
        outC.a *= uInkAlpha;
        if (outC.a < 0.004) discard;
        gl_FragColor = outC;
      }
    `,
  })
}

/**
 * Light behind the gate: a lamp glow shaped by the aperture with faint rays,
 * drawn partly as ink strokes and partly as a soft haze. Shows through the
 * perforations and around the frame. uHalf is the gate footprint projected
 * onto this plane (world units).
 */
export function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...createInkUniforms({ invert: 1 }),
      uHalf: { value: new THREE.Vector2(1, 1) },
      uAmt: { value: 0 },
      uTime: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec2 uHalf;
      uniform float uAmt;
      uniform float uTime;
      varying vec3 vW;
      ${inkCommon}
      ${sdBox}
      void main() {
        if (inkClipped(gl_FragCoord.xy)) discard;
        vec2 p = vW.xy;
        float d = max(sdBox(p, uHalf, uHalf.y * 0.05), 0.0);
        float tight = exp(-d / (uHalf.y * 0.07));
        float halo = exp(-d / (uHalf.y * 0.55));
        float ang = atan(p.y, p.x * 0.7);
        float rays = 0.5 + 0.5 * sin(ang * 9.0 + 1.4 * sin(ang * 4.0 + uTime * 0.06));
        rays *= 0.55 + 0.45 * sin(ang * 23.0 - uTime * 0.04);
        float inside = step(d, 0.0);
        // Lamp hotspot: brightest at the centre, still strong at the
        // perforation rows so they glow when the film is in the gate.
        vec2 q = p / uHalf;
        float hot = 0.58 + 0.42 * exp(-dot(q, q) * 1.6);
        float light = uAmt * (inside * hot + (1.0 - inside) * (tight * 0.5 + halo * (0.1 + 0.24 * rays)));
        float cov = inkCoverage(gl_FragCoord.xy, clamp(light * 0.8, 0.0, 1.0));
        float haze = light * 0.12;
        vec3 col = uPaperColor;
        gl_FragColor = vec4(col, clamp(cov * 0.55 + haze, 0.0, 1.0));
        if (gl_FragColor.a < 0.004) discard;
      }
    `,
  })
}

function roundedRectShape(hw, hh, r, shape = new THREE.Shape()) {
  shape.moveTo(-hw + r, -hh)
  shape.lineTo(hw - r, -hh)
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r)
  shape.lineTo(hw, hh - r)
  shape.quadraticCurveTo(hw, hh, hw - r, hh)
  shape.lineTo(-hw + r, hh)
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r)
  shape.lineTo(-hw, -hh + r)
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
  return shape
}

/**
 * The projector gate: a thin chrome aperture around the 36×24 image area,
 * just in front of the strip, so the frame in the gate is framed in metal
 * while perforations and rebates run on above and below. World units.
 */
export function buildGateGeometry(fw, bulge = 1.05) {
  const mm = fw / MM.frameW
  const t = mm * 1.05
  const iw = (MM.frameW / 2) * bulge * mm + mm * 0.7
  const ih = (MM.frameH / 2) * bulge * mm + mm * 0.7
  const outer = roundedRectShape(iw + t, ih + t, t * 1.2)
  const hole = roundedRectShape(iw, ih, t * 0.35, new THREE.Path())
  outer.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: t * 0.6,
    bevelEnabled: true,
    bevelThickness: t * 0.4,
    bevelSize: t * 0.3,
    bevelSegments: 6,
    curveSegments: 8,
  })
  geo.translate(0, 0, -t * 0.3)
  geo.computeVertexNormals()
  return geo
}
