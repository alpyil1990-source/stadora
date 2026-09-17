#!/usr/bin/env python3
"""Parse STREETPARK 2026/01 EUR price lists and match SKUs to the imported catalog.

List prices in the PDFs are recommended customer prices. Partner net is list minus
the yearly-turnover discount in The conditions of business cooperation.
Does not invent prices. Unmatched rows are kept with slug=null.
"""

from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERIES = ROOT / "src" / "data" / "generated" / "streetpark-series.json"
OUT = ROOT / "src" / "data" / "generated" / "streetpark-prices.json"
PDF_TEXT = Path("/tmp/streetpark-pdfs")

SOURCES = [
    ("park-benches", "Parkbänkar", "Price_list_26.01_EUR_-_Park_benches_ENG__1__03d9.txt"),
    ("litter-bins", "Papperskorgar och askkoppar", "Price_list_26.01_EUR_-_Litter_bins_ENG__1__ab5a.txt"),
    ("bicycle-stands", "Cykel- och sparkcykelställ", "Price_list_26.01_EUR_-_Bicycle_and_scooter_stands_ENG__1__f273.txt"),
    ("tables-picnic", "Bord och picknick", "Price_list_26.01_EUR_-_Tables_and_picnic_sets_ENG__1__def5.txt"),
    ("barrier-pillars", "Pollare", "Price_list_26.01_EUR_-_Barrier_pillars_ENG__1__b1ce.txt"),
]

WOOD_OR_FINISH = {
    "TW",
    "DG",
    "KD",
    "CA",
    "CP",
    "BB",
    "BN",
    "OP",
    "NO",
    "BTW",
    "BT",
    "BD",
    "A",
    "D",
    "T",
    "N",
    "Z",
    "B",
}

# Price-list dimension token -> catalog size token (RADIANO uses 100 for R1000 mm).
DIM_EXPAND = {"100": "1000", "150": "1500", "200": "2000"}
# Default 1800 mm benches use -180; catalog SKU has no length suffix.
DEFAULT_LENGTH = {"180", "140", "240", "300"}
# FLEXBIN 100 l is KFB10 on the list, KFB100 in the catalog.
FLEXBIN_MAP = {"KFB10": "KFB100"}
# Catalog typo LBG1BL is FLORIA LFG1BL.
SKU_ALIAS = {"LFG1BL": "LBG1BL"}
# Series headers that do not match catalog model names.
SERIES_SLUG = {
    "KRO": "papperskorg-robust",
    "ROBUST": "papperskorg-robust",
}


def parse_pdf_rows() -> list[dict]:
    rows: list[dict] = []
    for family, family_sv, fname in SOURCES:
        path = PDF_TEXT / fname
        series_code = series_name = None
        for raw in path.read_text().splitlines():
            line = raw.strip()
            if not line:
                continue
            if line.startswith(("Code ", "Price list", "www.", "-----")):
                continue
            if re.fullmatch(r"Page \d+/\d+", line):
                continue
            header = re.fullmatch(r"([A-Z]{2,5})\s+([A-Z][A-Z0-9 .&'/,-]+)", line)
            if header and "EUR" not in line:
                series_code, series_name = header.group(1), header.group(2).strip()
                continue
            m = re.fullmatch(r"([A-Za-z0-9._-]+)\s+(.+?)\s+(\d[\d ]*)\s*EUR", line)
            if not m:
                continue
            rows.append(
                {
                    "code": m.group(1),
                    "config": m.group(2).strip(),
                    "listEur": int(m.group(3).replace(" ", "")),
                    "seriesCode": series_code,
                    "seriesName": series_name,
                    "family": family,
                    "familyLabel": family_sv,
                    "source": fname.replace(".txt", ".pdf"),
                }
            )
    return rows


def split_catalog_sku(sku: str) -> tuple[str, str | None]:
    parts = sku.replace("-", " ").split()
    if len(parts) >= 2 and parts[-1].isdigit():
        return parts[0], parts[-1]
    return sku.replace(" ", ""), None


