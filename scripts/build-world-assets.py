"""Run inside Blender. An isolated scene; never clears the user's scene."""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(r"C:\Users\zaydo\OneDrive\Documents\Zay Domo Artist Webpage\site")
OUT = ROOT / "public/world"
SOURCE = ROOT / "source-assets/world"
SCENE_NAME = "AA | Between Frames"
if SCENE_NAME in bpy.data.scenes:
    raise RuntimeError("Asset scene already exists. Inspect it; do not duplicate.")

original_scene = bpy.context.window.scene
scene = bpy.data.scenes.new(SCENE_NAME)
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0
scene.render.engine = "CYCLES"
scene.cycles.samples = 16
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.view_settings.view_transform = "Standard"
scene.render.resolution_percentage = 100
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.fps = 12
scene.frame_start = 1
scene.frame_end = 16
world = bpy.data.worlds.new("AA | neutral studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (.45, .45, .45, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = .5
scene.world = world

def collection(name):
    c = bpy.data.collections.new(name)
    scene.collection.children.link(c)
    return c

mark_collection = collection("AA_WORLD | folded aperture")
bird_collection = collection("AA_WORLD | swift")
studio = collection("AA_WORLD | studio")

def material(name, color, metal=0, rough=.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes.get("Principled BSDF")
    n.inputs["Base Color"].default_value = (*color, 1)
    n.inputs["Metallic"].default_value = metal
    n.inputs["Roughness"].default_value = rough
    return m

pewter = material("AA | brushed pewter", (.34, .39, .33), .82, .27)
ivory = material("AA | silver wing", (.79, .82, .75), .1, .56)
bone = material("AA | wing underside", (.45, .49, .43), .12, .7)

contours = json.loads((SOURCE / "emblem-contours.json").read_text())
for i, poly in enumerate(contours["contours"]):
    curve = bpy.data.curves.new(f"AA | aperture ribbon {i+1}", "CURVE")
    curve.dimensions = "2D"
    curve.resolution_u = 2
    curve.fill_mode = "BOTH"
    curve.extrude = .075
    curve.bevel_depth = .014
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(poly)-2)
    for point, (x, y) in zip(spline.points, poly[:-1]):
        point.co = ((x-288)/180, (288-y)/180, 0, 1)
    spline.use_cyclic_u = True
    obj = bpy.data.objects.new(curve.name, curve)
    mark_collection.objects.link(obj)
    curve.materials.append(pewter)

def uv_ellipsoid(name, location, scale, mat):
    # Direct mesh construction keeps all operators out of the existing scene.
    vertices, faces = [], []
    rings, segments = 12, 24
    for j in range(rings + 1):
        phi = math.pi * j / rings
        for i in range(segments):
            theta = math.tau * i / segments
            vertices.append((
                math.sin(phi)*math.cos(theta)*scale[0]+location[0],
                math.sin(phi)*math.sin(theta)*scale[1]+location[1],
                math.cos(phi)*scale[2]+location[2],
            ))
    for j in range(rings):
        for i in range(segments):
            a, b = j*segments+i, j*segments+(i+1)%segments
            faces.append((a, b, b+segments, a+segments))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(mat)
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bird_collection.objects.link(obj)
    return obj

uv_ellipsoid("AA | swift breast", (0, 0, 0), (.12, .41, .12), ivory)
uv_ellipsoid("AA | swift head", (0, -.34, .035), (.105, .14, .1), ivory)

def mesh_object(name, verts, faces, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bird_collection.objects.link(obj)
    return obj

mesh_object("AA | swift beak",
            [(-.05,-.42,.015),(.05,-.42,.015),(0,-.61,.01),(0,-.44,.08)],
            [(0,1,2),(0,2,3),(1,3,2),(0,3,1)], bone)
mesh_object("AA | forked tail",
            [(-.065,.25,0),(.065,.25,0),(.22,.75,-.015),(0,.5,.01),(-.22,.75,-.015)],
            [(0,1,3),(1,2,3),(0,3,4)], ivory)

wing_outline = [
    (.065,-.14,0),(.35,-.25,.07),(.70,-.31,.08),(1.08,-.25,.04),
    (1.58,.06,0),(1.26,.045,.015),(1.37,.17,0),(1.05,.12,.015),
    (1.14,.26,0),(.87,.20,.02),(.93,.32,0),(.65,.27,.025),
    (.68,.37,0),(.35,.31,.035),(.10,.18,0),
]
for sign, side in [(1, "right"), (-1, "left")]:
    verts = [(x*sign,y,z) for x,y,z in wing_outline] + [(.53*sign,.015,.08)]
    faces = [(len(verts)-1,i,(i+1)%(len(verts)-1)) for i in range(len(verts)-1)]
    wing = mesh_object(f"AA | {side} articulated wing", verts, faces, ivory)
    wing.data.materials.append(bone)
    for i,p in enumerate(wing.data.polygons):
        p.material_index = 1 if i in (5,7,9,11) else 0
    solid = wing.modifiers.new("Feather thickness", "SOLIDIFY")
    solid.thickness = .007
    wing.rotation_mode = "XYZ"
    for frame in range(1,18):
        t = (frame-1)/16*math.tau
        wing.rotation_euler.y = sign*(.12 + .92*math.sin(t))
        wing.rotation_euler.z = sign*(.025*math.cos(t))
        wing.keyframe_insert(data_path="rotation_euler",frame=frame)
    if wing.animation_data and wing.animation_data.action:
        wing.animation_data.action.name = f"AA | {side} wingbeat"

camera_data = bpy.data.cameras.new("AA | orthographic camera")
camera = bpy.data.objects.new(camera_data.name,camera_data)
studio.objects.link(camera)
scene.camera = camera
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3.75
camera.location = (0,-3.6,7)
camera.rotation_euler = (Vector((0,0,0))-camera.location).to_track_quat("-Z","Y").to_euler()
for name,loc,power,size in [
    ("AA | key",(-3,-4,6),550,5),
    ("AA | rim",(3,1,4),700,3),
    ("AA | bounce",(-1,4,2),300,4),
]:
    data = bpy.data.lights.new(name,"AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name,data)
    studio.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (-obj.location).to_track_quat("-Z","Y").to_euler()

# Export the mark alone. The user's original scene remains unchanged.
try:
    bpy.context.window.scene = scene
    for obj in scene.objects:
        obj.select_set(False)
    for obj in mark_collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(iter(mark_collection.objects))
    bpy.ops.object.convert(target="MESH")
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / "aperture.glb"), export_format="GLB",
        use_selection=True, use_active_scene=True, export_animations=False, export_apply=True,
    )
    for obj in scene.objects:
        obj.select_set(False)
    for obj in bird_collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(iter(bird_collection.objects))
    bpy.ops.export_scene.gltf(
        filepath=str(OUT / "swift.glb"), export_format="GLB",
        use_selection=True, use_active_scene=True, export_animations=True, export_apply=False,
    )
    # A self-contained editable asset library, not a Save As of the user's project.
    bpy.data.libraries.write(str(SOURCE / "between-frames.blend"), {scene}, fake_user=True)
finally:
    bpy.context.window.scene = original_scene

report = {
    "scene":scene.name, "original_scene_preserved":original_scene.name,
    "units":"meters", "collections":[c.name for c in scene.collection.children],
    "objects":len(scene.objects),
    "mesh_vertices":sum(len(o.data.vertices) for o in scene.objects if o.type=="MESH"),
    "emblem_objects":len(mark_collection.objects),
    "bird_objects":len(bird_collection.objects),
    "animation_frames":16,
    "exports":[str(OUT/"aperture.glb"),str(OUT/"swift.glb"),str(SOURCE/"between-frames.blend")],
}
(SOURCE / "blender-report.json").write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
