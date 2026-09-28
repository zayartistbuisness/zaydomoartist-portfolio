from pathlib import Path
from PIL import Image, ImageDraw
import json
import hashlib

root = Path(__file__).resolve().parents[1]
frames = sorted((root / "source-assets/world/swift-frames").glob("swift-*.png"))
assert len(frames) == 16, f"Expected 16 frames; found {len(frames)}"
atlas = Image.new("RGBA", (1024, 1024))
proof = Image.new("RGB", (1024, 1024), "#333a32")
for i, path in enumerate(frames):
    image = Image.open(path).convert("RGBA")
    assert image.size == (256, 256)
    atlas.alpha_composite(image, ((i % 4) * 256, (i // 4) * 256))
    proof.paste(image, ((i % 4) * 256, (i // 4) * 256), image)
atlas.save(root / "public/world/swift-atlas.webp", lossless=True, method=6)
proof.save(root / "source-assets/world/swift-contact-sheet.jpg", quality=92)
with Image.open(root / "public/world/aperture-render.png") as image:
    image.save(root / "public/world/aperture-render.webp", quality=94, method=6)
(root / "public/world/swift-atlas.json").write_text(json.dumps({
    "frames":16,"columns":4,"rows":4,"frameWidth":256,"frameHeight":256,
    "fps":12,"source":"Original Blender model and wingbeat animation",
}, indent=2))
manifest_path = root / "source-assets/world/asset-manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
edit_input = root / "public/headshots/headshot-3.jpg"
manifest["portrait_edit_input"] = {
    "path": "site/public/headshots/headshot-3.jpg",
    "sha256": hashlib.sha256(edit_input.read_bytes()).hexdigest(),
    "provenance": "Path supplied to the actual creative.edit_image call; original photo retained.",
}
manifest["dimensions"] = {
    p.name: list(Image.open(p).size)
    for p in sorted((root / "public/world").glob("*"))
    if p.suffix in (".png", ".webp")
}
manifest["render"] = {"emblem_samples": 64, "bird_samples": 24, "bird_revision": "swept-wings-v2"}
manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("Packed 16 Blender frames; original renders retained.")
