#!/usr/bin/env python3
"""Import NOVUM Runner and Airwalker into private STADORA storage.

Credentials: NOVUM_PORTAL_EMAIL and NOVUM_PORTAL_PASSWORD from the environment
or a gitignored .env. They are never written to catalog JSON, logs, or git.

Only the two named test products are imported. The rest of Fitness Devices is skipped.
"""

from __future__ import annotations

import hashlib
import http.cookiejar
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "src" / "data" / "generated"
STORAGE = ROOT / "internal" / "storage" / "novum"
INDEX_PATH = ROOT / "internal" / "db" / "files.json"
ENV_PATH = ROOT / ".env"
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"
BASE = "https://novum4kids.com"
SUPPLIER = "NOVUM"
ACCESS_DEFAULT = "internal_only"

# Explicit allowlist — never match on a similar name.
PRODUCTS = [
    {
        "key": "runner",
        "slug": "utegym-runner",
        "originalName": "Runner",
        "url": "https://novum4kids.com/product/runner/",
        "expectedSku": "44103W",
        "wpId": "19252",
    },
    {
        "key": "airwalker",
        "slug": "utegym-airwalker",
        "originalName": "Airwalker",
        "url": "https://novum4kids.com/product/airwalker/",
        "expectedSku": "4403Z",
        "wpId": "16113",
    },
]

SIZE_SUFFIX = re.compile(r"-(\d+x\d+)(\.[a-z0-9]+)$", re.I)
DRIVE_ID = re.compile(r"drive\.google\.com/file/d/([^/]+)/")
IMG_TAG = re.compile(r"<img\b([^>]+)>", re.I)
SERIAL_RE = re.compile(
    r'product-serial-number[\s\S]{0,120}?SERIAL NUMBER:\s*</?\w*[^>]*>\s*<strong>([^<]+)</strong>',
    re.I,
)
SERIAL_RE2 = re.compile(r"SERIAL NUMBER:\s*<strong>([^<]+)</strong>", re.I)
ATTR_RE = re.compile(r"Color:\s*<b>([^<]+)</b>[\s\S]{0,80}?Materials:\s*<b>([^<]+)</b>", re.I)
DIM_RE = re.compile(r"<small>([^<]+)</small>\s*<b>([^<]+)</b>", re.I)
RESOURCE_RE = re.compile(
    r'<a[^>]*class=[\'"]resource-btn[\'"][^>]*href=[\'"]([^\'"]+)[\'"][^>]*>([\s\S]*?)</a>',
    re.I,
)
GLB_RE = re.compile(r'src="(https://novum4kids.com/wp-content/uploads/model3d/[^"]+\.glb)"')
DESC_RE = re.compile(r'<div class="product-description">([\s\S]+?)</div>')
NONCE_RE = re.compile(
    r'name="woocommerce-login-nonce"\s+value="([^"]+)"|'
    r'id="woocommerce-login-nonce"\s+value="([^"]+)"'
)


def load_env() -> None:
    if not ENV_PATH.is_file():
        return
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = val.strip()


def credentials() -> tuple[str, str]:
    email = (os.environ.get("NOVUM_PORTAL_EMAIL") or "").strip()
    password = os.environ.get("NOVUM_PORTAL_PASSWORD") or ""
    if not email or not password:
        print("NOVUM_PORTAL_EMAIL and NOVUM_PORTAL_PASSWORD must be set.", file=sys.stderr)
        sys.exit(2)
    return email, password


def opener() -> urllib.request.OpenerDirector:
    jar = http.cookiejar.CookieJar()
    ctx = ssl.create_default_context()
    https = urllib.request.HTTPSHandler(context=ctx)
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), https)


def request(op: urllib.request.OpenerDirector, url: str, data: bytes | None = None, method: str | None = None) -> tuple[str, bytes, str, str]:
    headers = {"User-Agent": UA, "Accept": "*/*"}
    if data is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with op.open(req, timeout=90) as resp:
        body = resp.read()
        ctype = resp.headers.get("Content-Type") or ""
        cdisp = resp.headers.get("Content-Disposition") or ""
        return resp.geturl(), body, ctype, cdisp


