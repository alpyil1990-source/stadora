#!/usr/bin/env python3
"""Strip VVZ article numbers and Verime copy from public product sheets.

Keeps originals under internal/vvz-play/docs/. Applies the same treatment to
every page (the English sheets are typically two pages). Run --one on a single
file until the layout is approved, then strip the rest.
"""

from __future__ import annotations

import argparse
import io
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

try:
    import numpy as np
    import pymupdf
    from PIL import Image
except ImportError:  # pragma: no cover
    np = None
    pymupdf = None
    Image = None

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DOC_ROOT = PUBLIC / "docs" / "vvz-play"
INTERNAL = ROOT / "internal" / "vvz-play" / "docs"
SERIES_PATH = ROOT / "src" / "data" / "generated" / "vvz-play-series.json"

SKU_RE = re.compile(r"\s*VVZ-[A-Z0-9]+(?:-[A-Z0-9]+)*\s*", re.I)
ORANGE_HEADER = (242, 102, 34)
ORANGE_FOOTER = (242, 104, 36)
HEADER_BOX = (920, 250, 1640, 360)
HEADER_REF = (2483, 597)
FOOTER_BOX = (1520, 210, 2506, 422)
FOOTER_REF = (2506, 422)

SAMPLE_ONE = (
    DOC_ROOT
    / "gunga-babysits-classic-1-0-m-vhp007-10"
    / "gunga-babysits-classic-1-0-m-vhp007-10-datasheet.pdf"
)


def rgb01(color: int) -> tuple[float, float, float]:
    return ((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255


def strip_sku(text: str) -> str:
    cleaned = SKU_RE.sub(" ", text)
    cleaned = re.sub(r" {2,}", " ", cleaned)
    cleaned = re.sub(r"\s+([,.;:])", r"\1", cleaned)
    return cleaned.strip()


def inset_rect(rect: pymupdf.Rect, top: float = 0.30, bottom: float = 0.10) -> pymupdf.Rect:
    h = rect.height
    return pymupdf.Rect(rect.x0 - 1, rect.y0 + h * top, rect.x1 + 1, rect.y1 - h * bottom)


def scale_box(size: tuple[int, int], box: tuple[int, int, int, int], ref: tuple[int, int]) -> tuple[int, int, int, int]:
    sx = size[0] / ref[0]
    sy = size[1] / ref[1]
    x0, y0, x1, y1 = box
    return int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy)


def cover_white_text(
    im: Image.Image, box: tuple[int, int, int, int], orange: tuple[int, int, int]
) -> Image.Image:
    a = np.array(im.convert("RGB"))
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(a.shape[1], x1), min(a.shape[0], y1)
    region = a[y0:y1, x0:x1]
    g, b = region[:, :, 1], region[:, :, 2]
    region[(g > 130) | (b > 80)] = orange
    a[y0:y1, x0:x1] = region
    return Image.fromarray(a)


def pixmap_image(doc: pymupdf.Document, xref: int) -> Image.Image:
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n >= 5:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    elif pix.n == 1:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def save_jpeg(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=88, optimize=True)
    return buf.getvalue()


def extract_fonts(doc: pymupdf.Document, dest: Path) -> dict[str, Path]:
    dest.mkdir(parents=True, exist_ok=True)
    found: dict[str, Path] = {}
    for page in doc:
        for item in page.get_fonts():
            xref = item[0]
            name = item[3] or f"font{xref}"
            key = name.lower().replace(" ", "").replace("-", "")
            if key in found:
                continue
            extracted = doc.extract_font(xref)
            data = extracted[3] if isinstance(extracted, tuple) and len(extracted) > 3 else None
            ext = (extracted[1] if isinstance(extracted, tuple) else None) or "ttf"
            if not data:
                continue
            path = dest / f"{key}.{ext}"
            path.write_bytes(data)
            found[key] = path
    return found


def fontfile_for(font: str, fonts: dict[str, Path]) -> str | None:
    key = (font or "").lower().replace(" ", "").replace("-", "")
    if key in fonts:
        return str(fonts[key])
    for name, path in fonts.items():
        if key in name or name in key:
            return str(path)
    return None


def redact_skus_and_slogan(page: pymupdf.Page) -> list[tuple]:
    inserts: list[tuple] = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span.get("text") or ""
                bbox = pymupdf.Rect(span["bbox"])
                if "together we create" in text.lower():
                    page.add_redact_annot(bbox, fill=[c / 255 for c in ORANGE_FOOTER])
                    continue
                if not SKU_RE.search(text):
                    continue
                new = strip_sku(text)
                page.add_redact_annot(inset_rect(bbox), fill=(1, 1, 1))
                if new:
                    inserts.append(
                        (
                            tuple(span["origin"]),
                            new,
                            span.get("font") or "",
                            float(span.get("size") or 12),
                            int(span.get("color") or 0),
                        )
                    )
    return inserts


def insert_replacements(page: pymupdf.Page, inserts: list[tuple], fonts: dict[str, Path]) -> None:
    for origin, text, font, size, color in inserts:
        kwargs = {"fontsize": size, "color": rgb01(color)}
        ff = fontfile_for(font, fonts)
        if ff:
            kwargs["fontfile"] = ff
        page.insert_text(pymupdf.Point(origin), text, **kwargs)


def classify_banner(page: pymupdf.Page, xref: int) -> str | None:
    rects = page.get_image_rects(xref)
    if not rects:
        return None
    rect = rects[0]
    wide = rect.width > page.rect.width * 0.8
    if not wide:
        return None
    if rect.y0 < 24:
        return "header"
    if rect.y1 > page.rect.height - 24:
        return "footer"
    return None


def patch_banners(doc: pymupdf.Document) -> list[int]:
    patched: dict[int, str] = {}
    for page in doc:
        for info in page.get_images(full=True):
            xref = info[0]
            if xref in patched:
                continue
            kind = classify_banner(page, xref)
            if not kind:
                continue
            image = pixmap_image(doc, xref)
            if kind == "header":
                image = cover_white_text(
                    image, scale_box(image.size, HEADER_BOX, HEADER_REF), ORANGE_HEADER
                )
            else:
                image = cover_white_text(
                    image, scale_box(image.size, FOOTER_BOX, FOOTER_REF), ORANGE_FOOTER
                )
            page.replace_image(xref, stream=save_jpeg(image))
            patched[xref] = kind
    return list(patched)


def export_page_previews(pdf_path: Path) -> list[str]:
    doc = pymupdf.open(pdf_path)
    written: list[str] = []
    for i, page in enumerate(doc, 1):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.8, 1.8), alpha=False)
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        dest = pdf_path.with_name(f"datasheet-sida-{i}.jpg")
        image.save(dest, "JPEG", quality=84, optimize=True)
        written.append(str(dest.relative_to(PUBLIC)))
    doc.close()
    return written


