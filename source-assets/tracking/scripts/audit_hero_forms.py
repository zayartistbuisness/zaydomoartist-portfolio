"""Mesh audit for the Tracking hero forms (run headless on hero-forms.blend).

  blender.exe --factory-startup -b hero-forms.blend -P audit_hero_forms.py
"""
import bmesh
import bpy
import numpy as np

col = bpy.data.collections["Tracking_Hero"]
for ob in sorted(col.objects, key=lambda o: o.name):
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    nm_e = sum(1 for e in bm.edges if not e.is_manifold)
    bnd = sum(1 for e in bm.edges if e.is_boundary)
    nm_v = sum(1 for v in bm.verts if not v.is_manifold)
    ngons = sum(1 for f in bm.faces if len(f.verts) > 4)
    degenerate = sum(1 for f in bm.faces if f.calc_area() < 1e-10)
    bm.free()
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    r = np.linalg.norm(co, axis=1).max()
    bb = (co.min(0) + co.max(0)) / 2
    # corner normals (custom) vs geometric face normals: any face pointing against
    # its own shading normals is a flipped/pinched face
    cn = np.empty(len(me.loops) * 3)
    me.corner_normals.foreach_get("vector", cn) if hasattr(me, "corner_normals") else None
    cn = cn.reshape(-1, 3)
    fn = np.empty(len(me.polygons) * 3)
    me.polygons.foreach_get("normal", fn)
    fn = fn.reshape(-1, 3)
    ls = np.empty(len(me.polygons), int)
    me.polygons.foreach_get("loop_start", ls)
    lt = np.empty(len(me.polygons), int)
    me.polygons.foreach_get("loop_total", lt)
    worst = 1.0
    bad = 0
    for i in range(len(me.polygons)):
        d = (cn[ls[i]:ls[i] + lt[i]] @ fn[i])
        worst = min(worst, d.min())
        bad += int(d.min() < 0.5)
    # signed volume (positive = outward-facing winding)
    tri_vol = 0.0
    me.calc_loop_triangles()
    lt_v = np.empty(len(me.loop_triangles) * 3, int)
    me.loop_triangles.foreach_get("vertices", lt_v)
    T = co[lt_v.reshape(-1, 3)]
    vol = np.einsum("ij,ij->i", T[:, 0], np.cross(T[:, 1], T[:, 2])).sum() / 6
    print(f"{ob.name:14} verts={len(me.vertices):6d} tris={tris:6d} nonmanifold_e={nm_e} "
          f"nonmanifold_v={nm_v} boundary={bnd} ngons={ngons} degenerate={degenerate} "
          f"uv={[u.name for u in me.uv_layers]} custom_normals={me.has_custom_normals} "
          f"maxR={r:.4f} bbox_center=({bb[0]:+.3f},{bb[1]:+.3f},{bb[2]:+.3f}) "
          f"vol={vol:+.3f} min(n.face)={worst:.3f} faces<0.5={bad} "
          f"loc={tuple(round(v, 3) for v in ob.location)} rot={tuple(round(v, 4) for v in ob.rotation_euler)} "
          f"scale={tuple(round(v, 4) for v in ob.scale)}")
