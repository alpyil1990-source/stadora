#!/usr/bin/env python3
"""Attach STREETPARK's own finish chips (metal / wood / concrete / compact) to the catalog.

Reads cached product HTML under /tmp/streetpark/products. Does not invent RAL codes
or swatch colours — only labels and images that appear on the product page.
"""

from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote, unquote, urlparse, urlsplit, urlunsplit

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
FINISH_DIR = PUBLIC / "images" / "streetpark" / "finishes"
SERIES = ROOT / "src" / "data" / "generated" / "streetpark-series.json"
PARSED = Path("/tmp/streetpark/parsed-products.json")
HTML_DIR = Path("/tmp/streetpark/products")
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"

METAL_LEGENDS = {
    "metal parts options",
    "metal parts option",
    "kulör på metall",
}

# STREETPARK page label -> catalog label (already imported names).
NAME_ALIASES = {
    "oak": "ek",
    "ek": "oak",
    "pine": "furu",
    "furu": "pine",
    "pine tw": "pine tw",
    "acacia": "akacia",
    "akacia": "acacia",
    "larch": "lärk",
    "lärk": "larch",
    "douglas fir": "douglastall",
    "douglastall": "douglas fir",
    "tropical wood": "tropiskt trä",
    "tropical w.": "tropiskt trä",
    "tropiskt trä": "tropical wood",
    "smooth natural": "natur",
    "natur": "smooth natural",
    "smooth anthracite": "antracit",
    "antracit": "smooth anthracite",
    "gray": "grå",
    "grey": "grå",
    "grå": "gray",
    "sandy light": "ljus sand",
    "ljus sand": "sandy light",
    "shade of corten": "corten-nyans",
    "corten-nyans": "shade of corten",
    "hot-dip zinc": "varmförzinkad",
    "varmförzinkad": "hot-dip zinc",
    "stainless steel": "rostfritt stål",
    "rostfritt stål": "stainless steel",
    "aluminum alloy": "aluminiumlegering",
    "aluminiumlegering": "aluminum alloy",
}

SUMMARY_PHRASES = [
    ("without armrests", "utan armstöd"),
    ("with armrests", "med armstöd"),
    ("seat without backrest", "sits utan ryggstöd"),
    ("seat with backrest", "sits med ryggstöd"),
    ("seat utan", "sits utan"),
    ("seat med", "sits med"),
    ("bench with armrest", "bänk med armstöd"),
    ("bench without backrest", "bänk utan ryggstöd"),
    ("backrest on the wall", "ryggstöd för väggmontage"),
    ("without backrest", "utan ryggstöd"),
    ("with backrest", "med ryggstöd"),
    ("central leg", "mittben"),
    ("inner diameter", "innerdiameter"),
    ("45° angle", "45° vinkel"),
    ("2 legs", "2 ben"),
    ("4 legs", "4 ben"),
]


