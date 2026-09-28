"""Build / audit / render / export the Domo sigil chrome sculpture. Runs headless in its
own Blender process so nobody's open scene is touched:

  blender.exe --factory-startup -b -P build_sigil.py -- --save <blend>
      [--dump <npz>] [--checks <dir>] [--final <qa dir>] [--export <glb>] [--samples N]
      [--params K=V,...] [--views az@el,...]
  blender.exe --factory-startup -b <blend> -P build_sigil.py -- --load [--final ...]
"""
import argparse
import importlib
import math
import os
import sys
import time

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SKILL = r"C:\Users\zaydo\AppData\Local\Programs\Nyx-CLI\plugins\nyx-core\skills\blender-modeling\scripts"
sys.path.insert(0, SKILL)
import hero_forms_geo as HG  # noqa: E402
import nyx_bpy as nb  # noqa: E402
import sigil_geo as S  # noqa: E402
importlib.reload(S)

TRACK = os.path.dirname(HERE)
PROJECT = os.path.dirname(os.path.dirname(os.path.dirname(TRACK)))
SVG = os.path.join(PROJECT, "assets", "generated", "logo", "final", "domo-sigil.svg")
HDRI = os.path.join(TRACK, "hdri", "monochrome_studio_04_4k.hdr")
BONE = "#E8E4DB"
DARK = "#111110"
SCENE = "Domo_Sigil"
COL = "Domo_Sigil"
STAGE = "Domo_Sigil_Stage"
OBJ = "domo_sigil"
HERO_AZ, HERO_EL = 24.0, 7.0

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--save", default="")
ap.add_argument("--load", action="store_true")
ap.add_argument("--dump", default="")
ap.add_argument("--checks", default="")
ap.add_argument("--views", default="0@0,24@7,70@10,-35@-20")
ap.add_argument("--final", default="")
ap.add_argument("--export", default="")
ap.add_argument("--samples", type=int, default=64)
ap.add_argument("--hdri-rot", type=float, default=200.0)
ap.add_argument("--params", default="")
args = ap.parse_args(argv)


def log(*a):
    print(*a, flush=True)


PRM = dict(S.PARAMS)
for item in filter(None, args.params.split(",")):
    k, v = item.split("=")
    PRM[k] = type(PRM[k])(float(v)) if isinstance(PRM[k], float) else int(float(v))


# ---------------------------------------------------------------------------
# geometry
# ---------------------------------------------------------------------------

def build_geometry():
    t0 = time.time()
    outlines = []
    for k, segs in enumerate(S.load_svg(SVG)):
        P = S.flatten(segs, PRM["FINE"])
        P[:, 1] *= -1.0                       # SVG y-down -> y-up
        if S.signed_area(P) < 0:
            P = P[::-1].copy()
        P = S.clean_corners(P, PRM, log=log, name=f"piece{k}")
        o = S.Outline(P, PRM)
        outlines.append(o)
        log(f"[piece{k}] outline len={o.L:.0f} dense={o.n} R {o.R.min():.2f}..{o.R.max():.2f} "
            f"({time.time() - t0:.1f}s)")
    field = S.Field(outlines, PRM, log=log)
    log(f"[field] ready ({time.time() - t0:.1f}s)")
    Vs, Ns, Ts, dump = [], [], [], {}
    base = 0
    for k, o in enumerate(outlines):
        V2, isb, tris, loop, Bn = S.piece_mesh(o, field, PRM, log=log, name=f"piece{k}", k=k)
        Z, N, u, H = S.lift(o, field, V2, isb, PRM, k)
        V2, Z, N, tris, isb, (u,), ncol = S.collapse_short(V2, Z, N, tris, isb, PRM["MIN3D"], (u,))
        log(f"[piece{k}] collapsed {ncol} edges shorter than {PRM['MIN3D']} units")
        N, nfix, dmin = S.fix_normals(V2, Z, tris, N, isb)
        log(f"[piece{k}] normals: {nfix} verts eased toward the facets, min(n.face)={dmin:.3f}")
        V, NN, T = S.solid(V2, isb, tris, Z, N)
        dump[f"V2_{k}"], dump[f"T_{k}"], dump[f"Z_{k}"], dump[f"u_{k}"] = V2, tris, Z, u
        dump[f"N_{k}"], dump[f"isb_{k}"] = N, isb
        Vs.append(V)
        Ns.append(NN)
        Ts.append(T + base)
        base += len(V)
        log(f"[piece{k}] verts={len(V)} tris={len(T)} zmax={Z.max():.1f} ({time.time() - t0:.1f}s)")
    V = np.vstack(Vs)
    N = np.vstack(Ns)
    T = np.vstack(Ts)
    if args.dump:
        np.savez_compressed(args.dump, **dump)
    V, N = S.to_blender(V, N)
    V, N, c, r = HG.normalize_pose(V, N, None, radius=1.0)
    log(f"[sigil] svg units per metre = {r:.2f}; tris={len(T)} verts={len(V)} ({time.time() - t0:.1f}s)")
    return V, N, T, r