def login(op: urllib.request.OpenerDirector, email: str, password: str) -> None:
    url, body, _, _ = request(op, f"{BASE}/my-account/")
    html = body.decode("utf-8", "replace")
    m = NONCE_RE.search(html)
    nonce = (m.group(1) or m.group(2)) if m else ""
    if not nonce:
        print("Login form nonce missing — aborting without writing credentials.", file=sys.stderr)
        sys.exit(3)
    payload = urllib.parse.urlencode(
        {
            "username": email,
            "password": password,
            "woocommerce-login-nonce": nonce,
            "_wp_http_referer": "/my-account/",
            "login": "Log in",
            "rememberme": "forever",
        }
    ).encode()
    final, body2, _, _ = request(op, f"{BASE}/my-account/", data=payload)
    html2 = body2.decode("utf-8", "replace")
    still_form = "woocommerce-form-login" in html2 and 'name="password"' in html2
    if still_form:
        print("NOVUM portal login failed. Check environment variables. Password not logged.", file=sys.stderr)
        sys.exit(4)
    _, probe, _, _ = request(op, "https://novum4kids.com/product/runner/")
    if "resources-files locked" in probe.decode("utf-8", "replace"):
        print("NOVUM session did not unlock Resources. Aborting.", file=sys.stderr)
        sys.exit(4)
    print("NOVUM portal session established.")


def strip_size(url: str) -> str:
    path = url.split("?")[0]
    return SIZE_SUFFIX.sub(r"\2", path)


def ext_of(name: str) -> str:
    suf = Path(name.split("?")[0]).suffix.lower().lstrip(".")
    return (suf or "bin").upper().replace("JPEG", "JPG")


def file_id(supplier: str, sku: str, original: str, source: str) -> str:
    raw = f"{supplier}|{sku}|{original}|{source}".encode()
    return hashlib.sha1(raw).hexdigest()[:16]


def storage_name(sku: str, doc_type: str, original: str, n: int) -> str:
    ext = Path(original).suffix.lower() or ".bin"
    stem = re.sub(r"[^A-Za-z0-9]+", "-", doc_type).strip("-").lower() or "file"
    return f"NOVUM_{sku}_{stem}_{n:02d}{ext}"


def classify_resource(label: str, url: str) -> tuple[str, str, str]:
    t = (label or "").lower()
    u = (url or "").lower()
    ext = ext_of(url or label)
    blob = f"{t} {u}"
    if "assembly" in blob or "manual" in t or "monter" in t:
        return "mounting", "Monteringsanvisning", ext
    if "data sheet" in t or "datasheet" in blob or (ext == "PDF" and "sheet" in t):
        return "datasheet", "Produktblad", ext
    if "dwg" in t and ("side" in t or " sv" in f" {t}"):
        return "cad", "DWG sidovy", "DWG"
    if "dwg" in t and ("top" in t or " tv" in f" {t}"):
        return "cad", "DWG ovanvy", "DWG"
    if ext in {"DWG", "DXF"}:
        return "cad", "CAD", ext
    if "3d" in t or ext in {"GLB", "GLTF", "STEP", "STP", "IGS", "SKP"}:
        return "cad", "3D-modell", ext
    if "side view" in t and "dwg" not in t:
        return "drawing", "Sidovy", ext
    if "top view" in t and "dwg" not in t:
        return "drawing", "Ovanvy", ext
    return "other", label.strip() or "Övrig fil", ext


def html_text(chunk: str) -> str:
    chunk = re.sub(r"<br\s*/?>", "\n", chunk, flags=re.I)
    chunk = re.sub(r"</p>", "\n", chunk, flags=re.I)
    chunk = re.sub(r"<[^>]+>", "", chunk)
    chunk = chunk.replace("&#8211;", "–").replace("&amp;", "&").replace("&nbsp;", " ")
    chunk = re.sub(r"\n{3,}", "\n\n", chunk)
    return chunk.strip()


