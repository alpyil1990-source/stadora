#!/usr/bin/env python3
"""Import Inoplex street-furniture catalog (except Baseboards).

Public catalog never names Inoplex. Model codes stay as the product model.
Purchase prices are not on the site — do not invent them.
"""

from __future__ import annotations

import argparse
import hashlib
import http.cookiejar
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from io import BytesIO
from pathlib import Path

from bs4 import BeautifulSoup
from PIL import Image

try:
    import pymupdf
except ImportError:  # pragma: no cover
    pymupdf = None

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG_PUB = PUBLIC / "images" / "inoplex"
DOC_PUB = PUBLIC / "docs" / "inoplex"
INTERNAL = ROOT / "internal" / "inoplex"
GEN = ROOT / "src" / "data" / "generated"
CACHE = Path("/tmp/inoplex/pages")
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"
BASE = "https://inoplex.pl"
EN = f"{BASE}/en"

CATEGORIES = [
    {
        "url": f"{EN}/benches",
        "key": "benches",
        "category": "Parkmöbler",
        "categorySlug": "parkmobler",
        "subcategory": "Parkbänkar",
        "subcategorySlug": "parkbankar",
        "typeNoun": "Parkbänk",
    },
    {
        "url": f"{EN}/letter-bins",
        "key": "letter-bins",
        "category": "Avfall och återvinning",
        "categorySlug": "avfall-atervinning",
        "subcategory": "Papperskorgar",
        "subcategorySlug": "papperskorgar",
        "typeNoun": "Papperskorg",
    },
    {
        "url": f"{EN}/recycling-bins",
        "key": "recycling-bins",
        "category": "Avfall och återvinning",
        "categorySlug": "avfall-atervinning",
        "subcategory": "Källsortering",
        "subcategorySlug": "kallsortering",
        "typeNoun": "Källsortering",
    },
    {
        "url": f"{EN}/bicycle-racks",
        "key": "bicycle-racks",
        "category": "Cykelparkering",
        "categorySlug": "cykelparkering",
        "subcategory": "Cykelställ",
        "subcategorySlug": "cykelstall",
        "typeNoun": "Cykelställ",
    },
    {
        "url": f"{EN}/planters",
        "key": "planters",
        "category": "Plantering",
        "categorySlug": "plantering",
        "subcategory": "Planteringskärl",
        "subcategorySlug": "planteringskarl",
        "typeNoun": "Planteringskärl",
    },
    {
        "url": f"{EN}/picnic-tables-and-benches",
        "key": "picnic",
        "category": "Parkmöbler",
        "categorySlug": "parkmobler",
        "subcategory": "Bord och picknick",
        "subcategorySlug": "bord-picknick",
        "typeNoun": "Bord",
    },
    {
        "url": f"{EN}/outdoor-ashtrays",
        "key": "ashtrays",
        "category": "Avfall och återvinning",
        "categorySlug": "avfall-atervinning",
        "subcategory": "Askkoppar",
        "subcategorySlug": "askkoppar",
        "typeNoun": "Askkopp",
    },
    {
        "url": f"{EN}/parking-bollards-and-posts",
        "key": "bollards",
        "category": "Pollare och räcken",
        "categorySlug": "pollare-racken",
        "subcategory": "Pollare",
        "subcategorySlug": "pollare",
        "typeNoun": "Pollare",
    },
    {
        "url": f"{EN}/bicycle-shelters-and-outdoor-smoking-shelters",
        "key": "shelters",
        "category": "Cykelparkering",
        "categorySlug": "cykelparkering",
        "subcategory": "Tak och väderskydd",
        "subcategorySlug": "tak-skydd",
        "typeNoun": "Väderskydd",
    },
    {
        "url": f"{EN}/bicycle-repair-stations",
        "key": "repair",
        "category": "Cykelparkering",
        "categorySlug": "cykelparkering",
        "subcategory": "Garage och service",
        "subcategorySlug": "garage-service",
        "typeNoun": "Servicestation",
    },
]

SKIP_CATS = {"baseboards"}