def planar_uv(ob):
    me = ob.data
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    lv = np.empty(len(me.loops), int)
    me.loops.foreach_get("vertex_index", lv)
    lo = co.min(0)
    span = (co.max(0) - lo).max()
    uv = np.column_stack([(co[lv, 0] - lo[0]) / span, (co[lv, 2] - lo[2]) / span])
    layer = me.uv_layers.new(name="UVMap")
    layer.data.foreach_set("uv", uv.ravel())


def chrome_material():
    m = nb.material("M_Sigil_Chrome", "#E4E3DF", roughness=0.07, metallic=1.0)
    return m


def world(rot_deg):
    w = bpy.data.worlds.get("Sigil_World") or bpy.data.worlds.new("Sigil_World")
    bpy.context.scene.world = w
    nt = w.node_tree
    if nt is None:
        w.use_nodes = True
        nt = w.node_tree
    nt.nodes.clear()
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, 0, math.radians(rot_deg))
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(HDRI, check_existing=True)
    hs = nt.nodes.new("ShaderNodeHueSaturation")
    hs.inputs["Saturation"].default_value = 0.0
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Strength"].default_value = 1.0
    out = nt.nodes.new("ShaderNodeOutputWorld")
    L = nt.links
    L.new(tc.outputs["Generated"], mp.inputs["Vector"])
    L.new(mp.outputs["Vector"], env.inputs["Vector"])
    L.new(env.outputs["Color"], hs.inputs["Color"])
    L.new(hs.outputs["Color"], bg.inputs["Color"])
    L.new(bg.outputs["Background"], out.inputs["Surface"])
    for i, n in enumerate((tc, mp, env, hs, bg, out)):
        n.location = (i * 220 - 600, 0)
    return w


def fresh_file():
    sc = bpy.context.scene
    sc.name = SCENE
    # brand-new factory-startup file in a background process: drop the startup
    # cube/light/camera so only the sigil lives here
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)
    sc.unit_settings.system = "METRIC"
    bpy.context.view_layer.update()