def encode_iri(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/-_.~")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def unsized(url: str) -> str:
    return re.sub(r"-\d+x\d+(?=\.(?:jpg|jpeg|png|webp|gif))", "", url, flags=re.I)


def ext_of(url: str) -> str:
    path = urlparse(url.split("?")[0]).path
    suffix = Path(path).suffix.lower()
    return suffix if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif"} else ".jpg"


def download(url: str, dest: Path, retries: int = 4) -> tuple[bool, str]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return True, "cached"
    last = ""
    for i in range(retries):
        try:
            req = urllib.request.Request(
                encode_iri(url),
                headers={"User-Agent": UA, "Accept": "image/*,*/*"},
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if not data:
                last = "empty"
                time.sleep(1.2 * (i + 1))
                continue
            tmp = dest.with_suffix(dest.suffix + ".part")
            tmp.write_bytes(data)
            tmp.replace(dest)
            return True, f"{len(data)}b"
        except Exception as exc:  # noqa: BLE001
            last = str(exc)
            time.sleep(1.2 * (i + 1))
    return False, last


def key_name(name: str) -> str:
    return re.sub(r"\s+", " ", name).strip().lower()


def names_match(a: str, b: str) -> bool:
    ka, kb = key_name(a), key_name(b)
    if ka == kb:
        return True
    if NAME_ALIASES.get(ka) == kb or NAME_ALIASES.get(kb) == ka:
        return True
    return False


def parse_rows(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    rows: list[dict] = []
    for row in soup.select(".product-rows .materials.product-row"):
        legend_el = row.select_one(".row-text")
        legend = (legend_el.get_text(" ", strip=True) if legend_el else "Options").strip()
        options = []
        for mat in row.select(".material"):
            title = mat.select_one("h2.title")
            name = title.get_text(" ", strip=True) if title else ""
            if not name:
                continue
            img = mat.select_one(".image")
            style = img.get("style") or "" if img else ""
            m = re.search(r"url\(([^)]+)\)", style)
            url = unsized(m.group(1).strip("\"'")) if m else None
            options.append({"name": name, "swatchUrl": url})
        if options:
            rows.append({"legend": legend, "options": options})
    return rows


def dest_for(url: str, used: dict[str, str]) -> Path:
    if url in used:
        return PUBLIC / used[url].lstrip("/")
    base = Path(urlparse(url.split("?")[0]).path).name
    base = re.sub(r"[^A-Za-z0-9._-]+", "-", base) or f"finish{ext_of(url)}"
    dest = FINISH_DIR / base
    if dest.exists() and dest.stat().st_size > 0:
        # Same filename from a different original is rare; keep first mapping.
        rel = f"/images/streetpark/finishes/{dest.name}"
        used[url] = rel
        return dest
    n = 1
    stem, suffix = dest.stem, dest.suffix
    while dest.exists():
        n += 1
        dest = FINISH_DIR / f"{stem}-{n}{suffix}"
    rel = f"/images/streetpark/finishes/{dest.name}"
    used[url] = rel
    return dest


def translate_summary(text: str | None) -> str | None:
    if not text:
        return text
    out = text
    for src, dst in sorted(SUMMARY_PHRASES, key=lambda x: len(x[0]), reverse=True):
        out = re.sub(re.escape(src), dst, out, flags=re.I)
    return re.sub(r"[ \t]+", " ", out).strip()


def find_option(options: list[dict], name: str) -> dict | None:
    for opt in options:
        if names_match(opt["name"], name):
            return opt
    return None


def main() -> None:
    parsed = json.loads(PARSED.read_text())
    by_slug = {p["slug"]: p for p in parsed}
    data = json.loads(SERIES.read_text())

    html_rows: dict[str, list[dict]] = {}
    for product in parsed:
        key = product.get("urlKey") or Path(urlparse(product["url"]).path).name
        path = HTML_DIR / f"{key}.html"
        if not path.exists():
            continue
        html_rows[product["slug"]] = parse_rows(path.read_text(errors="replace"))

    url_to_rel: dict[str, str] = {}
    jobs: list[tuple[str, Path]] = []
    seen_dest: set[str] = set()
    for rows in html_rows.values():
        for row in rows:
            for opt in row["options"]:
                url = opt.get("swatchUrl")
                if not url:
                    continue
                dest = dest_for(url, url_to_rel)
                if str(dest) in seen_dest:
                    continue
                seen_dest.add(str(dest))
                jobs.append((url, dest))

    print(f"Downloading {len(jobs)} finish chips…")
    failed: list[tuple[str, str]] = []
    ok = cached = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(download, url, dest): (url, dest) for url, dest in jobs}
        for i, fut in enumerate(as_completed(futs), 1):
            url, dest = futs[fut]
            success, info = fut.result()
            if success:
                if info == "cached":
                    cached += 1
                else:
                    ok += 1
            else:
                failed.append((url, info))
                dest.unlink(missing_ok=True)
                url_to_rel.pop(url, None)
            if i % 20 == 0:
                print(f"  {i}/{len(jobs)}")

    fail_urls = {u for u, _ in failed}
    products_with_metal_swatch = 0
    products_with_metal = 0
    colors_with_swatch = 0
    colors_without: list[str] = []
    variant_swatches = 0

    for row in data["series"]:
        html = html_rows.get(row["slug"]) or []
        metal = next((r for r in html if r["legend"].strip().lower() in METAL_LEGENDS), None)
        other = [r for r in html if r["legend"].strip().lower() not in METAL_LEGENDS]

        if metal:
            products_with_metal += 1
            colors = []
            for opt in metal["options"]:
                url = opt.get("swatchUrl")
                item: dict = {"name": opt["name"]}
                if url and url not in fail_urls and url in url_to_rel:
                    disk = PUBLIC / url_to_rel[url].lstrip("/")
                    if disk.exists() and disk.stat().st_size > 0:
                        item["swatch"] = url_to_rel[url]
                        item["swatchSourceUrl"] = url
                        colors_with_swatch += 1
                    else:
                        colors_without.append(f"{row['slug']}:{opt['name']}")
                else:
                    colors_without.append(f"{row['slug']}:{opt['name']}")
                colors.append(item)
            row["colors"] = colors
            row["colorLegend"] = "Kulör på metall"
            if any(c.get("swatch") for c in colors):
                products_with_metal_swatch += 1
        else:
            row["colors"] = []
            row.pop("colorLegend", None)

        leftover = []
        existing_by_label = {v["label"]: v for v in row.get("variants") or []}
        for group in other:
            legend = group["legend"]
            # Keep already-Swedish legends from the catalog when present.
            mapped_label = existing_by_label.keys()
            label = None
            low = legend.lower()
            if "wood" in low or "trä" in low:
                label = "Trä"
            elif "concrete" in low or "betong" in low:
                label = "Betong"
            elif "compact" in low:
                label = "Kompaktlaminat"
            else:
                label = legend
            if label in mapped_label:
                label = label  # already Swedish
            catalog_variant = existing_by_label.get(label)
            names = []
            swatches: dict[str, str] = {}
            source_names = [o["name"] for o in group["options"]]
            # Prefer existing catalog option names (may already be mapped to Swedish).
            if catalog_variant:
                for name in catalog_variant.get("options") or []:
                    html_opt = find_option(group["options"], name)
                    names.append(name)
                    if html_opt and html_opt.get("swatchUrl") in url_to_rel:
                        swatches[name] = url_to_rel[html_opt["swatchUrl"]]
            else:
                names = source_names
                for opt in group["options"]:
                    if opt.get("swatchUrl") in url_to_rel:
                        swatches[opt["name"]] = url_to_rel[opt["swatchUrl"]]
            entry: dict = {"label": label, "options": names}
            if swatches:
                entry["optionSwatches"] = swatches
                variant_swatches += len(swatches)
            leftover.append(entry)
        row["variants"] = leftover

        for size in row.get("sizes") or []:
            size["summary"] = translate_summary(size.get("summary"))

    data.setdefault("counts", {})["finishSwatches"] = colors_with_swatch
    data["counts"]["finishSwatchesMissing"] = len(colors_without)
    data["counts"]["productsWithMetalColors"] = products_with_metal
    data["counts"]["productsWithMetalSwatches"] = products_with_metal_swatch
    data["counts"]["variantSwatches"] = variant_swatches
    SERIES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("wrote", SERIES)
    print("downloaded", ok, "cached", cached, "failed", len(failed))
    print("metal products", products_with_metal, "with swatch", products_with_metal_swatch)
    print("color chips with file", colors_with_swatch, "without", len(colors_without))
    print("variant swatches", variant_swatches)
    if colors_without:
        print("missing colors", ", ".join(colors_without[:30]))
    for url, err in failed[:20]:
        print("FAIL", url, err)


if __name__ == "__main__":
    main()