def parse_product(html: str, spec: dict) -> dict:
    serial_m = SERIAL_RE2.search(html)
    sku = (serial_m.group(1).strip() if serial_m else "")
    attr = ATTR_RE.search(html)
    color = attr.group(1).strip() if attr else ""
    material_en = attr.group(2).strip() if attr else ""
    dims = []
    block = html
    m_ul = re.search(r"<ul class='product-dimensions'>([\s\S]+?)</ul>", html)
    if m_ul:
        for label, value in DIM_RE.findall(m_ul.group(1)):
            dims.append({"label": label.strip().rstrip(":"), "value": value.strip()})
    resources = []
    res_html = ""
    m_res = re.search(r"<div class='product-resources'>([\s\S]+?)</div>\s*</div>", html)
    if m_res:
        res_html = m_res.group(1)
    for href, inner in RESOURCE_RE.findall(res_html or html):
        label = html_text(inner)
        label = re.sub(r"\s+", " ", label).strip()
        if not label or label.lower() in {"sign in", "sign in to download product materials"}:
            continue
        resources.append({"label": label, "href": href})
    gallery = []
    seen = set()
    sku_l = spec["expectedSku"].lower()
    for tag in IMG_TAG.findall(html):
        if "attachment-large" not in tag:
            continue
        src_m = re.search(r'\bsrc="([^"]+)"', tag)
        if not src_m:
            continue
        full = strip_size(src_m.group(1))
        if full in seen:
            continue
        if sku_l not in Path(full).name.lower():
            continue
        seen.add(full)
        gallery.append(full)
    glbs = list(dict.fromkeys(GLB_RE.findall(html)))
    desc_html = ""
    dm = DESC_RE.search(html)
    if dm:
        desc_html = dm.group(1)
    return {
        "sku": sku,
        "color": color,
        "materialEn": material_en,
        "dimensionsRaw": dims,
        "resources": resources,
        "gallery": gallery,
        "glbs": glbs,
        "descriptionHtml": desc_html,
        "descriptionText": html_text(desc_html),
        "locked": "resources-files locked" in html,
    }


def dim_sv(label: str) -> str:
    table = {
        "Length (m)": "Längd",
        "Width (m)": "Bredd",
        "Height (m)": "Höjd",
        "Area of the safety zone (m²)": "Säkerhetsområde",
        "Perimeter of the safety zone (m)": "Säkerhetsområdets omkrets",
        "Maximum fall height (m)": "Maximal fallhöjd",
        "Users": "Antal användare",
        "User age (min-max)": "Rekommenderad ålder",
    }
    return table.get(label, label)


def fmt_m(value: str, unit: str) -> str:
    v = value.replace(",", ".")
    if unit == "m²":
        return f"{value.replace('.', ',')} m²"
    if unit == "m":
        return f"{value.replace('.', ',')} m"
    return value