def peel_price_code(code: str) -> tuple[str, str | None]:
    """Return (type_core, dimension_token)."""
    original = code
    dim: str | None = None

    bike = re.match(r"^([A-Z]{2,4})([a-z]+)(\d+)([a-z]*)$", original)
    if bike:
        core = f"{bike.group(1)}{bike.group(3)}"
        return FLEXBIN_MAP.get(core, core), None

    c = original.upper().replace("_A", "")
    if "-" in c:
        left, right = c.split("-", 1)
        rm = re.match(r"^(\d+)?([A-Z]*)$", right)
        if rm and rm.group(1):
            dim = rm.group(1)
        else:
            dm = re.match(r"^(\d+)", right)
            if dm:
                dim = dm.group(1)
        c = left
    # FLORIA LFG2PPbt: strip bt/tw only. Do not strip BB when it is the type (LFG2BB).
    c = re.sub(r"(BTW|BT|BD|TW|DG|KD|CA|CP)$", "", c)
    if re.search(r"\d[BZ]$", c) and not c.endswith("BB"):
        c = c[:-1]
    if re.search(r"\dA$", c):
        c = c[:-1]
    if original.endswith("b-kd") and c.endswith("B"):
        c = c[:-1]
    if not re.match(r"^LFG\dBB$", c):
        c = re.sub(r"(BB|BN)$", "", c)
    if re.match(r"^LAU\d[A-Z]\d", original, re.I):
        c = re.match(r"^(LAU\d[A-Z]\d)", original, re.I).group(1).upper()
    if original.upper().startswith("SKV"):
        c = "SKV1"
    if c in FLEXBIN_MAP:
        c = FLEXBIN_MAP[c]
    if dim in DIM_EXPAND and c.startswith("LRA"):
        dim = DIM_EXPAND[dim]
    if dim in DEFAULT_LENGTH:
        dim = None
    if dim == "100" and c.startswith("SJE"):
        dim = None
    if dim == "60" and c.startswith(("STM", "LVL")):
        dim = None
    return c, dim


def build_catalog(series: list[dict]):
    products = []
    by_slug: dict[str, dict] = {}
    sku_index: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for prod in series:
        sizes = []
        for s in prod.get("sizes") or []:
            sku = s.get("sku") or s.get("name")
            base, dim = split_catalog_sku(sku)
            sizes.append({"sku": sku, "base": base, "dim": dim})
            sku_index[sku.replace(" ", "").upper()].append((prod["slug"], sku))
            sku_index[base.upper()].append((prod["slug"], sku))
        rec = {
            "slug": prod["slug"],
            "name": prod["name"],
            "model": prod["modelName"],
            "subcategorySlug": prod.get("subcategorySlug"),
            "sizes": sizes,
        }
        products.append(rec)
        by_slug[prod["slug"]] = rec
    return products, by_slug, sku_index


def series_candidates(series_name: str | None, code: str, products: list[dict]) -> list[dict]:
    if series_name and series_name.upper() in SERIES_SLUG:
        slug = SERIES_SLUG[series_name.upper()]
        return [p for p in products if p["slug"] == slug]
    if code.upper().startswith("KRO") and not code.upper().startswith("KRA"):
        return [p for p in products if p["slug"] == "papperskorg-robust"]
    if not series_name:
        return products
    name = series_name.upper()
    hits = [p for p in products if p["model"].upper() == name or p["model"].upper().startswith(name)]
    if name == "D.N.A.":
        if code.upper().startswith("KDA2"):
            return [p for p in products if p["slug"] == "hundavfallskarl-d-n-a-dog"]
        return [p for p in products if p["slug"] == "askkopp-d-n-a-ash"]
    if name == "BAS":
        core, _ = peel_price_code(code)
        if core.startswith("KBA1") and len(core) >= 5:
            return [p for p in products if p["slug"] == "papperskorg-bas-m"]
        return [p for p in products if p["slug"] == "papperskorg-bas"]
    if name == "VEGA":
        if code.upper().startswith("PSV"):
            return [p for p in products if p["slug"] == "picknickgrupp-vega"]
        return [p for p in products if p["slug"] == "parkbank-vega"]
    if name == "RAILA":
        return [p for p in products if p["slug"] == "papperskorg-raila"]
    if name == "INOA":
        return [p for p in products if p["slug"] == "parkbank-inoa"]
    if name == "NISHA":
        return [p for p in products if p["slug"] == "parkbank-nisha"]
    if hits:
        return hits
    # model name may include spaces: FLORIA GRAND, PENTA ISLANDS
    compact = name.replace(" ", "")
    hits = [p for p in products if p["model"].upper().replace(" ", "") == compact]
    return hits or products


def match_row(row: dict, products: list[dict]) -> tuple[str | None, str | None, str | None]:
    """Return slug, catalog sku, gap reason."""
    core, dim = peel_price_code(row["code"])
    core = SKU_ALIAS.get(core, core)
    cands = series_candidates(row["seriesName"], row["code"], products)
    if dim:
        for p in cands:
            for s in p["sizes"]:
                if s["base"].upper() == core and s["dim"] == dim:
                    return p["slug"], s["sku"], None
                if s["sku"].replace(" ", "").upper() == f"{core}{dim}":
                    return p["slug"], s["sku"], None
        # Extra length on the list (BABIA 1900 mm, BORDO 2900 mm): attach to the type without dim.
        for p in cands:
            exact = [s for s in p["sizes"] if s["base"].upper() == core and s["dim"] is None]
            if exact:
                return p["slug"], exact[0]["sku"], None
            # NISHA LNI2 60 vs catalog LNI2
            any_base = [s for s in p["sizes"] if s["base"].upper() == core]
            if any_base:
                return p["slug"], any_base[0]["sku"], None
        if len(cands) == 1:
            return cands[0]["slug"], None, f"Modell {core} {dim} finns på prislistan men inte som storlek i katalogen."
        return None, None, "Ingen katalogträff för kod + mått."
    # no dim: prefer catalog size without dim
    for p in cands:
        exact = [s for s in p["sizes"] if s["base"].upper() == core and s["dim"] is None]
        if exact:
            return p["slug"], exact[0]["sku"], None
        any_base = [s for s in p["sizes"] if s["base"].upper() == core]
        if len(any_base) == 1:
            return p["slug"], any_base[0]["sku"], None
        if any_base:
            return p["slug"], None, f"Flera katalogstorlekar för {core}; raden saknar måttsuffix."
    if len(cands) == 1 and cands[0]["model"].upper().replace(" ", "") == (row["seriesName"] or "").upper().replace(" ", ""):
        return cands[0]["slug"], None, f"Kod {row['code']} kunde inte kopplas till en katalog-SKU."
    return None, None, "Serien eller koden saknas i den importerade katalogen."