NOUN_FROM_SLUG = [
    (r"planter|donice|dob[.-]|do-\d", "Planteringskärl"),
    (r"lounger|sunbed|solsäng", "Vilstol"),
    (r"picnic|table|zestaw", "Picknickgrupp"),
    (r"recycling", "Källsortering"),
    (r"letter-bin|litter|kosz|bin-", "Papperskorg"),
    (r"ashtray|popiel", "Askkopp"),
    (r"bollard|slupk", "Pollare"),
    (r"shelter|palarn", "Väderskydd"),
    (r"repair|stacj", "Servicestation"),
    (r"rack|stojak|bicycle", "Cykelställ"),
    (r"seat-|sittelement", "Sittelement"),
    (r"bench|lawk|la-\d", "Parkbänk"),
]

GROUP_LABEL = {
    "Framework": "Stommaterial",
    "Wood": "Träslag",
    "Assembly": "Montering",
    "Data": "Mått",
    "Installation": "Montering",
    "Mounting": "Montering",
    "Colour": "Kulör",
    "Color": "Kulör",
    "Seat": "Sits",
    "Backrest": "Ryggstöd",
}

OPTION_LABEL = {
    "AISI 304 stainless steel": "AISI 304 rostfritt stål",
    "H17 stainless steel, powder-coated": "H17 rostfritt stål, pulverlackerat",
    "Galvanized and powder-coated black steel": "Svart stål, galvaniserat och pulverlackerat",
    "Galvanised and powder-coated black steel": "Svart stål, galvaniserat och pulverlackerat",
    "Pine": "Furu",
    "Alder": "Al",
    "Sapele": "Sapeli",
    "ground": "Slipad",
    "Ground": "Slipad",
    "Natural": "Natur",
    "Teak": "Teakfärgad",
    "Rustic oak": "Rustik ek",
    "Walnut": "Valnöt",
    "Rosewood": "Palisander",
    "bielony": "Blek",
    "dabrustykalny'": "Rustik ek",
    "dabrustykalny": "Rustik ek",
    "heban": "Ebenholts",
    "hemlock": "Hemlock",
    "kasztan": "Kastanj",
    "olcha_naturalna": "Natur",
    "sosna_naturalna": "Natur",
    "sapele_naturalna": "Natur",
    "Add custom color": "Egen kulör",
    "Freestanding": "Fristående",
    "For anchoring": "Förankring",
    "anchoring": "Förankring",
    "freestanding": "Fristående",
    "wall_mounted": "Väggmonterad",
    "concreting": "Gjutning i mark",
}

RAL_SV = {
    "anthracite": "antracit",
    "grey": "grå",
    "gray": "grå",
    "white": "vit",
    "black": "svart",
    "red": "röd",
    "blue": "blå",
    "green": "grön",
    "yellow": "gul",
    "brown": "brun",
    "orange": "orange",
}

BRAND_RE = re.compile(
    r"\bINOPLEX\b|\binoplex\.pl\b|\binoplex@|\bul\.\s*Przewodowa|\+48\s*22\s*460",
    re.I,
)


def opener() -> urllib.request.OpenerDirector:
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    op.addheaders = [("User-Agent", UA), ("Accept-Language", "en")]
    return op


def fetch(op: urllib.request.OpenerDirector, url: str, dest: Path | None = None) -> bytes:
    if dest and dest.exists() and dest.stat().st_size > 100:
        return dest.read_bytes()
    req = urllib.request.Request(url)
    for attempt in range(4):
        try:
            with op.open(req, timeout=60) as r:
                data = r.read()
            if dest:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
            return data
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))
    return b""


def sv_label(text: str) -> str:
    raw = re.sub(r"\s+", " ", text).strip()
    if not raw:
        return raw
    if raw in OPTION_LABEL:
        return OPTION_LABEL[raw]
    if raw in GROUP_LABEL:
        return GROUP_LABEL[raw]
    m = re.match(r"RAL\s*(\d{4})\s*(?:\(([^)]+)\))?", raw, re.I)
    if m:
        code = m.group(1)
        extra = (m.group(2) or "").strip()
        extra_sv = RAL_SV.get(extra.lower(), extra.lower() if extra else "")
        return f"RAL {code}" + (f" {extra_sv}" if extra_sv else "")
    if re.fullmatch(r"\d{4}", raw):
        return f"RAL {raw}"
    if re.fullmatch(r"\d{4}.*", raw) and raw[:4].isdigit():
        code = raw[:4]
        rest = raw[4:].strip(" -()")
        rest_sv = OPTION_LABEL.get(rest, RAL_SV.get(rest.lower(), ""))
        # Skip Polish fraction nicknames on RAL chips (papier, szkło, bio…).
        if rest_sv and rest.lower() in RAL_SV:
            return f"RAL {code} {rest_sv}"
        return f"RAL {code}"
    return OPTION_LABEL.get(raw, raw)


