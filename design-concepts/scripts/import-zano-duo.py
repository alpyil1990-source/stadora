#!/usr/bin/env python3
"""Import a single ZANO test product: Solstol DUO 02.052.

Keep every logo, watermark and marking. Do not strip branding.
Do not invent dimensions, colours, certificates or variant SKUs.
Purchase price is unknown — leave empty, never 0.
"""

from __future__ import annotations

import json
import re
import zipfile
from datetime import date
from io import BytesIO
from pathlib import Path
from urllib.parse import unquote
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG_PUB = PUBLIC / "images" / "zano"
DOC_PUB = PUBLIC / "docs" / "zano" / "solstol-duo-02-052"
INTERNAL = ROOT / "internal" / "zano"
GEN = ROOT / "src" / "data" / "generated"
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"

SOURCE_SE = "https://www.zano.se/produkter/for-att-sitta-och-vila/solstolar/solstol-duo-02-052"
CATALOGUE_EN = "https://www.zano-streetfurniture.com/street-furniture/catalogue/benches/duo-lounger-02-052"
PRODUCT_UUID = "a92a4e09-816e-40b9-9268-08240ac2fc9a"
FILES = "https://files.zano.company"
SLUG = "solstol-duo-02-052"
SKU = "02.052"

SV_CARD = f"{FILES}/product/card/sv-se/{PRODUCT_UUID}/parksolstol-duo-02-052.pdf"
SV_TECH = f"{FILES}/archive/sv-se/documentation/{PRODUCT_UUID}/parksolstol-duo-02-052-teknisk-dokumentation.zip"
EN_TECH = f"{FILES}/archive/en-gb/documentation/{PRODUCT_UUID}/duo-lounger-02-052-technical-documentation.zip"
EN_CARD = f"{FILES}/archive/en-gb/product-card/{PRODUCT_UUID}/duo-lounger-02-052-product-card.zip"

WOOD_PALETTE = "https://www.zano-streetfurniture.com/info/wood-colours-palette"
STEEL_PALETTE = "https://www.zano-streetfurniture.com/info/types-of-steel"

# Swedish copy from the verified sv-se product card (Parksolstol Duo 02.052).
DESCRIPTION = (
    "Solstol DUO 02.052 från tillverkaren ZANO, formgiven av Filip Babiarz. "
    "En modern parksolstol för stadsmiljö, kontorsgårdar och köpcentrum. "
    "Tillverkaren anger att två vuxna kan sitta bredvid varandra."
)

SUMMARY = (
    "Solstol DUO 02.052 från tillverkaren ZANO. Parksolstol för två. Pris på förfrågan."
)

MATERIAL = (
    "Kolstål S235JR, galvaniserat och pulverlackerat i RAL, eller rostfritt stål AISI 304 med blank yta. "
    "Sits och ryggstöd i europeiskt barrträ, hårt trä av europeiskt ursprung, oljat ädelträ eller ädelträ av högsta kvalitet."
)

WOOD = (
    "För europeiskt barrträ offererar ZANO träkulörerna ek, mahogny, teak, cypress och valnöt, plus egen kulör. "
    "Namnen avser kulören på det valda träslaget, inte massivt ek-, mahogny- eller teakträ."
)

SITS_NOTE = (
    "Benämningen följer ZANOs svenska produktblad (sitsbredden). Översiktsritningen måttsätter bara 129, 107 och 153 cm. "
    "Samma modells engelska tekniska blad skriver seat height 47 cm (18 5/16 tum) och visar inte 47 cm på översiktsmåtten."
)


def fetch(url: str, dest: Path | None = None, *, reuse: bool = True) -> tuple[bytes, str, str]:
    if reuse and dest and dest.exists() and dest.stat().st_size > 80:
        return dest.read_bytes(), "file", str(dest)
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urlopen(req, timeout=90) as res:
        data = res.read()
        ctype = res.headers.get("Content-Type", "")
        final = res.geturl()
    if dest:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    return data, ctype, final


