"""Non-destructive web derivatives and silhouette contours from approved sources."""
from pathlib import Path
from collections import defaultdict
import json
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
OUT = ROOT / "public" / "world"
SOURCE = ROOT / "source-assets" / "world"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

portrait = WORKSPACE / "assets/generated/portrait-world-master-b12af7dc02/portrait-world-master.png"
emblem = WORKSPACE / "assets/generated/artist-emblem-concept-6360610e81/artist-emblem-concept.png"
clouds = WORKSPACE / "assets/generated/cloud-atmosphere-master-748f36d402/cloud-atmosphere-master.png"


def simplify(points, epsilon):
    """Ramer-Douglas-Peucker, retaining a source-faithful contour."""
    if len(points) < 3:
        return points
    a, b = np.array(points[0], dtype=float), np.array(points[-1], dtype=float)
    p = np.array(points[1:-1], dtype=float)
    ab = b - a
    length = np.linalg.norm(ab)
    distances = np.linalg.norm(p - a, axis=1) if length == 0 else np.abs(
        ab[0] * (a[1] - p[:, 1]) - (a[0] - p[:, 0]) * ab[1]
    ) / length
    index = int(np.argmax(distances)) + 1
    if distances[index - 1] <= epsilon:
        return [points[0], points[-1]]
    return simplify(points[:index + 1], epsilon)[:-1] + simplify(points[index:], epsilon)


with Image.open(portrait) as original:
    assert original.size == (1536, 1024)
    original.convert("RGB").save(OUT / "portrait-world.webp", quality=91, method=6)
    # Mobile derivative reframes the same master; no new face or fabricated pose.
    mobile = original.crop((525, 0, 1470, 1024))
    mobile.save(OUT / "portrait-world-mobile.webp", quality=90, method=6)

with Image.open(clouds).convert("RGBA") as original:
    # Preserve source alpha; WebGL uses this white cloud's luminance as density.
    original.thumbnail((1024, 683), Image.Resampling.LANCZOS)
    original.save(OUT / "clouds.webp", quality=92, method=6)

with Image.open(emblem).convert("RGBA") as original:
    rgba = np.array(original)
    darkness = 1 - np.mean(rgba[:, :, :3], axis=2) / 255
    mask = Image.fromarray(np.uint8(darkness * rgba[:, :, 3]))
    bbox = mask.point(lambda x: 255 if x > 100 else 0).getbbox()
    if bbox is None:
        raise RuntimeError("No emblem silhouette found.")
    crop = mask.crop(bbox)
    crop.thumbnail((512, 512), Image.Resampling.LANCZOS)
    square = Image.new("L", (576, 576))
    square.paste(crop, ((576 - crop.width) // 2, (576 - crop.height) // 2))
    binary = np.asarray(square) > 100
    h, w = binary.shape
    edges = defaultdict(list)
    ys, xs = np.nonzero(binary)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if y == 0 or not binary[y-1, x]:
            edges[(x, y)].append((x+1, y))
        if x == w-1 or not binary[y, x+1]:
            edges[(x+1, y)].append((x+1, y+1))
        if y == h-1 or not binary[y+1, x]:
            edges[(x+1, y+1)].append((x, y+1))
        if x == 0 or not binary[y, x-1]:
            edges[(x, y+1)].append((x, y))
    contours = []
    while edges:
        start = next(iter(edges))
        path = [start]
        current = start
        while current in edges:
            nxt = edges[current].pop()
            if not edges[current]:
                del edges[current]
            path.append(nxt)
            current = nxt
            if current == start:
                break
        if len(path) > 80:
            contours.append(simplify(path, 0.7))
    contours.sort(key=len, reverse=True)
    data = {"width": w, "height": h, "contours": contours}
    (SOURCE / "emblem-contours.json").write_text(json.dumps(data), encoding="utf-8")
    path_data = " ".join(
        "M " + " L ".join(f"{x},{y}" for x, y in contour[:-1]) + " Z"
        for contour in contours
    )
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 576">'
        f'<path fill="currentColor" fill-rule="evenodd" d="{path_data}"/></svg>'
    )
    (OUT / "emblem.svg").write_text(svg, encoding="utf-8")
    # A transparent raster fallback for WebGL and browsers without SVG masking.
    mark = Image.new("RGBA", square.size, (32, 36, 31, 0))
    mark.putalpha(square)
    mark.save(OUT / "emblem.png")
    preview = Image.new("RGBA", (576, 576), "#e7e2d8")
    preview.alpha_composite(mark)
    preview.convert("RGB").save(SOURCE / "emblem-proof.jpg", quality=94)

manifest = {
    "model": "gpt-image-2.5-sunburst",
    "quality": "max",
    "originals": [str(p.relative_to(WORKSPACE)) for p in (portrait, emblem, clouds)],
    "derivatives": "Web delivery derivatives only; original generated pixels retained.",
    "portrait": "Edited editorial artwork. Original casting photographs are unchanged.",
    "emblem": "Exploratory mark, source-faithful vector contour for Blender extrusion.",
    "dimensions": {p.name: list(Image.open(p).size) for p in OUT.glob("*") if p.suffix in (".webp", ".png")},
}
(SOURCE / "asset-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(json.dumps(manifest, indent=2))
