"""Background-only render of our isolated Blender asset library."""
import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-assets/world"
OUT = ROOT / "public/world"
scene = bpy.data.scenes["AA | Between Frames"]
bpy.context.window.scene = scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.image_settings.color_mode = "RGBA"
scene.render.resolution_percentage = 100
mark = bpy.data.collections["AA_WORLD | folded aperture"]
bird = bpy.data.collections["AA_WORLD | swift"]

for obj in bird.objects:
    obj.hide_render = True
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.camera.data.ortho_scale = 3.4
scene.camera.location = (1.1, -.8, 7)
scene.camera.rotation_euler = (-scene.camera.location).to_track_quat("-Z", "Y").to_euler()
scene.render.filepath = str(OUT / "aperture-render.png")
bpy.ops.render.render(write_still=True, scene=scene.name)

scene.cycles.samples = 24
for obj in bird.objects:
    obj.hide_render = False
for obj in mark.objects:
    obj.hide_render = True
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.camera.data.ortho_scale = 3.7
scene.camera.location = (0, -3.6, 7)
scene.camera.rotation_euler = (-scene.camera.location).to_track_quat("-Z", "Y").to_euler()
frames = SOURCE / "swift-frames"
frames.mkdir(exist_ok=True)
for frame in range(1, 17):
    scene.frame_set(frame)
    scene.render.filepath = str(frames / f"swift-{frame:02d}.png")
    bpy.ops.render.render(write_still=True, scene=scene.name)
print("WORLD_RENDER_COMPLETE")