def audit(ob):
    import bmesh
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    nm_e = sum(1 for e in bm.edges if not e.is_manifold)
    nm_v = sum(1 for v in bm.verts if not v.is_manifold)
    bnd = sum(1 for e in bm.edges if e.is_boundary)
    degenerate = sum(1 for f in bm.faces if f.calc_area() < 1e-12)
    bm.free()
    islands = HG._mesh_diag(me).split()[-1]
    co = np.empty(len(me.vertices) * 3)
    me.vertices.foreach_get("co", co)
    co = co.reshape(-1, 3)
    cn = np.empty(len(me.loops) * 3)
    me.corner_normals.foreach_get("vector", cn)
    cn = cn.reshape(-1, 3)
    fn = np.empty(len(me.polygons) * 3)
    me.polygons.foreach_get("normal", fn)
    fn = fn.reshape(-1, 3)
    ls = np.empty(len(me.polygons), int)
    me.polygons.foreach_get("loop_start", ls)
    dots = (cn.reshape(-1, 3, 3) * fn[:, None, :]).sum(2).min(1)
    me.calc_loop_triangles()
    lt = np.empty(len(me.loop_triangles) * 3, int)
    me.loop_triangles.foreach_get("vertices", lt)
    Tt = co[lt.reshape(-1, 3)]
    vol = np.einsum("ij,ij->i", Tt[:, 0], np.cross(Tt[:, 1], Tt[:, 2])).sum() / 6
    log(f"[audit] {ob.name} verts={len(me.vertices)} tris={len(me.polygons)} nonmanifold_e={nm_e} "
        f"nonmanifold_v={nm_v} boundary_e={bnd} degenerate={degenerate} {islands} "
        f"custom_normals={me.has_custom_normals} vol={vol:+.4f} min(n.face)={dots.min():.3f} "
        f"faces<0={int((dots < 0).sum())} faces<0.3={int((dots < 0.3).sum())} "
        f"maxR={np.linalg.norm(co, axis=1).max():.4f} dims={tuple(round(x, 4) for x in ob.dimensions)} "
        f"bbox_c={tuple(round(x, 4) for x in (co.min(0) + co.max(0)) / 2)}")


# ---------------------------------------------------------------------------
# rendering
# ---------------------------------------------------------------------------

