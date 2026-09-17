#!/usr/bin/env python3
"""Download STREETPARK type icons and attach them to catalog sizes.

Icons are the public line-drawings on product pages (.models.product-row .model).
No login is used. Does not invent artwork when an icon is missing.
"""

from __future__ import annotations

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import quote, unquote, urlparse, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
IMG_ROOT = PUBLIC / "images" / "streetpark"
SERIES = ROOT / "src" / "data" / "generated" / "streetpark-series.json"
PARSED = Path("/tmp/streetpark/parsed-products.json")
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"

METAL_LEGENDS = {
    "Metal parts options",
    "Metal parts option",
    "Kulör på metall",
}
LEGEND_SV = {
    "Metal parts options": "Kulör på metall",
    "Metal parts option": "Kulör på metall",
    "Wooden parts options": "Trä",
    "Wooden parts option": "Trä",
    "Wood parts options": "Trä",
    "Concrete parts options": "Betong",
    "Compact boards": "Kompaktlaminat",
}
RESTORE_OPTION = {
    "Corten-nyans": "Shade of Corten",
}


def encode_iri(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/-_.~")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def ext_of(url: str) -> str:
    path = urlparse(url.split("?")[0]).path
    suffix = Path(path).suffix.lower()
    return suffix if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"} else ".png"


def sku_file(code: str, url: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", code).strip("-") or "typ"
    return f"{slug}{ext_of(url)}"


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


def restore(name: str) -> str:
    return RESTORE_OPTION.get(name, name)


def legend_sv(name: str) -> str:
    return LEGEND_SV.get(name, name)


def main() -> None:
    parsed = json.loads(PARSED.read_text())
    by_slug = {p["slug"]: p for p in parsed}
    data = json.loads(SERIES.read_text())

    jobs: list[tuple[str, str, str, Path]] = []
    for row in data["series"]:
        product = by_slug.get(row["slug"])
        if not product:
            continue
        icons = {m["code"]: m.get("iconUrl") for m in product.get("models") or []}
        dest_dir = IMG_ROOT / row["slug"] / "types"
        for size in row.get("sizes") or []:
            code = size.get("sku") or size.get("name")
            url = icons.get(code) or icons.get(size.get("name"))
            if not url:
                size.pop("icon", None)
                continue
            fname = sku_file(code, url)
            dest = dest_dir / fname
            jobs.append((row["slug"], code, url, dest))
            size["icon"] = f"/images/streetpark/{row['slug']}/types/{fname}"
            size["iconSourceUrl"] = url

    print(f"Downloading {len(jobs)} type icons…")
    failed: list[tuple[str, str, str]] = []
    ok = cached = 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(download, url, dest): (slug, code, url, dest) for slug, code, url, dest in jobs}
        for i, fut in enumerate(as_completed(futs), 1):
            slug, code, url, dest = futs[fut]
            success, info = fut.result()
            if success:
                if info == "cached":
                    cached += 1
                else:
                    ok += 1
            else:
                failed.append((slug, code, info))
                dest.unlink(missing_ok=True)
            if i % 50 == 0:
                print(f"  {i}/{len(jobs)}")

    fail_keys = {(slug, code) for slug, code, _ in failed}
    for row in data["series"]:
        for size in row.get("sizes") or []:
            code = size.get("sku") or size.get("name")
            if (row["slug"], code) in fail_keys:
                size.pop("icon", None)
                size.pop("iconSourceUrl", None)
            elif size.get("icon"):
                disk = PUBLIC / size["icon"].lstrip("/")
                if not disk.exists() or disk.stat().st_size == 0:
                    size.pop("icon", None)
                    size.pop("iconSourceUrl", None)

        colors = [restore(c) for c in row.get("colors") or []]
        leftover = []
        for variant in row.get("variants") or []:
            label = legend_sv(variant["label"])
            options = [restore(o) for o in variant.get("options") or []]
            if variant["label"] in METAL_LEGENDS or label == "Kulör på metall":
                colors = options
                continue
            leftover.append({"label": label, "options": options})
        row["colors"] = colors
        row["variants"] = leftover
        if colors:
            row["colorLegend"] = "Kulör på metall"
        else:
            row.pop("colorLegend", None)

    with_icon = sum(1 for r in data["series"] for s in r.get("sizes") or [] if s.get("icon"))
    without = [
        f"{r['slug']}:{s.get('sku') or s.get('name')}"
        for r in data["series"]
        for s in r.get("sizes") or []
        if not s.get("icon")
    ]
    data.setdefault("counts", {})["typeIcons"] = with_icon
    data["counts"]["typeIconsMissing"] = len(without)
    SERIES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("wrote", SERIES)
    print("downloaded", ok, "cached", cached, "failed", len(failed))
    print("sizes with icon", with_icon, "without", len(without))
    if without:
        print("missing", ", ".join(without[:40]))
    for slug, code, err in failed[:20]:
        print("FAIL", slug, code, err)


if __name__ == "__main__":
    main()
