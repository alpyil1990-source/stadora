#!/usr/bin/env python3
"""Import VVZ-Play playground products into the STADORA Fas 0–1 catalog.

Credentials (VVZ_USER, VVZ_PASSWORD) are read from the environment only.
They are never written to JSON, logs, git, .env, or any file in this repo.
"""

from __future__ import annotations

import hashlib
import http.cookiejar
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG_ROOT = PUBLIC / "images" / "vvz-play"
DOC_ROOT = PUBLIC / "docs" / "vvz-play"
GEN = ROOT / "src" / "data" / "generated"
CACHE = Path("/tmp/vvz-import")
PAGES = CACHE / "pages"
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"
BASE = "https://www.vvz-play.com"
PDF_PATH = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/"
    "VVZ-Play_-_wholesale_pricelist_2026__1__0e75.pdf"
)
EXISTING_SLUGS = {
    "VZ1-006-15": {
        "slug": "kombinerad-lektorn-vz1-006-15",
        "name": "Kombinerad lektorn",
    },
    "PHP004": {
        "slug": "vippgunga-bage-php004",
        "name": "Vippgunga båge",
    },
}
NEW_TARGET = 50
DISCOUNT_PERCENT = 30

PLAYGROUND_CATS = [
    ("spring-swings", "fjaderlek", "Fjäderlek"),
    ("carousels", "karuseller", "Karuseller"),
    ("overweight-swings", "vippgungor", "Vippgungor"),
    ("hanging-swings", "gungor", "Gungor"),
    ("slides-with-swing", "rutschkanor", "Rutschkanor"),
    ("combined-sets", "lekstallningar", "Lekställningar"),
    ("playhouses-and-sandpits", "lekhus", "Lekhus och sandlek"),
    ("climbing-elements", "klattring-hinderbanor", "Klättring och hinderbanor"),
    ("monkey-tracks", "klattring-hinderbanor", "Klättring och hinderbanor"),
    ("pyramids", "klattring-hinderbanor", "Klättring och hinderbanor"),
    ("inclusive-playground", "tillganglig-lek", "Tillgänglig lek"),
    ("rope-elements", "lekplatsutrustning", "Lekplatsutrustning"),
    ("zip-lines", "lekplatsutrustning", "Lekplatsutrustning"),
    ("educational-panels", "lekplatsutrustning", "Lekplatsutrustning"),
    ("gyms", "lekplatsutrustning", "Lekplatsutrustning"),
    ("balancing-elements", "lekplatsutrustning", "Lekplatsutrustning"),
    ("bridges", "lekplatsutrustning", "Lekplatsutrustning"),
    ("inground-trampolines", "lekplatsutrustning", "Lekplatsutrustning"),
    ("tunnel-assemblies", "lekplatsutrustning", "Lekplatsutrustning"),
    ("vehicles-mini", "lekplatsutrustning", "Lekplatsutrustning"),
    ("tematicke-prvky", "lekplatsutrustning", "Lekplatsutrustning"),
]

QUOTAS = [
    ("lekstallningar", 8),
    ("gungor", 8),
    ("vippgungor", 6),
    ("rutschkanor", 5),
    ("karuseller", 4),
    ("fjaderlek", 5),
    ("lekhus", 3),
    ("klattring-hinderbanor", 4),
    ("tillganglig-lek", 3),
    ("lekplatsutrustning", 4),
]

COLOR_SV = {
    "orange + turquoise": ("Orange + turkos", "#ce5c27"),
    "turquoise + orange": ("Orange + turkos", "#ce5c27"),
    "orange + turkos": ("Orange + turkos", "#ce5c27"),
    "turkos + orange": ("Orange + turkos", "#ce5c27"),
    "brown + yellow green": ("Brun + gulgrön", "#6c4c2c"),
    "brown + yellow": ("Brun + gulgrön", "#6c4c2c"),
    "yellow green + brown": ("Brun + gulgrön", "#6c4c2c"),
    "brun + gulgron": ("Brun + gulgrön", "#6c4c2c"),
    "brun + gulgrön": ("Brun + gulgrön", "#6c4c2c"),
    "gulgron + brun": ("Brun + gulgrön", "#6c4c2c"),
    "gulgrön + brun": ("Brun + gulgrön", "#6c4c2c"),
    "anthracite + yellow": ("Antracit + gul", "#f7b500"),
    "yellow + anthracite": ("Antracit + gul", "#f7b500"),
    "antracit + gul": ("Antracit + gul", "#f7b500"),
    "gul + antracit": ("Antracit + gul", "#f7b500"),
    "anthracite + red": ("Antracit + röd", "#bb1e10"),
    "red + anthracite": ("Antracit + röd", "#bb1e10"),
    "antracit + rod": ("Antracit + röd", "#bb1e10"),
    "antracit + röd": ("Antracit + röd", "#bb1e10"),
    "rod + antracit": ("Antracit + röd", "#bb1e10"),
    "röd + antracit": ("Antracit + röd", "#bb1e10"),
    "green + white": ("Grön + vit", "#68a640"),
    "white + green": ("Grön + vit", "#68a640"),
    "gron + vit": ("Grön + vit", "#68a640"),
    "grön + vit": ("Grön + vit", "#68a640"),
}

COLOR_HEX = {
    "#ce5c27": "Orange + turkos",
    "#3d898b": "Orange + turkos",
    "#6c4c2c": "Brun + gulgrön",
    "#abc251": "Brun + gulgrön",
    "#f7b500": "Antracit + gul",
    "#bb1e10": "Antracit + röd",
    "#68a640": "Grön + vit",
}

PREFERRED_COLOR_ORDER = [
    "Orange + turkos",
    "Brun + gulgrön",
    "Antracit + gul",
    "Antracit + röd",
    "Grön + vit",
]

