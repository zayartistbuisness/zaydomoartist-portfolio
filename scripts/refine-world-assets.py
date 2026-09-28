"""Refine only our isolated swift mesh; retain its animation and source scene."""
import bpy
import math
from pathlib import Path

ROOT = Path(r"C:\Users\zaydo\OneDrive\Documents\Zay Domo Artist Webpage\site")
scene = bpy.data.scenes["AA | Between Frames"]
if scene.get("swift_revision") == "swept-wings-v2":
    raise RuntimeError("This refinement is already applied; inspect before changing the asset again.")
bird = bpy.data.collections["AA_WORLD | swift"]
mark = bpy.data.collections["AA_WORLD | folded aperture"]

def cubic(a, b, c, d, steps=7):
    pts = []
    for i in range(steps):
        t = i / steps
        pts.append(tuple((1-t)**3*a[k] + 3*(1-t)**2*t*b[k] +
                         3*(1-t)*t*t*c[k] + t**3*d[k] for k in range(2)))
    return pts

# Swept, continuous scythe wings. Three subtle terminal feather notches, not
# an all-over saw-tooth edge. The small source still reads as an avian form.
outline = (
    cubic((.075,-.19),(.48,-.30),(.90,-.24),(1.40,.44))
    + cubic((1.40,.44),(1.51,.60),(1.53,.66),(1.54,.73),4)
    + [(1.26,.51),(1.28,.58),(1.10,.44),(1.10,.50),(.92,.37)]
    + cubic((.92,.37),(.59,.29),(.30,.21),(.075,.19))
)
for sign, side in [(1,"right"),(-1,"left")]:
    obj = bird.objects[f"AA | {side} articulated wing"]
    vertices = [(x*sign,y,.055*math.sin(x*2)) for x,y in outline]
    vertices += [(.45*sign,.04,.075)]
    n = len(vertices)-1
    faces = [(n,i,(i+1)%n) for i in range(n)]
    mesh = bpy.data.meshes.new(f"AA | {side} swept feathers v2")
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    mesh.materials.append(bpy.data.materials["AA | silver wing"])
    mesh.materials.append(bpy.data.materials["AA | wing underside"])
    for i,p in enumerate(mesh.polygons):
        p.material_index = 1 if 11 <= i <= 16 else 0
    obj.data = mesh

tail = bird.objects["AA | forked tail"]
mesh = bpy.data.meshes.new("AA | subtle forked tail v2")
mesh.from_pydata(
    [(-.085,.24,0),(.085,.24,0),(.13,.61,-.015),(0,.49,.01),(-.13,.61,-.015)],
    [],[(0,1,3),(1,2,3),(0,3,4)])
mesh.materials.append(bpy.data.materials["AA | silver wing"])
tail.data = mesh

for v in bird.objects["AA | swift breast"].data.vertices:
    v.co.x *= 1.12
for v in bird.objects["AA | swift head"].data.vertices:
    v.co.x *= 1.10

# Neither revision changes unrelated objects or the user's active scene.
scene["swift_revision"] = "swept-wings-v2"
with bpy.context.temp_override(scene=scene, view_layer=scene.view_layers[0]):
    for obj in scene.objects:
        obj.select_set(False,view_layer=scene.view_layers[0])
    for obj in bird.objects:
        obj.select_set(True,view_layer=scene.view_layers[0])
    bpy.ops.export_scene.gltf(
        filepath=str(ROOT/"public/world/swift.glb"),export_format="GLB",
        use_selection=True,use_active_scene=True,export_animations=True,export_apply=False)
bpy.data.libraries.write(
    str(ROOT/"source-assets/world/between-frames.blend"),{scene},fake_user=True)
print("Refined swept-wing silhouettes, retained 16-frame animation; saved own asset library.")
