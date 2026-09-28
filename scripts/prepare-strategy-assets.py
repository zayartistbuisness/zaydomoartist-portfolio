#!/usr/bin/env python3
"""Prepare byte-preserving strategy assets for the main site.

This script intentionally owns only:
  - site/scripts/prepare-strategy-assets.py
  - site/public/strategy/**
  - site/src/components/strategy/strategyAssetPaths.js

It refuses to run the copy operation if the strategy destination already
exists, so reruns cannot silently overwrite an existing handoff.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import date
from pathlib import Path
from typing import Any


WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
SITE_ROOT = WORKSPACE_ROOT / "site"
SOURCE_ROOT = WORKSPACE_ROOT / "asset-studio"
STRATEGY_ROOT = SITE_ROOT / "public" / "strategy"
MANIFEST_PATH = STRATEGY_ROOT / "manifest.json"
JS_EXPORT_PATH = SITE_ROOT / "src" / "components" / "strategy" / "strategyAssetPaths.js"


JS_EXPORT = """/**
 * Stable public URLs for the strategy asset handoff.
 * Provenance, byte counts, hashes, and credit caveats live in /strategy/manifest.json.
 */
export const strategyAssetPaths = Object.freeze({
  manifest: '/strategy/manifest.json',

  portrait: {
    editorial: '/strategy/portrait/editorial.webp',
  },

  projects: {
    onTheRadar: '/strategy/projects/image4.jpeg',
    streamerUniversity2: '/strategy/projects/image7.jpeg',
    memehouse: '/strategy/projects/image9.jpeg',
  },

  transitions: {
    campusGrid: {
      threshold: '/strategy/transitions/campus-grid/threshold.png',
      poster: '/strategy/transitions/campus-grid/poster-50.png',
    },
    studioDoors: {
      threshold: '/strategy/transitions/studio-doors/threshold.png',
      poster: '/strategy/transitions/studio-doors/poster-50.png',
    },
    soundBands: {
      threshold: '/strategy/transitions/sound-bands/threshold.png',
      poster: '/strategy/transitions/sound-bands/poster-50.png',
    },
  },

  marks: {
    onTheRadar: {
      display: '/strategy/marks/on-the-radar/mark-display.png',
      pixelColor: '/strategy/marks/on-the-radar/mark-pixel-color.png',
      pixelInk: '/strategy/marks/on-the-radar/mark-pixel-ink.png',
      pixelInkSvg: '/strategy/marks/on-the-radar/mark-pixel-ink.svg',
    },
    memehouse: {
      display: '/strategy/marks/memehouse/mark-display.png',
      pixelColor: '/strategy/marks/memehouse/mark-pixel-color.png',
      pixelInk: '/strategy/marks/memehouse/mark-pixel-ink.png',
      pixelInkSvg: '/strategy/marks/memehouse/mark-pixel-ink.svg',
    },
    streamerUniversity2: {
      display: '/strategy/marks/streamer-university-2/mark-display.png',
      pixelColor: '/strategy/marks/streamer-university-2/mark-pixel-color.png',
      pixelInk: '/strategy/marks/streamer-university-2/mark-pixel-ink.png',
      pixelInkSvg: '/strategy/marks/streamer-university-2/mark-pixel-ink.svg',
    },
  },

  motion: {
    apertureAssembly: {
      src: '/strategy/motion/aperture-assembly/loop.mp4',
      mp4: '/strategy/motion/aperture-assembly/loop.mp4',
      webm: '/strategy/motion/aperture-assembly/loop.webm',
      mobileMp4: '/strategy/motion/aperture-assembly/loop-mobile.mp4',
      poster: '/strategy/motion/aperture-assembly/poster.webp',
    },
    avianFlight: {
      src: '/strategy/motion/avian-flight/loop.mp4',
      mp4: '/strategy/motion/avian-flight/loop.mp4',
      webm: '/strategy/motion/avian-flight/loop.webm',
      mobileMp4: '/strategy/motion/avian-flight/loop-mobile.mp4',
      poster: '/strategy/motion/avian-flight/poster.webp',
    },
    foxStride: {
      src: '/strategy/motion/fox-stride/loop.mp4',
      mp4: '/strategy/motion/fox-stride/loop.mp4',
      webm: '/strategy/motion/fox-stride/loop.webm',
      mobileMp4: '/strategy/motion/fox-stride/loop-mobile.mp4',
      poster: '/strategy/motion/fox-stride/poster.webp',
    },
  },

  brand: {
    icons: {
      sprite: '/strategy/brand/icons/sprite.svg',
      standalone: {
        arrowDiagonal: '/strategy/brand/icons/arrow-diagonal.svg',
        close: '/strategy/brand/icons/close.svg',
        contact: '/strategy/brand/icons/contact.svg',
        creativeStrategy: '/strategy/brand/icons/creative-strategy.svg',
        external: '/strategy/brand/icons/external.svg',
        film: '/strategy/brand/icons/film.svg',
        index: '/strategy/brand/icons/index.svg',
        pause: '/strategy/brand/icons/pause.svg',
        play: '/strategy/brand/icons/play.svg',
        project: '/strategy/brand/icons/project.svg',
        scroll: '/strategy/brand/icons/scroll.svg',
        soundOff: '/strategy/brand/icons/sound-off.svg',
      },
    },
    marks: {
      emblemSteppedMaster32: '/strategy/brand/marks/emblem-stepped-master-32.svg',
    },
  },
});
"""


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha256_and_bytes(path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    total = 0
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
            total += len(chunk)
    return digest.hexdigest(), total


def workspace_relative(path: Path) -> str:
    return path.resolve().relative_to(WORKSPACE_ROOT.resolve()).as_posix()


def destination_relative(path: Path) -> str:
    return path.resolve().relative_to(SITE_ROOT.resolve()).as_posix()


def safe_child(root: Path, relative: str) -> Path:
    candidate = (root / Path(relative)).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError as exc:
        raise RuntimeError(f"Path escapes expected root: {relative}") from exc
    return candidate


def base_caveats() -> dict[str, list[str]]:
    return {
        "projects": [
            "Deck media is preserved byte-for-byte from the user-supplied pitch deck extraction.",
            "Third-party project imagery and thumbnails require the applicable source credit and usage clearance before public deployment.",
        ],
        "transitions": [
            "Original one-shot luma assets contain no photo, logo, text, or brand mark; composite a separately sourced photo.",
            "threshold.png is scalar grayscale data, not a final display image; poster-50.png is an exact midpoint matte, not a promise of 50% revealed area.",
        ],
        "marks": [
            "Unofficial editorial treatment study: source identity retained; not endorsed.",
            "Use project-specific credit and clearance; these files do not establish ownership, approval, or registration.",
        ],
        "motion": [
            "Completed exploratory render; not brand approval or a new approved personal logo.",
            "Keep the associated project/design credit and complete visual review before public deployment.",
        ],
        "portrait": [
            "Art-direction candidate with fidelity caveats; face, hair, and anatomy were reconstructed rather than pixel-preserved.",
            "Human-likeness approval is required before public use; do not present it as an exact source-photo reproduction.",
        ],
        "brand": [
            "Exploratory asset-only kit; approval is required before treating the mark or icons as final identity.",
            "The SVGs are currentColor assets; keep accessible text labels alongside icon-only controls.",
        ],
    }


def add_spec(
    specs: list[dict[str, Any]],
    *,
    asset_id: str,
    category: str,
    source: str,
    destination: str,
    caveats: list[str],
    source_metadata: dict[str, Any] | None = None,
) -> None:
    specs.append(
        {
            "id": asset_id,
            "category": category,
            "source": source,
            "destination": destination,
            "creditCaveats": caveats,
            "sourceMetadata": source_metadata or {},
        }
    )


def build_specs() -> list[dict[str, Any]]:
    caveats = base_caveats()
    specs: list[dict[str, Any]] = []

    project_specs = [
        (
            "on-the-radar",
            "image4.jpeg",
            4,
            "On The Radar / Mafiathon 3",
            [
                "Images are thumbnails from linked official On The Radar Radio uploads.",
                "The event-wide lineup and results are context; do not imply that every artist or metric was personally booked or caused by Zay.",
            ],
        ),
        (
            "streamer-university-2",
            "image7.jpeg",
            5,
            "Streamer University 2",
            [
                "Image is a thumbnail from an official Suburbbaby video source.",
                "Event metrics are aggregated event-related coverage figures; role and date claims remain attributed to the supplied portfolio and user clarification.",
            ],
        ),
        (
            "memehouse",
            "image9.jpeg",
            7,
            "MemeHouse Productions",
            [
                "Image is an official Isaac Francis Twitch clip thumbnail and is not a claim that it depicts the specific U-Haul setup.",
                "MemeHouse work was contracted per project, not company-wide creative ownership.",
            ],
        ),
    ]
    deck_media = read_json(SOURCE_ROOT / "sources" / "deck" / "deck-extract.json")
    deck_media_by_name = {
        Path(item["extracted"].replace("\\", "/")).name: item
        for item in deck_media["media"]
        if isinstance(item, dict) and "extracted" in item
    }
    for project_id, filename, slide, label, project_caveats in project_specs:
        media = deck_media_by_name[filename]
        add_spec(
            specs,
            asset_id=f"projects.{project_id}.deckImage",
            category="projects",
            source=f"asset-studio/sources/deck/media/{filename}",
            destination=f"projects/{filename}",
            caveats=caveats["projects"] + project_caveats,
            source_metadata={
                "label": label,
                "deckSlide": slide,
                "deckSource": media["pptx_path"],
                "deckExtractedBytes": media["bytes"],
                "deckExtractedSha256": media["sha256"],
                "deckStatus": deck_media.get("status"),
            },
        )

    transition_root = SOURCE_ROOT / "transitions"
    transition_registry = read_json(transition_root / "registrytransitions.json")
    transition_verification = read_json(transition_root / "verification.json")
    for transition in transition_registry["transitions"]:
        transition_id = transition["id"]
        animation = read_json(transition_root / transition_id / "animation.json")
        transition_metadata = {
            "label": transition["label"],
            "caseStudy": transition["caseStudy"],
            "seed": transition["seed"],
            "dimensions": [transition["width"], transition["height"]],
            "width": transition["width"],
            "height": transition["height"],
            "durationSeconds": transition["durationSeconds"],
            "fps": transition["fps"],
            "loop": transition["loop"],
            "approval": animation.get("approval"),
            "provenance": animation.get("provenance"),
            "verification": {
                "result": transition_verification["result"],
                "thresholdMode": transition_verification["transitions"][transition_id]["thresholdMode"],
                "thresholdSize": transition_verification["transitions"][transition_id]["thresholdSize"],
                "sourcePerPixelMonotonic": transition_verification["transitions"][transition_id][
                    "sourcePerPixelMonotonic"
                ],
                "sourceFirstCoverage": transition_verification["transitions"][transition_id]["sourceFirstCoverage"],
                "sourceLastCoverage": transition_verification["transitions"][transition_id]["sourceLastCoverage"],
                "posterProgress": transition_verification["transitions"][transition_id]["posterProgress"],
            },
        }
        for filename, role in (("threshold.png", "threshold"), ("poster-50.png", "poster")):
            add_spec(
                specs,
                asset_id=f"transitions.{transition_id}.{role}",
                category="transitions",
                source=f"asset-studio/transitions/{transition_id}/{filename}",
                destination=f"transitions/{transition_id}/{filename}",
                caveats=caveats["transitions"],
                source_metadata=transition_metadata,
            )

    mark_root = SOURCE_ROOT / "case-studies"
    for mark_dir in ("on-the-radar", "memehouse", "streamer-university-2"):
        mark_metadata = read_json(mark_root / mark_dir / "provenance.json")
        for filename in mark_metadata["outputs"]:
            add_spec(
                specs,
                asset_id=f"marks.{mark_dir}.{filename}",
                category="marks",
                source=f"asset-studio/case-studies/{mark_dir}/{filename}",
                destination=f"marks/{mark_dir}/{filename}",
                caveats=caveats["marks"],
                source_metadata={
                    "title": mark_metadata["title"],
                    "sourceRecord": mark_metadata["source_record"],
                    "sourceAsset": mark_metadata["source"],
                    "sourceSha256": mark_metadata["source_sha256"],
                    "status": mark_metadata["status"],
                    "note": mark_metadata["note"],
                    "official": False,
                    "sourceFaithful": True,
                },
            )

    library_manifest = {
        item["path"]: item
        for item in read_json(SOURCE_ROOT / "library" / "manifest.json")
    }
    motion_specs = {
        "aperture-assembly": "Exploratory mark assembly; not an approved final identity.",
        "avian-flight": "Original three-bird flight study; exploratory motion asset, not a brand claim.",
        "fox-stride": "Original in-place walking study; exploratory motion asset, not a brand claim.",
    }
    for motion_id, specific_caveat in motion_specs.items():
        source_metadata = read_json(SOURCE_ROOT / "library" / motion_id / "source.json")
        verification = read_json(SOURCE_ROOT / "library" / motion_id / "verification.json")
        motion_metadata = {
            "renderStatus": source_metadata.get("status"),
            "sourceBuilder": source_metadata.get("source_builder"),
            "verificationPassed": verification.get("passed"),
            "frameCount": verification.get("frame_count"),
            "fps": verification.get("fps"),
            "loopTransformEndpointEqual": verification.get("loop_transform_endpoint_equal"),
            "loopEndpointMeanPixelDifference": verification.get("loop_endpoint_mean_pixel_difference"),
            "librarySourceCatalog": {
                filename: library_manifest[f"library/{motion_id}/{filename}"]
                for filename in ("loop.mp4", "loop.webm", "loop-mobile.mp4", "poster.webp")
            },
        }
        for filename, role in (
            ("loop.mp4", "mp4"),
            ("loop.webm", "webm"),
            ("loop-mobile.mp4", "mobileMp4"),
            ("poster.webp", "poster"),
        ):
            add_spec(
                specs,
                asset_id=f"motion.{motion_id}.{role}",
                category="motion",
                source=f"asset-studio/library/{motion_id}/{filename}",
                destination=f"motion/{motion_id}/{filename}",
                caveats=caveats["motion"] + [specific_caveat],
                source_metadata=motion_metadata,
            )

    portrait_manifest = read_json(SOURCE_ROOT / "portraits" / "sunburst-editorial-v1" / "manifest.json")
    add_spec(
        specs,
        asset_id="portrait.editorial",
        category="portrait",
        source="asset-studio/library/portrait-display.webp",
        destination="portrait/editorial.webp",
        caveats=caveats["portrait"] + portrait_manifest["visual_findings"]["caveats"],
        source_metadata={
            "assetId": portrait_manifest.get("asset_id"),
            "status": portrait_manifest.get("status"),
            "curationDecision": portrait_manifest.get("curation_decision"),
            "model": portrait_manifest.get("model"),
            "quality": portrait_manifest.get("quality"),
            "source": portrait_manifest.get("source"),
            "actualOutput": portrait_manifest.get("actual_output"),
            "verification": portrait_manifest.get("verification"),
        },
    )

    icon_manifest = read_json(SOURCE_ROOT / "brand" / "icons" / "manifest.json")
    icon_caveats = caveats["brand"] + [f"Icon kit approval status: {icon_manifest['approval']}."]
    standalone_icons = [
        "arrow-diagonal.svg",
        "close.svg",
        "contact.svg",
        "creative-strategy.svg",
        "external.svg",
        "film.svg",
        "index.svg",
        "pause.svg",
        "play.svg",
        "project.svg",
        "scroll.svg",
        "sound-off.svg",
    ]
    icon_metadata_by_name = {
        item["name"]: item
        for item in icon_manifest["icons"]
    }
    add_spec(
        specs,
        asset_id="brand.icons.sprite",
        category="brand",
        source="asset-studio/brand/icons/sprite.svg",
        destination="brand/icons/sprite.svg",
        caveats=icon_caveats,
        source_metadata={
            "family": icon_manifest["family"],
            "publicName": icon_manifest["publicName"],
            "approval": icon_manifest["approval"],
            "source": icon_manifest["source"],
            "iconCount": len(icon_manifest["icons"]),
        },
    )
    for filename in standalone_icons:
        icon_name = Path(filename).stem
        add_spec(
            specs,
            asset_id=f"brand.icons.{icon_name}",
            category="brand",
            source=f"asset-studio/brand/icons/{filename}",
            destination=f"brand/icons/{filename}",
            caveats=icon_caveats,
            source_metadata=icon_metadata_by_name[icon_name],
        )

    brand_source = read_json(SOURCE_ROOT / "brand" / "marks" / "source-provenance.json")
    add_spec(
        specs,
        asset_id="brand.marks.emblemSteppedMaster32",
        category="brand",
        source="asset-studio/brand/marks/emblem-stepped-master-32.svg",
        destination="brand/marks/emblem-stepped-master-32.svg",
        caveats=caveats["brand"]
        + [
            "Exploratory optical derivative of the existing four-ribbon silhouette; approval is required.",
            "No ownership, clearance, or registration claim is made.",
        ],
        source_metadata={
            "publicName": brand_source["publicName"],
            "status": brand_source["status"],
            "source": brand_source["source"],
            "sourceSha256": brand_source["sha256"],
            "preservedMaster": brand_source["preservedMaster"],
            "preservedPathIsExact": brand_source["preservedPathIsExact"],
        },
    )

    return specs


def provenance_paths(spec: dict[str, Any]) -> list[str]:
    category = spec["category"]
    subject = spec["destination"].split("/")[1]
    if category == "projects":
        return ["asset-studio/sources/deck/deck-extract.json"]
    if category == "transitions":
        return [
            "asset-studio/transitions/provenance.json",
            "asset-studio/transitions/registrytransitions.json",
            "asset-studio/transitions/verification.json",
            f"asset-studio/transitions/{subject}/animation.json",
        ]
    if category == "marks":
        return [
            "asset-studio/case-studies/project-marks.json",
            f"asset-studio/case-studies/{subject}/provenance.json",
        ]
    if category == "motion":
        return [
            "asset-studio/library/manifest.json",
            f"asset-studio/library/{subject}/source.json",
            f"asset-studio/library/{subject}/verification.json",
        ]
    if category == "portrait":
        return [
            "asset-studio/library/manifest.json",
            "asset-studio/portraits/sunburst-editorial-v1/manifest.json",
        ]
    return [
        "asset-studio/brand/build-manifest.json",
        "asset-studio/brand/icons/manifest.json"
        if subject == "icons"
        else "asset-studio/brand/marks/source-provenance.json",
    ]


def validate_sources(specs: list[dict[str, Any]]) -> None:
    """Fail before writing if the selected final inputs are incomplete or stale."""
    if len(specs) != 48:
        raise RuntimeError(f"Expected exactly 48 delivery assets, found {len(specs)}")
    for field in ("id", "source", "destination"):
        if len({spec[field] for spec in specs}) != len(specs):
            raise RuntimeError(f"Duplicate {field} in the asset plan")
    library = {
        item["path"]: item
        for item in read_json(SOURCE_ROOT / "library/manifest.json")
    }
    for spec in specs:
        source = safe_child(SOURCE_ROOT, spec["source"].removeprefix("asset-studio/"))
        safe_child(STRATEGY_ROOT, spec["destination"])
        digest, size = sha256_and_bytes(source)
        if size == 0:
            raise RuntimeError(f"Empty source: {spec['source']}")
        spec["sha256"], spec["bytes"] = digest, size
        category, metadata = spec["category"], spec["sourceMetadata"]
        subject = spec["destination"].split("/")[1]
        if category == "projects":
            if (digest, size) != (metadata["deckExtractedSha256"], metadata["deckExtractedBytes"]):
                raise RuntimeError(f"Deck extraction hash/size mismatch: {source}")
        elif category in ("motion", "portrait"):
            record = library[spec["source"].removeprefix("asset-studio/")]
            if (digest, size) != (record["sha256"], record["bytes"]):
                raise RuntimeError(f"Library catalog hash/size mismatch: {source}")
        if category == "transitions":
            checks = metadata["verification"]
            if (
                checks["result"] != "PASS"
                or not checks["sourcePerPixelMonotonic"]
                or checks["thresholdSize"] != [1024, 576]
                or checks["sourceFirstCoverage"] != 0
                or checks["sourceLastCoverage"] != 1
                or checks["posterProgress"] != 0.5
            ):
                raise RuntimeError(f"Incomplete transition: {subject}")
            if source.name == "threshold.png" and digest != metadata["provenance"]["thresholdSha256"]:
                raise RuntimeError(f"Threshold provenance hash mismatch: {subject}")
        elif category == "marks":
            original = safe_child(SOURCE_ROOT, metadata["sourceAsset"])
            if sha256_and_bytes(original)[0] != metadata["sourceSha256"]:
                raise RuntimeError(f"Original mark provenance mismatch: {subject}")
            if "unofficial" not in metadata["status"].lower() or metadata["official"] is not False:
                raise RuntimeError(f"Missing unofficial mark label: {subject}")
        elif category == "motion":
            record = read_json(SOURCE_ROOT / "library" / subject / "source.json")
            job = safe_child(SOURCE_ROOT, record["job"].replace("\\", "/"))
            status = read_json(job / "status.json")
            if status.get("phase") != "completed" or status.get("finished") is not True:
                raise RuntimeError(f"Render is not completed: {subject}")
            if (
                metadata["verificationPassed"] is not True
                or metadata["frameCount"] != 96
                or metadata["fps"] != 24
                or metadata["loopTransformEndpointEqual"] is not True
            ):
                raise RuntimeError(f"Motion final verification failed: {subject}")
            if sha256_and_bytes(job / "media" / source.name) != (digest, size):
                raise RuntimeError(f"Library is not identical to final render: {subject}/{source.name}")
            report = read_json(SOURCE_ROOT / "library" / subject / "verification.json")
            for export in report["exports"]:
                name = export["file"].replace("\\", "/").rsplit("/", 1)[-1]
                streams = export["metadata"]["streams"]
                expected_size = [960, 540] if name == "loop-mobile.mp4" else [1280, 720]
                if (
                    len(streams) != 1
                    or streams[0]["codec_type"] != "video"
                    or [streams[0]["width"], streams[0]["height"]] != expected_size
                    or streams[0]["nb_read_frames"] != "96"
                    or streams[0]["r_frame_rate"] != "24/1"
                ):
                    raise RuntimeError(f"Not the full-resolution final render set: {subject}")
            metadata["renderJob"] = workspace_relative(job)
        spec["provenanceRecords"] = []
        for relative in provenance_paths(spec):
            record_hash, record_bytes = sha256_and_bytes(safe_child(WORKSPACE_ROOT, relative))
            spec["provenanceRecords"].append({
                "sourceAssetPath": relative,
                "sha256": record_hash,
                "bytes": record_bytes,
            })


def build_manifest(specs: list[dict[str, Any]]) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    for spec in specs:
        source_path = safe_child(WORKSPACE_ROOT, spec["source"])
        destination_path = safe_child(STRATEGY_ROOT, spec["destination"])
        source_sha256, source_bytes = sha256_and_bytes(source_path)
        copied_sha256, copied_bytes = sha256_and_bytes(destination_path)
        if (source_sha256, source_bytes) != (copied_sha256, copied_bytes):
            raise RuntimeError(f"Copied bytes differ before manifest creation: {spec['id']}")
        if (source_sha256, source_bytes) != (spec["sha256"], spec["bytes"]):
            raise RuntimeError(f"Source changed after preflight: {spec['id']}")
        files.append(
            {
                "id": spec["id"],
                "category": spec["category"],
                "publicPath": f"/strategy/{spec['destination']}",
                "destinationPath": destination_relative(destination_path),
                "sourceAssetPath": workspace_relative(source_path),
                "sha256": copied_sha256,
                "bytes": copied_bytes,
                "creditCaveats": spec["creditCaveats"],
                "sourceMetadata": spec["sourceMetadata"],
                "provenanceRecords": spec["provenanceRecords"],
            }
        )

    grouped: dict[str, list[str]] = {}
    for entry in files:
        grouped.setdefault(entry["category"], []).append(entry["publicPath"])

    return {
        "schemaVersion": 1,
        "generatedAt": date.today().isoformat(),
        "purpose": "Motion and strategy asset handoff; site integration intentionally deferred.",
        "preserveOriginalBytes": True,
        "overwritePolicy": "Refuse existing strategy folder; retain an identical existing path export without writing it; never overwrite files.",
        "sourceRoot": "asset-studio",
        "destinationRoot": "site/public/strategy",
        "expectedFileCount": len(files),
        "excludedByRequest": [
            "asset-studio/creatures/concepts/** (source creature concept not copied)",
            "site/public/world/clouds.webp (already available for CSS masking; not copied)",
        ],
        "assetGroups": grouped,
        "files": files,
    }


def write_new_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(content)


def copy_new_file(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with source.open("rb") as original, destination.open("xb") as copy:
        shutil.copyfileobj(original, copy)


def verify_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    entries = manifest["files"]
    specs = build_specs()
    validate_sources(specs)
    expected = {f"public/strategy/{spec['destination']}": spec for spec in specs}
    expected_destination_files = {entry["destinationPath"] for entry in entries}
    if set(expected) != expected_destination_files or len(entries) != len(specs):
        raise RuntimeError("Manifest does not contain exactly the requested 48 assets")
    actual_destination_files = {
        path.relative_to(SITE_ROOT).as_posix()
        for path in STRATEGY_ROOT.rglob("*")
        if path.is_file() and path != MANIFEST_PATH
    }
    if actual_destination_files != expected_destination_files:
        missing = sorted(expected_destination_files - actual_destination_files)
        unexpected = sorted(actual_destination_files - expected_destination_files)
        raise RuntimeError(f"Destination file set mismatch; missing={missing}, unexpected={unexpected}")

    checked = 0
    for entry in entries:
        spec = expected[entry["destinationPath"]]
        if (
            entry["id"] != spec["id"]
            or entry["sourceAssetPath"] != spec["source"]
            or entry["publicPath"] != f"/strategy/{spec['destination']}"
            or entry["creditCaveats"] != spec["creditCaveats"]
            or entry["sourceMetadata"] != spec["sourceMetadata"]
            or entry["provenanceRecords"] != spec["provenanceRecords"]
        ):
            raise RuntimeError(f"Manifest provenance or path mismatch: {spec['id']}")
        destination = safe_child(SITE_ROOT, entry["destinationPath"])
        source = safe_child(WORKSPACE_ROOT, entry["sourceAssetPath"])
        destination_sha256, destination_bytes = sha256_and_bytes(destination)
        source_sha256, source_bytes = sha256_and_bytes(source)
        if (destination_sha256, destination_bytes) != (entry["sha256"], entry["bytes"]):
            raise RuntimeError(f"Manifest hash/byte mismatch: {entry['id']}")
        if (destination_sha256, destination_bytes) != (source_sha256, source_bytes):
            raise RuntimeError(f"Source/destination hash mismatch: {entry['id']}")
        checked += 1

    if not JS_EXPORT_PATH.exists():
        raise RuntimeError(f"Missing path export: {JS_EXPORT_PATH}")
    if JS_EXPORT_PATH.read_text(encoding="utf-8") != JS_EXPORT:
        raise RuntimeError(f"Path export differs from the prepared stable export: {JS_EXPORT_PATH}")
    if manifest["expectedFileCount"] != checked:
        raise RuntimeError("Manifest expectedFileCount does not match verified file count")

    return {
        "checkedFiles": checked,
        "expectedFiles": len(expected_destination_files),
        "manifest": workspace_relative(MANIFEST_PATH),
        "pathExport": workspace_relative(JS_EXPORT_PATH),
    }


def prepare() -> dict[str, Any]:
    if STRATEGY_ROOT.exists():
        raise RuntimeError(
            f"Refusing to use existing destination folder: {STRATEGY_ROOT}. "
            "Use --verify to validate an existing handoff; no overwrite mode exists."
        )
    if JS_EXPORT_PATH.exists() and JS_EXPORT_PATH.read_text(encoding="utf-8") != JS_EXPORT:
        raise RuntimeError(
            f"Refusing to overwrite existing path export: {JS_EXPORT_PATH}. "
            "Move it aside or use --verify if it belongs to this handoff."
        )

    specs = build_specs()
    validate_sources(specs)

    STRATEGY_ROOT.mkdir(parents=True)
    for spec in specs:
        copy_new_file(
            safe_child(WORKSPACE_ROOT, spec["source"]),
            safe_child(STRATEGY_ROOT, spec["destination"]),
        )

    if not JS_EXPORT_PATH.exists():
        write_new_text(JS_EXPORT_PATH, JS_EXPORT)
    else:
        print("Retained identical existing strategyAssetPaths.js without writing it.", file=sys.stderr)
    manifest = build_manifest(specs)
    write_new_text(
        MANIFEST_PATH,
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    )
    result = verify_manifest(manifest)
    result["copiedFiles"] = len(specs)
    return result


def verify_existing() -> dict[str, Any]:
    if not MANIFEST_PATH.is_file():
        raise RuntimeError(f"Missing manifest for verification: {MANIFEST_PATH}")
    manifest = read_json(MANIFEST_PATH)
    return verify_manifest(manifest)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify an existing strategy handoff without writing any files.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate the 48 source assets and final render records without writing.",
    )
    args = parser.parse_args()

    try:
        if args.verify and args.dry_run:
            raise RuntimeError("Choose --verify or --dry-run, not both")
        if args.dry_run:
            specs = build_specs()
            validate_sources(specs)
            result = {"sourceFiles": len(specs), "mode": "read-only dry run"}
        else:
            result = verify_existing() if args.verify else prepare()
    except (KeyError, OSError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(json.dumps({"result": "PASS", **result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