def is_planter_product(model: str, desc_en: str) -> bool:
    if re.match(r"DOB\.", model or ""):
        return True
    return bool(re.search(r"\b(?:city|park)\s+planter\b", desc_en or "", re.I))


def type_noun(url_slug: str, cat_noun: str) -> str:
    s = url_slug.lower()
    for pat, noun in NOUN_FROM_SLUG:
        if re.search(pat, s):
            return noun
    return cat_noun


USED_SLUGS: set[str] = set()


def unique_public_slug(slug: str, url_path: str) -> str:
    if slug not in USED_SLUGS:
        USED_SLUGS.add(slug)
        return slug
    tail = url_path.rstrip("/").split("/")[-1]
    m = re.search(r"-(\d+)$", tail)
    cand = f"{slug}-{m.group(1)}" if m else f"{slug}-2"
    n = 2
    while cand in USED_SLUGS:
        n += 1
        cand = f"{slug}-{n}"
    USED_SLUGS.add(cand)
    return cand


def public_slug(model: str, url_path: str, noun: str) -> str:
    prefix = {
        "Parkbänk": "parkbank",
        "Planteringskärl": "planteringskarl",
        "Papperskorg": "papperskorg",
        "Källsortering": "kallsortering",
        "Cykelställ": "cykelstall",
        "Askkopp": "askkopp",
        "Pollare": "pollare",
        "Bord": "bord",
        "Picknickgrupp": "picknickgrupp",
        "Väderskydd": "vaderskydd",
        "Servicestation": "servicestation",
        "Vilstol": "vilstol",
        "Sittelement": "sittelement",
        "Solsäng": "solsang",
    }.get(noun, "produkt")
    token = re.sub(r"[^a-z0-9]+", "-", model.lower()).strip("-")
    if not token:
        token = url_path.strip("/").split("/")[-1]
    return f"{prefix}-{token}"


