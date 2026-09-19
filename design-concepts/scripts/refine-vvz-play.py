#!/usr/bin/env python3
"""Refine VVZ-Play names from the wholesale list and swap a few buyer-facing SKUs.

No credentials. Does not invent EUR or specs.
"""

from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "src" / "data" / "generated"
CACHE = Path("/tmp/vvz-import")
INVENTED = " där de anges; andra kombinationer kan tillverkas på förfrågan"


def load_importer():
    path = ROOT / "scripts" / "import-vvz-play.py"
    spec = importlib.util.spec_from_file_location("vvz_import", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


imp = load_importer()

# Public names derived from wholesale listName / original product title. Existing two kept.
NAME_FROM_LIST = {
    "PHP004": "Vippgunga båge",
    "VZ1-006-15": "Kombinerad lektorn",
    "VZD1-001-10": "Lekställning ettorn låg, rutschkana, repvägg och stege",
    "VZD1-004-10": "Lekställning ettorn hög, rutschkana, repvägg och stege",
    "VZD1-005-10": "Lekställning ettorn låg, rutschkana, repvägg och klättervägg",
    "VZD1-002-10": "Lekställning ettorn låg, rutschkana, klättervägg och trappa",
    "VZD1-003-10": "Lekställning ettorn hög, rutschkana, klättervägg och stege",
    "VZ1-001-15": "Kombinerad lekställning, rutschkana, repvägg och stege 1,5 m",
    "VZP1-004-10": "Lekställning ettorn låg, rutschkana, lutande klättervägg och stege",
    "VZD1-007-10": "Lekställning ettorn låg, rutschkana, repvägg, klättervägg och trappa",
    "VHP101-10": "Gunga småbarn 1,0 m",
    "VH101-2": "Dubbel gunga småbarn, babysits",
    "VHP001-10": "Gunga Classic 1,0 m",
    "VHP001-15": "Gunga Classic 1,5 m",
    "VHP002-10": "Gunga babysits 1,0 m",
    "VHP002-15": "Gunga babysits 1,5 m",
    "VHP004-10": "Gunga fågelbo 1,0 m",
    "VHP102-10": "Dubbel gunga småbarn 1,0 m",
    "PH001": "Vippgunga enben 3 m",
    "PH004": "Vippgunga båge enben 3 m",
    "PHP001": "Vippgunga 3 m",
    "PH001-1": "Vippgunga enben hästar",
    "PH001-2": "Vippgunga enben drakar",
    "PH002": "Vippgunga enben 4 m",
    "A101": "Minirutschkana med stege 1,0 m",
    "A102": "Minirutschkana med trappa 1,0 m",
    "AP001-10": "Rutschkana 1,0 m",
    "AP001-15": "Rutschkana 1,5 m",
    "AP002-10": "Rutschkana med gunga Classic 1,0 m",
    "KL003": "Stående karusell 1,5 m",
    "KL001-15": "Karusell med sits 1,5 m",
    "KL005": "Repkarusell",
    "KL001-18": "Karusell med sits 1,8 m",
    "SH001": "Fjädergunga",
    "SH005": "Fjädergunga Clover",
    "SH003": "Fjädergunga häst",
    "SH013": "Fjädergunga Seal",
    "SH002": "Fjädergunga",
    "PD001": "Sandlåda 2 × 2 m",
    "PD009": "Hexagon sandlåda",
    "PD005": "Lekhus butik",
    "PYR010": "Reppyramid 1 m",
    "OP1-05": "Apbana lodräta rep",
    "OP1-02": "Apbana handledare",
    "OP1-03": "Apbana spindelnät",
    "BAL004": "Balanssteg löv",
    "BAL006": "Balansstång",
    "BAL001-2": "Balansbom",
    "BAL005": "Fjäderbalans Surf",
    "VH013": "Tillgänglig gunga",
    "KL011": "Tillgänglig karusell",
    "KL014": "Tillgänglig globkarusell",
}

SWAP = {
    "ZP002": "PD005",
    "EDU001": "VH013",
    "EDU016": "KL011",
    "EDU002": "KL014",
}

SUB_FOR_NEW = {
    "PD005": ("lekhus", "Lekhus och sandlek"),
    "VH013": ("tillganglig-lek", "Tillgänglig lek"),
    "KL011": ("tillganglig-lek", "Tillgänglig lek"),
    "KL014": ("tillganglig-lek", "Tillgänglig lek"),
}


def apply_name(row: dict, list_name: str | None = None) -> None:
    sku = row["sku"]
    name = NAME_FROM_LIST.get(sku) or row["name"]
    old = row["name"]
    row["name"] = name
    if old and old != name:
        row["summary"] = (row.get("summary") or "").replace(old, name, 1)
        row["description"] = (row.get("description") or "").replace(old, name, 1)
        for img in row.get("images") or []:
            if img.get("alt"):
                img["alt"] = img["alt"].replace(old, name)
    desc = row.get("description") or ""
    if INVENTED in desc:
        row["description"] = desc.replace(INVENTED, "")
    # Drop invented colour-combo sentence leftover from the first import pass.


def main() -> int:
    series_path = GEN / "vvz-play-series.json"
    prices_path = GEN / "vvz-play-prices.json"
    payload = json.loads(series_path.read_text())
    price_payload = json.loads(prices_path.read_text())
    prices = json.loads((CACHE / "prices.json").read_text())
    listed = {p["sku"]: p for p in json.loads((CACHE / "listed.json").read_text())}

    op = imp.opener()
    by_sku = {r["sku"]: r for r in payload["series"]}
    for old_sku, new_sku in SWAP.items():
        if new_sku in by_sku:
            continue
        src = listed.get(new_sku)
        if not src or new_sku not in prices:
            print("skip swap, missing", new_sku)
            continue
        sub, sub_name = SUB_FOR_NEW[new_sku]
        item = {
            **src,
            "sku": new_sku,
            "subcategorySlug": sub,
            "subcategory": sub_name,
            **{k: prices[new_sku][k] for k in ("listEur", "netEur", "wholesaleEur", "listName")},
        }
        print("build", new_sku, item["url"])
        row = imp.build_one(op, item, prices, logged=False)
        if not row:
            print("  fail", new_sku)
            continue
        payload["series"] = [r for r in payload["series"] if r["sku"] != old_sku]
        price_payload["rows"] = [r for r in price_payload["rows"] if r["sku"] != old_sku]
        # strip price fields used only while building
        price_payload["rows"].append(
            {
                "sku": row["sku"],
                "slug": row["slug"],
                "name": NAME_FROM_LIST.get(row["sku"], row["name"]),
                "subcategory": row["subcategory"],
                "subcategorySlug": row["subcategorySlug"],
                "listEur": row["listEur"],
                "discountPercent": 30,
                "netEur": row["netEur"],
            }
        )
        catalog_row = {k: v for k, v in row.items() if k not in ("listEur", "netEur", "discountPercent")}
        payload["series"].append(catalog_row)
        by_sku[new_sku] = catalog_row
        by_sku.pop(old_sku, None)

    for row in payload["series"]:
        apply_name(row)

    name_by_sku = {r["sku"]: r["name"] for r in payload["series"]}
    for r in price_payload["rows"]:
        if r["sku"] in name_by_sku:
            r["name"] = name_by_sku[r["sku"]]
            match = next((x for x in payload["series"] if x["sku"] == r["sku"]), None)
            if match:
                r["slug"] = match["slug"]
                r["subcategory"] = match["subcategory"]
                r["subcategorySlug"] = match["subcategorySlug"]

    by_sub: dict[str, list[str]] = defaultdict(list)
    for row in payload["series"]:
        by_sub[row["subcategorySlug"]].append(row["slug"])
    for row in payload["series"]:
        others = [s for s in by_sub[row["subcategorySlug"]] if s != row["slug"]]
        row["related"] = others[:2]

    price_payload["counts"] = {"rows": len(price_payload["rows"]), "products": len(payload["series"])}
    series_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    prices_path.write_text(json.dumps(price_payload, ensure_ascii=False, indent=2) + "\n")
    print("series", len(payload["series"]), "prices", len(price_payload["rows"]))
    from collections import Counter

    print(Counter(r["subcategorySlug"] for r in payload["series"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
