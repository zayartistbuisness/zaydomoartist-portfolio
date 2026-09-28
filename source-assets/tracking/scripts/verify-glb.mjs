// Decode each compressed GLB and check it the way three.js will see it:
// world-space bounds/radius, unit normals, and winding vs. normals (no flipped faces).
//   node source-assets/tracking/scripts/verify-glb.mjs [name.glb ...]
import { readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '..', '..', '..', 'public', 'tracking', 'models');
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

const only = process.argv.slice(2);
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.glb') && (!only.length || only.includes(n)))) {
  const doc = await io.read(join(DIR, f));
  const node = doc.getRoot().listNodes().find((n) => n.getMesh());
  const s = node.getScale(), t = node.getTranslation();
  let maxR = 0, badN = 0, flipped = 0, tris = 0, minDot = 1;
  for (const prim of node.getMesh().listPrimitives()) {
    const P = prim.getAttribute('POSITION'), N = prim.getAttribute('NORMAL'), I = prim.getIndices();
    const pos = [], nrm = [];
    const a = [0, 0, 0], b = [0, 0, 0];
    for (let i = 0; i < P.getCount(); i++) {
      P.getElement(i, a); N.getElement(i, b);
      const w = [a[0] * s[0] + t[0], a[1] * s[1] + t[1], a[2] * s[2] + t[2]];
      pos.push(w); nrm.push(b.slice());
      maxR = Math.max(maxR, Math.hypot(...w));
      if (Math.abs(Math.hypot(...b) - 1) > 0.01) badN++;
    }
    for (let k = 0; k < I.getCount(); k += 3) {
      const i0 = I.getScalar(k), i1 = I.getScalar(k + 1), i2 = I.getScalar(k + 2);
      const [p0, p1, p2] = [pos[i0], pos[i1], pos[i2]];
      const u = p1.map((v, j) => v - p0[j]), v = p2.map((v2, j) => v2 - p0[j]);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const L = Math.hypot(...n) || 1;
      for (const ii of [i0, i1, i2]) {
        const d = (n[0] * nrm[ii][0] + n[1] * nrm[ii][1] + n[2] * nrm[ii][2]) / L;
        minDot = Math.min(minDot, d);
        if (d < 0) { flipped++; break; }
      }
      tris++;
    }
  }
  console.log(`${f.padEnd(18)} ${(statSync(join(DIR, f)).size / 1000).toFixed(1)} kB  tris=${tris}  maxR=${maxR.toFixed(4)}  nonUnitNormals=${badN}  flippedTris=${flipped}  min(n.face)=${minDot.toFixed(3)}`);
}