def leftover(doc: pymupdf.Document) -> list[str]:
    hits: list[str] = []
    for i, page in enumerate(doc, 1):
        text = page.get_text()
        if SKU_RE.search(text):
            hits.append(f"p{i}:sku")
        if re.search(r"together we create", text, re.I):
            hits.append(f"p{i}:slogan")
        if re.search(r"ver[ií]me", text, re.I):
            hits.append(f"p{i}:verime-text")
    return hits


def strip_document(src: Path, dest: Path) -> dict:
    if pymupdf is None or np is None or Image is None:
        dest.write_bytes(src.read_bytes())
        return {"ok": False, "reason": "pymupdf/pillow saknas — original kopierat"}
    doc = pymupdf.open(src)
    with tempfile.TemporaryDirectory() as tmp:
        fonts = extract_fonts(doc, Path(tmp) / "fonts")
        meta = dict(doc.metadata or {})
        for key in ("title", "subject", "keywords"):
            if meta.get(key):
                meta[key] = strip_sku(meta[key])
        doc.set_metadata(meta)
        patch_banners(doc)
        inserts_by_page = []
        for page in doc:
            inserts_by_page.append(redact_skus_and_slogan(page))
            page.apply_redactions(images=0)
        for page, inserts in zip(doc, inserts_by_page):
            insert_replacements(page, inserts, fonts)
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp_pdf = dest.with_suffix(dest.suffix + ".tmp")
        doc.save(tmp_pdf, garbage=4, deflate=True, use_objstms=True)
        doc.close()
        leftover_hits = leftover(pymupdf.open(tmp_pdf))
        if leftover_hits:
            tmp_pdf.unlink(missing_ok=True)
            return {"ok": False, "reason": ",".join(leftover_hits)}
        tmp_pdf.replace(dest)
        page_files = export_page_previews(dest)
        return {
            "ok": True,
            "pages": pymupdf.open(dest).page_count,
            "bytes": dest.stat().st_size,
            "previews": page_files,
        }


def internal_for(public_path: Path) -> Path:
    return INTERNAL / public_path.relative_to(DOC_ROOT)


def process_one(public_path: Path) -> dict:
    original = internal_for(public_path)
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(public_path, original)
    info = strip_document(original, public_path)
    info["file"] = str(public_path.relative_to(PUBLIC))
    info["original"] = str(original.relative_to(ROOT))
    return info


def datasheet_paths() -> list[Path]:
    paths: list[Path] = []
    seen: set[Path] = set()
    if SERIES_PATH.exists():
        data = json.loads(SERIES_PATH.read_text())
        for row in data.get("series") or []:
            for doc in row.get("documents") or []:
                if doc.get("kind") != "datasheet":
                    continue
                href = doc.get("href") or ""
                path = PUBLIC / href.lstrip("/")
                if path.is_file() and path not in seen:
                    seen.add(path)
                    paths.append(path)
    return sorted(paths)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--one", nargs="?", const=str(SAMPLE_ONE), help="Strip one datasheet and stop")
    parser.add_argument("--all", action="store_true", help="Strip every VVZ datasheet")
    args = parser.parse_args()
    if pymupdf is None:
        sys.exit("pymupdf required")
    if args.all:
        summary = {"ok": 0, "fail": 0, "failures": []}
        files = datasheet_paths()
        for path in files:
            info = process_one(path)
            if info.get("ok"):
                summary["ok"] += 1
            else:
                summary["fail"] += 1
                summary["failures"].append(info)
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        return
    target = Path(args.one) if args.one else SAMPLE_ONE
    if not target.is_absolute():
        target = ROOT / target
    print(json.dumps(process_one(target), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