def swedish_copy(spec: dict, parsed: dict) -> dict:
    sku = parsed["sku"]
    name = spec["originalName"]
    dims = {d["label"]: d["value"] for d in parsed["dimensionsRaw"]}
    length = dims.get("Length (m)", "")
    width = dims.get("Width (m)", "")
    height = dims.get("Height (m)", "")
    safety = dims.get("Area of the safety zone (m²)", "")
    peri = dims.get("Perimeter of the safety zone (m)", "")
    fall = dims.get("Maximum fall height (m)", "")
    users = dims.get("Users", "")
    age = dims.get("User age (min-max)", "") or dims.get("User age (min-max)", "")
    for d in parsed["dimensionsRaw"]:
        if "age" in d["label"].lower():
            age = d["value"]

    color = parsed["color"]
    color_sv = {"Orange": "Orange", "Grey": "Grå", "Gray": "Grå"}.get(color, color)

    if spec["key"] == "runner":
        summary = (
            f"Utegymredskap Runner för gång- och löpliknande rörelse i underkroppen, "
            f"en användare, ålder {age}."
        )
        function = (
            "Runner är ett redskap för underkroppen. Rörelsen efterliknar gång eller löpning "
            "utan att belasta lederna hårt. NOVUM anger att den mjuka, pendlande benrörelsen "
            "stödjer kondition, koordination och muskulatur i ben och höfter. Handtag och "
            "stabil stomme ska ge stöd under övningen. Redskapet är avsett för utegym och "
            "aktivitetsytor utomhus."
        )
        material = (
            "Bärande stolpar av fyrkantsprofil 100 × 100 mm i stål S235. Rörliga delar i stål. "
            "Handtag i stål. Steg av halkfri plåt. Kompletterande detaljer i rostfritt stål. "
            "Förband väder- och UV-beständiga. Stål galvaniserat och pulverlackerat."
        )
        mounting = [
            "Gjutning mot betongfundament.",
            "Fundament enligt monteringsanvisning.",
        ]
        gaps = []
        contradiction = None
    else:
        summary = (
            f"Fristående utegymredskap Airwalker för en användare, ålder {age}."
        )
        function = (
            "Airwalker är ett fristående utegymredskap för en person. "
            "NOVUM:s engelska produktsida återanvänder här en text som beskriver Runner, "
            "inte Airwalker. Funktionspåståenden från den texten tas inte med. "
            "Verifierade uppgifter är mått, säkerhetsområde, fallhöjd, antal användare, "
            "ålder, material stål och visad kulör."
        )
        material = "Stål (enligt produktsidan). Ytbehandling och infästning framgår av dokument, inte av den felaktiga löptexten."
        mounting = []
        gaps = [
            "Funktionsbeskrivningen på novum4kids.com/product/airwalker/ nämner Runner och är inte verifierad för Airwalker.",
            "Ingen materialspecifikation i löptexten på Airwalker-sidan.",
        ]
        contradiction = (
            "Airwalker 4403Z har en produkttext som inleds med “The Runner is a device…”. "
            "Texten används inte som Airwalkers funktion."
        )

    dimension_rows = []
    for d in parsed["dimensionsRaw"]:
        lab = d["label"]
        val = d["value"]
        sv = dim_sv(lab)
        if "m²" in lab:
            dimension_rows.append({"label": sv, "value": fmt_m(val, "m²")})
        elif "(m)" in lab or "height" in lab.lower() or "length" in lab.lower() or "width" in lab.lower() or "fall" in lab.lower() or "perimeter" in lab.lower():
            dimension_rows.append({"label": sv, "value": fmt_m(val, "m")})
        else:
            dimension_rows.append({"label": sv, "value": val})

    description = f"{function}\n\n{material}"
    if spec["key"] == "runner":
        description += "\n\nSatsen enligt NOVUM: 1 × Runner."

    return {
        "name": f"Utegym {name}",
        "summary": summary,
        "description": description,
        "function": function,
        "material": material if spec["key"] == "runner" else "Stål",
        "colorSv": color_sv,
        "colorEn": color,
        "dimensions": dimension_rows,
        "safetyZoneArea": fmt_m(safety, "m²") if safety else None,
        "safetyZonePerimeter": fmt_m(peri, "m") if peri else None,
        "fallHeight": fmt_m(fall, "m") if fall else None,
        "users": users or None,
        "ageRange": age or None,
        "mounting": mounting,
        "gaps": gaps,
        "contradiction": contradiction,
        "length": length,
        "width": width,
        "height": height,
    }


def save_file(
    index: list,
    sku: str,
    slug: str,
    kind: str,
    type_label: str,
    source_url: str,
    original_name: str,
    payload: bytes,
    n: int,
    extra: dict | None = None,
) -> dict:
    fid = file_id(SUPPLIER, sku, original_name, source_url)
    stored = storage_name(sku, type_label, original_name, n)
    dest_dir = STORAGE / sku
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / stored
    dest.write_bytes(payload)
    rec = {
        "id": fid,
        "supplier": SUPPLIER,
        "sku": sku,
        "productSlug": slug,
        "kind": kind,
        "typeLabel": type_label,
        "format": ext_of(original_name),
        "access": ACCESS_DEFAULT,
        "originalName": original_name,
        "storageName": stored,
        "relPath": f"novum/{sku}/{stored}",
        "sourceUrl": source_url,
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "fetchedAt": FETCHED_AT,
        **(extra or {}),
    }
    index.append(rec)
    return rec


def drive_url(url: str) -> str:
    m = DRIVE_ID.search(url)
    if not m:
        return url
    return f"https://drive.google.com/uc?export=download&id={m.group(1)}"


