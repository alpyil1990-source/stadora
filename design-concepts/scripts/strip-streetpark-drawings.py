#!/usr/bin/env python3
"""Strip STREETPARK branding and Czech copy from public anchoring drawings.

Keeps the drawing, English LEGEND, English disclaimer, model code and version.
Removes the STREETPARK wordmark, streetpark.eu, Czech LEGENDA, Czech disclaimer
and the title-block copyright. Originals stay under internal/streetpark/docs/.

Product sheets are handled by strip-streetpark-datasheets.py — not this script.
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

try:
    import pytesseract
    from PIL import Image
except ImportError:  # pragma: no cover
    pytesseract = None
    Image = None

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DOC_ROOT = PUBLIC / "docs" / "streetpark"
INTERNAL = ROOT / "internal" / "streetpark" / "docs"
GEN = ROOT / "src" / "data" / "generated"
SERIES_PATH = GEN / "streetpark-series.json"

CZECH_CHARS = re.compile(r"[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]")
REMOVE_RE = re.compile(
    r"LEGENDA|"
    r"s?tree?t?p[oa]rk|"
    r"p[oa]rk\.eu|"
    r"streetp\w*\.eu|"
    r"STR[E=Z]+T\s*PARK|"
    r"All rights reserved|"
    r"Protection of industrial|"
    r"Protection in industrial|"
    r"Vsechna prava|"
    r"Chraneno prum|"
    r"PRO KOTVENI|"
    r"PRO ZEMINOVY|"
    r"Rozmery vyrobk|"
    r"Dlazba|"
    r"Chemicka kotva|"
    r"Betonovy zaklad|"
    r"Sterkove loze|"
    r"Kontramatic|"
    r"zeminov|"
    r"obchodnim oddelen",
    re.I,
)
KEEP_RE = re.compile(
    r"\bLEGEND\b|"
    r"\bPavement\b|"
    r"\bChemical anchor\b|"
    r"\bConcrete foundation\b|"
    r"\bCompacted gravel\b|"
    r"\bCounter nuts\b|"
    r"Dimensions of product|"
    r"^version\s*:|"
    r"\bUNDER PAVEMENT\b|"
    r"\bABOVE PAVEMENT\b|"
    r"\bFOR SOIL FOUNDATION\b|"
    r"^Detail\b",
    re.I,
)
# ASCII fold so extracted text without diacritics still matches.
FOLD = str.maketrans(
    {
        "á": "a",
        "č": "c",
        "ď": "d",
        "é": "e",
        "ě": "e",
        "í": "i",
        "ň": "n",
        "ó": "o",
        "ř": "r",
        "š": "s",
        "ť": "t",
        "ú": "u",
        "ů": "u",
        "ý": "y",
        "ž": "z",
        "Á": "A",
        "Č": "C",
        "Ď": "D",
        "É": "E",
        "Ě": "E",
        "Í": "I",
        "Ň": "N",
        "Ó": "O",
        "Ř": "R",
        "Š": "S",
        "Ť": "T",
        "Ú": "U",
        "Ů": "U",
        "Ý": "Y",
        "Ž": "Z",
    }
)


def fold(text: str) -> str:
    return (text or "").translate(FOLD)


def should_redact_line(text: str) -> bool:
    raw = (text or "").strip()
    if not raw:
        return False
    folded = fold(raw)
    if KEEP_RE.search(raw) or KEEP_RE.search(folded):
        # Mixed Czech+English on one line: still drop if it is clearly Czech/brand.
        if CZECH_CHARS.search(raw) or REMOVE_RE.search(folded) or REMOVE_RE.search(raw):
            if re.search(r"\bLEGEND\b", raw) and "LEGENDA" not in raw.upper():
                return False
            if re.search(r"Dimensions of product", raw, re.I):
                return False
            if re.match(r"version\s*:", raw, re.I):
                return False
            return True
        return False
    if CZECH_CHARS.search(raw):
        return True
    return bool(REMOVE_RE.search(raw) or REMOVE_RE.search(folded))


def expand(rect: pymupdf.Rect, pad: float = 1.8) -> pymupdf.Rect:
    return pymupdf.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad)


def display_rect(page: pymupdf.Page, rect: pymupdf.Rect) -> pymupdf.Rect:
    return pymupdf.Rect(rect) * page.rotation_matrix


def annot_from_display(page: pymupdf.Page, rect: pymupdf.Rect) -> pymupdf.Rect:
    return pymupdf.Rect(rect) * page.derotation_matrix


def add_redact(page: pymupdf.Page, rect: pymupdf.Rect, pad: float = 1.8) -> None:
    box = expand(rect, pad)
    if box.width < 0.5 or box.height < 0.5:
        return
    page.add_redact_annot(box, fill=(1, 1, 1))


def is_wordmark_image(
    width: int,
    height: int,
    raw_rect: pymupdf.Rect,
    page: pymupdf.Page,
) -> bool:
    short, long = min(width, height), max(width, height)
    if long / max(short, 1) < 3.15:
        return False
    if short > 430 or long < 180:
        return False
    disp = display_rect(page, raw_rect)
    page_rect = page.rect
    # Image rects on rotated pages are already in unrotated space; display_rect maps them.
    if disp.width <= 0 or disp.height <= 0:
        disp = pymupdf.Rect(raw_rect)
    cx = (disp.x0 + disp.x1) / 2
    cy = (disp.y0 + disp.y1) / 2
    near_bottom = cy > page_rect.height * 0.78
    near_right = cx > page_rect.width * 0.70
    near_left = cx < page_rect.width * 0.14
    return near_bottom or near_right or near_left


def delete_wordmarks(page: pymupdf.Page, doc: pymupdf.Document) -> int:
    n = 0
    for im in list(page.get_images(full=True)):
        xref = im[0]
        try:
            info = doc.extract_image(xref)
        except Exception:
            continue
        w, h = info["width"], info["height"]
        rects = page.get_image_rects(xref) or []
        if not rects:
            continue
        if not any(is_wordmark_image(w, h, r, page) for r in rects):
            continue
        try:
            page.delete_image(xref)
            n += 1
        except Exception:
            for r in rects:
                add_redact(page, r, pad=0.8)
            n += 1
    return n


def redact_text_lines(page: pymupdf.Page) -> int:
    n = 0
    data = page.get_text("dict")
    for block in data.get("blocks") or []:
        if block.get("type") != 0:
            continue
        for line in block.get("lines") or []:
            text = "".join(span.get("text") or "" for span in line.get("spans") or [])
            if should_redact_line(text):
                add_redact(page, pymupdf.Rect(line["bbox"]), pad=1.6)
                n += 1
    return n


def leftover_text(page: pymupdf.Page) -> list[str]:
    text = page.get_text() or ""
    folded = fold(text)
    hits: list[str] = []
    if re.search(r"LEGENDA", text, re.I):
        hits.append("LEGENDA")
    if re.search(r"streetpark|sreetpark|park\.eu", text, re.I):
        hits.append("streetpark")
    if CZECH_CHARS.search(text) and re.search(
        r"Dlažba|Chemická|Betonový|Štěrkové|Kontramatic|Rozměry|Všechna|Chráněno|KOTVENÍ",
        text,
    ):
        hits.append("czech")
    if re.search(r"All rights reserved", text, re.I):
        hits.append("copyright-en")
    if re.search(r"Rozmery vyrobk|Vsechna prava|LEGENDA", folded, re.I) and "czech" not in hits:
        if "LEGENDA" not in hits:
            hits.append("czech-ascii")
    return hits


def _ocr_rows(image: Image.Image) -> list[tuple[int, int, int, int, str]]:
    data = pytesseract.image_to_data(
        image, lang="eng+ces", output_type=pytesseract.Output.DICT
    )
    rows = []
    for i, raw in enumerate(data["text"]):
        text = (raw or "").strip()
        if not text:
            continue
        try:
            conf = float(data["conf"][i])
        except Exception:
            conf = 0
        if conf < 30:
            continue
        rows.append(
            (
                data["left"][i],
                data["top"][i],
                data["width"][i],
                data["height"][i],
                text,
            )
        )
    return rows


def upright_ocr(
    page: pymupdf.Page, zoom: float = 1.6
) -> tuple[bool, float, list[tuple[pymupdf.Rect, str]], int, int]:
    """OCR in reading orientation. Rects are in upright pixel space (not yet page space)."""
    if pytesseract is None or Image is None:
        return False, zoom, []
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    portrait = page.rect.height > page.rect.width + 20
    if portrait:
        img = img.rotate(90, expand=True)
    rows = _ocr_rows(img)
    words = [
        (pymupdf.Rect(l, t, l + w, t + h), text) for l, t, w, h, text in rows
    ]
    return portrait, zoom, words, pix.width, pix.height


def map_upright_to_page(
    rect: pymupdf.Rect,
    *,
    portrait: bool,
    zoom: float,
    native_w: int,
    page: pymupdf.Page,
) -> pymupdf.Rect:
    """Map an upright-pixel box to PDF annot space."""
    if portrait:
        # Inverse of PIL rotate(90) CCW: (x', y') -> (W - y' - h, x')
        x0 = native_w - rect.y1
        y0 = rect.x0
        x1 = native_w - rect.y0
        y1 = rect.x1
    else:
        x0, y0, x1, y1 = rect.x0, rect.y0, rect.x1, rect.y1
    display = pymupdf.Rect(x0 / zoom, y0 / zoom, x1 / zoom, y1 / zoom)
    return annot_from_display(page, display)


def cluster_ocr_lines(
    words: list[tuple[pymupdf.Rect, str]], y_tol: float = 9.0, gap: float = 80.0
) -> list[tuple[pymupdf.Rect, str]]:
    """Cluster OCR words into reading-order lines in upright pixel space."""
    items = sorted(words, key=lambda w: (round(w[0].y0 / y_tol), w[0].x0))
    lines: list[list[tuple[pymupdf.Rect, str]]] = []
    for rect, text in items:
        placed = False
        for line in lines:
            ly = sum(r.y0 for r, _ in line) / len(line)
            if abs(rect.y0 - ly) > y_tol:
                continue
            xs = sorted(line, key=lambda w: w[0].x0)
            last = xs[-1][0]
            if rect.x0 - last.x1 > gap:
                continue
            if xs[0][0].x0 - rect.x1 > gap:
                continue
            line.append((rect, text))
            placed = True
            break
        if not placed:
            lines.append([(rect, text)])
    out: list[tuple[pymupdf.Rect, str]] = []
    for line in lines:
        union = line[0][0]
        for r, _ in line[1:]:
            union |= r
        text = " ".join(t for _, t in sorted(line, key=lambda w: w[0].x0))
        out.append((union, text))
    return out


def _is_legend_header_en(text: str) -> bool:
    folded = fold(text).strip()
    return bool(re.match(r"^LEGEND:?$", folded, re.I)) and "LEGENDA" not in text.upper()


def _is_legend_header_cz(text: str) -> bool:
    return "LEGENDA" in fold(text).upper()


def _thin(rect: pymupdf.Rect, max_h: float = 14.0) -> pymupdf.Rect:
    height = min(rect.height, max_h)
    return pymupdf.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + height)


def redact_ocr(page: pymupdf.Page) -> int:
    portrait, zoom, words, native_w, native_h = upright_ocr(page)
    if not words:
        return 0
    n = 0

    def add_upright(rect: pymupdf.Rect, pad_px: float = 2.0) -> None:
        nonlocal n
        if rect.width < 1 or rect.height < 1:
            return
        box = pymupdf.Rect(
            rect.x0 - pad_px, rect.y0 - pad_px, rect.x1 + pad_px, rect.y1 + pad_px
        )
        add_redact(
            page,
            map_upright_to_page(
                box, portrait=portrait, zoom=zoom, native_w=native_w, page=page
            ),
            pad=0.3,
        )
        n += 1

    lines = cluster_ocr_lines(words)
    cz_legend = [ln for ln in lines if _is_legend_header_cz(ln[1])]
    en_legend = [ln for ln in lines if _is_legend_header_en(ln[1])]
    if cz_legend and en_legend:
        cz_rect, _ = cz_legend[0]
        en_rect, _ = en_legend[0]
        if cz_rect.y0 < en_rect.y0 - 4:
            block = pymupdf.Rect(
                min(cz_rect.x0, en_rect.x0) - 6,
                cz_rect.y0 - 3,
                max(cz_rect.x1 + 200, en_rect.x1 + 50),
                en_rect.y0 - 4,
            )
            add_upright(block, pad_px=1.0)
    elif cz_legend:
        cz_rect, _ = cz_legend[0]
        add_upright(
            pymupdf.Rect(cz_rect.x0 - 4, cz_rect.y0 - 2, cz_rect.x1 + 200, cz_rect.y0 + 72),
            pad_px=1.0,
        )

    rozmer = [
        w
        for w in words
        if re.search(r"Rozm[eě]r|v[yý]robk", fold(w[1]), re.I)
    ]
    dimensions = [
        w for w in words if re.search(r"^Dimensions", w[1], re.I)
    ]
    if rozmer:
        y0 = min(w[0].y0 for w in rozmer)
        y1 = y0 + 14
        if dimensions:
            y1 = min(y0 + 22, min(w[0].y0 for w in dimensions) - 3)
        right = native_w * 0.70
        version_words = [
            w for w in words if re.search(r"^version", fold(w[1]), re.I)
        ]
        if version_words:
            right = min(right, min(w[0].x0 for w in version_words) - 20)
        add_upright(pymupdf.Rect(24, y0 - 2, right, y1), pad_px=0.5)

    for rect, text in words:
        if not should_redact_line(text):
            continue
        if KEEP_RE.search(text) or KEEP_RE.search(fold(text)):
            continue
        folded = fold(text)
        if re.search(r"STR[E=Z]+T\s*PARK|s?tree?t?p[oa]rk|p[oa]rk\.eu|streetp\w*\.eu", folded, re.I):
            add_upright(
                pymupdf.Rect(rect.x0 - 4, rect.y0 - 3, rect.x1 + 8, rect.y1 + 4),
                pad_px=2.0,
            )
            continue
        add_upright(_thin(rect, 15), pad_px=2.0)

    for rect, text in lines:
        if _is_legend_header_en(text) or KEEP_RE.search(text):
            continue
        if not should_redact_line(text):
            continue
        # Skip mixed English/Czech clusters — words already handled.
        if KEEP_RE.search(text) or re.search(
            r"\b(Dimensions|Pavement|version:|informative)\b", text, re.I
        ):
            continue
        folded = fold(text)
        if re.search(r"STR[E=Z]+T|streetp[oa]rk|streetp\w*\.eu", folded, re.I):
            add_upright(_thin(rect, 18), pad_px=3.0)
            continue
        add_upright(_thin(rect, 15), pad_px=1.5)

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


def strip_document(src: Path, dest: Path, *, force_ocr: bool | None = None) -> dict:
    if pymupdf is None:
        dest.write_bytes(src.read_bytes())
        return {"ok": False, "reason": "pymupdf saknas — original kopierat"}
    doc = pymupdf.open(src)
    meta = dict(doc.metadata or {})
    for key in ("title", "author", "subject", "keywords", "creator", "producer"):
        val = meta.get(key) or ""
        meta[key] = re.sub(r"STREETPARK", "", val, flags=re.I).strip()
    doc.set_metadata(meta)

    text_n = logo_n = ocr_n = 0
    for page in doc:
        logo_n += delete_wordmarks(page, doc)
        text_n += redact_text_lines(page)
        page.apply_redactions(images=0)
        drop_brand_links(page)
        remaining = page.get_text() or ""
        extractable = bool(remaining.strip())
        if force_ocr is None:
            need_ocr = (
                not extractable
                or bool(leftover_text(page))
                or (
                    "LEGEND" not in remaining.upper()
                    and "Dimensions of" not in remaining
                )
            )
        else:
            need_ocr = force_ocr
        if need_ocr:
            ocr_n += redact_ocr(page)
            page.apply_redactions(images=0)
            drop_brand_links(page)

    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    doc.save(tmp, garbage=4, deflate=True)
    check = pymupdf.open(tmp)
    left = leftover_text(check[0]) if check.page_count else ["empty-doc"]
    # Visual leftovers on empty-text pages are accepted if OCR ran; text leftovers fail.
    if left and any(h in left for h in ("LEGENDA", "streetpark", "czech", "copyright-en")):
        # Second OCR pass on remaining extractable brand text.
        doc2 = pymupdf.open(tmp)
        extra = 0
        for page in doc2:
            extra += redact_text_lines(page)
            extra += redact_ocr(page)
            page.apply_redactions(images=0)
        doc2.save(tmp, garbage=4, deflate=True)
        ocr_n += extra
        check = pymupdf.open(tmp)
        left = leftover_text(check[0]) if check.page_count else ["empty-doc"]
    tmp.replace(dest)
    ok = not any(h in left for h in ("LEGENDA", "streetpark", "copyright-en"))
    return {
        "ok": ok,
        "pages": doc.page_count,
        "textRedactions": text_n,
        "logos": logo_n,
        "ocrRedactions": ocr_n,
        "leftover": left,
        "brandLeft": bool(left),
    }


def drawing_paths() -> list[Path]:
    paths: list[Path] = []
    seen: set[Path] = set()
    if SERIES_PATH.exists():
        data = json.loads(SERIES_PATH.read_text())
        for row in data.get("series") or []:
            for doc in row.get("documents") or []:
                if doc.get("kind") != "anchoring":
                    continue
                href = doc.get("href") or ""
                if not href.lower().endswith(".pdf"):
                    continue
                path = PUBLIC / href.lstrip("/")
                if path not in seen and path.is_file():
                    seen.add(path)
                    paths.append(path)
    for path in DOC_ROOT.rglob("*.pdf"):
        name = path.name.lower()
        if path in seen:
            continue
        if "product-sheet" in name or name.startswith("produktovy"):
            continue
        if "kotven" in name or "anchor" in name:
            seen.add(path)
            paths.append(path)
    return sorted(paths)


def internal_for(public_path: Path) -> Path:
    rel = public_path.relative_to(DOC_ROOT)
    return INTERNAL / rel


def process_one(public_path: Path, *, force_ocr: bool | None = None) -> dict:
    original = internal_for(public_path)
    original.parent.mkdir(parents=True, exist_ok=True)
    source = public_path
    if original.exists():
        source = original
    else:
        shutil.copy2(public_path, original)
        source = original
    info = strip_document(source, public_path, force_ocr=force_ocr)
    info["file"] = str(public_path.relative_to(PUBLIC))
    return info


def strip_all(only: list[Path] | None = None) -> dict:
    files = only if only is not None else drawing_paths()
    ok = fail = 0
    failures: list[dict] = []
    for i, path in enumerate(files, 1):
        info = process_one(path)
        if info.get("ok"):
            ok += 1
        else:
            fail += 1
            failures.append(info)
        print(f"  {i}/{len(files)} {'ok' if info.get('ok') else 'FAIL'} {path.name} {info}")
    summary = {"total": len(files), "ok": ok, "fail": fail, "failures": failures}
    print(json.dumps({k: v for k, v in summary.items() if k != "failures"}, indent=2))
    if failures:
        print("failures", json.dumps(failures[:30], indent=2, ensure_ascii=False))
    return summary


if __name__ == "__main__":
    if pymupdf is None:
        sys.exit("pymupdf required")
    if len(sys.argv) > 1 and sys.argv[1] == "--one":
        target = Path(sys.argv[2])
        print(json.dumps(process_one(target), indent=2, ensure_ascii=False))
    elif len(sys.argv) > 1 and sys.argv[1] == "--sample":
        rels = sys.argv[2:]
        files = [DOC_ROOT.joinpath(*r.split("/")) for r in rels]
        strip_all(files)
    else:
        strip_all()
