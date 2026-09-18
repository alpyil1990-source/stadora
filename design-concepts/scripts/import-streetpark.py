#!/usr/bin/env python3
"""Import STREETPARK catalog pages, original images and public documents."""

from __future__ import annotations

import hashlib
import json
import re
import runpy
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG_ROOT = PUBLIC / "images" / "streetpark"
DOC_ROOT = PUBLIC / "docs" / "streetpark"
GEN = ROOT / "src" / "data" / "generated"
CACHE = Path("/tmp/streetpark")
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"
BASE = "https://www.streetpark.eu"

CATEGORIES = [
    {
        "url": f"{BASE}/en/products/park-benches/",
        "key": "park-benches",
        "category": "Parkmöbler",
        "categorySlug": "parkmobler",
        "subcategory": "Parkbänkar",
        "subcategorySlug": "parkbankar",
        "typeNoun": "Parkbänk",
    },
    {
        "url": f"{BASE}/en/products/litter-bins/",
        "key": "litter-bins",
        "category": "Avfall och återvinning",
        "categorySlug": "avfall-atervinning",
        "subcategory": "Papperskorgar",
        "subcategorySlug": "papperskorgar",
        "typeNoun": "Papperskorg",
    },
    {
        "url": f"{BASE}/en/products/bicycle-stands/",
        "key": "bicycle-stands",
        "category": "Cykelparkering",
        "categorySlug": "cykelparkering",
        "subcategory": "Cykelställ",
        "subcategorySlug": "cykelstall",
        "typeNoun": "Cykelställ",
    },
    {
        "url": f"{BASE}/en/products/tables-and-picnic-sets/",
        "key": "tables-and-picnic-sets",
        "category": "Parkmöbler",
        "categorySlug": "parkmobler",
        "subcategory": "Bord och picknick",
        "subcategorySlug": "bord-picknick",
        "typeNoun": "Bord",
    },
    {
        "url": f"{BASE}/en/products/barrier-pillars/",
        "key": "barrier-pillars",
        "category": "Pollare och räcken",
        "categorySlug": "pollare-racken",
        "subcategory": "Pollare",
        "subcategorySlug": "pollare",
        "typeNoun": "Pollare",
    },
]

SKIP_PRODUCT_SLUGS = {
    "bus-stop",
    "bicycle-shelter",
    "bicycle-shelters",
}

THUMB_RE = re.compile(r"-\d+x\d+(?=\.(?:jpe?g|png|webp|gif)$)", re.I)
EXT_RE = re.compile(r"\.([a-z0-9]{2,5})(?:\?|$)", re.I)
DIM_RE = re.compile(
    r"(?:L\s*[×x]\s*W\s*[×x]\s*H\s*:\s*)?(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*[×x]\s*(\d+(?:[.,]\d+)?)\s*mm",
    re.I,
)
WEIGHT_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*kg", re.I)

# Product-page type overrides from STREETPARK names/URLs, not guessed specs.
TYPE_OVERRIDES = {
    "scooter-rack-scooty": ("Sparkcykelställ", "Cykelställ", "cykelstall"),
    "litter-bins-raila-ash": ("Askkopp", "Askkoppar", "askkoppar"),
    "litter-bin-d-n-a-ash": ("Askkopp", "Askkoppar", "askkoppar"),
    "litter-bin-raila-dog": ("Hundavfallskärl", "Papperskorgar", "papperskorgar"),
    "litter-bin-d-n-a-dog": ("Hundavfallskärl", "Papperskorgar", "papperskorgar"),
}

PICNIC_HINT = re.compile(r"picnic|picknick|set of table", re.I)
CHAIR_HINT = re.compile(r"\bchair\b|\barmchair\b|park chair", re.I)
ISLAND_HINT = re.compile(r"island|islands", re.I)


def request(url: str, dest: Path | None = None, retries: int = 4) -> bytes:
    dest.parent.mkdir(parents=True, exist_ok=True) if dest else None
    last: Exception | None = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
                final = resp.geturl()
            if dest:
                dest.write_bytes(data)
            return data
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"Failed {url}: {last}") from last


def abs_url(href: str) -> str:
    href = href.strip()
    if href.startswith("//"):
        return "https:" + href
    return urljoin(BASE + "/", href)


def unsized(url: str) -> str:
    path = url.split("?")[0]
    return THUMB_RE.sub("", path)


def basename(url: str) -> str:
    name = unquote(urlparse(url.split("?")[0]).path.rsplit("/", 1)[-1])
    return name or "file"


def ext_of(url_or_name: str) -> str:
    m = EXT_RE.search(url_or_name.lower())
    return (m.group(1) if m else "").upper().replace("JPEG", "JPG")


