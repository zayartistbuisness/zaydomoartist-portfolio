"""Build / render / export the Tracking hero chrome forms. Runs headless in its
own Blender process so nobody's open scene is touched:

  blender.exe --factory-startup -b -P build_hero_forms.py -- --save <blend> [--forms a,b]
      [--checks <dir>] [--final <qa dir>] [--export <glb dir>] [--samples N]
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
import hero_forms_geo as G  # noqa: E402
import nyx_bpy as nb  # noqa: E402
importlib.reload(G)

TRACK = os.path.dirname(HERE)
HDRI = os.path.join(TRACK, "hdri", "monochrome_studio_04_4k.hdr")
BG_HEX = "#E8E4DB"
ORDER = ["film_twist", "lens_element", "molten_glove", "spike_star", "soft_form"]
# three-quarter side used for each close-up (the more readable side of each form)
CLOSEUP_AZ = {"film_twist": 35.0, "lens_element": 35.0, "molten_glove": -35.0,
              "spike_star": 35.0, "soft_form": -35.0}
SPACING = 2.35

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--forms", default="all")
ap.add_argument("--save", default="")
ap.add_argument("--checks", default="")
ap.add_argument("--final", default="")
ap.add_argument("--export", default="")
ap.add_argument("--samples", type=int, default=64)
ap.add_argument("--hdri-rot", type=float, default=200.0)
ap.add_argument("--load", action="store_true", help="use the already-open .blend instead of building")
ap.add_argument("--fast", action="store_true", help="coarse SDF meshes for shape iteration")
ap.add_argument("--film", default="", help="k=v,... overrides for the film strip")
ap.add_argument("--views", default="", help="name@az@el,... extra close-ups into --checks")
args = ap.parse_args(argv)


def log(*a):
    print(*a, flush=True)


# ---------------------------------------------------------------------------
# forms
# ---------------------------------------------------------------------------

FILM = dict(n_cells=54, p=0.085, w=0.42, T=0.032, hA=0.056, hL=0.042, rc=0.012, em=0.05,
            n_c=2, n_phi=4, m_c=4, half_twists=1, twist0=0.0, wob=0.13, rx=62.0, rz=18.0)


def make_film(col):
    kw = dict(FILM)
    for item in filter(None, args.film.split(",")):
        k, v = item.split("=")
        kw[k] = int(float(v)) if isinstance(kw[k], int) else float(v)
    R = G.euler(rx=kw.pop("rx"), rz=kw.pop("rz"))
    V, N, F, L = G.film_twist(**kw)
    V, N, c, r = G.normalize_pose(V, N, R)
    log(f"[film_twist] L={L:.3f} verts={len(V)} faces={len(F)}")
    return G.build_object("film_twist", V, N, F, col)


def make_lens(col):
    V, N, F, m = G.lens_element(segments=128)
    R = G.euler(rz=-25) @ G.euler(rx=70)
    V, N, c, r = G.normalize_pose(V, N, R)
    log(f"[lens_element] profile pts={m} verts={len(V)} faces={len(F)}")
    return G.build_object("lens_element", V, N, F, col)


def make_glove(col):
    f, lo, hi = G.molten_glove_sdf()
    R = G.euler(rz=-30) @ G.euler(ry=-14)
    return G.sdf_form("molten_glove", f, lo, hi, 0.012, 3800, col, R=R, log=log, fast=args.fast)


def make_star(col):
    f, lo, hi = G.spike_star_sdf()
    # voxel remesh + curvature-adaptive collapse decimation (dense where the tips
    # are), then exact SDF projection + SDF normals. QuadriFlow left sliver folds
    # around its singularities on the core.
    return G.sdf_form("spike_star", f, lo, hi, 0.006, 12800, col, R=G.euler(rx=15, rz=10),
                      log=log, fast=args.fast, subdiv=False, remesher="decimate")


def make_soft(col):
    f, lo, hi = G.soft_form_sdf()
    return G.sdf_form("soft_form", f, lo, hi, 0.012, 2600, col, R=G.euler(rz=-12), log=log,
                      fast=args.fast)


MAKERS = {"film_twist": make_film, "lens_element": make_lens, "molten_glove": make_glove,
          "spike_star": make_star, "soft_form": make_soft}


# ---------------------------------------------------------------------------
# stage
# ---------------------------------------------------------------------------

def chrome_material():
    m = nb.material("M_Chrome_Preview", "#E6E6E6", roughness=0.08, metallic=1.0)
    return m


def world(rot_deg):
    w = bpy.data.worlds.get("Tracking_World") or bpy.data.worlds.new("Tracking_World")
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


def composite_bg(src, dst, hex_=BG_HEX):
    """Straight-alpha RGBA PNG over a flat sRGB colour (what a browser does)."""
    img = bpy.data.images.load(src, check_existing=False)
    w, h = img.size
    px = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    bg = np.array([int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
    a = px[..., 3:4]
    rgb = px[..., :3] * a + bg * (1 - a)
    out = bpy.data.images.new("comp_" + os.path.basename(dst), w, h, alpha=False)
    op = np.ones((h, w, 4), np.float32)
    op[..., :3] = rgb
    out.pixels.foreach_set(op.ravel())
    out.filepath_raw = dst
    out.file_format = "PNG"
    out.save()
    bpy.data.images.remove(out)
    bpy.data.images.remove(img)
    return dst


def render_row(path, samples, res, objs):
    """Render each form alone (keeps its self-reflections, drops the neighbours'
    cross-reflections, which read as sparkle artifacts), then composite the row."""
    s = bpy.context.scene
    nb.set_render("CYCLES", samples=samples, res=res, transparent=True,
                  view="AgX", look="AgX - Medium High Contrast")
    prev = {o.name: o.hide_render for o in objs}
    acc = None
    try:
        for ob in objs:
            for o in objs:
                o.hide_render = o is not ob
            raw = path[:-4] + f"_{ob.name}_rgba.png"
            nb.render_still(raw)
            img = bpy.data.images.load(raw, check_existing=False)
            w, h = img.size
            px = np.empty(w * h * 4, np.float32)
            img.pixels.foreach_get(px)
            px = px.reshape(h, w, 4)
            bpy.data.images.remove(img)
            os.remove(raw)
            if acc is None:
                acc = px
            else:   # straight-alpha "over"
                a = px[..., 3:4]
                out_a = a + acc[..., 3:4] * (1 - a)
                acc[..., :3] = (px[..., :3] * a + acc[..., :3] * acc[..., 3:4] * (1 - a)) / np.maximum(out_a, 1e-6)
                acc[..., 3:4] = out_a
    finally:
        for o in objs:
            o.hide_render = prev[o.name]
    bg = np.array([int(BG_HEX[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
    a = acc[..., 3:4]
    rgb = acc[..., :3] * a + bg * (1 - a)
    h, w = rgb.shape[:2]
    out = bpy.data.images.new("comp_row", w, h, alpha=False)
    op = np.ones((h, w, 4), np.float32)
    op[..., :3] = rgb
    out.pixels.foreach_set(op.ravel())
    out.filepath_raw = path
    out.file_format = "PNG"
    out.save()
    bpy.data.images.remove(out)
    return path


def render_to(path, samples, res):
    s = bpy.context.scene
    nb.set_render("CYCLES", samples=samples, res=res, transparent=True,
                  view="AgX", look="AgX - Medium High Contrast")
    s.cycles.use_adaptive_sampling = True
    s.render.film_transparent = True
    raw = path[:-4] + "_rgba.png"
    nb.render_still(raw)
    composite_bg(raw, path)
    os.remove(raw)
    return path


def closeup(ob, path, samples, res=(1200, 1200), az=35.0, el=20.0):
    cam = bpy.data.objects.get("Tracking_Cam") or nb.add_camera("Tracking_Cam", lens=85,
                                                                col=stage_col())
    cam.data.lens = 85
    bpy.context.scene.camera = cam
    others = [o for o in hero_col().objects if o is not ob]
    prev = {o.name: o.hide_render for o in others}
    for o in others:
        o.hide_render = True
    s = bpy.context.scene
    s.render.resolution_x, s.render.resolution_y = res
    nb.frame_camera(cam, [ob], margin=1.12, elevation_deg=el, azimuth_deg=az)
    try:
        render_to(path, samples, res)
    finally:
        for o in others:
            o.hide_render = prev[o.name]
    return path


def hero_col():
    return nb.work_collection("Tracking_Hero")


def stage_col():
    return nb.work_collection("Tracking_Stage")


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def fresh_file():
    sc = bpy.context.scene
    sc.name = "HeroForms"
    # this is a brand-new factory-startup file in a background process: drop the
    # startup cube/light/camera so only our forms live here
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    sc.unit_settings.system = "METRIC"
    bpy.context.view_layer.update()


def main():
    t0 = time.time()
    names = ORDER if args.forms == "all" else [n.strip() for n in args.forms.split(",")]
    if not args.load:
        fresh_file()
        col = hero_col()
        stage_col()
        mat = chrome_material()
        for n in names:
            t = time.time()
            ob = MAKERS[n](col)
            ob.location = (SPACING * (ORDER.index(n) - 2), 0, 0)
            nb.assign(ob, mat)
            log(f"[{n}] built in {time.time() - t:.1f}s tris={nb.tri_count(ob)} "
                f"dims={tuple(round(d, 3) for d in ob.dimensions)} "
                f"maxR={max((v.co.length for v in ob.data.vertices)):.4f}")
        world(args.hdri_rot)
        if args.save:
            os.makedirs(os.path.dirname(args.save), exist_ok=True)
            bpy.ops.wm.save_as_mainfile(filepath=args.save)
            log("saved", args.save)
    else:
        world(args.hdri_rot)
    col = hero_col()
    objs = [o for o in col.objects if o.name in names]

    if args.checks:
        os.makedirs(args.checks, exist_ok=True)
        for ob in (objs if not args.views else []):
            closeup(ob, os.path.join(args.checks, f"{ob.name}_34.png"), args.samples, (720, 720))
            closeup(ob, os.path.join(args.checks, f"{ob.name}_front.png"), args.samples, (720, 720),
                    az=0.0, el=0.0)
            closeup(ob, os.path.join(args.checks, f"{ob.name}_back.png"), args.samples, (720, 720),
                    az=130.0, el=-25.0)
        for item in filter(None, args.views.split(",")):
            n, az, el = item.split("@")
            closeup(bpy.data.objects[n], os.path.join(args.checks, f"{n}_{az}_{el}.png"),
                    args.samples, (720, 720), az=float(az), el=float(el))
        log("checks done")

    if args.final:
        os.makedirs(args.final, exist_ok=True)
        allobjs = [bpy.data.objects[n] for n in ORDER if n in bpy.data.objects]
        cam = bpy.data.objects.get("Tracking_Cam") or nb.add_camera("Tracking_Cam", lens=85,
                                                                    col=stage_col())
        bpy.context.scene.camera = cam
        s = bpy.context.scene
        s.render.resolution_x, s.render.resolution_y = 1920, 800
        nb.frame_camera(cam, allobjs, margin=1.03, elevation_deg=6.0, azimuth_deg=0.0)
        render_row(os.path.join(args.final, "hero-forms-preview.png"), args.samples, (1920, 800),
                   allobjs)
        for ob in objs:
            closeup(ob, os.path.join(args.final, f"{ob.name}.png"), args.samples,
                    az=CLOSEUP_AZ.get(ob.name, 35.0))
        # leave the saved file framed on the presentation row
        s.render.resolution_x, s.render.resolution_y = 1920, 800
        nb.frame_camera(cam, allobjs, margin=1.03, elevation_deg=6.0, azimuth_deg=0.0)
        if args.save:
            bpy.ops.wm.save_as_mainfile(filepath=args.save)
        log("final renders done")

    if args.export:
        os.makedirs(args.export, exist_ok=True)
        for ob in objs:
            loc = ob.location.copy()
            ob.location = (0, 0, 0)
            path = os.path.join(args.export, ob.name + ".glb")
            prev = nb._select_only([ob])
            try:
                bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                                          export_apply=True, export_yup=True, export_normals=True,
                                          export_texcoords=True, export_tangents=False, export_vertex_color="NONE",
                                          export_materials="NONE", export_animations=False,
                                          export_cameras=False, export_lights=False,
                                          export_extras=False)
            finally:
                nb._restore_selection(prev)
                ob.location = loc
            log(f"exported {path} {os.path.getsize(path)} bytes")
    log(f"total {time.time() - t0:.1f}s")


main()
