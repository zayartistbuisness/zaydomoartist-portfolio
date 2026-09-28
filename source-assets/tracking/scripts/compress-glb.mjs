// Meshopt-compress the Tracking hero form GLBs (run from the `site` folder):
//   node source-assets/tracking/scripts/compress-glb.mjs [name.glb ...]
// With no arguments every GLB in glb-raw is processed; otherwise only the named ones.
// Equivalent to `gltf-transform optimize in out --compress meshopt --texture-compress false`
// minus simplify/weld (the meshes are already final and carry exact normals), with
// 12-bit normals so mirror reflections stay smooth.
import { readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, meshopt, getBounds } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const here = dirname(fileURLToPath(import.meta.url));
const RAW = resolve(here, '..', 'glb-raw');
const OUT = resolve(here, '..', '..', '..', 'public', 'tracking', 'models');
mkdirSync(OUT, { recursive: true });

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const only = process.argv.slice(2);
for (const f of readdirSync(RAW).filter((n) => n.endsWith('.glb') && (!only.length || only.includes(n)))) {
  const src = join(RAW, f);
  const dst = join(OUT, f);
  const doc = await io.read(src);
  await doc.transform(
    dedup(),
    prune(),
    meshopt({ encoder: MeshoptEncoder, level: 'medium', quantizePosition: 14, quantizeNormal: 12, quantizeTexcoord: 12 }),
  );
  await io.write(dst, doc);

  // verify by reading the compressed file back
  const back = await io.read(dst);
  let tris = 0, verts = 0;
  const attrs = new Set();
  for (const mesh of back.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) {
      tris += prim.getIndices().getCount() / 3;
      verts += prim.getAttribute('POSITION').getCount();
      prim.listSemantics().forEach((s) => attrs.add(s));
    }
  const b = getBounds(back.getRoot().listScenes()[0]);
  const node = back.getRoot().listNodes()[0];
  console.log(JSON.stringify({
    file: f,
    rawKB: +(statSync(src).size / 1024).toFixed(1),
    optKB: +(statSync(dst).size / 1024).toFixed(1),
    tris, verts, attrs: [...attrs],
    bboxMin: b.min.map((v) => +v.toFixed(4)), bboxMax: b.max.map((v) => +v.toFixed(4)),
    nodeT: node.getTranslation().map((v) => +v.toFixed(5)), nodeS: node.getScale().map((v) => +v.toFixed(5)),
    ext: back.getRoot().listExtensionsUsed().map((e) => e.extensionName),
  }));
}