SKIP_URL_PARTS = (
    "/catalog/urban-furniture",
    "/catalog/benches",
    "/catalog/waste-bins",
    "/catalog/bicycle",
    "/catalog/outdoor-fitness",
    "/catalog/street-workout",
    "/catalog/skatepark",
    "/catalog/parkour",
    "/catalog/bouldering",
    "/catalog/impact-surfaces",
    "/catalog/rope-parks",
    "/catalog/bus-stops",
    "/profile/",
    "/reviews/",
)

SKU_IN_TITLE = re.compile(r"(?:VVZ-)?([A-Z]{1,8}\d{1,4}(?:[-_][A-Z0-9]+){0,4})", re.I)
SKU_LINE = re.compile(r"^(?:VVZ-)?([A-Z]{1,8}\d{1,4}(?:[-_][A-Z0-9]+){0,4})$", re.I)
PRICE_RE = re.compile(r"^[\d\s\xa0]+,\d{2}\s*€$")
HEX_RE = re.compile(r"CART_add\('product',(\d+),'([0-9A-Fa-f]+)'")


def fold(text: str) -> str:
    nfd = unicodedata.normalize("NFD", text or "")
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn").lower()


def slugify(text: str) -> str:
    s = fold(text)
    s = s.replace("å", "a").replace("ä", "a").replace("ö", "o")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def abs_url(href: str) -> str:
    href = (href or "").strip()
    if not href:
        return ""
    if href.startswith("//"):
        return "https:" + href
    return urljoin(BASE + "/", href)


