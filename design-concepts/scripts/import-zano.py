#!/usr/bin/env python3
"""Import ZANO street furniture from zano.se / files.zano.company.

Skip the Swedish Övrigt category (fågelmatare, lyktor, desinfektionsstationer).
Keep every logo, watermark and marking. Do not invent dimensions or colours.
Purchase price is unknown — leave empty, never 0.
"""

from __future__ import annotations

import argparse
import json
import re
import threading
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urljoin, urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

try:
    import pymupdf
except ImportError:  # pragma: no cover
    pymupdf = None

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG_PUB = PUBLIC / "images" / "zano"
DOC_PUB = PUBLIC / "docs" / "zano"
INTERNAL = ROOT / "internal" / "zano"
GEN = ROOT / "src" / "data" / "generated"
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"
FILES = "https://files.zano.company"
EN_BASE = "https://www.zano-streetfurniture.com"
SE_BASE = "https://www.zano.se"
WOOD_PALETTE = "https://www.zano-streetfurniture.com/info/wood-colours-palette"
STEEL_PALETTE = "https://www.zano-streetfurniture.com/info/types-of-steel"

SKIP_EN = {"feeders", "street-lamps", "hand-sanitizer-stations"}

# English catalogue pages to crawl. Övrigt equivalents are omitted.
EN_CATS = [
    "solar-charging-stations",
    "picnic-tables",
    "tables",
    "bicycle-zone",
    "bicycle-racks",
    "recycling-bins",
    "dog-waste-bins",
    "cigarette-bins",
    "litter-bins",
    "planters",
    "tree-guards",
    "bollards",
    "fences",
    "chains",
    "information-boards",
    "traffic-sign-posts",
    "pergolas",
    "benches",
]

CATALOG = {
    "parkbankar": ("Parkmöbler", "parkmobler", "Parkbänkar", "for-att-sitta-och-vila/bankar"),
    "solstolar": ("Parkmöbler", "parkmobler", "Solstolar", "for-att-sitta-och-vila/solstolar"),
    "fatoljer": ("Parkmöbler", "parkmobler", "Fåtöljer", "for-att-sitta-och-vila/fatoljer"),
    "barstolar": ("Parkmöbler", "parkmobler", "Barstolar", "for-att-sitta-och-vila/barstolar"),
    "hangmattor": ("Parkmöbler", "parkmobler", "Hängmattor", "for-att-sitta-och-vila/hangmattor"),
    "modulara-sitt": ("Parkmöbler", "parkmobler", "Modulära sitt", "for-att-sitta-och-vila/sittplatser"),
    "solkraftverk": ("Parkmöbler", "parkmobler", "Solkraftverk", "for-att-sitta-och-vila/solkraftverk"),
    "bord-picknick": ("Parkmöbler", "parkmobler", "Bord och picknick", "mat-och-picknickomrade/picknickbord"),
    "papperskorgar": ("Avfall och återvinning", "avfall-atervinning", "Papperskorgar", "avfallshantering/papperskorg-med-ett-fack"),
    "kallsortering": ("Avfall och återvinning", "avfall-atervinning", "Källsortering", "avfallshantering/papperskorgar-for-avfallssortering"),
    "askkoppar": ("Avfall och återvinning", "avfall-atervinning", "Askkoppar", "avfallshantering/askkopp"),
    "cykelstall": ("Cykelparkering", "cykelparkering", "Cykelställ", "cykelzon/cykelstall"),
    "garage-service": ("Cykelparkering", "cykelparkering", "Garage och service", "cykelzon/cykelreparationsstationer"),
    "planteringskarl": ("Plantering", "plantering", "Planteringskärl", "planteringskarl-och-tradsskydd/planteringskarl"),
    "tradskydd": ("Plantering", "plantering", "Trädskydd och galler", "planteringskarl-och-tradsskydd/tradgaller"),
    "pollare": ("Pollare och räcken", "pollare-racken", "Pollare", "avgransning-av-utrymmen-och-stangsel/stolpar"),
    "avsparrning": ("Pollare och räcken", "pollare-racken", "Avspärrning", "avgransning-av-utrymmen-och-stangsel/staket"),
    "skyltar": ("Pollare och räcken", "pollare-racken", "Skyltar och tavlor", "informationstavla-och-markning/informationstavla"),
    "pergolor": ("Väderskydd och hållplatser", "vaderskydd", "Pergolor", "pergolor-och-takkonstruktioner/pergolor"),
}

NOUN = {
    "parkbankar": "Parkbänk",
    "solstolar": "Solstol",
    "fatoljer": "Fåtölj",
    "barstolar": "Barstol",
    "hangmattor": "Hängmatta",
    "modulara-sitt": "Sittelement",
    "solkraftverk": "Solkraftverk",
    "bord-picknick": "Bord",
    "papperskorgar": "Papperskorg",
    "kallsortering": "Källsortering",
    "askkoppar": "Askkopp",
    "cykelstall": "Cykelställ",
    "garage-service": "Servicestation",
    "planteringskarl": "Planteringskärl",
    "tradskydd": "Trädskydd",
    "pollare": "Pollare",
    "avsparrning": "Avspärrning",
    "skyltar": "Informationstavla",
    "pergolor": "Pergola",
}

EN_CAT_DEFAULT = {
    "solar-charging-stations": "solkraftverk",
    "picnic-tables": "bord-picknick",
    "tables": "bord-picknick",
    "bicycle-zone": "garage-service",
    "bicycle-racks": "cykelstall",
    "recycling-bins": "kallsortering",
    "dog-waste-bins": "papperskorgar",
    "cigarette-bins": "askkoppar",
    "litter-bins": "papperskorgar",
    "planters": "planteringskarl",
    "tree-guards": "tradskydd",
    "bollards": "pollare",
    "fences": "avsparrning",
    "chains": "avsparrning",
    "information-boards": "skyltar",
    "traffic-sign-posts": "skyltar",
    "pergolas": "pergolor",
}

OPT_SV = {
    "carbon steel (s235jr)": "Kolstål S235JR",
    "carbon steel (s235jr )": "Kolstål S235JR",
    "carbon steel": "Kolstål S235JR",
    "stainless steel (aisi 304)": "Rostfritt stål AISI 304",
    "stainless steel": "Rostfritt stål AISI 304",
    "soft wood": "Europeiskt barrträ",
    "hard wood (oil finish)": "Oljat ädelträ",
    "hardwood of european origin": "Hårt trä av europeiskt ursprung",
    "premium hard wood": "Ädelträ av högsta kvalitet",
    "european coniferous wood": "Europeiskt barrträ",
    "exotic wood": "Ädelträ",
    "free-standing": "Fristående",
    "freestanding": "Fristående",
    "attached by bolts to foundation": "För skruvmontering",
    "for bolting": "För skruvmontering",
    "kolstål (s235jr)": "Kolstål S235JR",
    "kolstål (s235jr )": "Kolstål S235JR",
    "rostfritt stål (aisi 304)": "Rostfritt stål AISI 304",
    "europeiskt barrträ": "Europeiskt barrträ",
    "oljat ädelträ": "Oljat ädelträ",
    "hårt trä av europeiskt ursprung": "Hårt trä av europeiskt ursprung",
    "ädelträ av högsta kvalitet": "Ädelträ av högsta kvalitet",
    "fristående": "Fristående",
    "för skruvmontering": "För skruvmontering",
    "embedded in concrete": "Gjutning i betong",
    "gjutning i betong": "Gjutning i betong",
    "none": "Utan",
    "utan": "Utan",
    "left side": "Vänster sida",
    "right side": "Höger sida",
    "both sides": "Båda sidor",
    "bluetooth speaker": "Bluetooth-högtalare",
    "speaker with built-in memory": "Högtalare med inbyggt minne",
    "gel batteries 36 ah": "Gelbatterier 36 Ah",
    "lithium batteries 40 ah": "Litiumbatterier 40 Ah",
    "etching in stainless steel": "Etsning i rostfritt stål",
    "cut in steel": "Utskuret i stål",
    "sticker": "Dekal",
    "milled in wood": "Fräst i trä",
    "concrete": "Betong",
    "uv printed on a tabletop": "UV-tryck på skivan",
    "printed on stainless steel plate": "Tryck på rostfri platta",
    "1 chain (both sides)": "1 kedja, båda sidor",
    "1 chain (one side)": "1 kedja, en sida",
    "attachment of 2 chains (double-sided)": "2 kedjor, dubbelsidigt",
    "attachment of 2 chains (final)": "2 kedjor, ändfäste",
    "single sided": "Enkelsidigt",
    "double sided": "Dubbelsidigt",
    "2.4 ghz; 3g, 4g (no sim card included)": "2,4 GHz; 3G, 4G (SIM-kort ingår inte)",
    "2 a, 10 w": "2 A, 10 W",
    "galvanized steel container": "Behållare i galvaniserat stål",
}