def download(op: urllib.request.OpenerDirector, url: str) -> tuple[bytes, str, str, str]:
    if not url or url.strip() in {"#", ""}:
        raise ValueError("empty url")
    url = drive_url(url)
    final, body, ctype, cdisp = request(op, url)
    # Large Drive files sometimes return an HTML confirm page.
    head = body[:200].lstrip().lower()
    if head.startswith(b"<") or head.startswith(b"<!doctype"):
        text = body.decode("utf-8", "replace")
        conf = re.search(r"confirm=([A-Za-z0-9_-]+)", text)
        fid = re.search(r"id=([A-Za-z0-9_-]+)", url)
        if conf and fid:
            retry = f"https://drive.google.com/uc?export=download&id={fid.group(1)}&confirm={conf.group(1)}"
            final, body, ctype, cdisp = request(op, retry)
    return body, final, ctype, disposition_name(cdisp)


def disposition_name(header: str) -> str:
    if not header:
        return ""
    m = re.search(r'filename\*=UTF-8\'\'([^;]+)|filename="([^"]+)"|filename=([^;]+)', header, re.I)
    if not m:
        return ""
    raw = urllib.parse.unquote((m.group(1) or m.group(2) or m.group(3) or "").strip())
    return Path(raw).name


def other_sku_in_name(name: str, sku: str) -> str | None:
    known = {p["expectedSku"].lower() for p in PRODUCTS}
    blob = name.lower()
    for other in known:
        if other != sku.lower() and other in blob:
            return other.upper() if other.upper() in name else other
    return None


def filename_from(url: str, ctype: str, original_hint: str | None = None) -> str:
    if original_hint:
        return Path(original_hint).name
    name = Path(urllib.parse.unquote(url.split("?")[0])).name
    if name and name not in {"", "/", "download", "uc"}:
        return name
    ext = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "model/gltf-binary": ".glb",
        "application/octet-stream": "",
    }.get(ctype.split(";")[0].strip(), "")
    return f"file{ext}"


