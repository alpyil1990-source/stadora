#!/usr/bin/env python3
"""Strip STREETPARK branding from public product datasheets.

Removes the green STREETPARK logo, www.streetpark.eu / .cz, and the
DOWNLOAD PDF SAMPLER / STÁHNOUT PDF VZORNÍK link. Product copy, photos
and drawings stay. Originals are kept under internal/streetpark/docs/.
"""

from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

try:
    import pymupdf
except ImportError:  # pragma: no cover
    pymupdf = None

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DOC_ROOT = PUBLIC / "docs" / "streetpark"
INTERNAL = ROOT / "internal" / "streetpark" / "docs"
GEN = ROOT / "src" / "data" / "generated"
SERIES_PATH = GEN / "streetpark-series.json"

URL_RE = re.compile(r"streetpark\.(eu|cz|sk|com)\b", re.I)
SAMPLER_RE = re.compile(
    r"(DOWNLOAD\s+PDF\s+SAMPLER|ST[ÁA]HNOUT\s+PDF\s+VZORN[ÍI]K)",
    re.I,
)
SAMPLER_NEEDLES = (
    "DOWNLOAD PDF SAMPLER >",
    "DOWNLOAD PDF SAMPLER>",
    "DOWNLOAD PDF SAMPLER",
    "Download PDF Sampler",
    "STÁHNOUT PDF VZORNÍK >",
    "STÁHNOUT PDF VZORNÍK>",
    "STÁHNOUT PDF VZORNÍK",
    "STAHNOUT PDF VZORNIK",
)
URL_NEEDLES = (
    "www.streetpark.eu",
    "www.streetpark.cz",
    "www.streetpark.sk",
    "streetpark.eu",
    "streetpark.cz",
)


def is_logo_green(fill: tuple | None) -> bool:
    if not fill or len(fill) < 3:
        return False
    r, g, b = fill[:3]
    return g > 0.45 and g > r + 0.12 and g > b + 0.12 and 0.2 < r < 0.55 and b < 0.45


def expand(rect: pymupdf.Rect, pad: float = 2.0) -> pymupdf.Rect:
    return pymupdf.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad)


def annot_rect(page: pymupdf.Page, rect: pymupdf.Rect) -> pymupdf.Rect:
    """Redaction annots use unrotated PDF space."""
    return pymupdf.Rect(rect) * page.derotation_matrix


def logo_rects(page: pymupdf.Page) -> list[pymupdf.Rect]:
    found: list[pymupdf.Rect] = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.y0 > 72 or rect.height >= 48 or rect.width < 80:
            continue
        if is_logo_green(drawing.get("fill")):
            found.append(pymupdf.Rect(rect))
    if found:
        union = found[0]
        for rect in found[1:]:
            union |= rect
        return [expand(union, 4)]
    # Word template: green bar sits around (43, 25, 185, 56) on A4.
    if page.rect.width < 700 and page.rect.height > 700:
        return [pymupdf.Rect(38, 16, 210, 64)]
    return []


def schema_wordmark_rect(page: pymupdf.Page, path: Path) -> pymupdf.Rect | None:
    name = path.name.lower()
    if "schema" not in name and "typu" not in name:
        return None
    if page.get_text().strip():
        return None
    # Landscape type chart: STREETPARK wordmark, bottom left.
    h = page.rect.height
    return pymupdf.Rect(10, h - 70, 140, h - 4)


def add_text_redactions(page: pymupdf.Page) -> int:
    n = 0
    seen: list[pymupdf.Rect] = []

    def add(rect: pymupdf.Rect, pad: float = 2.0) -> None:
        nonlocal n
        box = expand(rect, pad) if pad else pymupdf.Rect(rect)
        for prev in seen:
            if abs(prev.x0 - box.x0) < 1 and abs(prev.y0 - box.y0) < 1 and abs(prev.x1 - box.x1) < 1:
                return
        seen.append(box)
        page.add_redact_annot(annot_rect(page, box), fill=(1, 1, 1))
        n += 1

    for needle in URL_NEEDLES + SAMPLER_NEEDLES:
        for rect in page.search_for(needle):
            sampler = "SAMPLER" in needle.upper() or "VZORN" in needle.upper()
            box = expand(rect, 2.5 if sampler else 2.0)
            if sampler:
                # The green ">" sits just after the label and is a separate glyph.
                box = pymupdf.Rect(box.x0, box.y0 - 1, min(page.rect.width - 8, box.x1 + 16), box.y1 + 1)
            add(box, 0)
            if needle.startswith("streetpark."):
                add(pymupdf.Rect(rect.x0 - 24, rect.y0, rect.x1, rect.y1), 2.0)
    return n


def drop_brand_links(page: pymupdf.Page) -> int:
    n = 0
    for link in list(page.get_links()):
        uri = (link.get("uri") or "").lower()
        if "streetpark" in uri:
            try:
                page.delete_link(link)
                n += 1
            except Exception:
                pass
    return n