DIM_SV = {
    "width": "Bredd",
    "bredd": "Bredd",
    "height": "Höjd",
    "höjd": "Höjd",
    "depth": "Djup",
    "djup": "Djup",
    "length": "Längd",
    "längd": "Längd",
    "diameter": "Diameter",
    "seat width": "Sitsbredd",
    "sitsbredd": "Sitsbredd",
    "sitsbredden": "Sitsbredd",
    "seat height": "Sitshöjd",
    "sitshöjd": "Sitshöjd",
    "thickness": "Tjocklek",
    "tjocklek": "Tjocklek",
    "base width": "Basens bredd",
    "basens bredd": "Basens bredd",
    "height with anchoring section": "Höjd med förankringsdel",
    "höjd med förankringsdel": "Höjd med förankringsdel",
    "height from ground surface": "Höjd från mark",
    "höjd från mark": "Höjd från mark",
    "total height": "Totalhöjd",
    "totalhöjd": "Totalhöjd",
    "height of the backrest": "Ryggstödets höjd",
    "ryggstödets höjd": "Ryggstödets höjd",
    "height above ground": "Höjd över markytan",
    "höjd över markytan": "Höjd över markytan",
}

SWATCHES = {
    "ral-9005": ("RAL 9005 svart", "/images/zano/swatches/ral-9005.png"),
    "ral-9011": ("RAL 9011 grafitsvart", "/images/zano/swatches/ral-9011.png"),
    "ral-7016": ("RAL 7016 mörk grafit", "/images/zano/swatches/ral-7016.png"),
    "ral-9007": ("RAL 9007 mörkt stål", "/images/zano/swatches/ral-9007.png"),
    "ral-9010": ("RAL 9010 vit", "/images/zano/swatches/ral-9010.png"),
    "stainless": ("Blank yta AISI 304", "/images/zano/swatches/stainless.png"),
    "wood-ek": ("Ek", "/images/zano/swatches/wood-ek.png"),
    "wood-mahogny": ("Mahogny", "/images/zano/swatches/wood-mahogny.png"),
    "wood-teak": ("Teak", "/images/zano/swatches/wood-teak.png"),
    "wood-cypress": ("Cypress", "/images/zano/swatches/wood-cypress.png"),
    "wood-valnot": ("Valnöt", "/images/zano/swatches/wood-valnot.png"),
}

WOOD_HINT = (
    "Ek, mahogny, teak, cypress och valnöt är kulören på valt träslag. "
    "Barrträ i ekkulör är inte massivt ekträ."
)

UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)
SKU_RE = re.compile(r"\b(\d{2}\.\d{3}(?:\.\d+)?(?:\.[A-Za-z]{1,3})?)\b")


def iri(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/%._-~")
    query = quote(unquote(parts.query), safe="=&%._-~")
    return urlunsplit((parts.scheme, parts.netloc, path, query, parts.fragment))


def fetch(url: str, dest: Path | None = None, *, reuse: bool = True) -> tuple[bytes, str, str]:
    url = iri(url)
    meta = dest.with_name(dest.name + ".final") if dest else None
    if reuse and dest and dest.exists() and dest.stat().st_size > 80:
        final = meta.read_text().strip() if meta and meta.exists() else url
        return dest.read_bytes(), "file", final
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    last_err: Exception | None = None
    for attempt in range(4):
        try:
            with urlopen(req, timeout=90) as res:
                data = res.read()
                ctype = res.headers.get("Content-Type", "")
                final = res.geturl()
            if dest:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                if meta:
                    meta.write_text(final)
            return data, ctype, final
        except HTTPError as exc:
            if exc.code in {404, 410}:
                raise
            last_err = exc
            time.sleep(1.2 * (attempt + 1))
        except Exception as exc:
            last_err = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"{url}: {last_err}")


def is_html(data: bytes, ctype: str) -> bool:
    head = data[:200].lower()
    return "text/html" in (ctype or "").lower() or head.startswith(b"<!doctype") or head.startswith(b"<html")