def import_one(op: urllib.request.OpenerDirector, spec: dict, index: list) -> dict:
    print(f"Fetching {spec['originalName']} …")
    _, body, _, _ = request(op, spec["url"])
    html = body.decode("utf-8", "replace")
    parsed = parse_product(html, spec)
    sku = parsed["sku"]
    if sku != spec["expectedSku"]:
        raise RuntimeError(
            f"SKU mismatch for {spec['originalName']}: page has {sku!r}, expected {spec['expectedSku']!r}"
        )
    copy = swedish_copy(spec, parsed)
    gaps = list(copy["gaps"])
    images_meta = []
    docs_meta = []

    n_img = 0
    for url in parsed["gallery"]:
        n_img += 1
        payload, final, ctype, hint = download(op, url)
        original = hint or filename_from(final, ctype)
        if spec["expectedSku"].lower() not in original.lower():
            gaps.append(f"Hoppad bild vars filnamn inte innehåller {sku}: {original}")
            n_img -= 1
            continue
        kind = "drawing" if re.search(r"_(SV|TV)(\.|$)", original, re.I) else "studio"
        type_label = "Sidovy" if "_SV" in original else "Ovanvy" if "_TV" in original else "Produktbild"
        rec = save_file(index, sku, spec["slug"], kind, type_label, final, original, payload, n_img)
        images_meta.append(
            {
                "fileId": rec["id"],
                "alt": f"{copy['name']}, artikel {sku}",
                "kind": "detail" if kind == "drawing" else "studio",
                "originalName": original,
                "sourceUrl": final,
            }
        )

    n_doc = 0
    seen_src = set()
    seen_labels = set()
    for glb in parsed["glbs"]:
        if glb in seen_src:
            continue
        seen_src.add(glb)
        n_doc += 1
        payload, final, ctype, hint = download(op, glb)
        original = hint or filename_from(final, ctype)
        if spec["expectedSku"].lower() not in original.lower() and spec["expectedSku"].lower() not in glb.lower():
            gaps.append(f"3D-fil utan artikelnummer i namnet: {original}")
        rec = save_file(index, sku, spec["slug"], "cad", "3D-modell", final, original, payload, n_doc)
        docs_meta.append(
            {
                "fileId": rec["id"],
                "title": original,
                "typeLabel": "3D-modell",
                "format": rec["format"],
                "kind": "cad",
                "access": ACCESS_DEFAULT,
                "originalName": original,
                "sourceUrl": final,
                "appliesTo": f"Artikel {sku}",
            }
        )

    for res in parsed["resources"]:
        href = res["href"].strip()
        label = res["label"]
        if href in {"#", "", "javascript:void(0)"}:
            gaps.append(f"Resources-länk utan fil efter inloggning: {label}")
            continue
        if href in seen_src:
            continue
        if label in seen_labels:
            continue
        seen_labels.add(label)
        abs_url = urllib.parse.urljoin(spec["url"], href)
        seen_src.add(abs_url)
        kind, type_label, _fmt = classify_resource(label, abs_url)
        try:
            payload, final, ctype, hint = download(op, abs_url)
        except Exception:
            gaps.append(f"Kunde inte hämta Resource “{label}”.")
            continue
        original = hint or filename_from(final, ctype)
        other = other_sku_in_name(original, sku)
        if other:
            gaps.append(f"Resource “{label}” heter {original} och tillhör {other} — kopplades inte.")
            continue
        if spec["expectedSku"].lower() not in original.lower() and spec["expectedSku"].lower() not in final.lower():
            # Still attach: the file sat on this product's Resources after SKU check.
            pass
        n_doc += 1
        rec = save_file(index, sku, spec["slug"], kind, type_label, final, original, payload, n_doc)
        docs_meta.append(
            {
                "fileId": rec["id"],
                "title": original,
                "typeLabel": type_label,
                "format": rec["format"],
                "kind": kind,
                "access": ACCESS_DEFAULT,
                "originalName": original,
                "sourceUrl": final,
                "appliesTo": f"Artikel {sku} · {label}",
            }
        )

    if not any(d["kind"] == "mounting" for d in docs_meta):
        gaps.append("Ingen monteringsanvisning i Resources efter inloggning.")
    if not any(d["kind"] == "datasheet" for d in docs_meta):
        gaps.append("Inget produktblad i Resources efter inloggning.")

    return {
        "slug": spec["slug"],
        "name": copy["name"],
        "originalName": spec["originalName"],
        "sku": sku,
        "manufacturer": SUPPLIER,
        "visibility": "internal_preview",
        "quoteOnRequest": True,
        "quoteShowsSku": True,
        "sourceUrl": spec["url"],
        "fetchedAt": FETCHED_AT,
        "category": "Lek och aktivitet",
        "categorySlug": "lek-aktivitet",
        "subcategory": "Utegym",
        "subcategorySlug": "utegym",
        "summary": copy["summary"],
        "description": copy["description"],
        "deviceFunction": copy["function"],
        "material": copy["material"],
        "colors": [{"name": copy["colorSv"]}],
        "colorLegend": "Kulör",
        "dimensions": copy["dimensions"],
        "safetyZoneArea": copy["safetyZoneArea"],
        "safetyZonePerimeter": copy["safetyZonePerimeter"],
        "fallHeight": copy["fallHeight"],
        "users": copy["users"],
        "ageRange": copy["ageRange"],
        "mounting": copy["mounting"],
        "standards": [],
        "images": images_meta,
        "documents": docs_meta,
        "related": [],
        "gaps": gaps,
        "contradiction": copy["contradiction"],
        "lockedBeforeLogin": parsed["locked"],
        "wpId": spec["wpId"],
    }


def main() -> None:
    load_env()
    email, password = credentials()
    STORAGE.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    GEN.mkdir(parents=True, exist_ok=True)
    op = opener()
    login(op, email, password)
    index: list = []
    series = []
    for spec in PRODUCTS:
        row = import_one(op, spec, index)
        series.append(row)
        print(
            f"  {row['originalName']} sku={row['sku']} images={len(row['images'])} docs={len(row['documents'])} gaps={len(row['gaps'])}"
        )
        time.sleep(0.3)
    payload = {
        "fetchedAt": FETCHED_AT,
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "scope": "test-import",
        "categorySource": "https://novum4kids.com/fitness-devices/?per_page=60",
        "note": "Only Runner and Airwalker. Remaining Fitness Devices are not imported.",
        "series": series,
    }
    (GEN / "novum-series.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    INDEX_PATH.write_text(json.dumps({"files": index, "fetchedAt": FETCHED_AT}, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {GEN / 'novum-series.json'} and {INDEX_PATH} ({len(index)} files).")


if __name__ == "__main__":
    main()
