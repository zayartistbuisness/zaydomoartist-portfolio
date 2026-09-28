import * as THREE from 'three'
import { createInkUniforms, inkCommon } from '../../ink/inkChunk'

// sRGB components straight into the shader (the ink pass works in display space).
const rgb = (hex) => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255)

export const BONE = 0xe8e4db
export const GREEN = 0x4bbc4c // the On The Radar logo's own glow green
export const R_IN = 0.779 // inner bezel ring (logo: 226 / 290 px)
export const EXT = 1.5 // half-size of the scope plane, in bezel radii

/**
 * The radar scope, drawn in one fragment shader on a plane in "bezel units"
 * (outer ring = 1). Everything is engraved hairline in bone except the
 * phosphor: the sweep arm, its trail (hatched through the shared ink grid so
 * it reads as the same printed material) and the contacts, in the logo green.
 *
 * Also carries the bezel (the logo's own double ring and six screws), which
 * reads as a heavy white band in the logo pose and thins to hairlines once it
 * has swung back into the table, and the sound-wave line field around the rim.
 */
export function makeScopeMaterial() {
  const blips = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0))
  const pings = [0, 1, 2, 3].map(() => new THREE.Vector4(99, 0, 0, 0))
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    premultipliedAlpha: true,
    uniforms: {
      ...createInkUniforms({ invert: 1 }),
      uTime: { value: 0 },
      uAlpha: { value: 1 },
      uBezel: { value: 0 },
      uFill: { value: 0 },
      uGround: { value: rgb(0x0e0f0e) },
      uBand: { value: 0.04 },
      uReveal: { value: 0 },
      uSweep: { value: 0 },
      uSweepOn: { value: 0 },
      uCw: { value: 1 },
      uTrail: { value: 0.9 },
      uWave: { value: 1 },
      uHum: { value: 1 },
      uBlip: { value: blips },
      uPing: { value: pings },
      uBone: { value: rgb(BONE) },
      uGreen: { value: rgb(GREEN) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() {
        vP = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uAlpha;
      uniform float uBezel;
      uniform float uFill;
      uniform vec3 uGround;
      uniform float uBand;
      uniform float uReveal;
      uniform float uSweep;
      uniform float uSweepOn;
      uniform float uCw;
      uniform float uTrail;
      uniform float uWave;
      uniform float uHum;
      uniform vec4 uBlip[4];
      uniform vec4 uPing[4];
      uniform vec3 uBone;
      uniform vec3 uGreen;
      varying vec2 vP;
      ${inkCommon}

      const float PI = 3.14159265;
      const float TAU = 6.28318531;
      const float R_IN = ${R_IN.toFixed(3)};
      const float R_SCREW = 0.893;

      // Coverage of a line |d| = 0 that is px device pixels wide.
      float hair(float d, float fw, float px) { return clamp(px * 0.5 - abs(d) / fw + 0.5, 0.0, 1.0); }
      float wrapPI(float a) { return mod(a + PI, TAU) - PI; }

      void main() {
        float r = length(vP);
        float a = atan(vP.x, vP.y); // bearing, clockwise from the far edge
        float fw = max(fwidth(r), 1e-5);
        vec2 fv = fwidth(vP);
        float fp = max(max(fv.x, fv.y), 1e-5);
        float frac = mod(a + TAU, TAU) / TAU;

        float bone = 0.0;
        float green = 0.0;
        float hot = 0.0;

        // ── Bezel: the logo's double ring, band → hairline.
        float wB = max(1.2, uBand / fw);
        bone += uBezel * max(hair(r - 1.0, fw, wB), hair(r - R_IN, fw, wB)) * 0.9;
        // Fine 1° graduations on the bezel band once it is an instrument.
        float s1 = TAU / 360.0;
        float g1 = r * abs(sin(a - floor(a / s1 + 0.5) * s1));
        bone += uReveal * uBezel * hair(g1, fp, 0.9) * step(0.965, r) * step(r, 0.99) * 0.35;

        // Six screws on the bezel (none at 90° / 270°, where the letters sat).
        float k = floor(a / (TAU / 8.0) + 0.5);
        float kk = mod(k + 8.0, 8.0);
        if (abs(kk - 2.0) > 0.5 && abs(kk - 6.0) > 0.5) {
          float ang = k * TAU / 8.0;
          vec2 u = vec2(sin(ang), cos(ang));
          vec2 q = vP - u * R_SCREW;
          float qr = dot(q, u);
          float qt = dot(q, vec2(u.y, -u.x));
          float sr = 0.04;
          float wS = max(1.1, uBand * 0.32 / fp);
          float head = hair(length(q) - sr, fp, wS);
          float cross = max(hair(qr, fp, wS) * step(abs(qt), sr * 0.5), hair(qt, fp, wS) * step(abs(qr), sr * 0.5));
          bone += uBezel * max(head, cross) * 0.85;
        }

        // ── Interior: range rings, spokes, crosshair, ticks. Draws in
        // clockwise from the far edge as the scope powers up.
        float inside = step(r, R_IN);
        float wipe = smoothstep(0.0, 0.03, uReveal * 1.06 - frac);
        float grid = 0.0;
        for (int i = 1; i <= 3; i++) {
          float fi = float(i);
          grid = max(grid, hair(r - R_IN * fi * 0.25, fw, 1.0) * 0.42 * step(fi * 0.22, uReveal));
        }
        float st = TAU / 12.0;
        float ks = floor(a / st + 0.5);
        float spoke = hair(r * sin(abs(a - ks * st)), fp, 1.0);
        float cardinal = 1.0 - step(0.5, mod(ks + 12.0, 3.0));
        grid = max(grid, spoke * mix(0.13, 0.4, cardinal) * step(0.02, r));
        float s5 = TAU / 72.0;
        float k5 = floor(a / s5 + 0.5);
        float major = 1.0 - step(0.5, mod(k5 + 72.0, 6.0));
        float mid = 1.0 - step(0.5, mod(k5 + 72.0, 2.0));
        float len = mix(mix(0.016, 0.028, mid), 0.05, major);
        float tick = hair(r * sin(abs(a - k5 * s5)), fp, 1.0) * step(R_IN - len, r);
        grid = max(grid, tick * 0.75);
        grid = max(grid, hair(r - 0.011, fw, 1.0) * 0.8);
        bone += grid * inside * wipe * uReveal;

        // ── Phosphor: trail hatched through the ink grid, then the arm.
        float da = wrapPI(a - uSweep);
        float fwd = step(0.0, cos(da));
        float behindCw = mod(uSweep - a + TAU * 4.0, TAU);
        float behindCcw = mod(a - uSweep + TAU * 4.0, TAU);
        float trail = mix(exp(-behindCcw / uTrail), exp(-behindCw / uTrail), uCw);
        trail *= inside * uSweepOn * smoothstep(0.0, 0.05, r);
        float cov = inkCoverage(gl_FragCoord.xy, trail * 0.82);
        green += cov * 0.4 + trail * trail * 0.05;
        float armD = abs(r * sin(da));
        hot += hair(armD, fp, 1.3) * fwd * inside * uSweepOn;
        green += exp(-armD / (fp * 4.0)) * fwd * inside * uSweepOn * 0.3;

        // ── Contacts and their pings.
        for (int i = 0; i < 4; i++) {
          vec4 b = uBlip[i];
          float d = length(vP - b.xy);
          float core = clamp((0.014 - d) / fp + 0.5, 0.0, 1.0);
          green += (core + exp(-d / 0.022) * 0.3) * b.z;
          hot += core * b.z * b.z * 0.6;
          bone += hair(d - 0.036, fp, 1.0) * b.w * 0.9;
          vec4 pg = uPing[i];
          float f1 = pow(clamp(1.0 - pg.x / 2.2, 0.0, 1.0), 2.0) * pg.z;
          green += hair(d - (0.016 + pg.x * 0.2), fp, 1.3) * f1;
          float a2 = pg.x - 0.32;
          float f2 = pow(clamp(1.0 - a2 / 2.2, 0.0, 1.0), 2.0) * step(0.0, a2) * pg.z * 0.55;
          green += hair(d - (0.016 + a2 * 0.2), fp, 1.0) * f2;
        }

        // ── Sound-wave line field around the rim: concentric contours that
        // swell where the arm is and burst when a contact is pinged.
        float dSw = abs(wrapPI(a - uSweep));
        float env = (0.14 + 0.86 * exp(-dSw * dSw / 0.2)) * uSweepOn;
        for (int i = 0; i < 4; i++) {
          float db = abs(wrapPI(a - uPing[i].y));
          env += uPing[i].z * exp(-db * db / 0.07) * exp(-uPing[i].x * 1.1) * 1.8;
        }
        env *= uWave;
        float field = 0.0;
        float t = uTime * uHum;
        for (int j = 0; j < 9; j++) {
          float fj = float(j);
          float rk = 1.075 + fj * 0.043;
          float w = sin(a * 64.0 + t * 1.9 + fj * 0.8) * 0.62 + sin(a * 23.0 - t * 1.15 + fj * 1.9) * 0.38;
          float amp = 0.03 * env * (0.55 + 0.45 * sin(fj * 1.3 + t * 0.45));
          float dd = r - rk - amp * w;
          field += hair(dd, max(fwidth(dd), 1e-5), 1.0) * (1.0 - fj / 9.5);
        }
        float bandMask = smoothstep(1.03, 1.06, r) * (1.0 - smoothstep(1.36, 1.46, r));
        bone += field * bandMask * 0.3 * uReveal;

        // Compose: hot core over phosphor over bone (premultiplied).
        bone = clamp(bone, 0.0, 1.0);
        green = clamp(green, 0.0, 1.0);
        hot = clamp(hot, 0.0, 1.0);
        vec3 hotCol = mix(uGreen, vec3(0.93, 1.0, 0.92), 0.6);
        // Dark glass inside the bezel holds the background plate back.
        float glass = uFill * (1.0 - smoothstep(1.0 - fw, 1.0 + fw, r));
        vec3 col = uGround * glass;
        float alpha = glass;
        col = uBone * bone + col * (1.0 - bone);
        alpha = bone + alpha * (1.0 - bone);
        col = uGreen * green + col * (1.0 - green);
        alpha = green + alpha * (1.0 - green);
        col = hotCol * hot + col * (1.0 - hot);
        alpha = hot + alpha * (1.0 - hot);
        gl_FragColor = vec4(col, alpha) * uAlpha;
        if (gl_FragColor.a < 0.002) discard;
      }
    `,
  })
}
