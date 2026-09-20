#!/usr/bin/env python3
"""Pad ZANO park-bench gallery photos into square listing thumbs.

Listing tiles use object-cover. A 3:2 bench photo is cropped in the square.
This writes listing.jpg at max(w,h)*1.084 on paper or white so the whole bench
shows, without changing gallery files or object-cover.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "src/data/generated/catalog-index.json"
SERIES = ROOT / "src/data/generated/zano-series.json"
PUBLIC = ROOT / "public"
PAPER = (244, 242, 236)
PAD = 1.084


def listing_source(row: dict) -> str | None:
    images = row.get("images") or []
    for img in images:
        if img.get("kind") == "studio" and img.get("src"):
            return img["src"]
    for img in images:
        if img.get("src"):
            return img["src"]
    return None


def canvas_color(rgba: Image.Image) -> tuple[int, int, int]:
    w, h = rgba.size
    pts = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    samples = [rgba.getpixel(p) for p in pts]
    if sum(1 for s in samples if s[3] < 20) >= 2:
        return PAPER
    opaque = [s[:3] for s in samples if s[3] >= 20]
    if opaque and all(min(c) > 240 for c in opaque):
        return (255, 255, 255)
    return PAPER


def make_listing(src: Path, dest: Path) -> None:
    rgba = Image.open(src).convert("RGBA")
    bg = canvas_color(rgba)
    flat = Image.new("RGB", rgba.size, bg)
    flat.paste(rgba, mask=rgba.split()[-1])
    w, h = flat.size
    side = max(int(max(w, h) * PAD), max(w, h) + 16)
    canvas = Image.new("RGB", (side, side), bg)
    canvas.paste(flat, ((side - w) // 2, (side - h) // 2))
    dest.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest, "JPEG", quality=95, optimize=True)


def main() -> None:
    slugs = json.loads(INDEX.read_text())["zano"]["bySubcategory"]["parkbankar"]
    by_slug = {row["slug"]: row for row in json.loads(SERIES.read_text())["series"]}
    ok = 0
    missing = []
    for slug in slugs:
        row = by_slug.get(slug)
        src_url = listing_source(row) if row else None
        if not src_url:
            missing.append((slug, "no image in catalog"))
            continue
        src = PUBLIC / src_url.lstrip("/")
        if not src.exists():
            missing.append((slug, f"missing {src}"))
            continue
        dest = PUBLIC / "images" / "zano" / slug / "listing.jpg"
        make_listing(src, dest)
        ok += 1
        print(f"{slug}\t{src.name}\t{dest.stat().st_size}")
    print(f"wrote {ok}/{len(slugs)}")
    if missing:
        for slug, reason in missing:
            print(f"FAIL {slug}: {reason}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