def copy_bytes(data: bytes, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


def safe_name(name: str) -> str:
    name = unquote(name).replace("%20", "-")
    name = re.sub(r"[^\w.\-]+", "-", name, flags=re.A)
    return name.strip("-.") or "fil"


def slugify(text: str) -> str:
    text = text.lower().replace("å", "a").replace("ä", "a").replace("ö", "o")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


def is_dwg(data: bytes) -> bool:
    return data.startswith(b"AC1")


def is_skp(data: bytes) -> bool:
    return data[:2] == b"PK" or b"SketchUp" in data[:400]


def original_image_url(url: str) -> str:
    url = url.split("?")[0]
    url = re.sub(r"/images/(\d+)/\d+/", r"/images/\1/", url)
    url = re.sub(r"/file/image/([0-9a-f-]+)/\d+/", r"/file/image/\1/", url)
    return url


def parse_listing(html: str, cat: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    out = []
    seen: set[str] = set()
    needle = f"/catalogue/{cat}/"
    for a in soup.select("a[href]"):
        href = urljoin(EN_BASE, a.get("href") or "").split("?")[0].rstrip("/")
        if needle not in href or href.endswith(f"/catalogue/{cat}"):
            continue
        if "/street-furniture/files" in href:
            continue
        if href in seen:
            continue
        seen.add(href)
        title = re.sub(r"\s+", " ", (a.get("title") or a.get_text(" ", strip=True)))
        if not title or len(title) < 3:
            continue
        out.append({"url": href, "title": title, "enCat": cat})
    return out


def is_combo_page(item: dict) -> bool:
    """Skip configurator/set landing pages — the member products are imported on their own."""
    url = item["url"].lower()
    title = item["title"].lower()
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    if "check out" in title:
        return True
    if slug.startswith("set-") or slug.startswith("picnic-set"):
        return True
    if "picnic sets" in title:
        return True
    return False


def classify(en_cat: str, title: str, url: str) -> str:
    blob = f"{title} {url}".lower()
    if en_cat == "benches":
        if "hammock" in blob:
            return "hangmattor"
        if "lounger" in blob or "recliner" in blob or "lezak" in blob:
            return "solstolar"
        if "bar" in blob and "stool" in blob:
            return "barstolar"
        if "armchair" in blob or re.search(r"\bchair\b", blob):
            return "fatoljer"
        if "stool" in blob:
            return "modulara-sitt"
        if re.search(r"\bseat\b", blob) and "bench" not in blob:
            return "modulara-sitt"
        return "parkbankar"
    if en_cat == "litter-bins" and "ashtray" in blob:
        return "papperskorgar"
    if en_cat == "bicycle-zone":
        if "rack" in blob and "repair" not in blob and "wash" not in blob and "pump" not in blob and "rest" not in blob:
            return "cykelstall"
        return "garage-service"
    if en_cat == "tree-guards":
        return "tradskydd"
    return EN_CAT_DEFAULT.get(en_cat, "parkbankar")


def extract_sku(text: str) -> str | None:
    matches = SKU_RE.findall(text.replace("-", "."))
    if not matches:
        matches = SKU_RE.findall(text)
    return matches[-1] if matches else None


def list_items(html: str, heading: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    items: list[str] = []
    for strong in soup.select("li > strong"):
        label = strong.get_text(" ", strip=True).strip(":").lower()
        if label != heading.lower():
            continue
        ul = strong.find_next_sibling("ul")
        if not ul:
            parent = strong.parent
            ul = parent.find("ul") if parent else None
        if not ul:
            continue
        for li in ul.find_all("li", recursive=False):
            t = re.sub(r"\s+", " ", li.get_text(" ", strip=True))
            if t:
                items.append(t)
    return items


def parse_dims(items: list[str]) -> list[dict]:
    rows = []
    seen = set()
    for raw in items:
        m = re.match(r"([^:]+):\s*(.+)", raw)
        if not m:
            continue
        label_raw = m.group(1).strip().lower()
        value = m.group(2).strip()
        label = DIM_SV.get(label_raw, label_raw[:1].upper() + label_raw[1:])
        if label in seen:
            continue
        seen.add(label)
        rows.append({"label": label, "value": value})
    return rows


def opt_sv(name: str) -> str:
    key = re.sub(r"\s+", " ", name).strip().lower()
    return OPT_SV.get(key, re.sub(r"\s+", " ", name).strip())


SPEC_SKIP_HEADINGS = {
    "dimensions",
    "mått",
    "weight",
    "vikt",
    "materials",
    "material",
    "basic equipment",
    "electrical specifications",
    "capacity",
    "kapacitet",
    "catalogue number",
    "katalognummer",
}

CORE_OPTION_HEADINGS = {
    "construction",
    "konstruktion",
    "seat",
    "sits",
    "seat and backrest",
    "sits och ryggstöd",
    "top",
    "bordsskiva",
    "methods of installation",
    "monteringssätt",
    "montering",
    "installation",
}

EXTRA_GROUP_LABEL = {
    "additional table": "Extra bord",
    "additional bicycle rack": "Extra cykelställ",
    "sound module": "Ljudmodul",
    "wireless charger": "Trådlös laddare",
    "battery pack": "Batteri",
    "wi-fi hotspot": "Wi-Fi-hotspot",
    "led lights": "LED-belysning",
    "logo": "Logotyp",
    "bollard handle": "Kedjefäste",
    "fence mounts": "Staketsfästen",
    "tabletop game board": "Spelplan på skivan",
    "container": "Behållare",
}


def labelled_option_blocks(soup: BeautifulSoup) -> dict[str, list[str]]:
    """Option lists on the older EN template (collapsible Construction/Seat/…)."""
    blocks: dict[str, list[str]] = {}

    def add(heading: str, ul) -> None:
        if ul is None or heading.lower() in SPEC_SKIP_HEADINGS:
            return
        items = []
        for li in ul.find_all("li", recursive=False):
            t = re.sub(r"\s+", " ", li.get_text(" ", strip=True))
            if t:
                items.append(t)
        if heading and items:
            blocks[heading] = items

    for box in soup.select(".collapsible"):
        btn = box.select_one("h4.collapse-button span, .collapse-button span, h4 span")
        ul = box.select_one("ul.options")
        if not btn or not ul:
            continue
        heading = btn.get_text(" ", strip=True).rstrip(":").strip()
        add(heading, ul)
    if not blocks:
        for span in soup.find_all("span"):
            label = span.get_text(" ", strip=True)
            if not label.endswith(":") or len(label) > 48:
                continue
            ul = span.find_next("ul", class_="options")
            heading = label.rstrip(":").strip()
            add(heading, ul)
    for strong in soup.select("li > strong"):
        heading = strong.get_text(" ", strip=True).rstrip(":").strip()
        ul = strong.find_next_sibling("ul")
        if not ul and strong.parent:
            ul = strong.parent.find("ul")
        add(heading, ul)
    return blocks


def option_spec_lines(soup: BeautifulSoup, heading: str) -> list[str]:
    """Dimensions/weight on older templates: heading then key: value lines."""
    text = soup.get_text("\n", strip=True)
    rx = re.compile(rf"^{re.escape(heading)}\s*:?\s*$", re.I | re.M)
    m = rx.search(text)
    if not m:
        return []
    rest = text[m.end() :]
    stop = re.search(
        r"\n(Weight|Vikt|Materials|Material|options|Options|Construction|Konstruktion|"
        r"Capacity|Kapacitet|Basic equipment|Electrical specifications|catalogue number|"
        r"Finishing options|Downloads|Description)\s*:?\s*\n",
        rest,
        re.I,
    )
    block = rest[: stop.start()] if stop else rest[:1200]
    lines: list[str] = []
    for raw in block.splitlines():
        t = re.sub(r"\s+", " ", raw).strip()
        if not t or t.lower() in {"expand", "scroll down", "explore all", "roll all"}:
            continue
        if ":" in t or re.search(r"\d+\s*kg\b", t, re.I) or re.match(r"^\d", t):
            lines.append(t)
    return lines


def parse_en_page(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "lxml")
    h1 = soup.find("h1")
    title = re.sub(r"\s+", " ", h1.get_text(" ", strip=True)) if h1 else ""
    files = []
    seen_file: set[str] = set()
    for a in soup.select(
        ".product-files a[href], .box_files a[href], a.product_pdf[href], a.product_dwg[href], .product_dl a[href]"
    ):
        href = urljoin(url, a.get("href") or "")
        if not href or href in seen_file:
            continue
        seen_file.add(href)
        files.append({"label": re.sub(r"\s+", " ", a.get_text(" ", strip=True)), "href": href})
    uuids = UUID_RE.findall(html)
    card_uuid = None
    for a in files:
        m = re.search(r"/product/card/[^/]+/([0-9a-f-]{36})/", a["href"], re.I)
        if m:
            card_uuid = m.group(1).lower()
            break
    if not card_uuid:
        m = re.search(r"/product/card/[^/]+/([0-9a-f-]{36})/", html, re.I)
        if m:
            card_uuid = m.group(1).lower()
    if not card_uuid:
        m = re.search(r"/archive/[^/]+/(?:documentation|product-card)/([0-9a-f-]{36})/", html, re.I)
        if m:
            card_uuid = m.group(1).lower()
    gallery: list[tuple[str, str]] = []
    seen: set[str] = set()

    def add_img(src: str, alt: str) -> None:
        src = original_image_url(src)
        if not src or src in seen:
            return
        if "/images/" not in src and "/file/image/" not in src:
            return
        low = src.lower()
        if any(tok in low for tok in ("customization", "banner", "/site/", "/tiles/", "tuv.png")):
            return
        seen.add(src)
        gallery.append((src, alt.strip()))

    for box in soup.select(".product-render picture, .product-gallery picture"):
        img = box.find("img")
        alt = (img.get("alt") if img else "") or ""
        src = ""
        for source in box.find_all("source"):
            blob = source.get("srcset") or ""
            for part in blob.split(","):
                u = part.strip().split(" ")[0]
                if not u:
                    continue
                u = original_image_url(urljoin(url, u))
                if re.search(r"/images/\d+/[^/]+$", u) or "/file/image/" in u:
                    src = u
        if not src and img and img.get("src"):
            src = original_image_url(urljoin(url, img.get("src")))
        if src:
            add_img(src, alt)

    # English catalogue template B: product-slider lightbox originals (not sized thumbs).
    for a in soup.select(
        ".product-slider a[data-lightbox][href], "
        ".product-slider a[href*='/images/'], "
        ".swiper-gallery a[href*='/images/'], "
        "#RendersCont a[href*='/images/']"
    ):
        href = a.get("href") or ""
        add_img(urljoin(url, href), a.get("title") or "")

    for img in soup.select(".product-slider img, .swiper-gallery img, #RendersCont img"):
        src = img.get("src") or ""
        add_img(urljoin(url, src), img.get("alt") or "")

    dim_img = soup.select_one(".product-dimensions img")
    drawing = None
    if dim_img and dim_img.get("src"):
        drawing = original_image_url(urljoin(url, dim_img.get("src")))

    dims = parse_dims(list_items(html, "Dimensions") or list_items(html, "Mått"))
    weights = list_items(html, "Weight") or list_items(html, "Vikt")
    materials = list_items(html, "Materials") or list_items(html, "Material")
    construction = list_items(html, "Construction") or list_items(html, "Konstruktion")
    seat = (
        list_items(html, "Seat")
        or list_items(html, "Sits")
        or list_items(html, "Seat and backrest")
        or list_items(html, "Sits och ryggstöd")
    )
    install = (
        list_items(html, "Methods of installation")
        or list_items(html, "Monteringssätt")
        or list_items(html, "Installation")
    )
    desc_el = soup.select_one(
        '[ref="description"] .data-content, .product-description, #description, .opis p'
    )
    description_en = re.sub(r"\s+", " ", desc_el.get_text(" ", strip=True)) if desc_el else ""
    description_en = re.sub(
        r"^(Description of the model|Model description|Description)\s+",
        "",
        description_en,
        flags=re.I,
    )
    option_blocks = labelled_option_blocks(soup)
    if option_blocks.get("Construction") and not construction:
        construction = option_blocks["Construction"]
    if not seat:
        seat = option_blocks.get("Seat") or option_blocks.get("Seat and backrest") or []
    if not install:
        install = option_blocks.get("Methods of installation") or []
    if not dims:
        dims = parse_dims(option_spec_lines(soup, "Dimensions") or option_spec_lines(soup, "Mått"))
    if not weights:
        weights = option_spec_lines(soup, "Weight") or option_spec_lines(soup, "Vikt")
    if not materials:
        materials = option_spec_lines(soup, "Materials") or option_spec_lines(soup, "Material")
    return {
        "title": title,
        "files": files,
        "uuid": card_uuid,
        "uuids": list(dict.fromkeys(u.lower() for u in uuids)),
        "gallery": gallery,
        "drawing": drawing,
        "dimensions": dims,
        "weights": [re.sub(r"\s+", " ", w) for w in weights],
        "materials": [re.sub(r"\s+", " ", m) for m in materials],
        "construction": construction,
        "seat": seat,
        "top": option_blocks.get("Top") or [],
        "install": install,
        "optionBlocks": option_blocks,
        "descriptionEn": description_en,
    }


def pdf_text(data: bytes) -> str:
    if not data.startswith(b"%PDF"):
        return ""
    if pymupdf is None:
        return data.decode("latin-1", "ignore")
    doc = pymupdf.open(stream=data, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


def section_after(text: str, heading: str, stop: list[str]) -> str:
    rx = re.compile(rf"^{re.escape(heading)}\s*$", re.I | re.M)
    m = rx.search(text)
    if not m:
        return ""
    rest = text[m.end() :]
    stops = [re.compile(rf"^{re.escape(s)}\s*$", re.I | re.M) for s in stop]
    cut = len(rest)
    for s in stops:
        n = s.search(rest)
        if n:
            cut = min(cut, n.start())
    return rest[:cut].strip()


def bullets(block: str) -> list[str]:
    lines = []
    for raw in block.splitlines():
        t = re.sub(r"^[\-–•\*]\s*", "", raw).strip()
        if t:
            lines.append(t)
    return lines


def parse_sv_pdf(text: str) -> dict:
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines() if ln.strip()]
    title = ""
    for ln in lines:
        if ln.upper().startswith("ZANO"):
            continue
        if len(ln) > 3:
            title = ln
            break
    sku = None
    m = re.search(r"Katalognummer:\s*([0-9.A-Za-z]+)", text)
    if m:
        sku = m.group(1).strip()
    if not sku:
        sku = extract_sku(title) or extract_sku(text[:800])
    designer = None
    m = re.search(r"Designer:\s*(.+)", text)
    if m:
        designer = m.group(1).strip()
    desc = section_after(
        text,
        "BESKRIVNING",
        ["ALLMÄNNA TEKNISKA UPPGIFTER", "ALTERNATIV", "Mått", "Vikt", "Material", "ZANO"],
    )
    desc = re.sub(r"\s+", " ", desc).strip()
    alt = section_after(text, "ALTERNATIV", ["BESKRIVNING", "ALLMÄNNA TEKNISKA UPPGIFTER", "Mått"])
    groups: dict[str, list[str]] = {}
    current = None
    for ln in alt.splitlines():
        t = ln.strip()
        if not t:
            continue
        if t.endswith(":") and len(t) < 40:
            current = t[:-1]
            groups[current] = []
            continue
        if current:
            groups[current].append(re.sub(r"^[\-–•]\s*", "", t))
    spec = section_after(text, "ALLMÄNNA TEKNISKA UPPGIFTER", ["MONTERING", "ZANO", "ALTERNATIV"])
    dim_block = section_after("Mått:\n" + spec, "Mått:", ["Vikt:", "Material:", "ZANO"])
    if not dim_block:
        dim_block = section_after(text, "Mått:", ["Vikt:", "Material:"])
    dims = parse_dims(bullets(dim_block) if dim_block else [])
    if not dims:
        dims = parse_dims(re.findall(r"-?\s*([^:\n]+:\s*[0-9][^\n]+)", spec))
    weight_block = section_after(text, "Vikt:", ["Material:", "ZANO", "Mått:"])
    weights = bullets(weight_block)
    mat_block = section_after(text, "Material:", ["ZANO", "MONTERING", "Vikt:"])
    materials = bullets(mat_block)
    return {
        "title": title,
        "sku": sku,
        "designer": designer,
        "description": desc,
        "groups": groups,
        "dimensions": dims,
        "weights": weights,
        "materials": materials,
        "hasMountingSchemes": "MONTERINGSSCHEMAN" in text.upper() or "FÖR SKRUVMONTERING" in text.upper(),
    }


def sentences(text: str, n: int = 3) -> str:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    keep = [p for p in parts if p]
    return " ".join(keep[:n]).strip()


def pretty_title(raw: str) -> str:
    raw = re.sub(r"\s+", " ", raw).strip(" -")
    if not raw:
        return raw
    if raw.isupper():
        words = []
        for w in raw.split(" "):
            if re.match(r"^\d", w) or w.upper() in {"ZANO", "DUO", "AISI", "RAL"}:
                words.append(w)
            else:
                words.append(w[:1] + w[1:].lower())
        return " ".join(words)
    return raw


WOOD_WEIGHT_KEYS = [
    ("europeiskt barrträ", "Europeiskt barrträ"),
    ("european coniferous", "Europeiskt barrträ"),
    ("soft wood", "Europeiskt barrträ"),
    ("hårt trä av europeiskt ursprung", "Hårt trä av europeiskt ursprung"),
    ("hardwood of european origin", "Hårt trä av europeiskt ursprung"),
    ("oljat ädelträ", "Oljat ädelträ"),
    ("hard wood (oil finish)", "Oljat ädelträ"),
    ("ädelträ av högsta kvalitet", "Ädelträ av högsta kvalitet"),
    ("premium hard wood", "Ädelträ av högsta kvalitet"),
    ("eco plank", "eco plank"),
]


def kg_weight_lines(weights: list[str]) -> list[str]:
    lines: list[str] = []
    for w in weights:
        t = re.sub(r"\s+", " ", w).strip()
        low = t.lower()
        if low.startswith(("grundutrustning", "elektriska", "kapacitet", "basic equipment", "electrical", "capacity")):
            continue
        if "kg" not in low:
            continue
        lines.append(t)
    return lines


def parse_weight_by_option(weights: list[str]) -> dict[str, str]:
    by: dict[str, str] = {}

    def add(name: str, kg: str) -> None:
        name = name.strip(" .")
        if not name or name.lower() in {"vikt", "weight"}:
            return
        by.setdefault(name, kg)

    blob = " ; ".join(weights)
    for m in re.finditer(
        r"(\d+(?:[.,]\d+)?)\s*kg\s+med\s+([^.,;]+)",
        blob,
        re.I,
    ):
        n = m.group(1).replace(".", ",")
        kg = f"{n} kg"
        label = re.sub(r"\s+", " ", m.group(2)).strip()
        mapped = None
        low = label.lower()
        for needle, name in WOOD_WEIGHT_KEYS:
            if needle in low:
                mapped = name
                break
        add(mapped or opt_sv(label), kg)

    for w in kg_weight_lines(weights):
        low = w.lower()
        m = re.search(r"(\d+(?:[.,]\d+)?)\s*kg", w, re.I)
        if not m:
            continue
        n = m.group(1).replace(".", ",")
        if n.endswith(",0"):
            n = n[:-2]
        kg = f"{n} kg"
        matched = False
        for needle, name in WOOD_WEIGHT_KEYS:
            if needle in low:
                add(name, kg)
                matched = True
                break
        if not matched and ":" in w:
            add(opt_sv(w.split(":", 1)[0]), kg)
    return by


def weight_fields(weights: list[str]) -> tuple[str | None, str | None]:
    """Return (full weight text, short summary). Do not invent a range that covers unverified woods."""
    kg_lines = kg_weight_lines(weights)
    if not kg_lines:
        return None, None
    by = parse_weight_by_option(kg_lines)
    if by:
        full = "; ".join(f"{name}: {kg}" for name, kg in by.items())
        if len(by) == 1:
            return full, next(iter(by.values()))
        # A compressed range is only honest when the caller knows every wood option
        # is covered. Leave summary empty; UI uses weightByOption per selection.
        return full, None
    full = "; ".join(kg_lines)
    nums = []
    for w in kg_lines:
        for n in re.findall(r"(\d+(?:[.,]\d+)?)\s*kg", w, re.I):
            nums.append(float(n.replace(",", ".")))
    if len(nums) == 1:
        n = nums[0]
        s = str(int(n)) if n.is_integer() else str(n).replace(".", ",")
        return full, f"{s} kg"
    return full, None


def is_wood_option(name: str) -> bool:
    low = name.lower()
    return any(
        tok in low
        for tok in (
            "barrträ",
            "soft wood",
            "hardwood",
            "hårt trä",
            "ädelträ",
            "hard wood",
            "eco plank",
            "hpl",
        )
    )


def extra_choice_groups(blocks: dict[str, list[str]]) -> list[dict]:
    groups: list[dict] = []
    for heading, items in blocks.items():
        key = heading.lower().strip()
        if key in SPEC_SKIP_HEADINGS or key in CORE_OPTION_HEADINGS:
            continue
        names = [opt_sv(x) for x in items if x]
        names = [n for n in dict.fromkeys(names) if n]
        if len(names) < 2:
            continue
        label = EXTRA_GROUP_LABEL.get(key, heading)
        groups.append(
            {
                "key": slugify(label),
                "label": label,
                "kind": "choice",
                "options": [{"id": slugify(n), "name": n} for n in names],
            }
        )
    return groups


def build_options(sv_groups: dict[str, list[str]], en: dict) -> list[dict]:
    construction = [opt_sv(x) for x in (sv_groups.get("Konstruktion") or en.get("construction") or [])]
    seat_src = sv_groups.get("Sits") or en.get("seat") or []
    top_src = sv_groups.get("Bordsskiva") or en.get("top") or []
    seat_is_top = False
    if not seat_src and top_src and any(is_wood_option(x) for x in top_src):
        seat_src = top_src
        seat_is_top = True
    seat = [opt_sv(x) for x in seat_src]
    install = [
        opt_sv(x)
        for x in (
            sv_groups.get("Monteringssätt")
            or sv_groups.get("Montering")
            or en.get("install")
            or []
        )
    ]
    construction = [c for c in construction if c]
    seat = [s for s in seat if s]
    install = [i for i in install if i]
    groups: list[dict] = []
    carbon = next((c for c in construction if "Kolstål" in c), None)
    stainless = next((c for c in construction if "Rostfritt" in c), None)
    if construction:
        groups.append(
            {
                "key": "Konstruktion",
                "label": "Konstruktion",
                "kind": "choice",
                "options": [
                    {"id": slugify(c), "name": c} for c in dict.fromkeys(construction)
                ],
            }
        )
    if carbon:
        ral_opts = [
            {"id": k, "name": name, "swatch": src}
            for k, (name, src) in SWATCHES.items()
            if k.startswith("ral-")
        ]
        ral_opts.append({"id": "ral-custom", "name": "Egen kulör", "customText": True})
        groups.append(
            {
                "key": "Stalfinish:kolstal",
                "label": "Stålfinish",
                "kind": "swatch",
                "parentKey": "Konstruktion",
                "parentValue": carbon,
                "options": ral_opts,
            }
        )
    if stainless:
        groups.append(
            {
                "key": "Stalfinish:rostfritt",
                "label": "Stålfinish",
                "kind": "swatch",
                "parentKey": "Konstruktion" if carbon else None,
                "parentValue": stainless if carbon else None,
                "options": [
                    {
                        "id": "stainless-finish",
                        "name": SWATCHES["stainless"][0],
                        "swatch": SWATCHES["stainless"][1],
                    }
                ],
            }
        )
        if not carbon:
            groups[-1].pop("parentKey")
            groups[-1].pop("parentValue")
    if seat:
        seat_key = "Bordsskiva" if seat_is_top else "Sits"
        seat_label = "Bordsskiva" if seat_is_top else (
            "Sits och ryggstöd" if any("rygg" in s.lower() for s in seat) or "backrest" in " ".join(seat_src).lower() else "Sits"
        )
        groups.append(
            {
                "key": seat_key,
                "label": seat_label,
                "kind": "choice",
                "options": [{"id": slugify(s), "name": s} for s in dict.fromkeys(seat)],
            }
        )
        barr = next((s for s in seat if "barrträ" in s.lower() or "barrtra" in slugify(s)), None)
        if barr:
            wood_opts = [
                {"id": k.replace("wood-", ""), "name": name, "swatch": src}
                for k, (name, src) in SWATCHES.items()
                if k.startswith("wood-")
            ]
            wood_opts.append({"id": "wood-custom", "name": "Egen kulör", "customText": True})
            groups.append(
                {
                    "key": "Trafinish:barrtra",
                    "label": "Träkulör",
                    "kind": "swatch",
                    "parentKey": seat_key,
                    "parentValue": barr,
                    "hint": WOOD_HINT,
                    "options": wood_opts,
                }
            )
    if len(install) > 1:
        groups.append(
            {
                "key": "Montering",
                "label": "Montering",
                "kind": "choice",
                "options": [{"id": slugify(i), "name": i} for i in dict.fromkeys(install)],
            }
        )
    groups.extend(extra_choice_groups(en.get("optionBlocks") or {}))
    # Drop empty parentKey leftovers
    for g in groups:
        if not g.get("parentKey"):
            g.pop("parentKey", None)
            g.pop("parentValue", None)
    return groups, install


def material_text(
    sv: list[str],
    en: list[str],
    construction: list,
    seat: list,
    wood_label: str = "Sits",
) -> str | None:
    bits = sv or []
    if not bits and (construction or seat):
        parts = []
        if construction:
            parts.append(" eller ".join(construction).replace("Kolstål S235JR", "Kolstål S235JR, galvaniserat och pulverlackerat") )
        if seat:
            parts.append(f"{wood_label}: " + ", ".join(seat))
        return ". ".join(parts) + "." if parts else None
    if bits:
        return ". ".join(b.rstrip(".") for b in bits) + "."
    if en:
        return None
    return None


def download_image(url: str, orig_dir: Path, pub_dir: Path, stem: str) -> dict | None:
    ext = Path(unquote(urlparse(url).path)).suffix.lower() or ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".svg"}:
        ext = ".jpg"
    orig = orig_dir / f"{stem}{ext}"
    try:
        data, ctype, final = fetch(url, orig)
    except Exception as exc:
        return {"url": url, "error": str(exc)}
    if is_html(data, ctype) or len(data) < 200:
        orig.unlink(missing_ok=True)
        return {"url": url, "error": "not an image"}
    pub_ext = ".jpg" if ext == ".jpeg" else ext
    pub = pub_dir / f"{stem}{pub_ext}"
    copy_bytes(data, pub)
    width = height = None
    try:
        from PIL import Image

        im = Image.open(BytesIO(data))
        width, height = im.size
    except Exception:
        pass
    rel = pub.relative_to(IMG_PUB).as_posix()
    return {
        "src": f"/images/zano/{rel}",
        "sourceUrl": final,
        "bytes": len(data),
        "width": width,
        "height": height,
        "format": pub_ext.lstrip(".").upper(),
    }


def add_doc(documents: list, **row: object) -> None:
    documents.append(row)


def publish_file(raw: bytes, dest: Path) -> None:
    copy_bytes(raw, dest)


def import_product(item: dict, keep: dict[str, dict]) -> dict:
    sku_hint = extract_sku(item["title"]) or extract_sku(item["url"])
    if sku_hint and sku_hint in keep:
        return keep[sku_hint]

    gaps: list[str] = []
    failed: list[dict] = []
    sub_key = classify(item["enCat"], item["title"], item["url"])
    cat_name, cat_slug, sub_name, se_path = CATALOG[sub_key]
    noun = NOUN[sub_key]

    page_path = INTERNAL / "pages-en" / (slugify(item["url"].rsplit("/", 1)[-1]) + ".html")
    html_b, ctype, _ = fetch(item["url"], page_path)
    if is_html(html_b, ctype) is False and not html_b:
        raise RuntimeError("empty product page")
    html = html_b.decode("utf-8", "replace")
    en = parse_en_page(html, item["url"])
    uuid = en.get("uuid")
    if not uuid and not en.get("gallery") and not en.get("title"):
        raise RuntimeError("tom produktsida utan UUID, bilder och rubrik")
    if not uuid:
        gaps.append("Produkt-UUID saknades i produktkorts-URL; svenska filer kunde inte hämtas via files.zano.company.")

    sv_pdf = None
    sv_pdf_name = None
    sv_text = ""
    if uuid:
        try:
            data, pc, final = fetch(
                f"{FILES}/product/card/sv-se/{uuid}/produktblad.pdf",
                INTERNAL / "pdf-sv" / f"{uuid}.pdf",
            )
            if data.startswith(b"%PDF"):
                sv_pdf = data
                sv_pdf_name = Path(urlparse(final).path).name
                sv_text = pdf_text(data)
            else:
                failed.append({"url": final, "reason": "inte en PDF"})
        except Exception as exc:
            failed.append({"url": f"sv-card {uuid}", "reason": str(exc)})

    sv = parse_sv_pdf(sv_text) if sv_text else {
        "title": "",
        "sku": None,
        "designer": None,
        "description": "",
        "groups": {},
        "dimensions": [],
        "weights": [],
        "materials": [],
        "hasMountingSchemes": False,
    }
    sku = sv.get("sku") or sku_hint or extract_sku(en.get("title") or "") or ""
    if sku and sku in keep:
        return keep[sku]

    pretty = pretty_title(sv.get("title") or "")
    if pretty.upper().startswith("ZANO") or pretty.lower().endswith((".dwg", ".pdf", ".zip")):
        pretty = ""
    model = pretty or pretty_title(en.get("title") or item["title"])
    if sku and sku not in model:
        model = f"{model} {sku}".strip()
    name = f"{model} – ZANO" if "ZANO" not in model.upper() else model

    slug = slugify(pretty or item["url"].rsplit("/", 1)[-1])
    slug = re.sub(r"-(dwg|pdf|zip|svg)(-.*)?$", "", slug)
    if not slug or re.fullmatch(r"[0-9a-f-]{36}", slug):
        slug = slugify(item["url"].rsplit("/", 1)[-1])
    if slug == "solstol-duo-02-052" and sku != "02.052":
        slug = f"{slug}-{slugify(sku)}"

    source_url = f"{SE_BASE}/produkter/{se_path}/{slug}"

    img_dir = IMG_PUB / slug
    orig_dir = INTERNAL / "images" / slug
    doc_dir = DOC_PUB / slug
    img_dir.mkdir(parents=True, exist_ok=True)
    orig_dir.mkdir(parents=True, exist_ok=True)
    doc_dir.mkdir(parents=True, exist_ok=True)

    images = []
    gallery_items = list(enumerate(en.get("gallery") or [], start=1))
    downloaded: dict[int, tuple[dict | None, str, str]] = {}
    if gallery_items:
        with ThreadPoolExecutor(max_workers=4) as pool:
            futs = {
                pool.submit(download_image, url, orig_dir, img_dir, f"galleri-{i:02d}"): (i, url, alt)
                for i, (url, alt) in gallery_items
            }
            for fut in as_completed(futs):
                i, url, alt = futs[fut]
                try:
                    info = fut.result()
                except Exception as exc:
                    downloaded[i] = ({"error": str(exc)}, url, alt)
                    continue
                downloaded[i] = (info, url, alt)
    for i in sorted(downloaded):
        info, url, alt = downloaded[i]
        if not info or info.get("error"):
            failed.append({"url": url, "reason": (info or {}).get("error", "bild")})
            continue
        kind = "studio" if i == 1 else "site"
        images.append(
            {
                "src": info["src"],
                "alt": alt or f"{name}, bild {i}",
                "kind": kind,
            }
        )
    if not images:
        gaps.append("Ingen produktbild kunde hämtas.")

    documents: list[dict] = []
    if sv_pdf and sv_pdf_name:
        dest = doc_dir / "produktblad.pdf"
        publish_file(sv_pdf, dest)
        add_doc(
            documents,
            title=pretty or Path(sv_pdf_name).stem,
            typeLabel="Produktblad (PDF)",
            format="PDF",
            href=f"/docs/zano/{slug}/produktblad.pdf",
            kind="datasheet",
            previewable=True,
            variant=None,
            appliesTo=sku or None,
            sourceUrl=f"{FILES}/product/card/sv-se/{uuid}/{sv_pdf_name}",
            fetchedAt=FETCHED_AT,
        )

    if uuid:
        try:
            svg, sc, sfinal = fetch(
                f"{FILES}/product/drawing/sv-se/{uuid}/matritning.svg",
                INTERNAL / "drawings" / f"{uuid}.svg",
            )
            if not is_html(svg, sc) and b"<svg" in svg.lower():
                publish_file(svg, doc_dir / "matritning.svg")
                add_doc(
                    documents,
                    title=f"{model} – mått",
                    typeLabel="Måttritning (SVG)",
                    format="SVG",
                    href=f"/docs/zano/{slug}/matritning.svg",
                    kind="drawing",
                    previewable=True,
                    variant=None,
                    appliesTo=sku or None,
                    sourceUrl=sfinal,
                    fetchedAt=FETCHED_AT,
                )
        except Exception as exc:
            if "404" not in str(exc):
                failed.append({"url": f"svg {uuid}", "reason": str(exc)})

    if en.get("drawing"):
        info = download_image(en["drawing"], orig_dir, img_dir, "matritning")
        if info and not info.get("error"):
            add_doc(
                documents,
                title=f"Måttritning {sku or model}",
                typeLabel="Måttritning (JPG)" if info["format"] in {"JPG", "JPEG"} else f"Måttritning ({info['format']})",
                format="JPG" if info["format"] == "JPEG" else info["format"],
                href=info["src"],
                kind="drawing",
                previewable=True,
                variant=None,
                appliesTo=sku or None,
                sourceUrl=info["sourceUrl"],
                fetchedAt=FETCHED_AT,
            )

    def consider_binary(url: str, raw: bytes, source: str, name: str) -> None:
        lower = name.lower()
        fmt = Path(name).suffix.lstrip(".").upper()
        if lower.endswith(".dwg"):
            if not is_dwg(raw):
                failed.append({"url": url, "reason": "ogiltig DWG"})
                return
            metric = "metric" in lower or "metr" in lower
            imperial = "imperial" in lower or "tum" in lower or "inch" in lower
            is_3d = "3d" in lower
            if is_3d:
                pub_name, label, kind = "3d-modell.dwg", "3D-modell (DWG)", "cad"
            elif imperial:
                pub_name, label, kind = "cad-ritning-tum.dwg", "CAD-ritning, tum-enheter (DWG)", "cad"
            else:
                pub_name, label, kind = "cad-ritning.dwg", "CAD-ritning, metriska enheter (DWG)", "cad"
                if not metric and not imperial:
                    label = "CAD-ritning (DWG)"
            dest = doc_dir / pub_name
            if not dest.exists():
                publish_file(raw, dest)
            if any(d.get("href") == f"/docs/zano/{slug}/{pub_name}" for d in documents):
                return
            add_doc(
                documents,
                title=name,
                typeLabel=label,
                format="DWG",
                href=f"/docs/zano/{slug}/{pub_name}",
                kind=kind,
                previewable=False,
                variant=None,
                appliesTo=sku or None,
                sourceUrl=source,
                fetchedAt=FETCHED_AT,
            )
        elif lower.endswith(".3ds"):
            dest = doc_dir / "3d-modell.3ds"
            if not dest.exists():
                publish_file(raw, dest)
            if any(d.get("href", "").endswith("3d-modell.3ds") for d in documents):
                return
            add_doc(
                documents,
                title=name,
                typeLabel="3D-modell (3DS)",
                format="3DS",
                href=f"/docs/zano/{slug}/3d-modell.3ds",
                kind="cad",
                previewable=False,
                variant=None,
                appliesTo=sku or None,
                sourceUrl=source,
                fetchedAt=FETCHED_AT,
            )
        elif lower.endswith(".skp"):
            dest = doc_dir / "3d-modell.skp"
            if not dest.exists():
                publish_file(raw, dest)
            if any(d.get("href", "").endswith("3d-modell.skp") for d in documents):
                return
            add_doc(
                documents,
                title=name,
                typeLabel="3D-modell (SKP)",
                format="SKP",
                href=f"/docs/zano/{slug}/3d-modell.skp",
                kind="cad",
                previewable=False,
                variant=None,
                appliesTo=sku or None,
                sourceUrl=source,
                fetchedAt=FETCHED_AT,
            )

    # Direct download links from the English product page (DWG etc.).
    for f in en.get("files") or []:
        href = f["href"]
        label = (f.get("label") or "").lower()
        if "/product/card/" in href:
            continue
        if href.rstrip("/").endswith("/street-furniture/files"):
            continue
        if href.lower().endswith(".pdf") and "brochure" in label:
            try:
                data, ct, final = fetch(href, INTERNAL / "brochures" / safe_name(Path(urlparse(href).path).name))
                dest = doc_dir / "seriebroschyr.pdf"
                if data.startswith(b"%PDF"):
                    if not dest.exists():
                        publish_file(data, dest)
                    if not any(d.get("href", "").endswith("seriebroschyr.pdf") for d in documents):
                        add_doc(
                            documents,
                            title=Path(urlparse(final).path).name,
                            typeLabel="Seriebroschyr (PDF)",
                            format="PDF",
                            href=f"/docs/zano/{slug}/seriebroschyr.pdf",
                            kind="other",
                            previewable=True,
                            variant=None,
                            appliesTo=sku or None,
                            sourceUrl=final,
                            fetchedAt=FETCHED_AT,
                        )
            except Exception as exc:
                failed.append({"url": href, "reason": str(exc)})
            continue
        try:
            data, ct, final = fetch(href, INTERNAL / "bin" / slug / safe_name(Path(urlparse(href).path).name or "fil"))
        except Exception as exc:
            failed.append({"url": href, "reason": str(exc)})
            continue
        if is_html(data, ct):
            failed.append({"url": href, "reason": "html"})
            continue
        fname = Path(urlparse(final).path).name or Path(urlparse(href).path).name
        if data.startswith(b"PK"):
            try:
                with zipfile.ZipFile(BytesIO(data)) as zf:
                    for info in zf.infolist():
                        if info.is_dir():
                            continue
                        raw = zf.read(info.filename)
                        consider_binary(href, raw, final, Path(info.filename).name)
            except Exception as exc:
                failed.append({"url": href, "reason": f"zip {exc}"})
        else:
            consider_binary(href, data, final, fname)

    if uuid:
        for loc, stem in (
            ("sv-se", "teknisk-dokumentation.zip"),
            ("en-gb", "technical-documentation.zip"),
        ):
            url = f"{FILES}/archive/{loc}/documentation/{uuid}/{stem}"
            try:
                data, ct, final = fetch(url, INTERNAL / "zips" / f"{uuid}-{loc}.bin")
            except Exception:
                continue
            if data.startswith(b"PK"):
                try:
                    with zipfile.ZipFile(BytesIO(data)) as zf:
                        for info in zf.infolist():
                            if info.is_dir():
                                continue
                            raw = zf.read(info.filename)
                            consider_binary(url, raw, final, Path(info.filename).name)
                except Exception as exc:
                    failed.append({"url": url, "reason": str(exc)})
            elif is_dwg(data):
                consider_binary(url, data, final, Path(urlparse(final).path).name)

    # Prefer metric DWG before imperial in the document list.
    documents.sort(
        key=lambda d: (
            0 if d["kind"] == "datasheet" else 1 if d["kind"] == "drawing" else 2,
            0 if "metriska" in d["typeLabel"] else 1 if "tum-enheter" in d["typeLabel"] else 2,
        )
    )

    option_groups, install = build_options(sv.get("groups") or {}, en)
    construction_names = []
    seat_names = []
    wood_label = "Sits"
    for g in option_groups:
        if g["key"] == "Konstruktion":
            construction_names = [o["name"] for o in g["options"]]
        if g["key"] == "Bordsskiva":
            wood_label = "Bordsskiva"
            seat_names = [o["name"] for o in g["options"]]
        if g["key"] == "Sits":
            seat_names = [o["name"] for o in g["options"]]

    dims = sv.get("dimensions") or en.get("dimensions") or []
    weights = sv.get("weights") or en.get("weights") or []
    weight, weight_summary = weight_fields(weights)
    weight_by = parse_weight_by_option(weights) or None
    materials = sv.get("materials") or []
    material = material_text(
        materials, en.get("materials") or [], construction_names, seat_names, wood_label
    )

    desc = sentences(sv.get("description") or "", 3)
    if not desc:
        desc = f"{name.replace(' – ZANO', '')} från tillverkaren ZANO."
        if not sv.get("description"):
            gaps.append("Svensk produktbeskrivning saknades i produktbladet; ingressen är bara tillverkare och modell.")

    summary = f"{model} från tillverkaren ZANO. {noun}."
    if sku:
        summary = f"{model} från tillverkaren ZANO."

    mounting = list(dict.fromkeys(install))
    if not mounting and sv.get("hasMountingSchemes"):
        mounting = ["För skruvmontering."]
        gaps.append("Monteringsalternativ i löptext; PDF visar skruvmonteringsscheman.")

    wood = None
    if any(g.get("key") == "Trafinish:barrtra" for g in option_groups):
        wood = (
            "För europeiskt barrträ offererar ZANO träkulörerna ek, mahogny, teak, cypress och valnöt, plus egen kulör. "
            "Namnen avser kulören på det valda träslaget, inte massivt ek-, mahogny- eller teakträ."
        )

    if not documents:
        gaps.append("Inga verifierade dokumentfiler kunde publiceras.")

    return {
        "slug": slug,
        "name": name,
        "modelName": model,
        "sku": sku or None,
        "manufacturer": "ZANO",
        "quoteShowsSku": True,
        "quoteOnRequest": True,
        "sourceUrl": source_url,
        "fetchedAt": FETCHED_AT,
        "category": cat_name,
        "categorySlug": cat_slug,
        "subcategory": sub_name,
        "subcategorySlug": sub_key,
        "summary": summary,
        "description": desc,
        "material": material,
        "wood": wood,
        "dimensions": dims,
        "weight": weight,
        "weightSummary": weight_summary,
        "weightByOption": weight_by,
        "mounting": mounting,
        "optionGroups": option_groups,
        "images": images,
        "documents": documents,
        "related": [],
        "imageNote": "Exempelbild – valt utförande kan avvika.",
        "internal": {
            "manufacturer": "ZANO",
            "legalName": "ZANO Mirosław Zarotyński",
            "sourceName": sv.get("title") or en.get("title") or item["title"],
            "designer": sv.get("designer"),
            "sourceUrl": source_url,
            "catalogueUrl": item["url"],
            "productUuid": uuid,
            "keepBranding": True,
            "supplierQuoteRequired": True,
            "purchasePrice": None,
            "woodPaletteUrl": WOOD_PALETTE,
            "steelPaletteUrl": STEEL_PALETTE,
            "enCat": item["enCat"],
        },
        "gaps": gaps,
        "failedFiles": failed,
    }


def load_existing() -> dict[str, dict]:
    path = GEN / "zano-series.json"
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    keep = {}
    for row in data.get("series") or []:
        sku = row.get("sku")
        if sku:
            keep[sku] = row
    return keep


def write_payload(series: list[dict]) -> Path:
    for row in series:
        row.pop("reviewNote", None)
    by_sub: dict[str, list[str]] = {}
    for row in series:
        by_sub.setdefault(row["subcategorySlug"], []).append(row["slug"])
    payload = {
        "fetchedAt": FETCHED_AT,
        "source": "https://www.zano.se/produkter",
        "note": (
            "ZANO-katalog utom kategorin Övrigt (fågelmatare, lyktor, desinfektionsstationer). "
            "Tillverkare ZANO visas publikt. Bilder och dokument är oförändrade original. "
            "Inköpspris saknas — lämna tomt, aldrig 0 kr."
        ),
        "skipped": [
            {"category": "Övrigt", "sv": "/produkter/ovriga", "en": ["feeders", "street-lamps", "hand-sanitizer-stations"]},
        ],
        "counts": {
            "products": len(series),
            "images": sum(len(p.get("images") or []) for p in series),
            "documents": sum(len(p.get("documents") or []) for p in series),
        },
        "series": series,
        "catalog": by_sub,
    }
    out = GEN / "zano-series.json"
    tmp = out.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    tmp.replace(out)
    return out


def fill_related(series: list[dict]) -> None:
    by_series: dict[str, list[str]] = {}
    for row in series:
        token = re.split(r"\s+", row.get("modelName") or row["name"])[0]
        token = re.sub(r"[^A-Za-zÅÄÖåäö]+", "", token)
        if len(token) < 3:
            continue
        by_series.setdefault(token.lower(), []).append(row["slug"])
    slugs = {r["slug"] for r in series}
    for row in series:
        token = re.split(r"\s+", row.get("modelName") or row["name"])[0]
        token = re.sub(r"[^A-Za-zÅÄÖåäö]+", "", token).lower()
        rel = [s for s in by_series.get(token, []) if s != row["slug"] and s in slugs][:4]
        row["related"] = rel


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--only", default="")
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--jobs", type=int, default=3)
    args = parser.parse_args()

    IMG_PUB.mkdir(parents=True, exist_ok=True)
    DOC_PUB.mkdir(parents=True, exist_ok=True)
    INTERNAL.mkdir(parents=True, exist_ok=True)
    GEN.mkdir(parents=True, exist_ok=True)

    keep = load_existing()
    if args.refresh:
        if args.only:
            drop = [
                sku
                for sku, row in keep.items()
                if args.only.lower()
                in f"{row.get('name', '')} {row.get('internal', {}).get('catalogueUrl', '')} {sku}".lower()
            ]
            for sku in drop:
                keep.pop(sku, None)
        else:
            keep = {sku: row for sku, row in keep.items() if sku == "02.052"}
    listing: list[dict] = []
    seen_url: set[str] = set()
    for cat in EN_CATS:
        if cat in SKIP_EN:
            continue
        dest = INTERNAL / "listings" / f"{cat}.html"
        data, ctype, _ = fetch(f"{EN_BASE}/street-furniture/catalogue/{cat}", dest)
        html = data.decode("utf-8", "replace")
        rows = parse_listing(html, cat)
        print(f"list {cat}: {len(rows)}")
        for row in rows:
            if row["url"] in seen_url:
                continue
            if is_combo_page(row):
                print(f"  skip combo {row['url'].rsplit('/', 1)[-1]}")
                continue
            seen_url.add(row["url"])
            listing.append(row)

    if args.only:
        listing = [r for r in listing if args.only.lower() in (r["title"] + r["url"]).lower()]
    if args.limit:
        listing = listing[: args.limit]

    series_by_slug: dict[str, dict] = {}
    # Keep previously imported products (including the DUO test product).
    for row in keep.values():
        series_by_slug[row["slug"]] = row

    imported = 0
    errors = []
    lock = threading.Lock()

    def persist() -> None:
        series = list(series_by_slug.values())
        fill_related(series)
        write_payload(sorted(series, key=lambda p: (p["subcategorySlug"], p["name"])))
        print("  checkpoint", len(series_by_slug))

    def run_one(item: dict, index: int, total: int) -> None:
        nonlocal imported
        sku_guess = extract_sku(item["title"]) or extract_sku(item["url"])
        with lock:
            if sku_guess and sku_guess in keep:
                print(f"[{index}/{total}] skip existing {sku_guess}")
                return
        print(f"[{index}/{total}] {item['title']}")
        try:
            product = import_product(item, dict(keep))
        except Exception as exc:
            with lock:
                errors.append({"url": item["url"], "error": str(exc)})
            print("  FAIL", exc)
            return
        with lock:
            series_by_slug[product["slug"]] = product
            if product.get("sku"):
                keep[product["sku"]] = product
            imported += 1
            if imported % 10 == 0:
                persist()

    pending: list[tuple[int, dict]] = []
    for i, item in enumerate(listing, start=1):
        sku_guess = extract_sku(item["title"]) or extract_sku(item["url"])
        if sku_guess and sku_guess in keep:
            print(f"[{i}/{len(listing)}] skip existing {sku_guess}")
            continue
        pending.append((i, item))

    jobs = max(1, args.jobs)
    if jobs == 1 or len(pending) <= 1:
        for i, item in pending:
            run_one(item, i, len(listing))
    else:
        with ThreadPoolExecutor(max_workers=jobs) as pool:
            futs = [pool.submit(run_one, item, i, len(listing)) for i, item in pending]
            for fut in as_completed(futs):
                fut.result()

    series = list(series_by_slug.values())
    fill_related(series)
    series.sort(key=lambda p: (p["subcategorySlug"], p["name"]))
    out = write_payload(series)
    print(json.dumps({
        "wrote": str(out),
        "products": len(series),
        "importedThisRun": imported,
        "listed": len(listing),
        "errors": errors[:20],
        "errorCount": len(errors),
        "skippedOvrigt": list(SKIP_EN),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