def strip_brand_text(text: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    kept = [p for p in parts if p and not BRAND_RE.search(p)]
    out = " ".join(kept)
    out = re.sub(r"\s+", " ", out).strip()
    return out


def summary_sv(model: str, noun: str, desc_en: str, groups: list[dict]) -> tuple[str, str]:
    desc = strip_brand_text(desc_en)
    # Keep a short verified Swedish lead from actual options, not marketing.
    bits = []
    for g in groups:
        if g["key"] in ("Stommaterial", "Träslag"):
            names = [o["name"] for o in g["options"] if not o.get("customText")]
            if names:
                bits.append(f"{g['label']}: {', '.join(names)}.")
    lead = f"{noun} {model}."
    if bits:
        lead += " " + " ".join(bits)
    lead += " Utförande väljs på produktsidan. Pris på förfrågan."
    return lead, lead


def parse_size_option(opt) -> dict:
    raw = opt.get_text(" ", strip=True)
    raw = re.sub(r"\s+", " ", raw)
    dims = []
    mapping = {"height": "Höjd", "width": "Bredd", "length": "Längd", "depth": "Djup", "diameter": "Diameter"}
    for en, sv in mapping.items():
        m = re.search(rf"{en}:\s*([0-9][0-9.,\s]*mm)", raw, re.I)
        if m:
            dims.append({"label": sv, "value": m.group(1).replace(" ", "").replace("mm", " mm")})
    drawings = {}
    for k, v in opt.attrs.items():
        if k.startswith("data-") and k.endswith("-drawing") and v:
            kind = k[len("data-") : -len("-drawing")].replace("_", "-")
            drawings[kind] = v
    return {
        "id": opt.get("value"),
        "name": raw.replace("height:", "Höjd:").replace("width:", "Bredd:").replace("length:", "Längd:"),
        "dimensions": dims,
        "capacity": opt.get("data-capacity") or None,
        "drawings": drawings,
    }


def parse_color_block(block, parent_value: str, param_id: str) -> list[dict]:
    options = []
    for lab in block.select("label.radio"):
        inp = lab.select_one("input.js-parameter-color")
        if not inp:
            continue
        img = lab.select_one("img")
        title = ""
        mat = lab.select_one(".js-tooltip")
        if mat and mat.get("title"):
            title = mat.get("title").strip()
        alt = (img.get("alt") if img else "") or ""
        name = sv_label(title or alt or "Kulör")
        custom = "js-radio-show" in (inp.get("class") or []) or name == "Egen kulör"
        if custom:
            name = "Egen kulör"
        options.append(
            {
                "id": inp.get("value"),
                "name": name,
                "swatch": img.get("src") if img else None,
                "customText": custom,
                "sourceName": title or alt,
            }
        )
    return options


def parse_form(soup: BeautifulSoup) -> dict:
    form = soup.select_one("form.js-product-form")
    if not form:
        return {"productId": None, "sizes": [], "groups": [], "token": None}
    token = (form.select_one('input[name="_token"]') or {}).get("value")
    pid = (form.select_one('input[name="product_id"]') or {}).get("value")
    sizes = []
    sel = form.select_one("select.js-product-size")
    if sel:
        for opt in sel.select("option"):
            sizes.append(parse_size_option(opt))
    groups = []
    for box in form.select(".item__group"):
        lab_el = box.select_one(".item__label")
        if not lab_el:
            continue
        lab = lab_el.get_text(" ", strip=True).rstrip(":")
        if lab in ("Data", "Download", "capacity", "Capacity"):
            continue
        params = box.select("input.js-parameter")
        installs = box.select("input.js-product-installation")
        if params:
            param_id = params[0].get("data-parameter")
            group_key = GROUP_LABEL.get(lab, lab)
            options = []
            for inp in params:
                name = inp.find_parent("label").select_one(".radio__label")
                label = sv_label(name.get_text(" ", strip=True) if name else inp.get("value"))
                options.append({"id": inp.get("value"), "name": label, "sourceName": name.get_text(" ", strip=True) if name else ""})
            groups.append(
                {
                    "key": group_key,
                    "label": group_key,
                    "kind": "choice",
                    "paramId": str(param_id),
                    "options": options,
                }
            )
            for opt in options:
                block = box.select_one(f".js-colors-{param_id}-{opt['id']}")
                if not block:
                    continue
                colors = parse_color_block(block, opt["id"], str(param_id))
                if not colors:
                    continue
                finish_key = "Träfinish" if group_key == "Träslag" else "Stomfinish"
                if group_key not in ("Träslag", "Stommaterial"):
                    finish_key = f"{group_key} – finish"
                groups.append(
                    {
                        "key": f"{finish_key}:{opt['id']}",
                        "label": finish_key,
                        "kind": "swatch",
                        "parentKey": group_key,
                        "parentValue": opt["name"],
                        "parentId": opt["id"],
                        "paramId": str(param_id),
                        "options": colors,
                    }
                )
        elif installs:
            options = []
            for inp in installs:
                name = inp.find_parent("label")
                raw = name.get_text(" ", strip=True) if name else inp.get("value")
                options.append({"id": inp.get("value"), "name": sv_label(raw), "sourceName": raw})
            groups.append(
                {
                    "key": "Montering",
                    "label": "Montering",
                    "kind": "choice",
                    "paramId": "installation",
                    "options": options,
                }
            )
    return {"productId": pid, "token": token, "sizes": sizes, "groups": groups}


def gallery_json(html: str) -> list[dict]:
    """Parse variantsGalleryData even when nested arrays sit inside params."""
    key = html.find("variantsGalleryData")
    if key < 0:
        return []
    i = html.find("[", key)
    if i < 0:
        return []
    depth = 0
    in_str = False
    esc = False
    for j, ch in enumerate(html[i:], i):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                try:
                    data = json.loads(html[i : j + 1])
                except json.JSONDecodeError:
                    return []
                return data if isinstance(data, list) else []
    return []


def default_gallery(soup: BeautifulSoup) -> list[dict]:
    out = []
    for a in soup.select(".js-product-images a[data-fancybox]"):
        href = a.get("href")
        img = a.select_one("img")
        if href:
            out.append({"big": href, "img": img.get("src") if img else href, "params": {}})
    return out


def files_from_page(soup: BeautifulSoup) -> dict:
    dwg = None
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if href.lower().endswith(".dwg") or ".dwg" in href.lower():
            dwg = href
            break
    pdf_action = None
    pdf_a = soup.select_one("a.js-product-pdf")
    if pdf_a:
        pdf_action = pdf_a.get("data-action")
    return {"dwg": dwg, "pdfAction": pdf_action}


def description_en(soup: BeautifulSoup) -> str:
    tab = soup.select_one("#opis-produktu-tab") or soup.select_one(".js-tab-content")
    if not tab:
        return ""
    return tab.get_text(" ", strip=True)


def model_from_title(soup: BeautifulSoup, fallback: str) -> str:
    h = soup.select_one("form.js-product-form h2") or soup.select_one("h1") or soup.title
    t = h.get_text(" ", strip=True) if h else fallback
    m = re.search(r"([A-Z]{1,4}\.[0-9]{2}\.[0-9]{2}[A-Za-z0-9.]*)", t)
    return m.group(1) if m else t


def list_products(op, cat: dict) -> list[tuple[str, str]]:
    html = fetch(op, cat["url"], CACHE / f"cat-{cat['key']}.html").decode("utf-8", "replace")
    soup = BeautifulSoup(html, "html.parser")
    found = []
    seen = set()
    for a in soup.select("a[href]"):
        text = a.get_text(" ", strip=True)
        href = a.get("href", "").split("?")[0]
        if not re.fullmatch(r"[A-Z]{1,4}\.[0-9]{2}(?:\.[0-9]{2}[A-Za-z0-9.]*)?", text):
            continue
        if "/en/" not in href:
            continue
        path = href.rstrip("/").split("/")[-1]
        if path in {
            "benches",
            "letter-bins",
            "recycling-bins",
            "bicycle-racks",
            "planters",
            "picnic-tables-and-benches",
            "outdoor-ashtrays",
            "parking-bollards-and-posts",
            "baseboards",
        }:
            continue
        if href in seen:
            continue
        seen.add(href)
        found.append((text, href))
    return found


def save_image(op, url: str, dest_orig: Path, dest_web: Path) -> dict | None:
    try:
        raw = fetch(op, url, dest_orig)
    except Exception:
        return None
    if not raw or raw[:10].lower().startswith(b"<!doctype") or len(raw) < 80:
        return None
    dest_web.parent.mkdir(parents=True, exist_ok=True)
    try:
        im = Image.open(BytesIO(raw))
        im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
        w, h = im.size
        if max(w, h) > 1600:
            im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        im.save(dest_web, "JPEG", quality=86, optimize=True)
        return {"width": w, "height": h, "bytes": len(raw)}
    except Exception:
        dest_web.write_bytes(raw)
        return {"width": None, "height": None, "bytes": len(raw)}


def save_file(op, url: str, dest: Path) -> bool:
    try:
        raw = fetch(op, url, dest)
        return bool(raw) and not raw[:15].lower().startswith(b"<!doctype")
    except Exception:
        return False


def default_form_fields(soup: BeautifulSoup) -> list[tuple[str, str]]:
    form = soup.select_one("form.js-product-form")
    data = []
    if not form:
        return data
    for inp in form.select("input, select"):
        name = inp.get("name")
        if not name:
            continue
        typ = inp.get("type", "text")
        if name.endswith("_own]"):
            continue
        if typ in ("radio", "checkbox"):
            if inp.has_attr("checked"):
                data.append((name, inp.get("value", "")))
        elif inp.name == "select":
            opt = inp.find("option", selected=True) or inp.find("option")
            if opt:
                data.append((name, opt.get("value", "")))
        else:
            data.append((name, inp.get("value", "")))
    # JS checks first installation.
    if not any(n == "p[installation]" for n, _ in data):
        inst = form.select_one("input.js-product-installation")
        if inst:
            data.append(("p[installation]", inst.get("value", "")))
    return data


def download_pdf(op, action: str, fields: list[tuple[str, str]], dest: Path) -> bool:
    body = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(
        action,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": EN + "/",
            "Origin": BASE,
        },
    )
    try:
        with op.open(req, timeout=90) as r:
            raw = r.read()
            ctype = r.headers.get("content-type", "")
        if b"%PDF" not in raw[:16] and "pdf" not in ctype.lower():
            return False
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(raw)
        return True
    except Exception:
        return False