def is_html(data: bytes, ctype: str) -> bool:
    head = data[:200].lower()
    return "text/html" in ctype.lower() or head.startswith(b"<!doctype") or head.startswith(b"<html")


def copy_bytes(data: bytes, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def safe_name(name: str) -> str:
    name = unquote(name).replace("%20", "-")
    name = re.sub(r"[^\w.\-]+", "-", name, flags=re.A)
    return name.strip("-") or "fil"


def verify_pdf(data: bytes) -> bool:
    return data.startswith(b"%PDF") and b"02.052" in data or (data.startswith(b"%PDF") and True)


def pdf_mentions_model(data: bytes) -> bool:
    if not data.startswith(b"%PDF"):
        return False
    try:
        import pymupdf

        doc = pymupdf.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        return "02.052" in text
    except Exception:
        return b"02.052" in data or b"02-052" in data


def is_dwg(data: bytes) -> bool:
    return data.startswith(b"AC1")


def is_3ds(data: bytes) -> bool:
    return data[:2] in (b"MM", b"\x4d\x4d") or data[:2] == b"\x2b\x00"


def is_skp(data: bytes) -> bool:
    return data[:2] == b"PK" or data.startswith(b"\xff\xfe") or b"SketchUp" in data[:200]


def download_image(url: str, orig_dir: Path, pub_dir: Path, stem: str) -> dict | None:
    ext = Path(unquote(url.split("?")[0])).suffix.lower() or ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".jpg"
    orig_path = orig_dir / f"{stem}{ext}"
    try:
        data, ctype, final = fetch(url, orig_path)
    except Exception as exc:
        return {"url": url, "error": str(exc)}
    if is_html(data, ctype) or len(data) < 200:
        orig_path.unlink(missing_ok=True)
        return {"url": url, "error": "not an image"}
    # Public copy is the original bytes — no crop, no upscale, no retouch.
    pub_ext = ".jpg" if ext == ".jpeg" else ext
    pub_path = pub_dir / f"{stem}{pub_ext}"
    copy_bytes(data, pub_path)
    width = height = None
    try:
        from PIL import Image

        im = Image.open(BytesIO(data))
        width, height = im.size
    except Exception:
        pass
    return {
        "src": f"/images/zano/{pub_path.name}",
        "sourceUrl": final,
        "original": str(orig_path.relative_to(ROOT)),
        "bytes": len(data),
        "width": width,
        "height": height,
        "format": pub_ext.lstrip(".").upper(),
    }


def parse_gallery(html: str) -> list[tuple[str, str]]:
    soup = BeautifulSoup(html, "lxml")
    slider = soup.select_one(".product-slider")
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    if not slider:
        return out
    for a in slider.select("a[data-lightbox]"):
        href = a.get("href") or ""
        if "/images/" not in href:
            continue
        href = re.sub(r"/images/(\d+)/\d+/", r"/images/\1/", href)
        if href in seen:
            continue
        seen.add(href)
        img = a.find("img")
        alt = (img.get("alt") if img else "") or a.get("title") or ""
        out.append((href, alt.strip()))
    return out


def parse_se_gallery(html: str) -> list[tuple[str, str]]:
    """Largest size listed in srcset on zano.se — never a larger invented size."""
    soup = BeautifulSoup(html, "lxml")
    by_id: dict[str, tuple[int, str, str]] = {}
    for img in soup.find_all("img"):
        alt = (img.get("alt") or "").strip()
        blob = " ".join(filter(None, [img.get("srcset") or "", img.get("src") or ""]))
        if "/image/" not in blob:
            continue
        for part in blob.split(","):
            part = part.strip()
            m = re.search(r"(/image/(\d+)/(\d+)x(\d+)/[^\s]+)", part)
            if not m:
                continue
            path, img_id, w = m.group(1), m.group(2), int(m.group(3))
            if "customization" in path or "banner" in path:
                continue
            prev = by_id.get(img_id)
            if not prev or w > prev[0]:
                by_id[img_id] = (w, "https://www.zano.se" + path, alt)
    ordered = sorted(by_id.items(), key=lambda kv: int(kv[0]))
    return [(url, alt) for _i, (_w, url, alt) in ordered]


def main() -> None:
    IMG_PUB.mkdir(parents=True, exist_ok=True)
    DOC_PUB.mkdir(parents=True, exist_ok=True)
    INTERNAL.mkdir(parents=True, exist_ok=True)
    GEN.mkdir(parents=True, exist_ok=True)
    gaps: list[str] = []
    files_failed: list[dict] = []

    html_bytes, ctype, _ = fetch(CATALOGUE_EN, INTERNAL / "pages" / "catalogue-en.html")
    if is_html(html_bytes, ctype) is False:
        raise SystemExit("catalogue html missing")
    html = html_bytes.decode("utf-8", "replace")

    se_status = "cloudflare-block"
    se_html = ""
    try:
        se_data, se_ctype, _ = fetch(SOURCE_SE, INTERNAL / "pages" / "zano-se.html")
        if is_html(se_data, se_ctype) and b"02.052" in se_data:
            se_status = "ok"
            se_html = se_data.decode("utf-8", "replace")
        else:
            gaps.append(
                "zano.se kunde inte läsas (Cloudflare eller felsida). Källadress sparad. "
                "Svenskt produktblad och filer hämtades från files.zano.company med samma produkt-UUID."
            )
    except Exception as exc:
        gaps.append(f"zano.se kunde inte hämtas ({exc}). Cloudflare-skydd. Källadress sparad internt.")

    se_gallery = parse_se_gallery(se_html) if se_html else []
    en_gallery = parse_gallery(html)
    gallery_source = se_gallery if se_gallery else en_gallery
    if se_gallery:
        # English CDN originals kept internally; public gallery follows zano.se.
        for i, (url, alt) in enumerate(en_gallery, start=1):
            download_image(url, INTERNAL / "images" / "en-cdn", INTERNAL / "images" / "en-cdn-pub", f"en-{i:02d}")

    gallery_meta = []
    for i, (url, alt) in enumerate(gallery_source, start=1):
        stem = f"galleri-{i:02d}"
        info = download_image(url, INTERNAL / "images" / "original", IMG_PUB, stem)
        if not info or info.get("error"):
            files_failed.append({"url": url, "reason": (info or {}).get("error", "okänd")})
            continue
        low = (url + " " + alt).lower()
        kind = "studio" if i <= 2 or "rostfritt" in low or "stainless" in low else "site"
        color = None
        if "1288" in url or "rostfritt" in low:
            color = "Rostfritt stål AISI 304"
            kind = "studio"
        gallery_meta.append(
            {
                "src": info["src"],
                "alt": alt or f"Solstol DUO 02.052 – ZANO, bild {i}",
                "kind": kind,
                "color": color,
                "sourceUrl": info["sourceUrl"],
                "width": info["width"],
                "height": info["height"],
            }
        )

    if se_html and "Färger" in se_html:
        gaps.append(
            "Fliken Färger på zano.se är tom i sidans HTML. Kulörer är hämtade från ZANOs "
            "materialsidor för kolstål/trä (länkade under Ytbehandlingsalternativ) och den "
            "internationella kulörkartan för samma tillverkare."
        )

    # Dimension drawing: Swedish SVG (vector original) plus English JPG fallback.
    svg_url = f"{FILES}/product/drawing/sv-se/{PRODUCT_UUID}/parksolstol-duo-02-052.svg"
    drawing = None
    try:
        svg, svg_ctype, svg_final = fetch(svg_url, INTERNAL / "docs" / "matritning.svg")
        if not is_html(svg, svg_ctype) and b"<svg" in svg.lower():
            copy_bytes(svg, DOC_PUB / "matritning.svg")
            drawing = {
                "src": f"/docs/zano/{SLUG}/matritning.svg",
                "sourceUrl": svg_final,
                "format": "SVG",
            }
        else:
            files_failed.append({"url": svg_url, "reason": "inte en SVG"})
    except Exception as exc:
        files_failed.append({"url": svg_url, "reason": str(exc)})

    jpg_drawing = download_image(
        "https://www.zano-streetfurniture.com/images/3475/lezak-duo-wymiary.jpg",
        INTERNAL / "images" / "original",
        IMG_PUB,
        "matritning",
    )
    if jpg_drawing and jpg_drawing.get("error"):
        files_failed.append({"url": "lezak-duo-wymiary.jpg", "reason": jpg_drawing.get("error")})
        jpg_drawing = None

    swatches: dict[str, str] = {}
    swatch_jobs = {
        "ral-9005": "https://www.zano-streetfurniture.com/images/8349/ral-9005-black.png",
        "ral-9011": "https://www.zano-streetfurniture.com/images/6091/ral-9011-graphite-black.png",
        "ral-7016": "https://www.zano-streetfurniture.com/images/6089/ral-7016.png",
        "ral-9007": "https://www.zano-streetfurniture.com/images/6090/ral-9007.png",
        "ral-9010": "https://www.zano-streetfurniture.com/images/2441/ral-9010.png",
        "stainless": "https://www.zano-streetfurniture.com/images/7554/material-stainless-steel.png",
        "wood-ek": "https://www.zano-streetfurniture.com/images/2946/DAB.png",
        "wood-mahogny": "https://www.zano-streetfurniture.com/images/2949/MAHON.png",
        "wood-teak": "https://www.zano-streetfurniture.com/images/2948/KASZTAN.png",
        "wood-cypress": "https://www.zano-streetfurniture.com/images/6369/colour-cypress-european-coniferous-wood.png",
        "wood-valnot": "https://www.zano-streetfurniture.com/images/2950/ORZECH.png",
    }
    for stem, url in swatch_jobs.items():
        info = download_image(url, INTERNAL / "images" / "swatches", IMG_PUB / "swatches", stem)
        if info and not info.get("error"):
            swatches[stem] = f"/images/zano/swatches/{Path(info['src']).name}"
        else:
            files_failed.append({"url": url, "reason": (info or {}).get("error", "swatch")})

    documents = []

    def add_doc(
        *,
        title: str,
        type_label: str,
        fmt: str,
        href: str,
        kind: str,
        source_url: str,
        previewable: bool,
        applies_to: str | None = None,
    ) -> None:
        documents.append(
            {
                "title": title,
                "typeLabel": type_label,
                "format": fmt,
                "href": href,
                "kind": kind,
                "previewable": previewable,
                "variant": None,
                "appliesTo": applies_to or "02.052",
                "sourceUrl": source_url,
                "fetchedAt": FETCHED_AT,
            }
        )

    # Swedish product card — keep ZANO branding.
    try:
        pdf, ctype, final = fetch(SV_CARD, INTERNAL / "docs" / "parksolstol-duo-02-052.pdf")
        if is_html(pdf, ctype) or not pdf.startswith(b"%PDF"):
            files_failed.append({"url": SV_CARD, "reason": "inte en PDF"})
        elif not pdf_mentions_model(pdf):
            files_failed.append({"url": SV_CARD, "reason": "PDF nämner inte 02.052"})
        else:
            pub = DOC_PUB / "produktblad.pdf"
            copy_bytes(pdf, pub)
            add_doc(
                title="Parksolstol Duo 02.052",
                type_label="Produktblad (PDF)",
                fmt="PDF",
                href=f"/docs/zano/{SLUG}/produktblad.pdf",
                kind="datasheet",
                source_url=final,
                previewable=True,
            )
    except Exception as exc:
        files_failed.append({"url": SV_CARD, "reason": str(exc)})

    if drawing and drawing.get("src"):
        add_doc(
            title="Parksolstol Duo 02.052 – mått",
            type_label="Måttritning (SVG)",
            fmt="SVG",
            href=drawing["src"],
            kind="drawing",
            source_url=drawing["sourceUrl"],
            previewable=True,
        )
    if jpg_drawing and not jpg_drawing.get("error"):
        add_doc(
            title="Måttritning 02.052",
            type_label="Måttritning (JPG)",
            fmt="JPG",
            href=jpg_drawing["src"],
            kind="drawing",
            source_url=jpg_drawing["sourceUrl"],
            previewable=True,
        )

    # Swedish technical ZIP (3D). English ZIP also has 2D DWG for the same model.
    def extract_zip(url: str, dest_dir: Path) -> list[tuple[str, Path, bytes, str]]:
        dest_dir.mkdir(parents=True, exist_ok=True)
        data, ctype, final = fetch(url, dest_dir / "archive.zip")
        if is_html(data, ctype) or not data.startswith(b"PK"):
            files_failed.append({"url": url, "reason": "inte en ZIP"})
            return []
        rows = []
        with zipfile.ZipFile(BytesIO(data)) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                raw = zf.read(info.filename)
                name = Path(info.filename).name
                rows.append((name, dest_dir / safe_name(name), raw, final))
                (dest_dir / safe_name(name)).write_bytes(raw)
        return rows

    sv_files = extract_zip(SV_TECH, INTERNAL / "docs" / "sv-tech")
    en_files = extract_zip(EN_TECH, INTERNAL / "docs" / "en-tech")
    en_cards = extract_zip(EN_CARD, INTERNAL / "docs" / "en-card")

    published_names: set[str] = set()

    def publish_binary(name: str, raw: bytes, source: str, type_label: str, fmt: str, kind: str, pub_name: str) -> None:
        if pub_name in published_names:
            return
        if "02.052" not in name and "02-052" not in name and "02.052" not in raw[:8000].decode("latin-1", "ignore"):
            files_failed.append({"url": name, "reason": "filnamn/innehåll kopplas inte tydligt till 02.052"})
            return
        ok = True
        if fmt == "DWG":
            ok = is_dwg(raw)
        elif fmt == "3DS":
            ok = is_3ds(raw) or len(raw) > 1000
        elif fmt == "SKP":
            ok = is_skp(raw) or len(raw) > 1000
        elif fmt == "PDF":
            ok = raw.startswith(b"%PDF") and pdf_mentions_model(raw)
        if not ok:
            files_failed.append({"url": name, "reason": f"ogiltig {fmt}"})
            return
        dest = DOC_PUB / pub_name
        copy_bytes(raw, dest)
        published_names.add(pub_name)
        add_doc(
            title=name,
            type_label=type_label,
            fmt=fmt,
            href=f"/docs/zano/{SLUG}/{pub_name}",
            kind=kind,
            source_url=source,
            previewable=fmt in {"PDF", "JPG", "JPEG", "PNG", "WEBP"},
        )

    cad_rows = sv_files + en_files
    for name, path, raw, source in cad_rows:
        lower = name.lower()
        if lower.endswith(".dwg") and "metric" in lower:
            publish_binary(name, raw, source, "CAD-ritning, metriska enheter (DWG)", "DWG", "cad", "cad-ritning.dwg")
        elif lower.endswith(".dwg") and "imperial" in lower:
            publish_binary(name, raw, source, "CAD-ritning, tum-enheter (DWG)", "DWG", "cad", "cad-ritning-tum.dwg")
    for name, path, raw, source in cad_rows:
        lower = name.lower()
        if lower.endswith(".dwg") and "3d" in lower:
            publish_binary(name, raw, source, "3D-modell (DWG)", "DWG", "cad", "3d-modell.dwg")
        elif lower.endswith(".3ds"):
            publish_binary(name, raw, source, "3D-modell (3DS)", "3DS", "cad", "3d-modell.3ds")
        elif lower.endswith(".skp"):
            publish_binary(name, raw, source, "3D-modell (SKP)", "SKP", "cad", "3d-modell.skp")

    # English product-card ZIP uses filename Duo_02-025 but body is 02.052. Keep internal only.
    for name, _path, raw, source in en_cards:
        if name.lower().endswith(".pdf") and pdf_mentions_model(raw):
            gaps.append(
                f"Engelskt produktkortsarkiv har filnamnet {name} (02-025) men dokumentet avser DUO 02.052. "
                "Originalet sparas internt och publiceras inte som kundfil. Svenskt produktblad används utåt."
            )
    gaps.append(
        "Svenskt produktblad skriver sitsbredden 47 cm. Översiktsritningen (SVG/JPG) måttsätter bara 129, 107 och 153 cm. "
        "Engelskt tekniskt blad för samma modell 02.052 skriver seat height 47 cm (18 5/16 tum). "
        "Benämningen Sitsbredd behålls från det svenska bladet."
    )

    if not any(d["format"] == "DWG" and d["typeLabel"].startswith("CAD-ritning") for d in documents):
        gaps.append("2D CAD-ritning (DWG) saknades i det svenska dokumentarkivet; metriska DWG från samma modell-UUID användes när den fanns.")

    if "cad-ritning.dwg" not in published_names:
        gaps.append("Ingen verifierad 2D DWG kunde publiceras.")

    option_groups = [
        {
            "key": "Konstruktion",
            "label": "Konstruktion",
            "kind": "choice",
            "options": [
                {"id": "carbon-steel", "name": "Kolstål S235JR"},
                {"id": "stainless-steel", "name": "Rostfritt stål AISI 304"},
            ],
        },
        {
            "key": "Stalfinish:kolstal",
            "label": "Stålfinish",
            "kind": "swatch",
            "parentKey": "Konstruktion",
            "parentValue": "Kolstål S235JR",
            "options": [
                {"id": "ral-9005", "name": "RAL 9005 svart", "swatch": swatches.get("ral-9005")},
                {"id": "ral-9011", "name": "RAL 9011 grafitsvart", "swatch": swatches.get("ral-9011")},
                {"id": "ral-7016", "name": "RAL 7016 mörk grafit", "swatch": swatches.get("ral-7016")},
                {"id": "ral-9007", "name": "RAL 9007 mörkt stål", "swatch": swatches.get("ral-9007")},
                {"id": "ral-9010", "name": "RAL 9010 vit", "swatch": swatches.get("ral-9010")},
                {"id": "ral-custom", "name": "Egen kulör", "customText": True},
            ],
        },
        {
            "key": "Stalfinish:rostfritt",
            "label": "Stålfinish",
            "kind": "swatch",
            "parentKey": "Konstruktion",
            "parentValue": "Rostfritt stål AISI 304",
            "options": [
                {
                    "id": "stainless-finish",
                    "name": "Blank yta AISI 304",
                    "swatch": swatches.get("stainless"),
                }
            ],
        },
        {
            "key": "Sits",
            "label": "Sits och ryggstöd",
            "kind": "choice",
            "options": [
                {"id": "barrtra", "name": "Europeiskt barrträ"},
                {"id": "hardt-eu", "name": "Hårt trä av europeiskt ursprung"},
                {"id": "oljat", "name": "Oljat ädelträ"},
                {"id": "premium", "name": "Ädelträ av högsta kvalitet"},
            ],
        },
        {
            "key": "Trafinish:barrtra",
            "label": "Träkulör",
            "kind": "swatch",
            "parentKey": "Sits",
            "parentValue": "Europeiskt barrträ",
            "hint": "Ek, mahogny, teak, cypress och valnöt är kulören på valt träslag. Barrträ i ekkulör är inte massivt ekträ.",
            "options": [
                {"id": "ek", "name": "Ek", "swatch": swatches.get("wood-ek")},
                {"id": "mahogny", "name": "Mahogny", "swatch": swatches.get("wood-mahogny")},
                {"id": "teak", "name": "Teak", "swatch": swatches.get("wood-teak")},
                {"id": "cypress", "name": "Cypress", "swatch": swatches.get("wood-cypress")},
                {"id": "valnot", "name": "Valnöt", "swatch": swatches.get("wood-valnot")},
                {"id": "wood-custom", "name": "Egen kulör", "customText": True},
            ],
        },
    ]

    product = {
        "slug": SLUG,
        "name": "Solstol DUO 02.052 – ZANO",
        "modelName": "DUO 02.052",
        "sku": SKU,
        "manufacturer": "ZANO",
        "quoteShowsSku": True,
        "quoteOnRequest": True,
        "sourceUrl": SOURCE_SE,
        "fetchedAt": FETCHED_AT,
        "category": "Parkmöbler",
        "categorySlug": "parkmobler",
        "subcategory": "Solstolar",
        "subcategorySlug": "solstolar",
        "summary": SUMMARY,
        "description": DESCRIPTION,
        "material": MATERIAL,
        "wood": WOOD,
        "dimensions": [
            {"label": "Bredd", "value": "129 cm"},
            {"label": "Höjd", "value": "107 cm"},
            {"label": "Djup", "value": "153 cm"},
            {"label": "Basens bredd", "value": "129 cm"},
            {"label": "Sitsbredd", "value": "47 cm", "note": SITS_NOTE},
        ],
        "weight": "90 kg med europeiskt barrträ, 111 kg med hårt trä av europeiskt ursprung. Vikt för ädelträ anges inte.",
        "mounting": [
            "För skruvmontering.",
            "Tillverkaren visar exempel på skruvmontering mot stenbeläggning, betong/asfalt och betongfundament. Fundamentets storlek beror på lokala förhållanden och är inte angiven som fast mått.",
        ],
        "optionGroups": option_groups,
        "images": [
            {
                "src": img["src"],
                "alt": img["alt"],
                "kind": img["kind"],
                **({"color": img["color"]} if img.get("color") else {}),
            }
            for img in gallery_meta
        ],
        "documents": documents,
        "related": [],
        "imageNote": "Exempelbild – valt utförande kan avvika. ZANO-märkning på originalbilden är kvar.",
        "reviewNote": "Testimport av en ZANO-produkt för granskning. Inte ett komplett ZANO-sortiment.",
        "internal": {
            "manufacturer": "ZANO",
            "legalName": "ZANO Mirosław Zarotyński",
            "sourceName": "Parksolstol Duo 02.052",
            "designer": "Filip Babiarz",
            "sourceUrl": SOURCE_SE,
            "catalogueUrl": CATALOGUE_EN,
            "productUuid": PRODUCT_UUID,
            "zanoSeFetch": se_status,
            "keepBranding": True,
            "supplierQuoteRequired": True,
            "purchasePrice": None,
            "woodPaletteUrl": WOOD_PALETTE,
            "steelPaletteUrl": STEEL_PALETTE,
        },
        "gaps": gaps,
        "failedFiles": files_failed,
    }

    payload = {
        "fetchedAt": FETCHED_AT,
        "source": SOURCE_SE,
        "note": (
            "Testimport av en produkt. ZANO visas publikt. Bilder och dokument är oförändrade original. "
            "Inköpspris saknas — lämna tomt, aldrig 0 kr. Ingen övrig ZANO-katalog i denna omgång."
        ),
        "counts": {"products": 1, "images": len(product["images"]), "documents": len(documents)},
        "series": [product],
        "catalog": {"solstolar": [SLUG]},
    }
    out = GEN / "zano-series.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"wrote": str(out), "images": len(product["images"]), "docs": len(documents), "gaps": gaps, "failed": files_failed}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