def encode_iri(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    path = quote(unquote(parts.path), safe="/-_.~(),")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def basename(url: str) -> str:
    name = unquote(urlparse(url.split("?")[0].split("#")[0]).path.rsplit("/", 1)[-1])
    return name or "file"


def safe_name(name: str) -> str:
    base = Path(name).name
    return re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip("-.") or "file"


def opener(cookie: http.cookiejar.CookieJar | None = None) -> urllib.request.OpenerDirector:
    jar = cookie or http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def fetch(op: urllib.request.OpenerDirector, url: str, dest: Path | None = None, retries: int = 4) -> bytes:
    last: Exception | None = None
    encoded = encode_iri(url)
    for i in range(retries):
        try:
            req = urllib.request.Request(encoded, headers={"User-Agent": UA, "Accept": "*/*"})
            with op.open(req, timeout=90) as resp:
                data = resp.read()
                final = resp.geturl()
            if dest:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
            return data
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(1.2 * (i + 1))
    raise RuntimeError(f"Failed {url}: {last}") from last


def parse_price(text: str) -> float:
    s = text.replace("€", "").replace("\xa0", "").replace(" ", "").replace(",", ".")
    return float(s)


def parse_pricelist() -> dict[str, dict]:
    import pymupdf

    doc = pymupdf.open(PDF_PATH)
    skip = {
        "Cenník produktov",
        "Veríme v Zábavu, s.r.o.",
        "Code",
        "Picture",
        "Name of product",
        "Notes",
        "(-30%)",
    }
    skip_prefix = ("Price of product", "Wholesale price", "Od 1.6.2026", "Strana ")
    rows: dict[str, dict] = {}
    pending_sku = ""
    for page in doc:
        lines = [ln.strip() for ln in page.get_text("text").splitlines() if ln.strip()]
        i = 0
        while i < len(lines):
            ln = lines[i]
            if ln in skip or ln.startswith(skip_prefix):
                i += 1
                continue
            joined = ln
            m = SKU_LINE.match(ln)
            if not m and pending_sku and re.fullmatch(r"\d{1,2}", ln):
                joined = pending_sku + ln
                m = SKU_LINE.match(joined)
                pending_sku = ""
            if m:
                sku = m.group(1).upper().replace("_", "-")
                name_parts: list[str] = []
                i += 1
                while i < len(lines) and not PRICE_RE.match(lines[i]) and not SKU_LINE.match(lines[i]):
                    if lines[i] in skip or lines[i].startswith(skip_prefix):
                        break
                    if lines[i] == "=":
                        i += 1
                        continue
                    name_parts.append(lines[i])
                    i += 1
                prices: list[float] = []
                while i < len(lines) and PRICE_RE.match(lines[i]) and len(prices) < 2:
                    prices.append(parse_price(lines[i]))
                    i += 1
                if prices:
                    list_eur = prices[0]
                    net = round(list_eur * (1 - DISCOUNT_PERCENT / 100), 2)
                    rows[sku] = {
                        "sku": sku,
                        "listName": " ".join(name_parts).strip(),
                        "listEur": list_eur,
                        "netEur": net,
                        "wholesaleEur": prices[1] if len(prices) > 1 else net,
                    }
                continue
            if re.fullmatch(r"[A-Z]{1,8}\d{0,3}-[A-Z0-9]+-", ln):
                pending_sku = ln
            i += 1
    return rows


def hex_decode(h: str) -> str:
    try:
        return bytes.fromhex(h).decode("utf-8")
    except Exception:
        return ""


def sku_from_text(*parts: str) -> str | None:
    blob = " ".join(p for p in parts if p)
    for m in SKU_IN_TITLE.finditer(blob):
        sku = m.group(1).upper().replace("_", "-")
        if sku.startswith("VVZ-"):
            sku = sku[4:]
        if re.search(r"\d", sku):
            return sku
    return None


def cat_for_url(url: str) -> tuple[str, str]:
    path = urlparse(url).path.strip("/")
    slug = path.split("/")[-1] if path else ""
    for key, sub, name in PLAYGROUND_CATS:
        if key == slug or f"/{key}/" in url:
            return sub, name
    return "lekplatsutrustning", "Lekplatsutrustning"


def extract_listing_products(html: str, page_url: str) -> tuple[list[dict], list[str]]:
    soup = BeautifulSoup(html, "lxml")
    products: list[dict] = []
    children: list[str] = []
    for a in soup.select(".katalog-lite-content-products-child a[href]"):
        href = abs_url(a["href"])
        if "/catalog/" in href:
            children.append(href.rstrip("/") + "/")
    for card in soup.select(".katalog-lite-content-product"):
        a = card.select_one("a[href]")
        if not a:
            continue
        href = abs_url(a.get("href") or "")
        if not href or "/catalog/" in href:
            continue
        title = ""
        t = card.select_one(".katalog-lite-small-product-info-text-title")
        if t:
            title = t.get_text(" ", strip=True)
        title = title or a.get("aria-label") or a.get_text(" ", strip=True)
        sku = sku_from_text(title, href)
        clicker = card.select_one(".katalog-lite-small-product-clicker")
        if clicker and clicker.get("onclick"):
            hm = HEX_RE.search(clicker["onclick"])
            if hm:
                decoded = hex_decode(hm.group(2))
                sku = sku or sku_from_text(decoded) or decoded.upper()
        sub, sub_name = cat_for_url(page_url)
        if "inclusive" in fold(title):
            sub, sub_name = "tillganglig-lek", "Tillgänglig lek"
        products.append(
            {
                "url": href.split("?")[0],
                "title": title,
                "sku": sku,
                "subcategorySlug": sub,
                "subcategory": sub_name,
            }
        )
    nexts = []
    for rel in ("next",):
        tag = soup.find("link", rel=rel)
        if tag and tag.get("href"):
            nexts.append(abs_url(tag["href"]))
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        if re.search(r"[?&]p=\d+", href) and "/catalog/" in href:
            nexts.append(abs_url(href))
    children.extend(nexts)
    return products, children


def crawl_catalog(op: urllib.request.OpenerDirector) -> list[dict]:
    seen_pages: set[str] = set()
    found: dict[str, dict] = {}
    queue: list[str] = [f"{BASE}/catalog/{key}/" for key, _, _ in PLAYGROUND_CATS]
    while queue:
        url = queue.pop(0)
        key = url.split("?")[0].rstrip("/")
        if key in seen_pages:
            continue
        if any(part in key for part in SKIP_URL_PARTS):
            continue
        seen_pages.add(key)
        try:
            html = fetch(op, url).decode("utf-8", "replace")
        except Exception as exc:
            print("skip page", url, exc)
            continue
        products, children = extract_listing_products(html, url)
        for p in products:
            sku = p.get("sku")
            if not sku:
                continue
            prev = found.get(sku)
            if not prev:
                found[sku] = p
            elif prev.get("subcategorySlug") == "lekplatsutrustning" and p["subcategorySlug"] != "lekplatsutrustning":
                found[sku] = p
        for child in children:
            ckey = child.split("?")[0].rstrip("/")
            if ckey not in seen_pages and "/catalog/" in child:
                queue.append(child)
        print(f"  crawled {url} -> {len(products)} products, queue {len(queue)}")
    return list(found.values())


def swedish_color(name: str, hex_val: str | None = None) -> dict:
    key = fold(name).replace("yellow-green", "yellow green")
    hex_key = (hex_val or "").strip().lower()
    mapped_name = COLOR_HEX.get(hex_key)
    mapped = COLOR_SV.get(key)
    if mapped_name:
        row = {"name": mapped_name}
        if hex_val:
            row["hex"] = hex_key
        return row
    if mapped:
        return {"name": mapped[0], "hex": mapped[1]}
    row = {"name": name.strip()}
    if hex_val:
        row["hex"] = hex_val
    return row


def swedish_name(english: str, sku: str) -> str:
    if sku in EXISTING_SLUGS:
        return EXISTING_SLUGS[sku]["name"]
    t = re.sub(r"\s+", " ", english).strip()
    t = re.sub(r"\bVVZ-?" + re.escape(sku) + r"\b", "", t, flags=re.I)
    t = re.sub(r"\bVVZ-[A-Z0-9-]+\b", "", t, flags=re.I)
    t = re.sub(r"\bEN\b", "", t).strip(" -–|,")
    low = fold(t)

    towers = [
        ("ten-tower", "Lekställning tiotorn"),
        ("eight-tower", "Lekställning åttatorn"),
        ("seven-tower", "Lekställning sjutorn"),
        ("six-tower", "Lekställning sextorn"),
        ("five-tower", "Lekställning femtorn"),
        ("four-tower", "Lekställning fyrtorn"),
        ("triple-tower", "Lekställning tretorn"),
        ("double-tower", "Lekställning tvåtorn"),
        ("single-tower", "Lekställning ettorn"),
        ("combined tower", "Kombinerad lekställning"),
        ("tower set", "Lekställning"),
        ("combined play structure", "Lekställning"),
        ("combined play set", "Lekställning"),
        ("playtowers", "Lekställning"),
    ]
    for needle, noun in towers:
        if needle in low:
            bits = [noun]
            if "high" in low:
                bits.append("hög")
            if "low" in low:
                bits.append("låg")
            if "roof" in low:
                bits.append("med tak")
            if "swing" in low:
                bits.append("med gunga")
            if "tunnel" in low:
                bits.append("med tunnel")
            return " ".join(bits)

    if "seesaw" in low or "teeter" in low:
        bits = ["Vippgunga"]
        if "horse" in low:
            bits.append("häst")
        if "arch" in low:
            bits.append("båge")
        if "rotat" in low:
            bits.append("roterande")
        if "spring" in low:
            bits.append("fjäder")
        if "standing" in low:
            bits.append("stående")
        if "4 person" in low or "for 4" in low:
            bits.append("fyra personer")
        if "6 person" in low or "for 6" in low:
            bits.append("sex personer")
        if "one leg" in low or "single-leg" in low:
            bits.append("enben")
        m = re.search(r"(\d)\s*m", low)
        if m and len(bits) < 3:
            bits.append(f"{m.group(1)} m")
        return " ".join(bits)

    if "hanging swing" in low or "swing-seat" in low or (low.startswith("swing") and "slide" not in low):
        bits = ["Gunga"]
        if "toddler" in low:
            bits.append("småbarn")
        if "baby" in low:
            bits.append("babysits")
        if "nest" in low:
            bits.append("fågelbo")
        if "mother" in low or "matka" in low:
            bits.append("mamma-barn")
        if "classic" in low:
            bits.append("Classic")
        if "double" in low or "2x" in low:
            bits.insert(0, "Dubbel")
            bits[1] = "gunga"
        if "triple" in low or "3x" in low:
            bits.insert(0, "Trippel")
            bits[1] = "gunga"
        hic = re.search(r"hic\s*(\d[.,]\d)", low)
        if hic:
            bits.append(f"{hic.group(1).replace('.', ',')} m")
        elif re.search(r"-15\b", sku):
            bits.append("1,5 m")
        elif re.search(r"-10\b", sku):
            bits.append("1,0 m")
        return " ".join(bits)

    if "slide" in low:
        bits = ["Rutschkana"]
        if "double" in low:
            bits = ["Dubbelrutschkana"]
        if "triple" in low:
            bits = ["Trippelrutschkana"]
        if "swing" in low:
            bits.append("med gunga")
        if "slope" in low:
            bits.append("slänt")
        return " ".join(bits)

    if "carousel" in low or "roundabout" in low:
        bits = ["Karusell"]
        if "inclusive" in low:
            bits.append("tillgänglig")
        if "bowl" in low:
            bits.append("skål")
        if "nest" in low:
            bits.append("fågelbo")
        return " ".join(bits)

    if "spring" in low and ("rocker" in low or "rider" in low or "animal" in low or sku.startswith("W") or sku.startswith("F")):
        bits = ["Fjädergunga"]
        extra = re.sub(r"(springer|spring rocker|spring rider|for kids)", "", t, flags=re.I).strip(" -")
        extra = extra[:40].strip()
        if extra and fold(extra) not in ("", "fjädergunga"):
            bits.append(extra)
        return " ".join(bits) if extra else "Fjädergunga"

    if "playhouse" in low or "house" in low or "sandbox" in low or "sandpit" in low:
        if "sand" in low:
            return "Sandlåda" if "house" not in low else "Lekhus med sandlåda"
        bits = ["Lekhus"]
        theme = re.sub(r"(themed house|playhouse|house)", "", t, flags=re.I).strip(" -")
        if theme:
            bits.append(theme)
        return " ".join(bits)

    if "pyramid" in low:
        return "Klätterpyramid"
    if "zip" in low or "cableway" in low:
        return "Linbana"
    if "panel" in low or "abacus" in low:
        return "Lekpanel"
    if "inclusive" in low:
        return "Tillgänglig lek " + t[:40]
    if "trampolin" in low:
        return "Markstudsmatta"
    if "vehicle" in low or "car " in low or "train" in low:
        return "Lekfordon"
    if "balance" in low or "agility" in low:
        return "Balanslek"
    if "bridge" in low:
        bits = ["Lekbro"]
        if "rope" in low:
            bits.insert(0, "Rep")
            bits[1] = "lekbro"
        if "arch" in low:
            bits.append("båge")
        return " ".join(bits)
    if "climb" in low or "monkey" in low or "obstacle" in low:
        return "Klätterlek"
    if "gym" in low:
        return "Lekgym"
    if "tunnel" in low:
        return "Lektunnel"
    cleaned = t.strip(" -")
    return cleaned[:80] if cleaned else f"Lekredskap {sku}"


def make_slug(name: str, sku: str) -> str:
    if sku in EXISTING_SLUGS:
        return EXISTING_SLUGS[sku]["slug"]
    base = slugify(name) or "lekredskap"
    sku_bit = slugify(sku)
    if sku_bit and sku_bit not in base:
        base = f"{base}-{sku_bit}"
    return base[:90]


def fmt_m(val: str) -> str:
    v = val.strip().replace(".", ",")
    return f"{v} m"


def parse_product_html(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    h1 = soup.find("h1")
    original = h1.get_text(" ", strip=True) if h1 else ""
    desc_el = soup.select_one(".VVZ-PRO-form-mid-TEXT-in-DESC") or soup.select_one(
        ".VVZ-PRO-form-top-data-in-desc-in"
    )
    description_en = ""
    if desc_el:
        description_en = " ".join(desc_el.get_text(" ", strip=True).split())
    params: dict[str, str] = {}
    dims: list[dict] = []
    for item in soup.select(".VVZ-PRO-form-mid-PARAMS-item"):
        title = item.select_one(".VVZ-PRO-form-mid-PARAMS-item-title span")
        label = title.get_text(" ", strip=True).rstrip(":") if title else ""
        data = item.select_one(".VVZ-PRO-form-mid-PARAMS-item-data")
        datas = item.select(".VVZ-PRO-form-mid-PARAMS-item-datas > div")
        if datas:
            params[label] = " · ".join(d.get_text(" ", strip=True) for d in datas)
            if "dimension" in fold(label):
                for d in datas:
                    txt = d.get_text(" ", strip=True)
                    m = re.match(r"(length|width|height)\s+([\d.]+)\s*m", txt, re.I)
                    if m:
                        sv = {"length": "Längd", "width": "Bredd", "height": "Höjd"}[m.group(1).lower()]
                        dims.append({"label": sv, "value": fmt_m(m.group(2))})
            if "protective" in fold(label) or "impact" in fold(label):
                pass
        elif data:
            params[label] = data.get_text(" ", strip=True)
    sku = sku_from_text(params.get("Item code", ""), original, url) or ""
    sku = sku.upper()

    colors = []
    for el in soup.select(".VVZ-PRO-form-top-data-in-variants-item"):
        if "INFO" in " ".join(el.get("class") or []):
            continue
        title = el.select_one(".VVZ-PRO-form-top-data-in-variants-item-title span")
        name = title.get_text(" ", strip=True) if title else ""
        style = el.select_one(".VVZ-PRO-form-top-data-in-variants-item-color")
        hex_val = None
        if style and style.get("style"):
            hm = re.search(r"#([0-9a-fA-F]{6})", style["style"])
            if hm:
                hex_val = "#" + hm.group(1).lower()
        if name:
            colors.append(swedish_color(name, hex_val))

    images = []
    seen = set()
    for a in soup.select("a.gallery-top-a[href], a[data-fancybox='galeria'][href]"):
        href = abs_url(a.get("href") or "")
        if not href or "/produkt_lite/" not in href:
            continue
        if href in seen:
            continue
        seen.add(href)
        images.append(href)
    if not images:
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            images.append(og["content"])

    docs = []
    for item in soup.select(".VVZ-PRO-form-mid-TEXT-in-DOWNLOAD-item"):
        title_el = item.select_one(".VVZ-PRO-form-mid-TEXT-in-DOWNLOAD-item-data-main")
        sub_el = item.select_one(".VVZ-PRO-form-mid-TEXT-in-DOWNLOAD-item-data-sub")
        title = title_el.get_text(" ", strip=True) if title_el else ""
        sub = sub_el.get_text(" ", strip=True) if sub_el else ""
        locked = "locked" in " ".join(item.get("class") or [])
        a = item.select_one("a[href]")
        href = abs_url(a["href"]) if a and a.get("href") else ""
        docs.append({"title": title, "sub": sub, "href": href, "locked": locked})

    age = None
    am = re.search(r"from\s+(\d+)\s+to\s+(\d+)", params.get("Age category", ""), re.I)
    if am:
        age = f"{am.group(1)}–{am.group(2)} år"
    users = None
    um = re.search(r"(\d+)", params.get("Element capacity", ""))
    if um:
        users = f"{um.group(1)} personer" if um.group(1) != "1" else "1 person"
    fall = None
    fm = re.search(r"([\d.]+)", params.get("Free fall height", ""))
    if fm:
        fall = f"upp till {fmt_m(fm.group(1))}"
    zone_area = zone_peri = None
    prot = params.get("Protective area", "")
    nums = re.findall(r"([\d.]+)", prot)
    if len(nums) >= 2:
        zone_peri = f"{nums[0].replace('.', ',')} × {nums[1].replace('.', ',')} m"
    if len(nums) >= 3:
        zone_area = f"{nums[2].replace('.', ',')} m²"
    standards = []
    st = params.get("Certified according to standard", "")
    if st:
        standards = [s.strip() for s in re.split(r"[,;/]", st) if s.strip()]

    material = None
    mm = re.search(r"Material:\s*(.+?)(?:\.|$)", description_en, re.I)
    if mm:
        material = mm.group(1).strip()

    crumbs = [a.get_text(" ", strip=True) for a in soup.select(".VVZ-PRO-form-top-data-in-bread-item a")]
    return {
        "originalName": original,
        "descriptionEn": description_en,
        "sku": sku,
        "params": params,
        "dimensions": dims,
        "colors": colors,
        "imageUrls": images,
        "docs": docs,
        "ageRange": age,
        "users": users,
        "fallHeight": fall,
        "safetyZonePerimeter": zone_peri,
        "safetyZoneArea": zone_area,
        "standards": standards,
        "material": material,
        "crumbs": crumbs,
        "url": url,
    }


def translate_summary(parsed: dict, name: str) -> str:
    bits = [name]
    if parsed.get("ageRange"):
        bits.append(f"Ålder {parsed['ageRange']}.")
    if parsed.get("users"):
        bits.append(parsed["users"] + ".")
    if parsed.get("fallHeight"):
        bits.append(f"Fallhöjd {parsed['fallHeight']}.")
    return " ".join(bits)


def translate_description(parsed: dict, name: str) -> str:
    parts = [name + "."]
    if parsed.get("ageRange"):
        parts.append(f"Ålder {parsed['ageRange']}.")
    if parsed.get("users"):
        parts.append(f"Kapacitet {parsed['users']}.")
    if parsed.get("fallHeight"):
        parts.append(f"Fallhöjd {parsed['fallHeight']}.")
    if parsed.get("safetyZonePerimeter"):
        peri = parsed["safetyZonePerimeter"]
        extra = f" ({parsed['safetyZoneArea']})" if parsed.get("safetyZoneArea") else ""
        parts.append(f"Säkerhetsområde {peri}{extra}.")
    if parsed.get("material"):
        parts.append("Material enligt leverantören: " + parsed["material"].rstrip(".") + ".")
    if parsed.get("standards"):
        parts.append("Certifierad enligt " + ", ".join(parsed["standards"]) + ".")
    return " ".join(parts)


def color_for_image(url: str, colors: list[dict]) -> str | None:
    name = fold(basename(url))
    mapping = [
        (("-yg", "_yg", "yg_"), "Brun + gulgrön"),
        (("-t.", "_t.", "-t_", "_t_"), "Orange + turkos"),
        (("-y.", "_y.", "-y_", "_y_"), "Antracit + gul"),
        (("-r.", "_r.", "-r_", "_r_"), "Antracit + röd"),
    ]
    for needles, color in mapping:
        if any(n in name for n in needles):
            for c in colors:
                if c["name"] == color:
                    return color
            return color
    return colors[0]["name"] if colors else None


def classify_doc(title: str, href: str, locked: bool) -> dict | None:
    t = fold(title)
    ext = Path(urlparse(href).path).suffix.lower() if href else ""
    if "dwg" in t or ext == ".dwg":
        return {
            "kind": "cad",
            "format": "DWG",
            "typeLabel": "CAD, DWG",
            "title": "DWG",
            "access": "registered_customer",
            "previewable": False,
        }
    if "certif" in t:
        ext = Path(urlparse(href).path).suffix.lower() if href else ".pdf"
        fmt = ext.lstrip(".").upper() or "PDF"
        if fmt == "JPEG":
            fmt = "JPG"
        return {
            "kind": "certificate",
            "format": fmt,
            "typeLabel": "Certifikat",
            "title": "Certifikat",
            "access": "internal_only",
            "previewable": False,
            "language": None,
        }
    if "catalog" in t or "sheet" in t or "datasheet" in t:
        return {
            "kind": "datasheet",
            "format": "PDF",
            "typeLabel": "Produktblad",
            "title": "Produktblad",
            "access": "public",
            "previewable": True,
            "language": "en",
        }
    if "impact" in t or "protective" in t:
        return {
            "kind": "drawing",
            "format": "PDF",
            "typeLabel": "Ritning, säkerhetsområde",
            "title": "Säkerhetsområde",
            "access": "public",
            "previewable": False,
        }
    if locked and "assembl" in t:
        return None
    if href and ext == ".pdf":
        return {
            "kind": "datasheet",
            "format": "PDF",
            "typeLabel": title or "Dokument",
            "title": title or "Dokument",
            "access": "public",
            "previewable": False,
        }
    return None


def file_hash(data: bytes) -> str:
    return hashlib.sha1(data).hexdigest()[:12]


EXISTING_FALLBACK = {
    "VZ1-006-15": {
        "url": "https://www.vvz-play.com/combined-tower-set-vvz-vz1-006-15-en/",
        "title": "Combined Tower set VVZ-VZ1-006-15",
        "sku": "VZ1-006-15",
        "subcategorySlug": "lekstallningar",
        "subcategory": "Lekställningar",
    },
    "PHP004": {
        "url": "https://www.vvz-play.com/seesaw-swing-arched-vvz-php004/",
        "title": "Seesaw Swing - Arched VVZ-PHP004",
        "sku": "PHP004",
        "subcategorySlug": "vippgungor",
        "subcategory": "Vippgungor",
    },
}


def select_products(listed: list[dict], prices: dict[str, dict]) -> list[dict]:
    by_sub: dict[str, list[dict]] = defaultdict(list)
    existing = []
    for p in listed:
        sku = (p.get("sku") or "").upper()
        if sku not in prices or prices[sku].get("listEur") is None:
            continue
        p = {**p, "sku": sku, **{k: prices[sku][k] for k in ("listEur", "netEur", "wholesaleEur", "listName")}}
        if sku in EXISTING_SLUGS:
            existing.append(p)
            continue
        by_sub[p["subcategorySlug"]].append(p)

    have_existing = {p["sku"] for p in existing}
    for sku, meta in EXISTING_FALLBACK.items():
        if sku in have_existing:
            continue
        if sku not in prices or prices[sku].get("listEur") is None:
            continue
        existing.append(
            {
                **meta,
                **{k: prices[sku][k] for k in ("listEur", "netEur", "wholesaleEur", "listName")},
            }
        )

    def rank(p: dict) -> tuple:
        sku = p["sku"]
        title = fold(p.get("title") or "") + " " + fold(p.get("listName") or "")
        # Prefer typical municipal sizes over mega sets / many-seat combos.
        penalty = 0
        if re.search(r"VZP?[5-9]|VZP10|VZD[5-9]|VZD[6-8]", sku):
            penalty += 5
        if sku.count("-") > 3:
            penalty += 1
        sub = p.get("subcategorySlug")
        if sub == "lekhus":
            if "tarpaulin" in title or "cover for" in title:
                penalty += 20
            if "house" in title or "playhouse" in title:
                penalty -= 3
        if sub == "tillganglig-lek" and "inclusive" not in title:
            penalty += 8
        if "inclusive" in title:
            penalty -= 4
        return (penalty, p.get("listEur") or 0, sku)

    for sub in by_sub:
        by_sub[sub].sort(key=rank)

    chosen: list[dict] = list(existing)
    used = {p["sku"] for p in chosen}
    for sub, n in QUOTAS:
        pool = [p for p in by_sub.get(sub, []) if p["sku"] not in used]
        take = pool[:n]
        chosen.extend(take)
        used.update(p["sku"] for p in take)

    # Fill up to 50 new if some buckets were short.
    new_count = len(chosen) - len(existing)
    if new_count < NEW_TARGET:
        rest = []
        for sub, items in by_sub.items():
            rest.extend(p for p in items if p["sku"] not in used)
        rest.sort(key=rank)
        need = NEW_TARGET - new_count
        chosen.extend(rest[:need])
        used.update(p["sku"] for p in rest[:need])

    # Trim extra new products, never drop existing.
    extras = [p for p in chosen if p["sku"] not in EXISTING_SLUGS]
    keep = [p for p in chosen if p["sku"] in EXISTING_SLUGS]
    extras = extras[:NEW_TARGET]
    return keep + extras


def login(op: urllib.request.OpenerDirector) -> bool:
    user = (os.environ.get("VVZ_USER") or "").strip()
    password = os.environ.get("VVZ_PASSWORD") or ""
    if not user or not password:
        print("VVZ_USER / VVZ_PASSWORD not set — DWG stays locked.", file=sys.stderr)
        return False
    login_url = f"{BASE}/profile/login/"
    fetch(op, login_url)
    data = urllib.parse.urlencode(
        {
            "login-email": user,
            "login-pass": password,
            "save": "Log in",
            "keep_me": "1",
        }
    ).encode()
    req = urllib.request.Request(
        login_url,
        data=data,
        headers={
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": BASE,
            "Referer": login_url,
        },
        method="POST",
    )
    try:
        with op.open(req, timeout=60) as resp:
            body = resp.read().decode("utf-8", "replace")
            final = resp.geturl()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        final = getattr(exc, "url", login_url)
        print("login HTTP", exc.code)
    logged = "login-pass" not in body and ("profile" in final or "Log out" in body or "Odhlásiť" in body or "logout" in fold(body))
    if not logged:
        # Some sessions land on profile without the password field.
        logged = "login-email" not in body and "/profile/login" not in final
    print("login", "ok" if logged else "failed", "final", final.split("?")[0])
    return bool(logged)


def download_logged_product(op: urllib.request.OpenerDirector, url: str) -> list[dict]:
    html = fetch(op, url).decode("utf-8", "replace")
    parsed = parse_product_html(html, url)
    return parsed["docs"]


def build_one(op: urllib.request.OpenerDirector, listed: dict, prices: dict, logged: bool) -> dict | None:
    url = listed["url"]
    sku = listed["sku"]
    html = fetch(op, url).decode("utf-8", "replace")
    parsed = parse_product_html(html, url)
    sku = (parsed.get("sku") or sku).upper()
    if sku not in prices:
        print("  skip no price", sku, url)
        return None
    if logged:
        parsed["docs"] = download_logged_product(op, url)

    name = swedish_name(parsed.get("originalName") or listed.get("title") or sku, sku)
    slug = make_slug(name, sku)
    sub_slug = listed["subcategorySlug"]
    sub_name = listed["subcategory"]
    img_dir = IMG_ROOT / slug
    img_dir.mkdir(parents=True, exist_ok=True)
    doc_dir = DOC_ROOT / slug
    doc_dir.mkdir(parents=True, exist_ok=True)

    images = []
    seen_dest: set[str] = set()
    for i, src in enumerate(parsed["imageUrls"][:8]):
        raw = basename(src)
        ext = Path(raw).suffix.lower() or ".jpg"
        color = color_for_image(src, parsed["colors"])
        kind = "detail" if re.search(r"\(b\)|_b\.|-b\.|baksida|back", fold(raw)) else "studio"
        fname = f"{i:02d}{ext}"
        if color:
            fname = f"{slugify(color)}{'-baksida' if kind == 'detail' else ''}{ext}"
            dest = img_dir / fname
        else:
            dest = img_dir / fname
        if dest.name in seen_dest:
            continue
        try:
            fetch(op, src if src.startswith("http") else abs_url(src), dest)
        except Exception as exc:
            print("  img fail", sku, src, exc)
            continue
        seen_dest.add(dest.name)
        alt = name + (f", {color.lower()}" if color else "")
        images.append(
            {
                "src": f"/images/vvz-play/{slug}/{dest.name}",
                "alt": alt,
                "kind": kind,
                "color": color,
                "caption": color,
            }
        )

    uniq_images = []
    seen_src: set[str] = set()
    for im in images:
        if im["src"] in seen_src:
            continue
        seen_src.add(im["src"])
        if im.get("color"):
            sv = swedish_color(im["color"])
            im["color"] = sv["name"]
            im["caption"] = sv["name"]
        uniq_images.append(im)
    uniq_images.sort(
        key=lambda im: PREFERRED_COLOR_ORDER.index(im["color"])
        if im.get("color") in PREFERRED_COLOR_ORDER
        else 50
    )
    by_color: dict[str, dict] = {}
    untagged: list[dict] = []
    for im in uniq_images:
        color = im.get("color")
        if not color:
            untagged.append(im)
            continue
        if color not in by_color:
            by_color[color] = im
    images = list(by_color.values()) + untagged

    uniq_colors = []
    seen_color: set[str] = set()
    for c in parsed["colors"]:
        sv = swedish_color(c.get("name") or "", c.get("hex"))
        if sv["name"] in seen_color:
            continue
        seen_color.add(sv["name"])
        uniq_colors.append(sv)
    uniq_colors.sort(
        key=lambda c: PREFERRED_COLOR_ORDER.index(c["name"]) if c["name"] in PREFERRED_COLOR_ORDER else 50
    )
    image_color_names = {im["color"] for im in images if im.get("color")}
    if image_color_names:
        keep = []
        seen_keep: set[str] = set()
        for c in uniq_colors:
            if c["name"] in image_color_names and c["name"] not in seen_keep:
                keep.append(c)
                seen_keep.add(c["name"])
        for name in sorted(image_color_names, key=lambda n: PREFERRED_COLOR_ORDER.index(n) if n in PREFERRED_COLOR_ORDER else 50):
            if name in seen_keep:
                continue
            keep.append(swedish_color(name))
            seen_keep.add(name)
        parsed["colors"] = keep
    else:
        parsed["colors"] = []

    documents = []
    for doc in parsed["docs"]:
        meta = classify_doc(doc["title"], doc["href"], doc["locked"])
        if not meta:
            continue
        href = doc["href"]
        if not href:
            continue
        original = basename(href)
        if meta["kind"] == "certificate":
            dest = DOC_ROOT / "certs" / safe_name(original)
        elif meta["kind"] == "cad":
            dest = DOC_ROOT / "dwg" / safe_name(original)
        else:
            dest = doc_dir / safe_name(f"{slug}-{meta['kind']}{Path(original).suffix or '.pdf'}")
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or dest.stat().st_size == 0:
            try:
                fetch(op, href, dest)
            except Exception as exc:
                print("  doc fail", sku, meta["kind"], exc)
                continue
        public_href = "/docs/vvz-play/" + str(dest.relative_to(DOC_ROOT)).replace("\\", "/")
        entry = {
            "title": meta["title"],
            "typeLabel": meta["typeLabel"],
            "format": meta["format"],
            "href": public_href,
            "kind": meta["kind"],
            "previewable": bool(meta.get("previewable")),
            "originalName": original,
            "sourceUrl": href,
            "fetchedAt": FETCHED_AT,
            "access": meta["access"],
        }
        if meta.get("language"):
            entry["language"] = meta["language"]
        if meta["kind"] == "certificate":
            entry["appliesTo"] = "Intern fil. Visas inte för kund."
        elif meta["kind"] == "cad":
            entry["appliesTo"] = "DWG. Kund laddar ner efter inloggning på STADORA."
        elif meta["kind"] == "datasheet":
            entry["appliesTo"] = "Engelskt produktblad."
        documents.append(entry)

    gaps = []
    if not images:
        gaps.append("Produktbild saknas i importen.")
    if not any(d["kind"] == "cad" for d in documents):
        gaps.append("DWG saknas eller kräver fortfarande leverantörsinloggning.")
    if not any(d["kind"] == "certificate" for d in documents):
        gaps.append("Inget certifikat på produktsidan.")
    if prices[sku]["listEur"] is None:
        gaps.append("Listpris saknas — ingen EUR påhittad.")

    price = prices[sku]
    contradiction = None
    return {
        "slug": slug,
        "name": name,
        "originalName": parsed.get("originalName") or listed.get("title"),
        "sku": sku,
        "manufacturer": "VVZ-Play",
        "quoteShowsSku": True,
        "quoteOnRequest": True,
        "sourceUrl": url,
        "fetchedAt": FETCHED_AT,
        "category": "Lek och aktivitet",
        "categorySlug": "lek-aktivitet",
        "subcategory": sub_name,
        "subcategorySlug": sub_slug,
        "summary": translate_summary(parsed, name),
        "description": translate_description(parsed, name),
        "material": parsed.get("material"),
        "colorLegend": "Kulör" if parsed["colors"] else None,
        "colors": parsed["colors"],
        "dimensions": parsed["dimensions"],
        "ageRange": parsed.get("ageRange"),
        "users": parsed.get("users"),
        "fallHeight": parsed.get("fallHeight"),
        "safetyZoneArea": parsed.get("safetyZoneArea"),
        "safetyZonePerimeter": parsed.get("safetyZonePerimeter"),
        "environment": "Utomhus, lekplats." if parsed.get("params", {}).get("Designed for exterior use") else None,
        "qtyLegend": "Antal",
        "standards": parsed.get("standards") or [],
        "related": [],
        "imageNote": "Originalbilder från leverantören. Kulör på skärm kan avvika.",
        "documentPolicy": "Produktblad och ritning av säkerhetsområde från leverantörens öppna nedladdning. Certifikat endast internt. DWG kräver inloggning på STADORA.",
        "images": images,
        "documents": documents,
        "gaps": gaps,
        "contradiction": contradiction,
        "listEur": price["listEur"],
        "netEur": price["netEur"],
        "discountPercent": DISCOUNT_PERCENT,
    }


def main() -> int:
    CACHE.mkdir(parents=True, exist_ok=True)
    IMG_ROOT.mkdir(parents=True, exist_ok=True)
    DOC_ROOT.mkdir(parents=True, exist_ok=True)
    jar = http.cookiejar.CookieJar()
    op = opener(jar)

    print("parse pricelist")
    prices = parse_pricelist()
    print("  priced rows", len(prices), "PHP004", prices.get("PHP004"), "VZ1-006-15", prices.get("VZ1-006-15"))
    (CACHE / "prices.json").write_text(json.dumps(prices, ensure_ascii=False, indent=2))

    print("crawl catalog")
    listed = crawl_catalog(op)
    print("  listed with sku", len(listed))
    (CACHE / "listed.json").write_text(json.dumps(listed, ensure_ascii=False, indent=2))

    selected = select_products(listed, prices)
    print("selected", len(selected), "existing", sum(1 for p in selected if p["sku"] in EXISTING_SLUGS))
    from collections import Counter

    print("  by sub", Counter(p["subcategorySlug"] for p in selected))
    (CACHE / "selected.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2))

    print("login")
    logged = login(op)

    series = []
    for i, item in enumerate(selected, 1):
        print(f"[{i}/{len(selected)}] {item['sku']} {item['url']}")
        try:
            row = build_one(op, item, prices, logged)
        except Exception as exc:
            print("  FAIL", item["sku"], exc)
            continue
        if row:
            series.append(row)

    # related: two others in same subcategory
    by_sub: dict[str, list[str]] = defaultdict(list)
    for row in series:
        by_sub[row["subcategorySlug"]].append(row["slug"])
    for row in series:
        others = [s for s in by_sub[row["subcategorySlug"]] if s != row["slug"]]
        row["related"] = others[:2]

    GEN.mkdir(parents=True, exist_ok=True)
    payload = {
        "fetchedAt": FETCHED_AT,
        "source": "https://www.vvz-play.com",
        "note": (
            "Lekplatsprodukter med inköpspris från VVZ-Play wholesale pricelist 2026. "
            "Inte parkbänkar eller sopkärl. Tillverkare VVZ-Play endast internt. "
            "Leverantörens artikelnummer endast i admin. Certifikat intern_only. "
            "DWG kräver STADORA-inloggning. Inga påhittade EUR."
        ),
        "series": [{k: v for k, v in row.items() if k not in ("listEur", "netEur", "discountPercent")} for row in series],
    }
    (GEN / "vvz-play-series.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")

    price_rows = []
    for row in series:
        price_rows.append(
            {
                "sku": row["sku"],
                "slug": row["slug"],
                "name": row["name"],
                "subcategory": row["subcategory"],
                "subcategorySlug": row["subcategorySlug"],
                "listEur": row["listEur"],
                "discountPercent": DISCOUNT_PERCENT,
                "netEur": row["netEur"],
            }
        )
    price_payload = {
        "list": "VVZ-Play wholesale pricelist 2026",
        "fetchedAt": FETCHED_AT,
        "currency": "EUR",
        "discountPercent": DISCOUNT_PERCENT,
        "legal": "Veríme v Zábavu, s.r.o.",
        "address": "Kasárenská 9, 911 01 Trenčín, Slovakia",
        "website": "https://www.vvz-play.com",
        "note": (
            "Ordinarie pris är listpris i EUR från wholesale pricelist 2026. "
            "Rabatt 30 %. Nettoinköp = listpris × 0,70. Syns bara i intern admin."
        ),
        "vat": "EUR exkl. moms. Inte kundpris på stadora.se.",
        "rows": price_rows,
        "counts": {"rows": len(price_rows), "products": len(series)},
    }
    (GEN / "vvz-play-prices.json").write_text(json.dumps(price_payload, ensure_ascii=False, indent=2) + "\n")
    print("wrote", len(series), "products")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