def main() -> None:
    catalog = json.loads(SERIES.read_text())
    products, by_slug, _ = build_catalog(catalog["series"])
    raw = parse_pdf_rows()
    out_rows = []
    gaps = []
    seen_codes: set[str] = set()
    for row in raw:
        slug, sku, gap = match_row(row, products)
        rec = {
            "sku": row["code"],
            "catalogSku": sku,
            "slug": slug,
            "model": by_slug[slug]["model"] if slug else row["seriesName"],
            "name": by_slug[slug]["name"] if slug else row["config"],
            "config": row["config"],
            "listEur": row["listEur"],
            "family": row["family"],
            "familyLabel": row["familyLabel"],
            "seriesName": row["seriesName"],
            "gap": gap,
        }
        key = row["code"]
        if key in seen_codes:
            rec["gap"] = (rec["gap"] + " " if rec["gap"] else "") + "Dubblettkod i prislistan."
        seen_codes.add(key)
        out_rows.append(rec)
        if gap:
            gaps.append(
                {
                    "sku": row["code"],
                    "slug": slug,
                    "seriesName": row["seriesName"],
                    "config": row["config"],
                    "listEur": row["listEur"],
                    "reason": gap,
                }
            )

    priced_slugs = {r["slug"] for r in out_rows if r["slug"]}
    catalog_without = []
    for p in products:
        if p["slug"] not in priced_slugs:
            catalog_without.append({"slug": p["slug"], "name": p["name"], "model": p["model"]})

    catalog_sizes_without = []
    covered = {(r["slug"], r["catalogSku"]) for r in out_rows if r["slug"] and r["catalogSku"]}
    for p in products:
        for s in p["sizes"]:
            if (p["slug"], s["sku"]) not in covered:
                catalog_sizes_without.append({"slug": p["slug"], "name": p["name"], "sku": s["sku"]})

    payload = {
        "list": "Prislista STREETPARK 2026/01 EUR",
        "fetchedAt": "2026-09-17",
        "currency": "EUR",
        "note": (
            "Beloppen i PDF:erna är recommended customer prices. "
            "Inköpsnetto är listpris minus partnerrabatt enligt The conditions of business cooperation."
        ),
        "discounts": [
            {"minEur": 0, "maxEur": 99999, "percent": 20, "label": "Nivå 1 · årsomsättning 0–99 999 EUR"},
            {"minEur": 100000, "maxEur": 199999, "percent": 21, "label": "Nivå 2 · 100 000–199 999 EUR"},
            {"minEur": 200000, "maxEur": None, "percent": 22, "label": "Nivå 3 · 200 000 EUR och mer"},
        ],
        "terms": [
            "Partnerrabatt följer årsomsättning (Y.T.) och flyttas automatiskt till nästa år.",
            "Order mejlas. Orderbekräftelse med proformafaktura för förskott. Tillverkning efter betalning.",
            "Förpackning ingår i orderbekräftelsen. Frakt räknas bara om partnern begär det.",
            "Leveranstid anges på orderbekräftelsen.",
            "Partnern använder STREETPARKs produktvarumärke.",
            "Samarbetsvillkoren i PDF:en anger ingen garantitid. Garanti-PDF från produktsidan ligger kvar under Dokument och underlag.",
        ],
        "counts": {
            "rows": len(out_rows),
            "matched": sum(1 for r in out_rows if r["slug"] and r["catalogSku"] and not r["gap"]),
            "matchedProduct": sum(1 for r in out_rows if r["slug"]),
            "gaps": len(gaps),
            "catalogWithoutPrice": len(catalog_without),
            "catalogSizesWithoutPrice": len(catalog_sizes_without),
        },
        "catalogWithoutPrice": catalog_without,
        "catalogSizesWithoutPrice": catalog_sizes_without,
        "gaps": gaps,
        "rows": out_rows,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print("wrote", OUT)
    print(json.dumps(payload["counts"], indent=2))
    print("catalog without any price", [c["slug"] for c in catalog_without])
    series_gaps = defaultdict(int)
    for g in gaps:
        series_gaps[g["seriesName"] or "?"] += 1
    print("gaps by series", dict(series_gaps))


if __name__ == "__main__":
    main()