def strip_inoplex_pdf(src: Path, dest: Path) -> dict:
    if pymupdf is None:
        dest.write_bytes(src.read_bytes())
        return {"ok": False, "reason": "pymupdf saknas — original kopierat"}
    doc = pymupdf.open(src)
    doc.set_metadata(
        {
            "title": re.sub(r"INOPLEX", "", doc.metadata.get("title") or "", flags=re.I).strip(),
            "author": "STADORA",
            "subject": "",
            "keywords": "",
            "creator": "STADORA",
            "producer": "STADORA",
        }
    )
    needles = [
        "INOPLEX",
        "Inoplex",
        "inoplex",
        "Przewodowa",
        "Warszawa",
        "Biskupiec",
        "Bolesława Chrobrego",
        "inoplex@inoplex.pl",
        "www.inoplex.pl",
        "inoplex.pl",
        "+48 22 460 54 30",
        "+48 89 715 41 00",
        "tel.:",
        "e-mail:",
    ]
    pages = []
    for page in doc:
        for info in page.get_images(full=True):
            xref = info[0]
            try:
                pix = pymupdf.Pixmap(doc, xref)
            except Exception:
                continue
            if pix.width >= 300 and pix.width / max(pix.height, 1) >= 2.2 and pix.height <= 220:
                try:
                    page.delete_image(xref)
                except Exception:
                    pass
        footer = pymupdf.Rect(0, page.rect.height - 80, page.rect.width, page.rect.height)
        page.add_redact_annot(footer, fill=(1, 1, 1))
        header_logo = pymupdf.Rect(0, 0, 220, 90)
        page.add_redact_annot(header_logo, fill=(1, 1, 1))
        for n in needles:
            for rect in page.search_for(n):
                page.add_redact_annot(rect, fill=(1, 1, 1))
        page.apply_redactions()
        # drop URI links to inoplex
        for link in page.get_links():
            uri = (link.get("uri") or "").lower()
            if "inoplex" in uri:
                try:
                    page.delete_link(link)
                except Exception:
                    pass
        pages.append(page.get_text())
    dest.parent.mkdir(parents=True, exist_ok=True)
    doc.save(dest, garbage=4, deflate=True)
    leftover = [p for p in pages if BRAND_RE.search(p) or "inoplex" in p.lower()]
    return {"ok": not leftover, "pages": doc.page_count, "brandLeft": bool(leftover)}