def composite(src_px, dst, hex_):
    h, w = src_px.shape[:2]
    bg = np.array([int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
    a = src_px[..., 3:4]
    rgb = src_px[..., :3] * a + bg * (1 - a)
    out = bpy.data.images.new("comp_" + os.path.basename(dst), w, h, alpha=False)
    op = np.ones((h, w, 4), np.float32)
    op[..., :3] = rgb
    out.pixels.foreach_set(op.ravel())
    out.filepath_raw = dst
    out.file_format = "PNG"
    out.save()
    bpy.data.images.remove(out)
    return dst


def render_rgba(path_noext, samples, res, az, el, margin=1.08, zoom=None):
    """zoom: (x, z, half_height) in Blender units -> close-up on that spot of the sigil."""
    from mathutils import Vector
    s = bpy.context.scene
    cam = bpy.data.objects["Sigil_Cam"]
    s.camera = cam
    nb.set_render("CYCLES", samples=samples, res=res, transparent=True,
                  view="AgX", look="AgX - Medium High Contrast")
    s.cycles.use_adaptive_sampling = True
    s.render.film_transparent = True
    if zoom:
        x, z, hh = zoom
        a, e = math.radians(az), math.radians(el)
        d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
        c = Vector((x, 0.0, z))
        vf = 2 * math.atan(18.0 / cam.data.lens) if res[1] >= res[0] else \
            2 * math.atan(math.tan(math.atan(18.0 / cam.data.lens)) * res[1] / res[0])
        cam.data.sensor_fit = "AUTO"
        dist = hh / math.tan(vf / 2)
        cam.location = c + d * dist
        nb.look_at(cam, c)
    else:
        nb.frame_camera(cam, [bpy.data.objects[OBJ]], margin=margin, elevation_deg=el, azimuth_deg=az)
    raw = path_noext + "_rgba.png"
    nb.render_still(raw)
    img = bpy.data.images.load(raw, check_existing=False)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    os.remove(raw)
    return px.reshape(h, w, 4)


def stage():
    col = nb.work_collection(STAGE)
    cam = bpy.data.objects.get("Sigil_Cam") or nb.add_camera("Sigil_Cam", lens=85, col=col)
    cam.data.lens = 85
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main():
    t0 = time.time()
    if not args.load:
        fresh_file()
        V, N, T, r = build_geometry()
        col = nb.work_collection(COL)
        ob = HG.build_object(OBJ, V, N, T, col, uv=False)
        planar_uv(ob)
        ob["svg_units_per_metre"] = float(r)
        nb.assign(ob, chrome_material())
        world(args.hdri_rot)
        stage()
    ob = bpy.data.objects[OBJ]
    audit(ob)
    if args.save and not args.load:
        s = bpy.context.scene
        # F12 in the saved scene reproduces the hero (composite over bone afterwards)
        nb.set_render("CYCLES", samples=256, res=(1600, 2000), transparent=True,
                      view="AgX", look="AgX - Medium High Contrast")
        s.render.resolution_x, s.render.resolution_y = 1600, 2000
        nb.frame_camera(bpy.data.objects["Sigil_Cam"], [ob], margin=1.08,
                        elevation_deg=HERO_EL, azimuth_deg=HERO_AZ)
        os.makedirs(os.path.dirname(args.save), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=args.save)
        log("saved", args.save)

    if args.checks:
        os.makedirs(args.checks, exist_ok=True)
        if os.environ.get("CLAY"):
            clay = nb.material("M_Sigil_Clay", "#B8B4AC", roughness=0.45, metallic=0.0)
            ob.data.materials[0] = clay
        res = tuple(int(x) for x in os.environ.get("CHECK_RES", "800x1000").split("x"))
        for item in filter(None, args.views.split(",")):
            parts = item.split("@")
            az, el = float(parts[0]), float(parts[1])
            zoom = tuple(float(v) for v in parts[2].split(":")) if len(parts) > 2 else None
            px = render_rgba(os.path.join(args.checks, "tmp"), args.samples, res, az, el, zoom=zoom)
            tag = f"_z{parts[2].replace(':', '_')}" if zoom else ""
            composite(px, os.path.join(args.checks, f"check_{int(az):+04d}_{int(el):+03d}{tag}.png"), BONE)
        log(f"checks done ({time.time() - t0:.1f}s)")

    if args.final:
        os.makedirs(args.final, exist_ok=True)
        px = render_rgba(os.path.join(args.final, "sigil-hero"), args.samples, (1600, 2000),
                         HERO_AZ, HERO_EL)
        composite(px, os.path.join(args.final, "sigil-hero.png"), BONE)
        composite(px, os.path.join(args.final, "sigil-dark.png"), DARK)
        for az in (0, 45, 90):
            px = render_rgba(os.path.join(args.final, "turn"), args.samples, (1200, 1500), float(az), 5.0)
            composite(px, os.path.join(args.final, f"sigil-turn-{az:03d}.png"), BONE)
        # leave the file framed on the hero view
        s = bpy.context.scene
        s.render.resolution_x, s.render.resolution_y = 1600, 2000
        nb.frame_camera(bpy.data.objects["Sigil_Cam"], [ob], margin=1.08,
                        elevation_deg=HERO_EL, azimuth_deg=HERO_AZ)
        if args.load and bpy.data.filepath:
            bpy.ops.wm.save_mainfile()
        log(f"final renders done ({time.time() - t0:.1f}s)")

    if args.export:
        os.makedirs(os.path.dirname(args.export), exist_ok=True)
        prev = nb._select_only([ob])
        try:
            bpy.ops.export_scene.gltf(filepath=args.export, export_format="GLB", use_selection=True,
                                      export_apply=True, export_yup=True, export_normals=True,
                                      export_texcoords=False, export_tangents=False,
                                      export_vertex_color="NONE", export_materials="NONE",
                                      export_animations=False, export_cameras=False,
                                      export_lights=False, export_extras=False)
        finally:
            nb._restore_selection(prev)
        log(f"exported {args.export} {os.path.getsize(args.export)} bytes")
    log(f"total {time.time() - t0:.1f}s")


main()
