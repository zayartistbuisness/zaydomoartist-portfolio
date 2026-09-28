"""Read-only, offline QA for the existing Between Frames assets.

Run with Python -B. Uses Pillow, numpy and the standard library; writes no
reports, caches, images or baselines. --self-test uses only in-memory fixtures.
This is a project-specific check, not a full glTF validator or browser test.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import shutil
import struct
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.dont_write_bytecode = True

import numpy as np
from PIL import Image, __version__ as PILLOW_VERSION


SCENE = "AA | Between Frames"
PUBLIC = "public/world"
SOURCE = "source-assets/world"
PIPELINE = (
    "prepare-world-assets.py",
    "build-world-assets.py",
    "refine-world-assets.py",
    "render-world-assets.py",
    "pack-world-frames.py",
)
MASTERS = {
    "portrait": ("portrait-world-master-b12af7dc02", "portrait-world-master.png"),
    "emblem": ("artist-emblem-concept-6360610e81", "artist-emblem-concept.png"),
    "clouds": ("cloud-atmosphere-master-748f36d402", "cloud-atmosphere-master.png"),
}
# Dimensions come from the inspected pipeline, not the requested model sizes.
PUBLIC_IMAGES = {
    "portrait-world.webp": ((1536, 1024), False),
    "portrait-world-mobile.webp": ((945, 1024), False),
    "clouds.webp": ((1024, 683), True),
    "emblem.png": ((576, 576), True),
    "aperture-render.png": ((640, 640), True),
    "aperture-render.webp": ((640, 640), True),
    "swift-atlas.webp": ((1024, 1024), True),
}
WINGS = {"AA | left articulated wing", "AA | right articulated wing"}
# Object/animation-target names are stable; the refined mesh datablocks are not
# identically named. These exact bindings come from refine-world-assets.py and
# the inspected v2 GLB, not a mesh-count-only allowance or auto-approved names.
SWIFT_BINDINGS = {
    "AA | swift breast": "AA | swift breast",
    "AA | swift head": "AA | swift head",
    "AA | swift beak": "AA | swift beak",
    "AA | forked tail": "AA | subtle forked tail v2",
    "AA | left articulated wing": "AA | left swept feathers v2",
    "AA | right articulated wing": "AA | right swept feathers v2",
}
APERTURE_BINDINGS = {f"AA | aperture ribbon {i}": f"AA | aperture ribbon {i}"
                     for i in range(1, 5)}
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


class VerificationError(ValueError):
    pass


def require(condition, message):
    if not condition:
        raise VerificationError(message)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def file_hash(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def decode_recorded_text(data):
    """PowerShell redirects may produce a UTF-16 log, not UTF-8."""
    if data.startswith((b"\xff\xfe\x00\x00", b"\x00\x00\xfe\xff")):
        return data.decode("utf-32")
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        return data.decode("utf-16")
    return data.decode("utf-8-sig")


def integer(value, label, minimum=0):
    require(type(value) is int and value >= minimum, f"invalid {label}: {value!r}")
    return value


def visible_rgba(pixels):
    """Ignore RGB under alpha=0, which lossless WebP is allowed to discard."""
    result = pixels.copy()
    result[result[:, :, 3] == 0, :3] = 0
    return result


def image_pixels(path, size=None, transparent=None):
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        image.load()
        mode, fmt = image.mode, image.format
        if size is not None:
            require(image.size == tuple(size),
                    f"dimensions {image.size}, expected {tuple(size)}")
        pixels = np.array(image.convert("RGBA"))
        has_alpha = "A" in image.getbands() or "transparency" in image.info
    alpha = pixels[:, :, 3]
    require(bool(np.any(alpha > 0)), "image is completely transparent")
    if transparent is True:
        require(has_alpha and bool(np.any(alpha < 255)),
                "expected real transparency, not an opaque replacement")
    elif transparent is False:
        require(bool(np.all(alpha == 255)), "expected an opaque photograph/proof")
    return pixels, mode, fmt


def atlas_motion(frames):
    require(len(frames) == 16, f"expected 16 tiles, found {len(frames)}")
    hashes = [sha256(visible_rgba(frame).tobytes()) for frame in frames]
    masks = [frame[:, :, 3] >= 128 for frame in frames]
    silhouettes = [sha256(mask.tobytes()) for mask in masks]
    changes = [int(np.count_nonzero(masks[i] != masks[(i + 1) % 16]))
               for i in range(16)]
    require(len(set(hashes)) == 16, "atlas contains repeated visible RGBA frames")
    require(len(set(silhouettes)) == 16,
            "atlas has repeated silhouettes (RGB noise alone is not animation)")
    require(min(changes) >= 64,
            f"too little silhouette motion: {changes}; minimum is 64 pixels/step")
    return hashes, changes


def parse_glb(data):
    require(len(data) >= 20, "truncated GLB header")
    magic, version, length = struct.unpack_from("<4sII", data)
    require(magic == b"glTF" and version == 2, "expected a GLB 2 header")
    require(length == len(data), f"declared GLB length {length} != {len(data)}")
    chunks, offset = [], 12
    while offset < length:
        require(offset + 8 <= length, "truncated GLB chunk header")
        size, kind = struct.unpack_from("<II", data, offset)
        offset += 8
        require(size > 0 and size % 4 == 0, "invalid GLB chunk length/alignment")
        require(offset + size <= length, "GLB chunk exceeds file")
        chunks.append((kind, data[offset:offset + size]))
        offset += size
    require([kind for kind, _ in chunks] == [JSON_CHUNK, BIN_CHUNK],
            "these exports must contain one JSON chunk followed by one BIN chunk")
    document = json.loads(chunks[0][1].decode("utf-8"))
    require(document.get("asset", {}).get("version") == "2.0", "not glTF 2.0")
    buffers = document.get("buffers", [])
    require(len(buffers) == 1 and "uri" not in buffers[0],
            "expected one embedded buffer, no external resource")
    binary = chunks[1][1]
    size = integer(buffers[0].get("byteLength"), "buffer byteLength", 1)
    require(size <= len(binary) <= size + 3, "BIN size disagrees with JSON")
    for view in document.get("bufferViews", []):
        require(view.get("buffer") == 0, "bufferView references a missing buffer")
        start = integer(view.get("byteOffset", 0), "bufferView offset")
        count = integer(view.get("byteLength"), "bufferView length", 1)
        require(start + count <= size, "bufferView exceeds embedded buffer")
    return document, binary


def accessor_array(document, binary, index):
    accessors = document.get("accessors", [])
    integer(index, "accessor index")
    require(index < len(accessors), "missing accessor")
    accessor = accessors[index]
    require("sparse" not in accessor, "sparse accessors are not used by this recipe")
    types = {5120: "i1", 5121: "u1", 5122: "<i2", 5123: "<u2",
             5125: "<u4", 5126: "<f4"}
    widths = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
    require(accessor.get("componentType") in types and accessor.get("type") in widths,
            "unsupported accessor layout for these exports")
    dtype = np.dtype(types[accessor["componentType"]])
    width = widths[accessor["type"]]
    count = integer(accessor.get("count"), "accessor count", 1)
    view_index = integer(accessor.get("bufferView"), "accessor bufferView")
    views = document.get("bufferViews", [])
    require(view_index < len(views), "missing bufferView")
    view = views[view_index]
    offset = integer(accessor.get("byteOffset", 0), "accessor offset")
    stride = integer(view.get("byteStride", width * dtype.itemsize), "stride", 1)
    require(stride >= width * dtype.itemsize and stride % dtype.itemsize == 0,
            "invalid accessor stride")
    end = offset + (count - 1) * stride + width * dtype.itemsize
    require(end <= view["byteLength"], "accessor exceeds bufferView")
    absolute = view.get("byteOffset", 0) + offset
    require(absolute % dtype.itemsize == 0, "misaligned accessor")
    require(absolute + (count - 1) * stride + width * dtype.itemsize <= len(binary),
            "accessor exceeds binary data")
    result = np.ndarray((count, width), dtype=dtype, buffer=binary,
                        offset=absolute, strides=(stride, dtype.itemsize)).copy()
    require(bool(np.all(np.isfinite(result))), "non-finite accessor data")
    return result


def no_studio_leaks(document):
    require(not document.get("cameras"), "camera definitions leaked into GLB")
    require("KHR_lights_punctual" not in document.get("extensions", {}),
            "light definitions leaked into GLB")
    for node in document.get("nodes", []):
        name = node.get("name", "")
        require(not re.search(r"(?i)(?<![a-z])(cube|camera|light)(?![a-z])", name),
                f"default/studio node leaked: {name}")
        require("camera" not in node, f"camera node leaked: {name}")
        require("KHR_lights_punctual" not in node.get("extensions", {}),
                f"light node leaked: {name}")


def validate_wing_samples(times, rotations):
    require(times.ndim == 2 and times.shape == (17, 1),
            "wing action must have 17 boundary-inclusive time samples")
    require(rotations.shape == (17, 4), "wing action must contain 17 quaternions")
    require(bool(np.all(np.diff(times[:, 0]) > 0)), "animation times not increasing")
    require(np.isclose(times[-1, 0] - times[0, 0], 16 / 12, atol=1e-5),
            "wing action duration is not the 16-frame/12-fps cycle")
    require(bool(np.allclose(np.linalg.norm(rotations, axis=1), 1, atol=1e-4)),
            "non-unit rotation quaternion")
    # q and -q describe the same orientation: a sign flip is not motion.
    dots = np.abs(rotations @ rotations[0])
    require(float(dots.min()) < 0.999, "rotation samples are effectively static")
    require(np.isclose(abs(float(rotations[0] @ rotations[-1])), 1, atol=1e-4),
            "wing boundary samples do not close the loop")


def validate_mesh_identities(document, expected_bindings):
    no_studio_leaks(document)
    nodes, meshes = document.get("nodes", []), document.get("meshes", [])
    require(len(meshes) == len(expected_bindings), "unexpected mesh count")
    require({m.get("name") for m in meshes} == set(expected_bindings.values()),
            f"unexpected meshes: {[m.get('name') for m in meshes]}")
    require(len(nodes) == len(expected_bindings), "unexpected node count")
    require({n.get("name") for n in nodes} == set(expected_bindings),
            f"unexpected nodes: {[n.get('name') for n in nodes]}")
    for node in nodes:
        index = integer(node.get("mesh"), "node mesh index")
        require(index < len(meshes), f"missing mesh on {node.get('name')}")
        require(meshes[index].get("name") == expected_bindings[node["name"]],
                f"wrong mesh binding for {node['name']}: {meshes[index].get('name')}")
    require({n.get("mesh") for n in nodes} == set(range(len(meshes))),
            "missing or duplicate mesh instances")


def validate_glb(document, binary, expected_bindings, animated):
    validate_mesh_identities(document, expected_bindings)
    nodes, meshes = document.get("nodes", []), document.get("meshes", [])
    scenes = document.get("scenes", [])
    require(document.get("scene") == 0 and len(scenes) == 1, "unexpected scene count")
    require(scenes[0].get("name") == SCENE, "wrong exported scene")
    require(set(scenes[0].get("nodes", [])) == set(range(len(nodes)))
            and all(not n.get("children") for n in nodes),
            "expected all isolated mesh nodes directly in the asset scene")
    for index in range(len(document.get("accessors", []))):
        accessor_array(document, binary, index)
    vertices = triangles = primitives = 0
    for mesh in meshes:
        require(bool(mesh.get("primitives")), "empty mesh")
        for primitive in mesh["primitives"]:
            positions = accessor_array(document, binary, primitive["attributes"]["POSITION"])
            indices = accessor_array(document, binary, primitive["indices"])
            require(positions.shape[1] == 3 and positions.dtype.kind == "f",
                    "invalid vertex positions")
            require(indices.shape[1] == 1 and indices.dtype.kind == "u"
                    and int(indices.max()) < len(positions), "invalid mesh indices")
            require(primitive.get("mode", 4) == 4 and len(indices) % 3 == 0,
                    "expected triangle primitives")
            vertices += len(positions)
            triangles += len(indices) // 3
            primitives += 1
    animations = document.get("animations", [])
    require(len(animations) == (2 if animated else 0), "unexpected animation clip count")
    channels, wing_targets, action_details = 0, set(), []
    for animation in animations:
        require(len(animation.get("channels", [])) == 1
                and len(animation.get("samplers", [])) == 1,
                "expected one rotation channel per wing clip")
        channel = animation["channels"][0]
        target = channel["target"]
        require(target.get("node") in range(len(nodes)), "missing animated node")
        name = nodes[target["node"]]["name"]
        require(name in WINGS and target.get("path") == "rotation",
                "unexpected animation target")
        require(channel.get("sampler") == 0, "unexpected sampler reference")
        sampler = animation["samplers"][0]
        require(sampler.get("interpolation", "LINEAR") == "LINEAR",
                "expected linear baked rotation samples")
        times = accessor_array(document, binary, sampler["input"])
        rotations = accessor_array(document, binary, sampler["output"])
        validate_wing_samples(times, rotations)
        channels += 1
        wing_targets.add(name)
        action_details.append(f'{animation.get("name")}: 1 rotation channel, '
                              f'17 samples, {times[0, 0]:.6f}..{times[-1, 0]:.6f}s')
    require(not animated or wing_targets == WINGS, "both wings must be animated")
    return (f"nodes={len(nodes)} meshes={len(meshes)} primitives={primitives} "
            f"vertices={vertices} triangles={triangles} clips={len(animations)} "
            f"channels={channels}; no Cube/Camera/Light nodes"), action_details


class Audit:
    def __init__(self, root):
        self.root = root
        self.passed = self.failed = self.warnings = 0
        self.snapshot = {}
        self.images = {}

    def label(self, path):
        try:
            return path.relative_to(self.root).as_posix()
        except ValueError:
            return "../" + path.relative_to(self.root.parent).as_posix()

    def run(self, label, action):
        try:
            result = action()
        except Exception as error:
            self.failed += 1
            print(f"[FAIL] {label}: {type(error).__name__}: {error}")
            return None
        self.passed += 1
        print(f"[PASS] {label}")
        return result

    def warn(self, message):
        self.warnings += 1
        print(f"[WARN] {message}")

    def inventory(self, paths):
        for path in sorted(paths, key=self.label):
            try:
                require(path.is_file(), "missing file")
                size = path.stat().st_size
                require(size > 0, "empty file")
                self.snapshot[path] = (size, file_hash(path))
                print(f"[FILE] {self.label(path)} | {size} bytes")
            except (OSError, VerificationError) as error:
                self.failed += 1
                print(f"[FAIL] {self.label(path)}: {error}")
        print(f"[INFO] Inventoried {len(self.snapshot)} nonempty files.")

    def image(self, path, size=None, transparent=None):
        def inspect():
            pixels, mode, fmt = image_pixels(path, size, transparent)
            self.images[path] = pixels
            alpha = pixels[:, :, 3]
            print(f"[IMAGE] {self.label(path)} | {pixels.shape[1]}x{pixels.shape[0]} "
                  f"{mode}/{fmt} | alpha={alpha.min()}..{alpha.max()} "
                  f"zero={np.count_nonzero(alpha == 0)} "
                  f"partial={np.count_nonzero((alpha > 0) & (alpha < 255))}")
            return pixels
        return self.run(f"image {self.label(path)}", inspect)

    def generated(self, kind, folder, filename):
        directory = self.root.parent / "assets/generated" / folder
        path = directory / filename
        manifest = read_json(directory / "generation.json")
        require(manifest.get("model") == "gpt-image-2.5-sunburst"
                and manifest.get("quality") == "max", "unexpected recorded model/quality")
        require(manifest.get("ok") is True and manifest.get("http_status") == 200,
                "manifest does not record success")
        require(manifest.get("route") == ("edit" if kind == "portrait" else "generate"),
                "unexpected generation route")
        require(bool(manifest.get("original_prompt")) and bool(manifest.get("prompt")),
                "missing original/effective prompt")
        require(len(manifest.get("files", [])) == 1, "expected one generated master")
        entry = manifest["files"][0]
        require(str(entry["path"]).replace("\\", "/").split("/")[-1] == filename,
                "manifest filename disagrees with source")
        actual = file_hash(path)
        require(actual == entry.get("sha256"), "master SHA-256 does not match manifest")
        require(path.stat().st_size == entry.get("bytes"), "master byte size mismatch")
        pixels, mode, fmt = image_pixels(
            path, (entry["width"], entry["height"]), kind != "portrait")
        require(mode == entry.get("mode") and fmt == entry.get("format"),
                "master encoding/mode mismatch")
        require(bool(np.any(pixels[:, :, 3] < 255)) == entry.get("has_transparent_pixels"),
                "manifest transparency flag mismatch")
        self.images[path] = pixels
        print(f"[MASTER] {self.label(path)} | {pixels.shape[1]}x{pixels.shape[0]} "
              f"{mode} | sha256={actual}")
        if manifest.get("requested_size") != f'{entry["width"]}x{entry["height"]}':
            self.warn(f"{kind}: requested {manifest.get('requested_size')}, "
                      f'returned {entry["width"]}x{entry["height"]}; do not relabel/upscale.')
        if kind == "portrait":
            project = read_json(self.root / SOURCE / "asset-manifest.json")
            if project.get("portrait_edit_input"):
                print("[INFO] Provider portrait generation.json omits edit-input path/hash; "
                      "project provenance is checked separately in asset-manifest.json.")
            else:
                self.warn("Portrait provider manifest describes Image 1 but records no "
                          "edit-input filename/hash, and no project input record exists.")

    def headshots(self, paths):
        reference = None
        git = shutil.which("git")
        if git:
            try:
                result = subprocess.run(
                    [git, "--no-optional-locks", "-C", str(self.root),
                     "rev-parse", "--verify", "HEAD"], capture_output=True, timeout=10)
                if result.returncode == 0:
                    candidate = result.stdout.decode("ascii").strip()
                    if re.fullmatch(r"[0-9a-f]{40,64}", candidate):
                        reference = candidate
            except (OSError, subprocess.SubprocessError, UnicodeError):
                pass
        if reference:
            print(f"[INFO] Measured local Git reference: {reference} (not assumed original).")
        else:
            self.warn("No readable Git HEAD reference; reporting current headshot hashes only.")
        for path in paths:
            if path not in self.snapshot:
                continue
            digest = self.snapshot[path][1]
            self.image(path, transparent=False)
            print(f"[HEADSHOT] {self.label(path)} | sha256={digest}")
            if reference:
                def compare(path=path, digest=digest):
                    result = subprocess.run(
                        [git, "--no-optional-locks", "-C", str(self.root), "show",
                         f"{reference}:{path.relative_to(self.root).as_posix()}"],
                        capture_output=True, timeout=10)
                    if result.returncode:
                        self.warn(f"No committed blob available for {self.label(path)}.")
                        return
                    require(sha256(result.stdout) == digest,
                            "differs from the measured committed blob; investigate, do not restore automatically")
                self.run(f"headshot vs measured Git reference: {path.name}", compare)
        self.warn("Headshot hashes are observations, not a pre-generation baseline. "
                  "Matching Git HEAD and start/end hashes does not prove photographer-original provenance.")

    def atlas(self):
        metadata = read_json(self.root / PUBLIC / "swift-atlas.json")
        expected = {"frames": 16, "columns": 4, "rows": 4, "frameWidth": 256,
                    "frameHeight": 256, "fps": 12}
        require(all(type(metadata.get(key)) is int and metadata[key] == value
                    for key, value in expected.items()), "incorrect atlas layout/fps metadata")
        source_dir = self.root / SOURCE / "swift-frames"
        files = sorted(source_dir.glob("swift-*.png"))
        require([p.name for p in files] == [f"swift-{i:02d}.png" for i in range(1, 17)],
                "missing, extra or misnumbered source frames")
        pixels = self.images[self.root / PUBLIC / "swift-atlas.webp"]
        frames, hidden_changes, white = [], 0, []
        for index, path in enumerate(files):
            y, x = (index // 4) * 256, (index % 4) * 256
            tile = pixels[y:y + 256, x:x + 256]
            source = self.images[path]
            require(np.array_equal(visible_rgba(tile), visible_rgba(source)),
                    f"atlas tile {index + 1} differs visibly from {path.name}")
            alpha = tile[:, :, 3]
            require(bool(np.any(alpha > 0)), f"empty atlas frame {index + 1}")
            require(not (alpha[0].any() or alpha[-1].any()
                         or alpha[:, 0].any() or alpha[:, -1].any()),
                    f"frame {index + 1} touches its tile edge")
            hidden_changes += int(np.count_nonzero(np.any(tile != source, axis=2)
                                                  & (alpha == 0)))
            opaque = alpha >= 250
            white.append(float(np.count_nonzero(np.all(tile[:, :, :3] >= 250, axis=2)
                                                & opaque) / max(1, opaque.sum())))
            frames.append(tile)
        hashes, changes = atlas_motion(frames)
        print(f"[ATLAS] 16/16 distinct visible frames; 16/16 distinct alpha silhouettes; "
              f"16/16 source matches; min adjacent silhouette change={min(changes)} pixels")
        print(f"[ATLAS] row-major frame visible-SHA256 prefixes: "
              + " ".join(h[:12] for h in hashes))
        print(f"[ATLAS] silhouette changes 1->2 through 16->1: {changes}")
        print(f"[ATLAS] ignored {hidden_changes} source/atlas RGB differences under alpha=0.")
        print(f"[ATLAS] near-white coverage of opaque pixels: "
              f"{min(white):.1%}..{max(white):.1%}.")
        if max(white) >= 0.90:
            self.warn("Swift has nearly flat-white frames; assess silhouette/readability "
                      "and flight orientation at actual display size. File QA is not approval.")

    def metadata(self):
        manifest = read_json(self.root / SOURCE / "asset-manifest.json")
        require(manifest.get("model") == "gpt-image-2.5-sunburst"
                and manifest.get("quality") == "max", "wrong derivative provenance")
        expected = {f"assets/generated/{folder}/{filename}"
                    for folder, filename in MASTERS.values()}
        require({p.replace("\\", "/") for p in manifest["originals"]} == expected,
                "unexpected master paths in asset manifest")
        for filename, dimensions in manifest["dimensions"].items():
            require(filename in PUBLIC_IMAGES, "unexpected manifest image")
            require(list(dimensions) == list(PUBLIC_IMAGES[filename][0]),
                    f"stale manifest dimensions for {filename}")
        missing = set(PUBLIC_IMAGES) - set(manifest["dimensions"])
        if missing:
            self.warn("asset-manifest.json predates render/pack; missing dimension entries: "
                      + ", ".join(sorted(missing)) + ". Verified directly instead.")
        edit_input = manifest.get("portrait_edit_input")
        if edit_input:
            require(edit_input.get("path", "").replace("\\", "/")
                    == "site/public/headshots/headshot-3.jpg",
                    "project edit-input path differs from the confirmed source")
            path = self.root / "public/headshots/headshot-3.jpg"
            digest = file_hash(path)
            require(edit_input.get("sha256") == digest,
                    "project portrait edit-input SHA-256 does not match the retained photo")
            require(bool(edit_input.get("provenance")), "missing project provenance explanation")
            print(f"[PROVENANCE] project record: site/public/headshots/headshot-3.jpg "
                  f"| sha256={digest}; provider generation.json remains separate.")
        render = manifest.get("render", {})
        require(render.get("emblem_samples") == 64 and render.get("bird_samples") == 24
                and render.get("bird_revision") == "swept-wings-v2",
                "project must record emblem=64 samples, bird=24 samples, swept-wings-v2")
        print("[RENDER] Project metadata: emblem=64 samples; bird=24 samples; "
              "swept-wings-v2 (declared provenance, not inferred from image pixels).")
        report = read_json(self.root / SOURCE / "blender-report.json")
        require(report.get("scene") == SCENE and report.get("units") == "meters",
                "unexpected scene/units report")
        require(report.get("bird_objects") == 6 and report.get("emblem_objects") == 4
                and report.get("animation_frames") == 16, "unexpected Blender report counts")
        require(report.get("collections") == [
            "AA_WORLD | folded aperture", "AA_WORLD | swift", "AA_WORLD | studio"],
            "unexpected asset collections")
        blend = self.root / SOURCE / "between-frames.blend"
        data = blend.read_bytes()
        require(data.startswith(b"BLENDER"), "not an uncompressed Blender library signature")
        for marker in [SCENE, *report["collections"]]:
            require(marker.encode("utf-8") in data, f"missing .blend marker {marker}")
        print(f"[BLEND] {len(data)} bytes | sha256={sha256(data)} | "
              "signature + named scene/collection strings present (not reopened).")
        log = decode_recorded_text((self.root / SOURCE / "render.log").read_bytes())
        require("WORLD_RENDER_COMPLETE" in log, "render log has no completion marker")

    def emblem(self):
        data = read_json(self.root / SOURCE / "emblem-contours.json")
        require((data.get("width"), data.get("height")) == (576, 576),
                "wrong contour canvas")
        contours = data.get("contours", [])
        require(len(contours) == 4, "expected four source-derived contour ribbons")
        for contour in contours:
            points = np.array(contour)
            require(points.ndim == 2 and points.shape[1] == 2 and len(points) >= 4,
                    "invalid contour")
            require(np.isfinite(points).all() and points.min() >= 0 and points.max() <= 576,
                    "out-of-bounds contour")
            require(contour[0] == contour[-1], "open contour")
        svg = ET.fromstring((self.root / PUBLIC / "emblem.svg").read_text(encoding="utf-8"))
        require(svg.tag == "{http://www.w3.org/2000/svg}svg"
                and svg.get("viewBox") == "0 0 576 576", "wrong SVG canvas")
        paths = list(svg)
        path_data = " ".join("M " + " L ".join(f"{x},{y}" for x, y in c[:-1]) + " Z"
                             for c in contours)
        require(len(paths) == 1 and paths[0].tag == "{http://www.w3.org/2000/svg}path"
                and paths[0].get("d") == path_data
                and paths[0].get("fill-rule") == "evenodd"
                and paths[0].get("fill") == "currentColor",
                "SVG no longer matches saved contours")
        folder, filename = MASTERS["emblem"]
        original = self.images[self.root.parent / "assets/generated" / folder / filename]
        darkness = 1 - np.mean(original[:, :, :3], axis=2) / 255
        mask = Image.fromarray(np.uint8(darkness * original[:, :, 3]))
        bbox = mask.point(lambda x: 255 if x > 100 else 0).getbbox()
        require(bbox is not None, "empty master emblem")
        cropped = mask.crop(bbox)
        cropped.thumbnail((512, 512), Image.Resampling.LANCZOS)
        square = Image.new("L", (576, 576))
        square.paste(cropped, ((576 - cropped.width) // 2, (576 - cropped.height) // 2))
        fallback = self.images[self.root / PUBLIC / "emblem.png"]
        require(np.array_equal(np.array(square), fallback[:, :, 3]),
                "emblem fallback alpha differs from the source-derived mask")
        require(bool(np.all(fallback[:, :, :3] == (32, 36, 31))),
                "unexpected fallback RGB")

    def derivatives(self):
        folder, filename = MASTERS["portrait"]
        portrait = self.root.parent / "assets/generated" / folder / filename
        folder, filename = MASTERS["clouds"]
        cloud = self.root.parent / "assets/generated" / folder / filename
        recipes = [
            ("portrait-world.webp", portrait, 91),
            ("portrait-world-mobile.webp", portrait, 90),
            ("clouds.webp", cloud, 92),
            ("aperture-render.webp", self.root / PUBLIC / "aperture-render.png", 94),
        ]
        for name, source, quality in recipes:
            with Image.open(source) as original:
                image = original.copy()
                if name == "portrait-world.webp":
                    image = image.convert("RGB")
                elif name == "portrait-world-mobile.webp":
                    image = image.crop((525, 0, 1470, 1024))
                elif name == "clouds.webp":
                    image = image.convert("RGBA")
                    image.thumbnail((1024, 683), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                image.save(buffer, format="WEBP", quality=quality, method=6)
            if buffer.getvalue() == (self.root / PUBLIC / name).read_bytes():
                print(f"[RECIPE] {name}: byte-identical in-memory re-encode")
            else:
                self.warn(f"{name}: recipe re-encode is not byte-identical. Check source/"
                          "recipe drift or Pillow/libwebp version before claiming reproducibility.")
        png = self.images[self.root / PUBLIC / "aperture-render.png"]
        webp = self.images[self.root / PUBLIC / "aperture-render.webp"]
        require(np.array_equal(png[:, :, 3], webp[:, :, 3]), "aperture alpha changed")
        alpha = self.images[self.root / PUBLIC / "clouds.webp"][:, :, 3]
        edges = [alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]]
        maxima = [int(edge.max()) for edge in edges]
        if max(maxima) >= 16:
            self.warn(f"Cloud alpha reaches texture edges (top/bottom/left/right max={maxima}); "
                      "test hard rectangular seams in the actual animated shader.")

    def glb(self, filename, expected, animated):
        data = (self.root / PUBLIC / filename).read_bytes()
        document, binary = parse_glb(data)
        summary, actions = validate_glb(document, binary, expected, animated)
        print(f"[GLB] {filename} | {len(data)} bytes | {summary}")
        for node in document["nodes"]:
            print(f"[GLB] node {node['name']} -> mesh "
                  f"{document['meshes'][node['mesh']]['name']}")
        for action in actions:
            print(f"[GLB] {action}")
        if animated:
            self.warn("swift.glb exports two independent clips. Play both wingbeat actions "
                      "together if using the GLB; atlas playback already includes both wings.")

    def stable(self):
        changed = []
        for path, (size, digest) in self.snapshot.items():
            if not path.is_file() or path.stat().st_size != size or file_hash(path) != digest:
                changed.append(self.label(path))
        require(not changed, "files changed during verification: " + ", ".join(changed))
        headshots = sum(self.root / f"public/headshots/headshot-{i}.jpg" in self.snapshot
                        for i in range(1, 7))
        print(f"[STABILITY] {len(self.snapshot)} inventoried files, including "
              f"{headshots}/6 casting headshots, have identical start/end hashes.")


def verify(root):
    audit = Audit(root)
    print("WORLD ASSET QA - offline/read-only; no Blender, browser or model calls")
    print(f"Root: {root}")
    print(f"Python {sys.version.split()[0]} | Pillow {PILLOW_VERSION} | numpy {np.__version__}")
    headshots = [root / f"public/headshots/headshot-{i}.jpg" for i in range(1, 7)]
    paths = set(headshots)
    for directory in [root / PUBLIC, root / SOURCE, root.parent / "assets/generated"]:
        paths.update(path for path in directory.rglob("*") if path.is_file())
    paths.update(root / "scripts" / name for name in (*PIPELINE, "verify-world-assets.py"))
    paths.update(root / PUBLIC / name for name in (
        *PUBLIC_IMAGES, "aperture.glb", "swift.glb", "swift-atlas.json", "emblem.svg"))
    paths.update(root / SOURCE / name for name in (
        "asset-manifest.json", "blender-report.json", "emblem-contours.json",
        "between-frames.blend", "render.log", "emblem-proof.jpg",
        "swift-contact-sheet.jpg", "PRODUCTION.md"))
    paths.update(root / SOURCE / "swift-frames" / f"swift-{i:02d}.png" for i in range(1, 17))
    for folder, filename in MASTERS.values():
        paths.update(root.parent / "assets/generated" / folder / name
                     for name in (filename, "generation.json"))
    audit.inventory(paths)
    audit.headshots(headshots)
    for kind, (folder, filename) in MASTERS.items():
        audit.run(f"generated master + prompt manifest: {kind}",
                  lambda k=kind, d=folder, f=filename: audit.generated(k, d, f))
    for filename, (size, transparent) in PUBLIC_IMAGES.items():
        audit.image(root / PUBLIC / filename, size, transparent)
    audit.image(root / SOURCE / "emblem-proof.jpg", (576, 576), False)
    audit.image(root / SOURCE / "swift-contact-sheet.jpg", (1024, 1024), False)
    for index in range(1, 17):
        audit.image(root / SOURCE / "swift-frames" / f"swift-{index:02d}.png", (256, 256), True)
    audit.run("atlas metadata, motion, padding and source-frame fidelity", audit.atlas)
    audit.run("source manifests, editable Blender library and render completion", audit.metadata)
    audit.run("emblem SVG/contours and source-derived raster mask", audit.emblem)
    audit.run("in-memory derivative recipes and alpha preservation", audit.derivatives)
    audit.run("isolated aperture GLB", lambda: audit.glb("aperture.glb", APERTURE_BINDINGS, False))
    audit.run("animated swift GLB", lambda: audit.glb("swift.glb", SWIFT_BINDINGS, True))
    for directory, label in [(root / PUBLIC, "public/world"), (root / SOURCE, "source-assets/world"),
                             (root.parent / "assets/generated", "../assets/generated")]:
        total = sum(size for path, (size, _) in audit.snapshot.items()
                    if path.is_relative_to(directory))
        print(f"[BYTES] {label}: {total} bytes ({total / 1024:.1f} KiB)")
    audit.warn("Static file checks are not visual approval, browser QA, performance measurement, "
               "or proof that the .blend opens/evaluates. Main still owns those checks.")
    audit.run("read-only start/end file stability", audit.stable)
    print(f"SUMMARY: {audit.passed} checks passed, {audit.failed} failed, "
          f"{audit.warnings} warnings.")
    print("RESULT: " + ("FAIL" if audit.failed else "PASS (with documented limitations)"))
    return 1 if audit.failed else 0


def self_test():
    """Negative checks without temporary files or changes to production assets."""
    import unittest

    class Tests(unittest.TestCase):
        @staticmethod
        def glb_bytes(document=None):
            if document is None:
                document = {"asset": {"version": "2.0"}, "buffers": [{"byteLength": 4}]}
            encoded = json.dumps(document).encode()
            encoded += b" " * (-len(encoded) % 4)
            chunks = struct.pack("<II", len(encoded), JSON_CHUNK) + encoded
            chunks += struct.pack("<II", 4, BIN_CHUNK) + b"\0" * 4
            return struct.pack("<4sII", b"glTF", 2, len(chunks) + 12) + chunks

        def test_glb_header_and_length(self):
            valid = self.glb_bytes()
            parse_glb(valid)
            for bad in (b"", b"NOPE" + valid[4:], valid[:-1],
                        valid[:4] + struct.pack("<I", 1) + valid[8:]):
                with self.subTest(data=bad[:12]), self.assertRaises(VerificationError):
                    parse_glb(bad)

        def test_truncated_chunk(self):
            data = bytearray(self.glb_bytes())
            struct.pack_into("<I", data, 12, len(data) * 4)
            with self.assertRaises(VerificationError):
                parse_glb(bytes(data))

        def test_buffer_bounds(self):
            document = {"asset": {"version": "2.0"}, "buffers": [{"byteLength": 4}],
                        "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": 8}]}
            with self.assertRaises(VerificationError):
                parse_glb(self.glb_bytes(document))

        def test_studio_leaks(self):
            for name in ("Cube", "Cube.001", "Camera", "Light.002", "AA | orthographic camera"):
                with self.subTest(name=name), self.assertRaises(VerificationError):
                    no_studio_leaks({"nodes": [{"name": name}]})
            for node in ({"camera": 0}, {"extensions": {"KHR_lights_punctual": {"light": 0}}}):
                with self.assertRaises(VerificationError):
                    no_studio_leaks({"nodes": [node]})
            no_studio_leaks({"nodes": [{"name": "AA | swift head"}]})

        @staticmethod
        def swift_identities():
            return {
                "nodes": [{"name": name, "mesh": i}
                          for i, name in enumerate(SWIFT_BINDINGS)],
                "meshes": [{"name": name} for name in SWIFT_BINDINGS.values()],
            }

        def test_exact_refined_mesh_bindings(self):
            validate_mesh_identities(self.swift_identities(), SWIFT_BINDINGS)

        def test_unexpected_mesh_identity_rejected(self):
            for name in ("Cube", "AA | left articulated wing", "AA | left swept feathers v3"):
                document = self.swift_identities()
                index = list(SWIFT_BINDINGS).index("AA | left articulated wing")
                document["meshes"][index]["name"] = name
                with self.subTest(name=name), self.assertRaises(VerificationError):
                    validate_mesh_identities(document, SWIFT_BINDINGS)

        def test_swapped_mesh_bindings_rejected(self):
            document = self.swift_identities()
            document["nodes"][0]["mesh"], document["nodes"][1]["mesh"] = 1, 0
            with self.assertRaises(VerificationError):
                validate_mesh_identities(document, SWIFT_BINDINGS)

        def test_invisible_rgb_does_not_count(self):
            left = np.zeros((4, 4, 4), dtype=np.uint8)
            right = left.copy()
            right[:, :, :3] = 200
            self.assertTrue(np.array_equal(visible_rgba(left), visible_rgba(right)))
            right[0, 0, 3] = 1
            self.assertFalse(np.array_equal(visible_rgba(left), visible_rgba(right)))

        @staticmethod
        def frames():
            frames = []
            for index in range(16):
                frame = np.zeros((256, 256, 4), dtype=np.uint8)
                frame[32:48, 20 + index * 5:36 + index * 5] = 255
                frames.append(frame)
            return frames

        def test_real_atlas_motion(self):
            hashes, changes = atlas_motion(self.frames())
            self.assertEqual(len(set(hashes)), 16)
            self.assertGreaterEqual(min(changes), 64)

        def test_duplicate_atlas_rejected(self):
            frames = self.frames()
            frames[7] = frames[6].copy()
            with self.assertRaises(VerificationError):
                atlas_motion(frames)

        def test_rgb_only_animation_rejected(self):
            frames = [self.frames()[0].copy() for _ in range(16)]
            for index, frame in enumerate(frames):
                frame[32:48, 20:36, 0] = index
            with self.assertRaises(VerificationError):
                atlas_motion(frames)

        def test_accessor_overflow_rejected(self):
            document = {"accessors": [{"bufferView": 0, "componentType": 5126,
                                      "count": 2, "type": "SCALAR"}],
                        "bufferViews": [{"byteLength": 4}]}
            with self.assertRaises(VerificationError):
                accessor_array(document, b"\0" * 4, 0)

        def test_log_encodings(self):
            text = "Blender log\nWORLD_RENDER_COMPLETE\n"
            for encoding in ("utf-8", "utf-8-sig", "utf-16", "utf-32"):
                with self.subTest(encoding=encoding):
                    self.assertEqual(decode_recorded_text(text.encode(encoding)), text)

        def test_quaternion_sign_changes_are_not_animation(self):
            times = (np.arange(1, 18, dtype=np.float32) / 12).reshape(-1, 1)
            rotations = np.tile([0., 0., 0., 1.], (17, 1))
            rotations[1::2] *= -1
            with self.assertRaises(VerificationError):
                validate_wing_samples(times, rotations)

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(Tests)
    return 0 if unittest.TextTestRunner(verbosity=2).run(suite).wasSuccessful() else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1],
                        help="site directory (defaults to this script's parent project)")
    parser.add_argument("--self-test", action="store_true", help="run in-memory regression tests")
    args = parser.parse_args()
    return self_test() if args.self_test else verify(args.root.resolve())


if __name__ == "__main__":
    raise SystemExit(main())