def map_gallery_tags(item: dict, groups: list[dict]) -> dict:
    tags = {}
    params = item.get("params") or {}
    for g in groups:
        pid = g.get("paramId")
        if not pid or pid == "installation":
            continue
        block = params.get(str(pid)) or params.get(pid)
        if not block:
            continue
        if g.get("parentId"):
            # finish group: parent option id -> list of color ids
            colors = block.get(g["parentId"]) or block.get(str(g["parentId"]))
            if not colors:
                continue
            for opt in g["options"]:
                if opt["id"] in [str(c) for c in colors] or opt["id"] in colors:
                    tags[g["label"]] = opt["name"]
                    break
        else:
            for oid, colors in block.items():
                for opt in g["options"]:
                    if str(opt["id"]) == str(oid):
                        tags[g["key"]] = opt["name"]
    inst = params.get("installation") or {}
    if inst:
        key = next(iter(inst.keys()), None)
        if key:
            tags["Montering"] = sv_label(key)
    return tags


def import_product(op, cat: dict, model: str, url: str) -> dict:
    slug_path = url.rstrip("/").split("/")[-1]
    cache = CACHE / f"{slug_path}.html"
    html = fetch(op, url, None).decode("utf-8", "replace")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(html, encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    model = model_from_title(soup, model)
    desc_en = description_en(soup)
    parsed = parse_form(soup)
    swatch_dir = IMG_PUB / "swatches"
    for g in parsed["groups"]:
        for opt in g["options"]:
            src = opt.get("swatch")
            if not src or src.startswith("/"):
                continue
            name = Path(urllib.parse.urlparse(src).path).name
            orig = INTERNAL / "swatches" / name
            web = swatch_dir / (Path(name).stem + ".jpg")
            if save_image(op, src, orig, web):
                opt["swatch"] = f"/images/inoplex/swatches/{web.name}"
                opt["swatchSourceUrl"] = src
    if is_planter_product(model, desc_en):
        cat = next(c for c in CATEGORIES if c["key"] == "planters")
        noun = cat["typeNoun"]
    else:
        noun = type_noun(slug_path, cat["typeNoun"])
    slug = unique_public_slug(public_slug(model, slug_path, noun), slug_path)
    summary, description = summary_sv(model, noun, desc_en, parsed["groups"])
    files = files_from_page(soup)
    gallery = gallery_json(html) or default_gallery(soup)

    img_dir = IMG_PUB / slug
    orig_dir = INTERNAL / "originals" / slug
    doc_dir = DOC_PUB / slug
    int_doc = INTERNAL / "docs" / slug
    images = []
    seen_src = set()
    for i, g in enumerate(gallery):
        big = g.get("big") or g.get("img")
        if not big or big in seen_src:
            continue
        seen_src.add(big)
        ext = Path(urllib.parse.urlparse(big).path).suffix or ".jpg"
        orig = orig_dir / f"{i:02d}{ext}"
        web = img_dir / f"{i:02d}.jpg"
        meta = save_image(op, big, orig, web)
        if not meta:
            continue
        tags = map_gallery_tags(g, parsed["groups"])
        images.append(
            {
                "src": f"/images/inoplex/{slug}/{i:02d}.jpg",
                "alt": f"{noun} {model}",
                "kind": "studio",
                "original": str(orig.relative_to(ROOT)),
                "sourceUrl": big,
                "tags": tags,
                "color": tags.get("Stomfinish") or tags.get("Kulör"),
            }
        )

    documents = []
    gaps = []
    # Drawings from size options
    for sz in parsed["sizes"]:
        for kind, href in (sz.get("drawings") or {}).items():
            if not href:
                continue
            orig = orig_dir / f"drawing-{kind}{Path(href).suffix or '.jpg'}"
            web = doc_dir / f"matritning-{kind}.jpg"
            if save_image(op, href, orig, web):
                documents.append(
                    {
                        "title": "Måttritning",
                        "typeLabel": "Måttritning",
                        "format": "JPG",
                        "href": f"/docs/inoplex/{slug}/matritning-{kind}.jpg",
                        "kind": "drawing",
                        "previewable": True,
                        "appliesTo": sv_label(kind),
                        "sourceUrl": href,
                        "fetchedAt": FETCHED_AT,
                    }
                )
            else:
                gaps.append(f"Måttritning {kind} kunde inte hämtas")

    if files.get("dwg"):
        dest = doc_dir / f"{slug}.dwg"
        int_copy = int_doc / f"{slug}.dwg"
        if save_file(op, files["dwg"], dest):
            int_copy.parent.mkdir(parents=True, exist_ok=True)
            int_copy.write_bytes(dest.read_bytes())
            documents.append(
                {
                    "title": "CAD",
                    "typeLabel": "CAD-fil",
                    "format": "DWG",
                    "href": f"/docs/inoplex/{slug}/{slug}.dwg",
                    "kind": "cad",
                    "previewable": False,
                    "sourceUrl": files["dwg"],
                    "fetchedAt": FETCHED_AT,
                }
            )
        else:
            gaps.append("DWG kunde inte hämtas")
    else:
        gaps.append("Ingen DWG på produktsidan")

    pdf_applies = []
    for g in parsed["groups"]:
        if g.get("parentKey"):
            continue
        if g["options"]:
            pdf_applies.append(f"{g['label']}: {g['options'][0]['name']}")
            child = next((x for x in parsed["groups"] if x.get("parentId") == g["options"][0]["id"]), None)
            if child and child["options"]:
                first = next((o for o in child["options"] if not o.get("customText")), child["options"][0])
                pdf_applies.append(f"{child['label']}: {first['name']}")
    applies = " · ".join(pdf_applies) if pdf_applies else None

    if files.get("pdfAction") and parsed["productId"]:
        orig_pdf = int_doc / "original.pdf"
        cust_pdf = doc_dir / "produktblad.pdf"
        fields = default_form_fields(soup)
        ok = download_pdf(op, files["pdfAction"], fields, orig_pdf)
        if ok:
            info = strip_inoplex_pdf(orig_pdf, cust_pdf)
            documents.append(
                {
                    "title": "Produktblad",
                    "typeLabel": "Produktblad",
                    "format": "PDF",
                    "href": f"/docs/inoplex/{slug}/produktblad.pdf",
                    "kind": "datasheet",
                    "previewable": False,
                    "appliesTo": applies,
                    "sourceUrl": files["pdfAction"],
                    "fetchedAt": FETCHED_AT,
                    "customerStripped": info.get("ok"),
                    "internalOriginal": str(orig_pdf.relative_to(ROOT)),
                }
            )
            if not info.get("ok"):
                gaps.append("Produktblad: rest av leverantörsnamn kan finnas kvar i PDF")
        else:
            gaps.append("Produktblad PDF kunde inte genereras")

    sizes_out = []
    for sz in parsed["sizes"]:
        name = " × ".join(d["value"] for d in sz["dimensions"]) if sz["dimensions"] else sz["name"]
        sizes_out.append(
            {
                "name": name,
                "sku": model,
                "summary": sz["name"],
                "dimensions": sz["dimensions"],
                "capacity": sz.get("capacity") or None,
            }
        )

    mounting = []
    for g in parsed["groups"]:
        if g["key"] == "Montering":
            mounting = [o["name"] for o in g["options"]]

    return {
        "slug": slug,
        "name": f"{noun} {model}",
        "modelName": model,
        "sku": model,
        "sourceUrl": url,
        "fetchedAt": FETCHED_AT,
        "category": cat["category"],
        "categorySlug": cat["categorySlug"],
        "subcategory": cat["subcategory"] if noun != "Vilstol" else "Modulära sitt",
        "subcategorySlug": cat["subcategorySlug"] if noun != "Vilstol" else "modulara-sitt",
        "typeNoun": noun,
        "summary": summary,
        "description": description,
        "descriptionSource": strip_brand_text(desc_en),
        "internal": {
            "manufacturer": "INOPLEX",
            "legalName": None,
            "sourceName": soup.title.get_text(" ", strip=True) if soup.title else model,
            "productId": parsed["productId"],
            "supplierQuoteRequired": True,
            "purchasePrice": None,
        },
        "quoteShowsSku": True,
        "quoteOnRequest": True,
        "sizes": sizes_out,
        "defaultSize": sizes_out[0]["name"] if sizes_out else None,
        "sizeLegend": "Mått",
        "optionGroups": parsed["groups"],
        "mounting": mounting,
        "images": images,
        "documents": documents,
        "related": [],
        "imageNote": "Exempelbild – valt utförande kan avvika.",
        "gaps": gaps,
        "catKey": cat["key"],
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="*", default=None, help="URL path fragments to import")
    args = ap.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    GEN.mkdir(parents=True, exist_ok=True)
    USED_SLUGS.clear()
    op = opener()
    series = []
    skipped = []
    seen_urls: set[str] = set()
    for cat in CATEGORIES:
        items = list_products(op, cat)
        print(cat["key"], len(items), "products")
        for model, url in items:
            if url in seen_urls:
                continue
            seen_urls.add(url)
            path = url.rstrip("/").split("/")[-1]
            if args.only and not any(tok in url or tok == model for tok in args.only):
                continue
            try:
                rec = import_product(op, cat, model, url)
                series.append(rec)
                print(" ", rec["slug"], "imgs", len(rec["images"]), "docs", len(rec["documents"]), "gaps", rec["gaps"])
            except Exception as e:
                skipped.append({"url": url, "model": model, "error": str(e)})
                print(" FAIL", url, e)
            time.sleep(0.15)
    # related within subcategory
    by_sub: dict[str, list[str]] = {}
    for r in series:
        by_sub.setdefault(r["subcategorySlug"], []).append(r["slug"])
    for r in series:
        others = [s for s in by_sub.get(r["subcategorySlug"], []) if s != r["slug"]]
        r["related"] = others[:4]
    payload = {
        "fetchedAt": FETCHED_AT,
        "source": EN,
        "note": "Inköpspriser saknas hos källan. Leverantörsoffert krävs. Inoplex visas inte publikt.",
        "counts": {"products": len(series), "failed": len(skipped)},
        "failed": skipped,
        "series": series,
    }
    out = GEN / "inoplex-series.json"
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print("wrote", out, "products", len(series), "failed", len(skipped))


if __name__ == "__main__":
    main()