def slugify_model(name: str) -> str:
    s = name.lower().strip()
    s = s.replace("&", " och ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def product_url_key(url: str) -> str:
    path = urlparse(url).path.rstrip("/")
    return path.rsplit("/", 1)[-1]


def parse_category(html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    urls: list[str] = []
    for a in soup.select("a[href]"):
        href = abs_url(a["href"].split("?")[0])
        if "/en/product/" not in href:
            continue
        key = product_url_key(href)
        if any(skip in key for skip in SKIP_PRODUCT_SLUGS):
            continue
        if href not in urls:
            urls.append(href.rstrip("/") + "/")
    return urls


def text_or_none(el) -> str | None:
    if not el:
        return None
    t = el.get_text(" ", strip=True)
    return t or None


def classify_file(label: str, url: str) -> tuple[str, str]:
    t = (label or "").lower()
    ext = ext_of(url)
    image_ext = ext in {"JPG", "JPEG", "PNG", "WEBP", "GIF"}
    cad_ext = ext in {"RAR", "ZIP", "DWG", "DXF", "STEP", "STP", "IGS", "IGES", "3DS", "SKP"}
    if "sampler" in t or (t.startswith("material") and ext == "PDF"):
        return "material", "Materialprov"
    if "warranty" in t or "guarantee" in t or "maintenance" in t:
        return "warranty", "Garanti och underhåll"
    if "anchor" in t or "kotveni" in t:
        return "anchoring", "Förankringsanvisning"
    if any(w in t for w in ("assembl", "mounting", "installation", "install ")):
        return "mounting", "Monteringsanvisning"
    if any(w in t for w in ("data sheet", "datasheet", "product sheet", "catalogue sheet", "catalog sheet")):
        return "datasheet", "Produktblad"
    if "2d" in t or "drawing" in t:
        return "drawing", "Måttritning"
    if "perspective" in t or ("3d" in t and image_ext):
        return "perspective", "3D-perspektivbild"
    if ext in {"DWG", "DXF"}:
        return "cad", "CAD"
    if "3d" in t and cad_ext:
        return "cad", "3D-/CAD-underlag"
    if cad_ext:
        return "cad", "3D-/CAD-underlag"
    if image_ext:
        return "image", "Bild"
    if ext == "PDF":
        return "other", "Dokument"
    return "other", "Dokument"


def parse_dims(raw: str | None) -> tuple[list[dict], str | None]:
    if not raw:
        return [], None
    dims: list[dict] = []
    m = DIM_RE.search(raw.replace(" ", ""))
    if not m:
        m = DIM_RE.search(raw)
    if m:
        l, w, h = (x.replace(",", ".") for x in m.groups())
        dims = [
            {"label": "Längd", "value": f"{l} mm"},
            {"label": "Bredd", "value": f"{w} mm"},
            {"label": "Höjd", "value": f"{h} mm"},
        ]
    wgt = None
    wm = WEIGHT_RE.search(raw)
    if wm:
        wgt = f"{wm.group(1).replace(',', '.')} kg"
    return dims, wgt


def is_gated_href(href: str | None) -> bool:
    if not href:
        return True
    h = href.strip()
    return h in {"#", "", "javascript:void(0)"} or h.startswith("javascript:")


def parse_product(html: str, url: str, cat: dict) -> dict:
    soup = BeautifulSoup(html, "lxml")
    detail = soup.select_one(".single-product-detail") or soup
    title_el = detail.select_one("h1")
    model_name = (title_el.get_text(" ", strip=True) if title_el else "").strip()
    designer = text_or_none(detail.select_one(".product-subtitle"))
    desc_el = detail.select_one(".product-description")
    description_html = ""
    description_plain = ""
    material_note = None
    if desc_el:
        description_plain = desc_el.get_text("\n", strip=True)
        description_html = str(desc_el)
        em = desc_el.find("em")
        if em:
            material_note = em.get_text(" ", strip=True)

    images: list[dict] = []
    seen_img = set()
    for a in detail.select(".next-gallery a.image[data-img], .next-gallery a.image[href]"):
        src = unsized(abs_url(a.get("data-img") or a.get("href") or ""))
        if not src or src in seen_img:
            continue
        if "ikona" in src.lower():
            continue
        seen_img.add(src)
        images.append({"sourceUrl": src, "alt": a.get("title") or a.get("alt") or ""})
    if not images:
        for a in detail.select("a.main-image[href]"):
            src = unsized(abs_url(a["href"]))
            if src and src not in seen_img and "ikona" not in src.lower():
                seen_img.add(src)
                images.append({"sourceUrl": src, "alt": ""})

    models: list[dict] = []
    for i, m in enumerate(detail.select(".models.product-row .model")):
        code = text_or_none(m.select_one("h2.title")) or f"modell-{i+1}"
        info_ps = [p.get_text(" ", strip=True) for p in m.select(".info p")]
        dim_line = next((p for p in info_ps if DIM_RE.search(p.replace(" ", "")) or "mm" in p.lower()), None)
        if not dim_line:
            dim_line = next((p for p in info_ps if WEIGHT_RE.search(p)), None)
        extra = [p for p in info_ps if p and p != code and p != dim_line]
        dims, weight = parse_dims(" ".join(info_ps))
        icon = m.select_one(".image img")
        icon_src = unsized(abs_url(icon["src"])) if icon and icon.get("src") else None
        models.append(
            {
                "id": m.get("data-id") or str(i),
                "code": code,
                "info": extra,
                "dimLine": dim_line,
                "dimensions": dims,
                "weight": weight,
                "iconUrl": icon_src,
            }
        )

    option_rows: list[dict] = []
    for row in detail.select(".product-rows .materials.product-row"):
        legend = text_or_none(row.select_one(".row-text")) or "Options"
        opts = []
        for mat in row.select(".material"):
            name = text_or_none(mat.select_one("h2.title"))
            if not name:
                continue
            img = mat.select_one(".image")
            style = img.get("style") or "" if img else ""
            m = re.search(r"url\(([^)]+)\)", style)
            swatch_url = unsized(m.group(1).strip("\"'")) if m else None
            opts.append({"name": name, "swatchUrl": swatch_url} if swatch_url else {"name": name})
        if opts:
            option_rows.append({"legend": legend, "options": opts})

    files: list[dict] = []
    gated: list[dict] = []
    for body in detail.select(".models-files .files-body"):
        cls = " ".join(body.get("class") or [])
        mid = None
        mm = re.search(r"files-body-(\d+)", cls)
        if mm:
            mid = mm.group(1)
        variant_title = text_or_none(body.select_one(".title"))
        variant_code = re.sub(r"\s*-\s*Files to download.*$", "", variant_title or "", flags=re.I).strip()
        for a in body.select("a[href]"):
            label = a.get_text(" ", strip=True) or a.get("title") or ""
            if not label or label.lower() in {"log in", "register", "log out", "logout", "download"}:
                continue
            href = a.get("href") or ""
            if is_gated_href(href) or "login-area" in (a.get("onclick") or ""):
                gated.append(
                    {
                        "name": label,
                        "sourceUrl": url,
                        "variant": variant_code or None,
                        "reason": "login-required",
                    }
                )
                continue
            file_url = unsized(abs_url(href))
            kind, type_label = classify_file(label, file_url)
            files.append(
                {
                    "label": label,
                    "sourceUrl": file_url,
                    "variant": variant_code or None,
                    "modelId": mid,
                    "kind": kind,
                    "typeLabel": type_label,
                    "format": ext_of(file_url) or "FIL",
                }
            )

    sampler = None
    for a in detail.select("a[href]"):
        href = a.get("href") or ""
        if "Material-Sampler" in href:
            sampler = unsized(abs_url(href))
            break

    key = product_url_key(url)
    type_noun = cat["typeNoun"]
    sub_name = cat["subcategory"]
    sub_slug = cat["subcategorySlug"]
    if key in TYPE_OVERRIDES:
        type_noun, sub_name, sub_slug = TYPE_OVERRIDES[key]
    elif cat["key"] == "tables-and-picnic-sets" and (
        PICNIC_HINT.search(model_name) or PICNIC_HINT.search(description_plain)
    ):
        type_noun = "Picknickgrupp"
    elif cat["key"] == "park-benches" and ISLAND_HINT.search(model_name + " " + key):
        type_noun = "Sittö"
    elif cat["key"] == "park-benches" and CHAIR_HINT.search(description_plain):
        type_noun = "Parkstol"

    slug_tail = slugify_model(model_name) or slugify_model(key)
    prefix = {
        "Parkbänk": "parkbank",
        "Parkstol": "parkstol",
        "Sittö": "sitto",
        "Papperskorg": "papperskorg",
        "Askkopp": "askkopp",
        "Hundavfallskärl": "hundavfallskarl",
        "Cykelställ": "cykelstall",
        "Sparkcykelställ": "sparkcykelstall",
        "Bord": "bord",
        "Picknickgrupp": "picknickgrupp",
        "Pollare": "pollare",
    }[type_noun]
    slug = f"{prefix}-{slug_tail}"

    mentions_betoni = bool(re.search(r"\bbetoni\b|\buhpc\b", description_plain, re.I))
    mentions_anchor = bool(
        re.search(r"anchor|anchoring|bolted|screwed|base plate|plates are welded", description_plain, re.I)
    )

    return {
        "url": url,
        "urlKey": key,
        "slug": slug,
        "modelName": model_name,
        "typeNoun": type_noun,
        "publicName": f"{type_noun} {model_name}",
        "designer": designer,
        "descriptionEn": description_plain,
        "materialEn": material_note,
        "category": cat["category"],
        "categorySlug": cat["categorySlug"],
        "subcategory": sub_name,
        "subcategorySlug": sub_slug,
        "images": images,
        "models": models,
        "optionRows": option_rows,
        "files": files,
        "gated": gated,
        "samplerUrl": sampler,
        "mentionsBetoni": mentions_betoni,
        "mentionsAnchor": mentions_anchor,
        "fetchedAt": FETCHED_AT,
        "sourceUrl": url,
    }


def parse_download_page(html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    public: list[dict] = []
    gated: list[dict] = []
    for card in soup.select(".product-card.file-card"):
        model = card.get("data-model")
        a = card.select_one("a.link")
        name_el = card.select_one("h3.name")
        label = ""
        if name_el:
            regular = name_el.select_one(".regular")
            label = (regular.get_text(" ", strip=True) if regular else name_el.get_text(" ", strip=True))
        href = a.get("href") if a else None
        title = (a.get("title") if a else None) or label
        login = bool(card.select_one(".read-more.inactive")) or (
            a and "login-area" in (a.get("onclick") or "")
        )
        if login or is_gated_href(href):
            gated.append(
                {
                    "name": title,
                    "variant": model,
                    "sourceUrl": f"{BASE}/en/download/",
                    "reason": "login-required",
                }
            )
            continue
        file_url = unsized(abs_url(href))
        kind, type_label = classify_file(title, file_url)
        public.append(
            {
                "label": title,
                "sourceUrl": file_url,
                "variant": model,
                "kind": kind,
                "typeLabel": type_label,
                "format": ext_of(file_url) or "FIL",
            }
        )
    shared = []
    for card in soup.select(".product-card")[:40]:
        if "file-card" in (card.get("class") or []):
            continue
        a = card.select_one("a.link[href]")
        if not a:
            continue
        href = a.get("href")
        if is_gated_href(href):
            continue
        title = a.get("title") or text_or_none(card.select_one("h3.name")) or ""
        file_url = unsized(abs_url(href))
        if "wp-content/uploads" not in file_url:
            continue
        kind, type_label = classify_file(title, file_url)
        shared.append(
            {
                "label": title,
                "sourceUrl": file_url,
                "kind": kind,
                "typeLabel": type_label,
                "format": ext_of(file_url) or "FIL",
            }
        )
    return {"public": public, "gated": gated, "shared": shared}


def merge_files(product: dict, download: dict) -> None:
    codes = {m["code"].upper() for m in product["models"]}
    existing = {f["sourceUrl"] for f in product["files"]}
    for f in download["public"]:
        var = (f.get("variant") or "").upper()
        if var and var in codes and f["sourceUrl"] not in existing:
            product["files"].append({**f, "variant": next(m["code"] for m in product["models"] if m["code"].upper() == var)})
            existing.add(f["sourceUrl"])
        elif not var:
            continue
    product_gated_names = {(g["name"], g.get("variant")) for g in product["gated"]}
    for g in download["gated"]:
        var = g.get("variant")
        if var and var.upper() in codes and (g["name"], var) not in product_gated_names:
            product["gated"].append(g)


def tag_images(product: dict) -> None:
    codes = sorted((m["code"] for m in product["models"]), key=len, reverse=True)
    for img in product["images"]:
        base = basename(img["sourceUrl"])
        hits = []
        for code in codes:
            if re.search(rf"(^|[^A-Za-z0-9]){re.escape(code)}([^A-Za-z0-9]|$)", base, re.I):
                hits.append(code)
        if len(hits) == 1:
            img["size"] = hits[0]


def safe_name(url: str, used: set[str]) -> str:
    name = basename(url)
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name)
    if name in used:
        stem, _, ext = name.rpartition(".")
        digest = hashlib.sha1(url.encode()).hexdigest()[:6]
        name = f"{stem or 'file'}-{digest}.{ext}" if ext else f"{name}-{digest}"
    used.add(name)
    return name


def sku_icon_name(code: str, url: str, used: set[str]) -> str:
    suffix = Path(urlparse(url.split("?")[0]).path).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
        suffix = ".png"
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", code).strip("-") or "typ"
    name = f"{slug}{suffix}"
    if name in used:
        digest = hashlib.sha1(url.encode()).hexdigest()[:6]
        name = f"{slug}-{digest}{suffix}"
    used.add(name)
    return name


def download_one(url: str, dest: Path) -> dict:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return {"url": url, "path": str(dest), "bytes": dest.stat().st_size, "cached": True}
    tmp = dest.with_suffix(dest.suffix + ".part")
    data = request(url)
    tmp.write_bytes(data)
    tmp.replace(dest)
    return {"url": url, "path": str(dest), "bytes": len(data), "cached": False}


# --- Swedish copy from supplier English. No invented specs. ---

PHRASES: list[tuple[str, str]] = [
    ("Ultra-High Performance Concrete", "UHPC-betong (Ultra-High Performance Concrete)"),
    ("The galvanized steel supporting structure is treated with a powder coating.", "Den galvaniserade stålkonstruktionen är pulverlackerad."),
    ("The galvanised steel supporting structure is treated with a powder coating.", "Den galvaniserade stålkonstruktionen är pulverlackerad."),
    ("The galvanised steel supporting structure is finished with a powder-coated baked paint finish.", "Den galvaniserade stålkonstruktionen har pulverlack som härdats i ugn."),
    ("The galvanized steel supporting structure is finished with a powder-coated baked paint finish.", "Den galvaniserade stålkonstruktionen har pulverlack som härdats i ugn."),
    ("Rubber sleeves are threaded on the upper part of the construction.", "Gummihylsor är trädda på den övre delen av konstruktionen."),
    ("In the lower part, two plates are welded with holes for anchoring to the base.", "I den nedre delen är två plattor svetsade med hål för förankring i underlaget."),
    ("The seat consists of solid wood slats fixed to the frame with stainless steel screws.", "Sitsen består av massiva trälister fästa i stommen med rostfria skruvar."),
    ("The planters are made of UHPC concrete (Ultra-High Performance Concrete).", "Planteringsdelarna är tillverkade av UHPC-betong (Ultra-High Performance Concrete)."),
    ("The mix is reinforced with composite fibres.", "Blandningen är armerad med kompositfibrer."),
    ("The colour of the concrete may vary slightly and naturally changes over time.", "Betongens kulör kan variera något och förändras naturligt över tid."),
    ("The color of the concrete may vary slightly and naturally changes over time.", "Betongens kulör kan variera något och förändras naturligt över tid."),
    ("The surface may contain pores or microcracks, which are part of the unique aesthetic character of concrete.", "Ytan kan innehålla porer eller mikrosprickor, vilket ingår i betongens estetiska karaktär."),
    ("which protects the bicycle paint from damage", "som skyddar cykelns lack mot skador"),
    ("A simple support system for bicycles with a rubber sleeve", "Ett enkelt stödsystem för cyklar med gummihylsa"),
    ("New BIKEME bike stand.", "Cykelställ BIKEME."),
    ("architectural concrete", "arkitektonisk betong"),
    ("powder coating", "pulverlackering"),
    ("powder-coated", "pulverlackerad"),
    ("galvanized steel", "galvaniserat stål"),
    ("galvanised steel", "galvaniserat stål"),
    ("stainless steel", "rostfritt stål"),
    ("supporting structure", "bärande konstruktion"),
    ("rubber sleeve", "gummihylsa"),
    ("rubber sleeves", "gummihylsor"),
    ("solid wood slats", "massiva trälister"),
    ("wood slats", "trälister"),
    ("tropical wood", "tropiskt trä"),
    ("bench without backrest", "bänk utan ryggstöd"),
    ("benches without backrest", "bänkar utan ryggstöd"),
    ("bench with backrest", "bänk med ryggstöd"),
    ("bench with armrest", "bänk med armstöd"),
    ("seat without backrest", "sits utan ryggstöd"),
    ("seat with backrest", "sits med ryggstöd"),
    ("without armrests", "utan armstöd"),
    ("with armrests", "med armstöd"),
    ("backrest on the wall", "ryggstöd för väggmontage"),
    ("central leg", "mittben"),
    ("inner diameter", "innerdiameter"),
    ("45° angle", "45° vinkel"),
    ("2 legs", "2 ben"),
    ("4 legs", "4 ben"),
    ("open pot", "öppen planteringsdel"),
    ("covered pot", "täckt planteringsdel"),
    ("steel leg", "stålben"),
    ("litter bin", "papperskorg"),
    ("bicycle stand", "cykelställ"),
    ("bike stand", "cykelställ"),
    ("scooter rack", "sparkcykelställ"),
    ("barrier pillar", "pollare"),
    ("picnic set", "picknickgrupp"),
    ("park bench", "parkbänk"),
    ("public spaces", "offentliga miljöer"),
    ("public space", "offentlig miljö"),
    ("hot-dip galvanized", "varmförzinkad"),
    ("hot-dip galvanised", "varmförzinkad"),
    ("anchoring to the base", "förankring i underlaget"),
    ("anchored to the base", "förankrad i underlaget"),
    ("composite fibres", "kompositfibrer"),
    ("composite fibers", "kompositfibrer"),
    ("without the need for additional landscaping", "utan extra landskapsarbete"),
    ("integrated planters", "integrerade planteringsdelar"),
    ("custom configurations", "anpassade konfigurationer"),
    ("maximum flexibility", "stor flexibilitet"),
]


def translate_en(text: str | None) -> str | None:
    if not text:
        return None
    out = text
    for src, dst in sorted(PHRASES, key=lambda x: len(x[0]), reverse=True):
        out = re.sub(re.escape(src), dst, out, flags=re.I)
    out = out.replace(" / ", " / ")
    return re.sub(r"[ \t]+", " ", out).strip()


OPTION_MAP = {
    "Metal parts options": "Kulör på metall",
    "Metal parts option": "Kulör på metall",
    "Concrete parts options": "Betong",
    "Wooden parts options": "Trä",
    "Wooden parts option": "Trä",
    "Wood parts options": "Trä",
    "Compact boards": "Kompaktlaminat",
    "RAL": None,
    "Tropical wood": "Tropiskt trä",
    # Keep STREETPARK's own RAL / Corten labels on the public picker.
    "Shade of Corten": None,
    "Gray": "Grå",
    "Grey": "Grå",
    "Sandy light": "Ljus sand",
    "Anthracite": "Antracit",
    "White": "Vit",
    "Black": "Svart",
    "Natural": "Natur",
    "Pine": "Furu",
    "Oak": "Ek",
    "Larch": "Lärk",
    "Acacia": "Akacia",
    "Garapa": "Garapa",
    "Thermo wood": "Termoträ",
    "Thermowood": "Termoträ",
}


def map_option(name: str) -> str:
    if name.upper().startswith("RAL "):
        return name
    mapped = OPTION_MAP.get(name)
    if mapped:
        return mapped
    return name


def option_name(entry: object) -> str:
    if isinstance(entry, dict):
        return str(entry.get("name") or "")
    return str(entry)


def map_legend(name: str) -> str:
    mapped = OPTION_MAP.get(name)
    return mapped or name


def info_sv(lines: list[str]) -> str | None:
    if not lines:
        return None
    return " / ".join(filter(None, (translate_en(x) for x in lines)))


def mounting_from_en(product: dict) -> list[str]:
    blob = " ".join(
        filter(None, [product.get("descriptionEn"), product.get("materialEn")])
    ).lower()
    out: list[str] = []
    if "anchoring to the base" in blob or "plates are welded with holes" in blob or "anchor" in blob:
        out.append("Förankras i underlaget enligt STREETPARKs underlag.")
    if "free-standing" in blob or "freestanding" in blob:
        out.append("Fristående")
    if "concrete foundation" in blob:
        out.append("Betongfundament enligt leverantörens anvisning.")
    return out


def first_sentence_sv(product: dict) -> str:
    desc = translate_en(product["descriptionEn"]) or ""
    first = desc.split("\n")[0].split(". ")[0].strip()
    if first and not first.endswith("."):
        first += "."
    if first:
        return first
    return f"{product['publicName']} från STREETPARK."


def build_description(product: dict) -> str:
    parts: list[str] = []
    raw = product.get("descriptionEn") or ""
    blocks = [b.strip() for b in re.split(r"\n+", raw) if b.strip()]
    for b in blocks:
        parts.append(translate_en(b) or b)
    if product.get("designer"):
        d = product["designer"]
        d = re.sub(r"^design\s+", "Formgivning: ", d, flags=re.I)
        if not d.lower().startswith("formgivning"):
            d = f"Formgivning: {d}"
        if d not in " ".join(parts):
            parts.append(d + ("" if d.endswith(".") else "."))
    parts.append("Tillverkare: STREETPARK.")
    return " ".join(parts)


def to_catalog_row(product: dict, related: list[str], local: dict) -> dict:
    models = product["models"]
    sizes = []
    for m in models:
        summary = info_sv(m.get("info") or [])
        size: dict = {
            "name": m["code"],
            "sku": m["code"],
            "summary": summary,
            "dimensions": m.get("dimensions") or [],
            "weight": m.get("weight"),
        }
        icon_path = (local.get("icons") or {}).get(m["code"])
        if icon_path:
            size["icon"] = icon_path["publicPath"]
            size["iconSourceUrl"] = icon_path["sourceUrl"]
        sizes.append(size)
    colors: list[str] = []
    variants: list[dict] = []
    for row in product.get("optionRows") or []:
        legend = map_legend(row["legend"])
        options = [map_option(option_name(o)) for o in row["options"]]
        if "metall" in legend.lower() or legend.startswith("Kulör"):
            colors = options
        else:
            variants.append({"label": legend, "options": options})

    images = []
    for img in local["images"]:
        item = {
            "src": img["publicPath"],
            "alt": img["alt"] or f"{product['publicName']}, STREETPARK",
            "kind": "studio",
            "sourceUrl": img["sourceUrl"],
            "fetchedAt": FETCHED_AT,
        }
        if img.get("size"):
            item["size"] = img["size"]
        images.append(item)

    documents = []
    for doc in local["documents"]:
        documents.append(
            {
                "title": doc["title"],
                "typeLabel": doc["typeLabel"],
                "format": doc["format"],
                "href": doc["publicPath"],
                "sourceUrl": doc["sourceUrl"],
                "fetchedAt": FETCHED_AT,
                "variant": doc.get("variant"),
                "kind": doc["kind"],
                "previewable": doc["format"] in {"JPG", "JPEG", "PNG", "WEBP", "GIF"},
                "appliesTo": doc.get("appliesTo"),
            }
        )

    material = translate_en(product.get("materialEn")) or None
    default_dims = models[0]["dimensions"] if models and models[0].get("dimensions") else []
    default_weight = models[0].get("weight") if models else None
    sku = models[0]["code"] if models else None

    return {
        "slug": product["slug"],
        "name": product["publicName"],
        "modelName": product["modelName"],
        "sku": sku,
        "manufacturer": "STREETPARK",
        "quoteShowsSku": True,
        "sourceUrl": product["sourceUrl"],
        "fetchedAt": FETCHED_AT,
        "category": product["category"],
        "categorySlug": product["categorySlug"],
        "subcategory": product["subcategory"],
        "subcategorySlug": product["subcategorySlug"],
        "summary": first_sentence_sv(product),
        "description": build_description(product),
        "material": material,
        "dimensions": default_dims,
        "weight": default_weight,
        "mounting": mounting_from_en(product),
        "sizes": sizes,
        "defaultSize": sizes[0]["name"] if sizes else None,
        "sizeLegend": "Modell" if sizes else None,
        "colorLegend": "Kulör på metall" if colors else None,
        "colors": colors,
        "variants": variants,
        "related": related,
        "images": images,
        "documents": documents,
        "imageNote": "Bilden visar ett exempelutförande från STREETPARK. Kulör på skärm kan avvika. Galleriet byts bara när en bild är märkt för vald modell.",
        "mentionsBetoni": product.get("mentionsBetoni", False),
    }


def attach_shared_docs(product: dict, shared_locals: dict) -> None:
    sampler = shared_locals.get("sampler")
    if product.get("samplerUrl") and sampler:
        product.setdefault("_shared", []).append(
            {
                **sampler,
                "variant": None,
                "appliesTo": "Gäller materialval som STREETPARK listar för produkten.",
            }
        )
    warranty = shared_locals.get("warranty")
    if warranty:
        product.setdefault("_shared", []).append(
            {
                **warranty,
                "variant": None,
                "appliesTo": "Gäller STREETPARKs sortiment enligt dokumentet.",
            }
        )
    betoni = shared_locals.get("betoniWarranty")
    if betoni and product.get("mentionsBetoni"):
        product.setdefault("_shared", []).append(
            {
                **betoni,
                "variant": None,
                "appliesTo": "Gäller Betoni-kollektionen enligt dokumentet.",
            }
        )


def main() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    GEN.mkdir(parents=True, exist_ok=True)
    IMG_ROOT.mkdir(parents=True, exist_ok=True)
    DOC_ROOT.mkdir(parents=True, exist_ok=True)

    products: list[dict] = []
    cat_urls: dict[str, dict] = {}
    for cat in CATEGORIES:
        html_path = CACHE / "cats" / f"{cat['key']}.html"
        if not html_path.exists():
            request(cat["url"], html_path)
        html = html_path.read_text(errors="replace")
        urls = parse_category(html)
        print(f"{cat['key']}: {len(urls)} products")
        for u in urls:
            cat_urls[u] = cat

    jobs = []
    for url, cat in cat_urls.items():
        key = product_url_key(url)
        dest = CACHE / "products" / f"{key}.html"
        jobs.append((url, cat, dest))

    def fetch_job(item):
        url, cat, dest = item
        if not dest.exists() or dest.stat().st_size < 1000:
            request(url, dest)
        return url, cat, dest

    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = [ex.submit(fetch_job, j) for j in jobs]
        for fut in as_completed(futs):
            url, cat, dest = fut.result()
            parsed = parse_product(dest.read_text(errors="replace"), url, cat)
            products.append(parsed)
            print(" parsed", parsed["slug"], parsed["modelName"], f"{len(parsed['models'])} models", f"{len(parsed['images'])} img")

    products.sort(key=lambda p: (p["subcategorySlug"], p["slug"]))

    dl_path = CACHE / "download.html"
    if not dl_path.exists():
        request(f"{BASE}/en/download/", dl_path)
    download = parse_download_page(dl_path.read_text(errors="replace"))
    for p in products:
        merge_files(p, download)
        tag_images(p)

    # Shared public files
    sampler_url = next((p["samplerUrl"] for p in products if p.get("samplerUrl")), None)
    warranty_url = next(
        (s["sourceUrl"] for s in download["shared"] if s["kind"] == "warranty" and "betoni" not in s["label"].lower()),
        None,
    )
    betoni_url = next(
        (s["sourceUrl"] for s in download["shared"] if s["kind"] == "warranty" and "betoni" in s["label"].lower()),
        None,
    )

    downloads: list[tuple[str, Path]] = []
    local_map: dict[str, dict] = {}
    shared_dir = DOC_ROOT / "shared"
    shared_dir.mkdir(parents=True, exist_ok=True)
    shared_used: set[str] = set()
    shared_locals: dict[str, dict] = {}

    def enqueue_shared(key: str, url: str | None, title: str, kind: str, type_label: str, applies: str):
        if not url:
            return
        name = safe_name(url, shared_used)
        dest = shared_dir / name
        downloads.append((url, dest))
        shared_locals[key] = {
            "title": title,
            "typeLabel": type_label,
            "format": ext_of(url) or ext_of(name) or "FIL",
            "kind": kind,
            "sourceUrl": url,
            "publicPath": f"/docs/streetpark/shared/{name}",
            "appliesTo": applies,
        }

    enqueue_shared(
        "sampler",
        sampler_url,
        "Material Sampler 2026",
        "material",
        "Materialprov",
        "Gäller materialval som STREETPARK listar för produkten.",
    )
    enqueue_shared(
        "warranty",
        warranty_url,
        "Warranty conditions and maintenance",
        "warranty",
        "Garanti och underhåll",
        "Gäller STREETPARKs sortiment enligt dokumentet.",
    )
    enqueue_shared(
        "betoniWarranty",
        betoni_url,
        "Warranty conditions and maintenance — Betoni collection",
        "warranty",
        "Garanti och underhåll",
        "Gäller Betoni-kollektionen enligt dokumentet.",
    )

    for p in products:
        used_img: set[str] = set()
        used_doc: set[str] = set()
        img_dir = IMG_ROOT / p["slug"]
        doc_dir = DOC_ROOT / p["slug"]
        images_local = []
        for img in p["images"]:
            name = safe_name(img["sourceUrl"], used_img)
            dest = img_dir / name
            downloads.append((img["sourceUrl"], dest))
            rec = {
                "sourceUrl": img["sourceUrl"],
                "publicPath": f"/images/streetpark/{p['slug']}/{name}",
                "alt": img.get("alt") or "",
            }
            if img.get("size"):
                rec["size"] = img["size"]
            images_local.append(rec)
        icons_local: dict[str, dict] = {}
        type_dir = img_dir / "types"
        used_icon: set[str] = set()
        for m in p.get("models") or []:
            url = m.get("iconUrl")
            if not url:
                continue
            name = sku_icon_name(m["code"], url, used_icon)
            dest = type_dir / name
            downloads.append((url, dest))
            icons_local[m["code"]] = {
                "sourceUrl": url,
                "publicPath": f"/images/streetpark/{p['slug']}/types/{name}",
            }
        documents_local = []
        seen_doc = set()
        for f in p["files"]:
            if f["sourceUrl"] in seen_doc:
                continue
            seen_doc.add(f["sourceUrl"])
            name = safe_name(f["sourceUrl"], used_doc)
            dest = doc_dir / name
            downloads.append((f["sourceUrl"], dest))
            documents_local.append(
                {
                    "title": f["label"],
                    "typeLabel": f["typeLabel"],
                    "format": f["format"],
                    "kind": f["kind"],
                    "sourceUrl": f["sourceUrl"],
                    "publicPath": f"/docs/streetpark/{p['slug']}/{name}",
                    "variant": f.get("variant"),
                }
            )
        attach_shared_docs(p, shared_locals)
        for extra in p.get("_shared") or []:
            if extra["sourceUrl"] in seen_doc:
                continue
            seen_doc.add(extra["sourceUrl"])
            documents_local.append(
                {
                    "title": extra["title"],
                    "typeLabel": extra["typeLabel"],
                    "format": extra["format"],
                    "kind": extra["kind"],
                    "sourceUrl": extra["sourceUrl"],
                    "publicPath": extra["publicPath"],
                    "variant": extra.get("variant"),
                    "appliesTo": extra.get("appliesTo"),
                }
            )
        local_map[p["slug"]] = {
            "images": images_local,
            "documents": documents_local,
            "icons": icons_local,
        }

    print(f"Downloading {len(downloads)} files…")
    ok = fail = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(download_one, url, dest): (url, dest) for url, dest in downloads}
        for i, fut in enumerate(as_completed(futs), 1):
            url, dest = futs[fut]
            try:
                res = fut.result()
                ok += 1
                if i % 25 == 0:
                    print(f"  {i}/{len(downloads)} {dest.name} {res['bytes']}b")
            except Exception as exc:  # noqa: BLE001
                fail += 1
                print("FAIL", url, exc)
                # drop missing files from catalog
                rel = str(dest)
                for loc in local_map.values():
                    loc["images"] = [x for x in loc["images"] if not x["publicPath"].endswith("/" + dest.name) or (IMG_ROOT / Path(x["publicPath"].removeprefix("/images/streetpark/"))).exists()]
                    loc["documents"] = [x for x in loc["documents"] if Path(PUBLIC / x["publicPath"].lstrip("/")).exists() or x["sourceUrl"] != url]

    # prune docs/images whose files failed
    for loc in local_map.values():
        loc["images"] = [x for x in loc["images"] if (PUBLIC / x["publicPath"].lstrip("/")).exists()]
        loc["documents"] = [x for x in loc["documents"] if (PUBLIC / x["publicPath"].lstrip("/")).exists()]
        loc["icons"] = {
            code: rec
            for code, rec in (loc.get("icons") or {}).items()
            if (PUBLIC / rec["publicPath"].lstrip("/")).exists()
        }

    by_sub: dict[str, list[str]] = {}
    for p in products:
        by_sub.setdefault(p["subcategorySlug"], []).append(p["slug"])

    series = []
    for p in products:
        group = by_sub.get(p["subcategorySlug"], [])
        related = [s for s in group if s != p["slug"]][:3]
        series.append(to_catalog_row(p, related, local_map[p["slug"]]))

    catalog = {
        "parkbankar": [p["slug"] for p in products if p["subcategorySlug"] == "parkbankar"],
        "papperskorgar": [p["slug"] for p in products if p["subcategorySlug"] == "papperskorgar"],
        "askkoppar": [p["slug"] for p in products if p["subcategorySlug"] == "askkoppar"],
        "cykelstall": [p["slug"] for p in products if p["subcategorySlug"] == "cykelstall"],
        "bord-picknick": [p["slug"] for p in products if p["subcategorySlug"] == "bord-picknick"],
        "pollare": [p["slug"] for p in products if p["subcategorySlug"] == "pollare"],
    }

    gated_all = []
    for p in products:
        for g in p["gated"]:
            gated_all.append(
                {
                    "product": p["publicName"],
                    "slug": p["slug"],
                    "name": g["name"],
                    "sourceUrl": g.get("sourceUrl") or p["sourceUrl"],
                    "variant": g.get("variant"),
                    "fetchedAt": FETCHED_AT,
                    "reason": g.get("reason", "login-required"),
                }
            )
    for g in download["gated"]:
        if not any(x["name"] == g["name"] and x.get("variant") == g.get("variant") for x in gated_all):
            # only keep if variant belongs to imported models
            codes = {m["code"].upper() for p in products for m in p["models"]}
            if g.get("variant") and g["variant"].upper() in codes:
                gated_all.append({**g, "fetchedAt": FETCHED_AT})

    payload = {
        "fetchedAt": FETCHED_AT,
        "source": BASE,
        "series": series,
        "catalog": catalog,
        "counts": {
            "products": len(series),
            "images": sum(len(p["images"]) for p in series),
            "documents": sum(len(p["documents"]) for p in series),
            "gated": len(gated_all),
            "downloadOk": ok,
            "downloadFail": fail,
        },
    }
    (GEN / "streetpark-series.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    (GEN / "streetpark-gated.json").write_text(
        json.dumps({"fetchedAt": FETCHED_AT, "items": gated_all}, ensure_ascii=False, indent=2) + "\n"
    )
    (CACHE / "parsed-products.json").write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n")
    print("Wrote", GEN / "streetpark-series.json")
    print(json.dumps(payload["counts"], indent=2))
    print("by cat", {k: len(v) for k, v in catalog.items()})
    strip_public_datasheets()


def strip_public_datasheets() -> None:
    script = Path(__file__).with_name("strip-streetpark-datasheets.py")
    ns = runpy.run_path(str(script))
    ns["strip_all"]()


if __name__ == "__main__":
    main()