def has_branding(doc: pymupdf.Document, path: Path | None = None) -> bool:
    for page in doc:
        text = page.get_text()
        if URL_RE.search(text) or SAMPLER_RE.search(text):
            return True
        if page.search_for("www.streetpark") or page.search_for("DOWNLOAD PDF SAMPLER"):
            return True
        if page.search_for("STÁHNOUT PDF VZORNÍK"):
            return True
        for link in page.get_links():
            if "streetpark" in (link.get("uri") or "").lower():
                return True
        if logo_rects(page) and page.rect.width < 700:
            # Only treat green header bars as branding when URL/sampler exist
            # or the filename is a product sheet. Checked after drawings:
            if any(is_logo_green(d.get("fill")) and d["rect"].y0 < 72 and d["rect"].width > 80 for d in page.get_drawings()):
                return True
        if path and schema_wordmark_rect(page, path) is not None:
            return True
    return False


def leftover_branding(doc: pymupdf.Document) -> list[str]:
    hits: list[str] = []
    for page in doc:
        text = page.get_text()
        if URL_RE.search(text):
            hits.append("url-text")
        if SAMPLER_RE.search(text):
            hits.append("sampler-text")
        if re.search(r"DOWNLOAD\s+PDF|ST[ÁA]HNOUT\s+PDF", text, re.I):
            hits.append("sampler-partial")
        if re.search(r"^\s*>\s*$", text, re.M):
            hits.append("sampler-arrow")
        for link in page.get_links():
            uri = (link.get("uri") or "").lower()
            if "streetpark" in uri:
                hits.append(f"link:{uri}")
        if page.search_for("DOWNLOAD PDF SAMPLER") or page.search_for("STÁHNOUT PDF VZORNÍK"):
            hits.append("sampler-search")
        if page.search_for("www.streetpark"):
            hits.append("www-search")
        for drawing in page.get_drawings():
            rect = drawing["rect"]
            if rect.y0 < 72 and rect.width > 80 and 15 < rect.height < 48 and is_logo_green(drawing.get("fill")):
                hits.append("green-logo")
                break
    return hits


def strip_document(src: Path, dest: Path) -> dict:
    if pymupdf is None:
        dest.write_bytes(src.read_bytes())
        return {"ok": False, "reason": "pymupdf saknas — original kopierat"}
    doc = pymupdf.open(src)
    meta = dict(doc.metadata or {})
    for key in ("title", "author", "subject", "keywords", "creator", "producer"):
        val = meta.get(key) or ""
        meta[key] = re.sub(r"STREETPARK", "", val, flags=re.I).strip()
    doc.set_metadata(meta)
    for page in doc:
        for rect in logo_rects(page):
            page.add_redact_annot(annot_rect(page, rect), fill=(1, 1, 1))
        wordmark = schema_wordmark_rect(page, src)
        if wordmark is not None:
            page.add_redact_annot(annot_rect(page, wordmark), fill=(1, 1, 1))
        add_text_redactions(page)
        page.apply_redactions(images=0)
        drop_brand_links(page)
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    doc.save(tmp, garbage=4, deflate=True)
    leftover = leftover_branding(pymupdf.open(tmp))
    if leftover:
        tmp.unlink(missing_ok=True)
        return {"ok": False, "reason": ",".join(leftover), "pages": doc.page_count}
    tmp.replace(dest)
    return {"ok": True, "pages": doc.page_count, "brandLeft": False}


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
                if path not in seen and path.is_file():
                    seen.add(path)
                    paths.append(path)
    for path in DOC_ROOT.rglob("*.pdf"):
        name = path.name.lower()
        if path in seen:
            continue
        if name.startswith("product-sheet") or name.startswith("produktovy-list"):
            seen.add(path)
            paths.append(path)
    return sorted(paths)


def internal_for(public_path: Path) -> Path:
    rel = public_path.relative_to(DOC_ROOT)
    return INTERNAL / rel


def process_one(public_path: Path) -> dict:
    original = internal_for(public_path)
    original.parent.mkdir(parents=True, exist_ok=True)
    source = public_path
    if original.exists():
        source = original
        if pymupdf is not None:
            live = pymupdf.open(public_path)
            if has_branding(live, public_path):
                shutil.copy2(public_path, original)
                source = original
    else:
        shutil.copy2(public_path, original)
        source = original
    info = strip_document(source, public_path)
    info["file"] = str(public_path.relative_to(PUBLIC))
    return info


def strip_all() -> dict:
    files = datasheet_paths()
    ok = fail = 0
    failures: list[dict] = []
    for i, path in enumerate(files, 1):
        info = process_one(path)
        if info.get("ok"):
            ok += 1
        else:
            fail += 1
            failures.append(info)
        if i % 50 == 0:
            print(f"  {i}/{len(files)}")
    summary = {"total": len(files), "ok": ok, "fail": fail, "failures": failures}
    print(json.dumps({k: v for k, v in summary.items() if k != "failures"}, indent=2))
    if failures:
        print("failures", json.dumps(failures[:20], indent=2, ensure_ascii=False))
    return summary


if __name__ == "__main__":
    if pymupdf is None:
        sys.exit("pymupdf required")
    if len(sys.argv) > 1 and sys.argv[1] == "--one":
        target = Path(sys.argv[2])
        print(json.dumps(process_one(target), indent=2, ensure_ascii=False))
    else:
        strip_all()
