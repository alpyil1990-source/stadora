#!/usr/bin/env python3
"""Log in to streetpark.eu and attach gated CAD / datasheet / anchoring files.

Credentials come from STREETPARK_USER and STREETPARK_PASSWORD. They are never
written to the catalog JSON or this repository.
"""

from __future__ import annotations

import hashlib
import http.cookiejar
import json
import os
import re
import runpy
import shutil
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path
from urllib.parse import quote, unquote, urljoin, urlparse, urlsplit, urlunsplit

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DOC_ROOT = PUBLIC / "docs" / "streetpark"
GEN = ROOT / "src" / "data" / "generated"
SERIES_PATH = GEN / "streetpark-series.json"
GATED_PATH = GEN / "streetpark-gated.json"
CACHE = Path("/tmp/streetpark")
AUTH_CACHE = CACHE / "auth-products"
FETCHED_AT = date.today().isoformat()
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"
BASE = "https://www.streetpark.eu"
POSTID_RE = re.compile(r"postid-(\d+)")
EXT_RE = re.compile(r"\.([a-z0-9]{2,5})(?:\?|#|$)", re.I)
SKIP_LABELS = {"log in", "register", "log out", "logout", "download"}
INNER_KEEP = {".dwg", ".dxf"}
INNER_PDF = {".pdf"}
CAD_FMT = {"RAR", "ZIP", "DWG", "DXF", "STEP", "STP", "IGS", "IGES", "3DS", "SKP"}
IMAGE_FMT = {"JPG", "JPEG", "PNG", "WEBP", "GIF"}


def encode_iri(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/-_.~")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def abs_url(href: str) -> str:
    href = href.strip()
    if href.startswith("//"):
        return "https:" + href
    return urljoin(BASE + "/", href)


def fold(text: str) -> str:
    nfd = unicodedata.normalize("NFD", text or "")
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn").lower()


def basename(url: str) -> str:
    name = unquote(urlparse(url.split("?")[0].split("#")[0]).path.rsplit("/", 1)[-1])
    return name or "file"


def file_stem_name(name: str) -> str:
    """Sanitize a local filename without treating ';' as a URL separator."""
    base = Path(name).name
    return re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip("-.") or "file"


def ext_of(url_or_name: str) -> str:
    suffix = Path(str(url_or_name).split("?")[0]).suffix.lower().lstrip(".")
    if suffix:
        return suffix.upper().replace("JPEG", "JPG")
    m = EXT_RE.search(url_or_name.lower())
    return (m.group(1) if m else "").upper().replace("JPEG", "JPG")


def is_gated_href(href: str | None) -> bool:
    if not href:
        return True
    h = href.strip()
    return h in {"#", "", "javascript:void(0)"} or h.startswith("javascript:")


def safe_name(url_or_name: str, used: set[str]) -> str:
    name = basename(url_or_name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name)
    if not name or name in {".", "-"}:
        name = "file"
    if name in used:
        stem, _, ext = name.rpartition(".")
        digest = hashlib.sha1(url_or_name.encode()).hexdigest()[:6]
        name = f"{stem or 'file'}-{digest}.{ext}" if ext else f"{name}-{digest}"
    used.add(name)
    return name


def classify(label: str, url: str, fmt: str | None = None) -> tuple[str, str]:
    t = fold(label or "")
    u = fold(url or "")
    blob = f"{t} {u}"
    ext = (fmt or ext_of(url) or "").upper().replace("JPEG", "JPG")
    image_ext = ext in IMAGE_FMT
    cad_ext = ext in CAD_FMT
    if "sampler" in t or (t.startswith("material") and ext == "PDF"):
        return "material", "Materialprov"
    if "warranty" in t or "guarantee" in t or "maintenance" in t:
        return "warranty", "Garanti och underhåll"
    if "anchor" in blob or "kotveni" in blob:
        return "anchoring", "Förankringsanvisning"
    if any(w in t for w in ("assembl", "mounting", "installation", "install ")):
        return "mounting", "Monteringsanvisning"
    if any(w in blob for w in ("data sheet", "datasheet", "product sheet", "catalogue sheet", "catalog sheet", "size table", "schema typu")):
        if "size table" in blob or "schema typu" in blob:
            return "datasheet", "Storlekstabell"
        return "datasheet", "Produktblad"
    if "2d" in blob or "drawing" in blob:
        return "drawing", "Måttritning"
    if "perspective" in blob or ("3d" in blob and image_ext):
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


_CODE_RX: dict[str, re.Pattern[str]] = {}


def token_rx(code: str) -> re.Pattern[str]:
    cached = _CODE_RX.get(code)
    if cached:
        return cached
    alts = {code, code.replace(" ", "-"), code.replace(" ", "_"), code.replace(" ", "")}
    rx = re.compile(r"(?:^|[^A-Za-z0-9])(?:" + "|".join(re.escape(a) for a in alts) + r")(?:[^A-Za-z0-9]|$)", re.I)
    _CODE_RX[code] = rx
    return rx


def codes_in_title(title: str, size_names: list[str]) -> list[str]:
    found: list[str] = []
    for code in sorted(size_names, key=len, reverse=True):
        if not token_rx(code).search(title):
            continue
        compact = code.replace(" ", "").lower()
        if any(compact != f.replace(" ", "").lower() and compact in f.replace(" ", "").lower() for f in found):
            continue
        found.append(code)
    return found


def match_variant(label: str, url: str, section: str | None, size_names: list[str]) -> str | None:
    blob = f"{label} {basename(url)} {section or ''}"
    ordered = sorted(size_names, key=len, reverse=True)
    hits = []
    for code in ordered:
        if re.search(rf"(^|[^A-Za-z0-9]){re.escape(code)}([^A-Za-z0-9]|$)", blob, re.I):
            hits.append(code)
    if len(hits) == 1:
        return hits[0]
    if section:
        sec = section.strip()
        for code in ordered:
            if sec.lower() == code.lower():
                return code
        sec_hits = [c for c in ordered if c.lower() in sec.lower()]
        if len(sec_hits) == 1:
            return sec_hits[0]
    if hits:
        return hits[0]
    return section.strip() if section and section.strip() in size_names else (section.strip() if section else None)


def login(opener: urllib.request.OpenerDirector, user: str, password: str) -> None:
    data = urllib.parse.urlencode(
        {
            "userName": user,
            "userPassword": password,
            "dologin": "1",
            "afterLogin": f"{BASE}/en/",
        }
    ).encode()
    req = urllib.request.Request(
        f"{BASE}/en/",
        data=data,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,*/*",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    with opener.open(req, timeout=60) as resp:
        html = resp.read()
    if b"Log out" not in html and b"logged-in" not in html:
        raise SystemExit("STREETPARK-inloggningen misslyckades. Inga filer hämtades.")


def fetch(opener: urllib.request.OpenerDirector, url: str, dest: Path | None = None, retries: int = 4) -> bytes:
    last: Exception | None = None
    headers = {"User-Agent": UA, "Accept": "*/*"}
    for i in range(retries):
        try:
            req = urllib.request.Request(encode_iri(url), headers=headers)
            with opener.open(req, timeout=180) as resp:
                data = resp.read()
            if dest:
                dest.parent.mkdir(parents=True, exist_ok=True)
                tmp = dest.with_suffix(dest.suffix + ".part")
                tmp.write_bytes(data)
                tmp.replace(dest)
            return data
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(1.2 * (i + 1))
    raise RuntimeError(f"Failed {url}: {last}") from last


def parse_post_id(html: str) -> str | None:
    m = POSTID_RE.search(html)
    return m.group(1) if m else None


def parse_product_files(html: str, size_names: list[str]) -> tuple[list[dict], list[dict]]:
    soup = BeautifulSoup(html, "lxml")
    files: list[dict] = []
    gated: list[dict] = []
    detail = soup.select_one(".single-product-detail") or soup
    for body in detail.select(".models-files .files-body"):
        title = body.select_one(".title")
        raw = title.get_text(" ", strip=True) if title else ""
        section = re.sub(r"\s*-\s*Files to download.*$", "", raw, flags=re.I).strip()
        for a in body.select("a[href]"):
            label = (a.get_text(" ", strip=True) or a.get("title") or "").strip()
            if not label or label.lower() in SKIP_LABELS:
                continue
            href = a.get("href") or ""
            if is_gated_href(href) or "login-area" in (a.get("onclick") or ""):
                gated.append({"name": label, "variant": section or None})
                continue
            file_url = abs_url(href)
            variant = match_variant(label, file_url, section, size_names)
            kind, type_label = classify(label, file_url)
            files.append(
                {
                    "label": label,
                    "sourceUrl": file_url,
                    "variant": variant,
                    "kind": kind,
                    "typeLabel": type_label,
                    "format": ext_of(file_url) or "FIL",
                }
            )
    return files, gated


def parse_download_cards(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    out: list[dict] = []
    for card in soup.select(".product-card.file-card"):
        model = card.get("data-model")
        product_id = card.get("data-product")
        a = card.select_one("a.link")
        name_el = card.select_one("h3.name .regular") or card.select_one("h3.name")
        label = (name_el.get_text(" ", strip=True) if name_el else "") or (a.get("title") if a else "") or ""
        href = a.get("href") if a else None
        if not label:
            continue
        if is_gated_href(href) or (a and "login-area" in (a.get("onclick") or "")):
            continue
        file_url = abs_url(href)
        kind, type_label = classify(label, file_url)
        out.append(
            {
                "label": label,
                "sourceUrl": file_url,
                "variant": model,
                "productId": product_id,
                "kind": kind,
                "typeLabel": type_label,
                "format": ext_of(file_url) or "FIL",
            }
        )
    return out


def collapse_series_files(files: list[dict], size_names: list[str]) -> list[dict]:
    by_url: dict[str, list[dict]] = defaultdict(list)
    for f in files:
        by_url[f["sourceUrl"]].append(f)
    sizes = {s for s in size_names if s}
    out: list[dict] = []
    for group in by_url.values():
        variants = {g.get("variant") for g in group if g.get("variant")}
        if sizes and len(group) > 1 and variants >= sizes:
            base = dict(group[0])
            base["variant"] = None
            base["appliesTo"] = "Gäller serien enligt STREETPARKs nedladdning."
            out.append(base)
            continue
        seen: set[tuple] = set()
        for g in group:
            key = (g["sourceUrl"], g.get("variant"), g.get("label"))
            if key in seen:
                continue
            seen.add(key)
            out.append(g)
    return out


def download_one(url: str, dest: Path) -> dict:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        return {"url": url, "path": str(dest), "bytes": dest.stat().st_size, "cached": True}
    tmp = dest.with_suffix(dest.suffix + ".part")
    req = urllib.request.Request(encode_iri(url), headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = resp.read()
    tmp.write_bytes(data)
    tmp.replace(dest)
    return {"url": url, "path": str(dest), "bytes": len(data), "cached": False}


def extract_inners(archive: Path, dest_dir: Path, used: set[str], parent: dict) -> list[dict]:
    if archive.suffix.lower() not in {".rar", ".zip"}:
        return []
    tmp = Path(tempfile.mkdtemp(prefix="sp-extract-"))
    try:
        proc = subprocess.run(
            ["unar", "-quiet", "-force-overwrite", "-output-directory", str(tmp), str(archive)],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode != 0:
            return []
        keep: list[Path] = []
        want_pdf = parent.get("kind") == "anchoring"
        for path in tmp.rglob("*"):
            if not path.is_file():
                continue
            suf = path.suffix.lower()
            if suf in INNER_KEEP or (want_pdf and suf in INNER_PDF):
                keep.append(path)
        extras: list[dict] = []
        for path in keep:
            name = file_stem_name(path.name)
            if name in used:
                stem = Path(name).stem
                suf = Path(name).suffix
                name = f"{stem}-{hashlib.sha1(path.name.encode()).hexdigest()[:6]}{suf}"
            used.add(name)
            target = dest_dir / name
            if not target.exists() or target.stat().st_size == 0:
                shutil.copy2(path, target)
            fmt = (path.suffix or "").lstrip(".").upper().replace("JPEG", "JPG") or ext_of(name)
            kind, type_label = classify(path.name, str(target), fmt)
            if parent.get("kind") == "anchoring" and fmt == "PDF":
                kind, type_label = "anchoring", "Förankringsanvisning"
            extras.append(
                {
                    "title": path.name,
                    "typeLabel": type_label,
                    "format": fmt,
                    "kind": kind,
                    "sourceUrl": parent["sourceUrl"],
                    "publicPath": f"/docs/streetpark/{dest_dir.name}/{name}",
                    "variant": parent.get("variant"),
                    "appliesTo": f"Fil från STREETPARK-arkivet {archive.name}.",
                    "extracted": True,
                }
            )
        return extras
    except Exception:  # noqa: BLE001
        return []
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def recount(series: list[dict]) -> dict:
    kinds: dict[str, int] = {}
    formats: dict[str, int] = {}
    dwg = 0
    for row in series:
        for d in row.get("documents") or []:
            kinds[d.get("kind") or "other"] = kinds.get(d.get("kind") or "other", 0) + 1
            fmt = d.get("format") or "FIL"
            formats[fmt] = formats.get(fmt, 0) + 1
            if fmt in {"DWG", "DXF"}:
                dwg += 1
    return {
        "documents": sum(len(r.get("documents") or []) for r in series),
        "docKinds": kinds,
        "docFormats": formats,
        "dwgOrDxf": dwg,
    }


def polish_attached_docs(series: list[dict]) -> list[dict]:
    sku_owner: dict[str, set[str]] = defaultdict(set)
    sizes_by: dict[str, list[str]] = {}
    for row in series:
        names = [s.get("name") for s in row.get("sizes") or [] if s.get("name")]
        sizes_by[row["slug"]] = names
        for n in names:
            sku_owner[n].add(row["slug"])

    gaps: list[dict] = []
    for row in series:
        local = sizes_by[row["slug"]]
        foreign = [code for code, slugs in sku_owner.items() if row["slug"] not in slugs]
        other_names = [
            o.get("modelName") or ""
            for o in series
            if o["slug"] != row["slug"] and (o.get("modelName") or "") and len(o.get("modelName") or "") >= 4
        ]
        own_name = fold(row.get("modelName") or "")
        new_docs: list[dict] = []
        seen: set[tuple] = set()
        for d in row.get("documents") or []:
            href = d.get("href") or ""
            disk = PUBLIC / href.lstrip("/") if href else None
            if href and (not disk or not disk.exists()):
                continue
            if disk and disk.name.endswith(".STP5"):
                dest = disk.with_name("STP5-STP9-KOTVENI.pdf")
                if not dest.exists():
                    disk.rename(dest)
                elif disk != dest:
                    disk.unlink(missing_ok=True)
                d["href"] = f"/docs/streetpark/{row['slug']}/{dest.name}"
                d["format"] = "PDF"
                disk = dest
            if disk and disk.is_file():
                real_fmt = ext_of(disk.name)
                if real_fmt:
                    d["format"] = real_fmt
            kind, type_label = classify(d.get("title") or "", d.get("href") or "", d.get("format"))
            d["kind"] = kind
            d["typeLabel"] = type_label
            d["previewable"] = (d.get("format") or "") in IMAGE_FMT

            title = d.get("title") or Path(href).name
            href_base = Path(href).name
            local_hits = codes_in_title(f"{title} {href_base}", local)
            foreign_hits = codes_in_title(f"{title} {href_base}", foreign)
            href_local = codes_in_title(href_base, local)
            href_foreign = codes_in_title(href_base, foreign)
            extracted = (d.get("appliesTo") or "").startswith("Fil från")
            name_clash = False
            if href_base:
                for mn in other_names:
                    if fold(mn) in {"vega"}:
                        continue
                    if token_rx(mn).search(href_base) and not (row.get("modelName") and token_rx(row["modelName"]).search(href_base)):
                        name_clash = True
                        break
            mismatch = (href_foreign and not href_local) or (foreign_hits and not local_hits) or name_clash
            if mismatch:
                intended_local = codes_in_title(title, local) or (d.get("variant") in local)
                if intended_local and (name_clash or (href_foreign and not href_local)):
                    gaps.append(
                        {
                            "product": row["name"],
                            "slug": row["slug"],
                            "name": title,
                            "sourceUrl": d.get("sourceUrl") or href,
                            "variant": d.get("variant"),
                            "fetchedAt": FETCHED_AT,
                            "reason": "supplier-file-mismatch",
                        }
                    )
                continue
            if local_hits:
                variants = local_hits
            elif d.get("variant") in local:
                variants = [d["variant"]]
            else:
                variants = [None]

            for var in variants:
                copy = dict(d)
                if var:
                    copy["variant"] = var
                else:
                    copy.pop("variant", None)
                key = (copy.get("href"), copy.get("variant"), copy.get("title"))
                if key in seen:
                    continue
                seen.add(key)
                new_docs.append(copy)
        # Same inner file can be extracted from several archives; keep one per title+variant+format.
        collapsed: list[dict] = []
        best: dict[tuple, dict] = {}
        for d in new_docs:
            key = (fold(d.get("title") or ""), d.get("variant"), d.get("format"), d.get("kind"))
            href = d.get("href") or ""
            hashed = bool(re.search(r"-[a-f0-9]{6}\.[A-Za-z0-9]+$", href))
            size = 0
            disk = PUBLIC / href.lstrip("/")
            if disk.exists():
                size = disk.stat().st_size
            prev = best.get(key)
            if prev is None:
                best[key] = d
                continue
            prev_href = prev.get("href") or ""
            prev_hashed = bool(re.search(r"-[a-f0-9]{6}\.[A-Za-z0-9]+$", prev_href))
            prev_size = 0
            prev_disk = PUBLIC / prev_href.lstrip("/")
            if prev_disk.exists():
                prev_size = prev_disk.stat().st_size
            if (hashed, -size) < (prev_hashed, -prev_size):
                best[key] = d
        row["documents"] = list(best.values())
    return gaps


def to_doc(row: dict, public_path: str, extra: dict | None = None) -> dict:
    fmt = row.get("format") or ext_of(row.get("sourceUrl") or public_path) or "FIL"
    kind, type_label = classify(row.get("label") or row.get("title") or "", row.get("sourceUrl") or public_path, fmt)
    doc = {
        "title": row.get("title") or row.get("label") or Path(public_path).name,
        "typeLabel": row.get("typeLabel") or type_label,
        "format": fmt,
        "href": public_path,
        "sourceUrl": row["sourceUrl"],
        "fetchedAt": FETCHED_AT,
        "kind": row.get("kind") or kind,
        "previewable": fmt in IMAGE_FMT,
    }
    if row.get("variant"):
        doc["variant"] = row["variant"]
    if row.get("appliesTo"):
        doc["appliesTo"] = row["appliesTo"]
    if extra:
        doc.update(extra)
    return doc


def main() -> None:
    user = os.environ.get("STREETPARK_USER", "").strip()
    password = os.environ.get("STREETPARK_PASSWORD", "")
    if not user or not password:
        raise SystemExit("Set STREETPARK_USER and STREETPARK_PASSWORD in the environment.")

    series_doc = json.loads(SERIES_PATH.read_text())
    series: list[dict] = series_doc["series"]
    AUTH_CACHE.mkdir(parents=True, exist_ok=True)
    DOC_ROOT.mkdir(parents=True, exist_ok=True)

    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    login(opener, user, password)
    print("logged in")

    download_html_path = CACHE / "auth-download.html"
    download_html = fetch(opener, f"{BASE}/en/download/", download_html_path)
    download_cards = parse_download_cards(download_html.decode("utf-8", "replace"))
    print("download cards with urls", len(download_cards))

    by_post: dict[str, list[dict]] = defaultdict(list)
    for card in download_cards:
        if card.get("productId"):
            by_post[str(card["productId"])].append(card)

    remaining_gated: list[dict] = []
    jobs: list[tuple[str, Path]] = []
    planned: dict[str, list[dict]] = {}
    used_names: dict[str, set[str]] = {}

    for row in series:
        slug = row["slug"]
        dest = AUTH_CACHE / f"{slug}.html"
        html = fetch(opener, row["sourceUrl"], dest).decode("utf-8", "replace")
        post_id = parse_post_id(html)
        size_names = [s.get("name") for s in row.get("sizes") or [] if s.get("name")]
        files, still_gated = parse_product_files(html, size_names)
        for g in still_gated:
            remaining_gated.append(
                {
                    "product": row["name"],
                    "slug": slug,
                    "name": g["name"],
                    "sourceUrl": row["sourceUrl"],
                    "variant": g.get("variant"),
                    "fetchedAt": FETCHED_AT,
                    "reason": "login-required",
                }
            )
        if post_id:
            existing_urls = {f["sourceUrl"] for f in files}
            for card in by_post.get(post_id, []):
                if card["sourceUrl"] in existing_urls:
                    continue
                variant = match_variant(card["label"], card["sourceUrl"], card.get("variant"), size_names)
                files.append({**card, "variant": variant})
                existing_urls.add(card["sourceUrl"])
        files = collapse_series_files(files, size_names)
        planned[slug] = files
        used_names[slug] = {Path(d["href"]).name for d in row.get("documents") or []}
        doc_dir = DOC_ROOT / slug
        doc_dir.mkdir(parents=True, exist_ok=True)
        have_urls = {d.get("sourceUrl") for d in row.get("documents") or []}
        existing_href_by_url = {
            d.get("sourceUrl"): PUBLIC / str(d.get("href", "")).lstrip("/")
            for d in row.get("documents") or []
            if d.get("sourceUrl") and d.get("href")
        }
        for f in files:
            if f["sourceUrl"] in have_urls and f.get("format") in IMAGE_FMT:
                continue
            existing_path = existing_href_by_url.get(f["sourceUrl"])
            if existing_path and existing_path.exists() and f.get("format") not in IMAGE_FMT:
                f["_dest"] = str(existing_path)
                f["_public"] = "/" + str(existing_path.relative_to(PUBLIC))
                continue
            name = safe_name(f["sourceUrl"], used_names[slug])
            f["_dest"] = str(doc_dir / name)
            f["_public"] = f"/docs/streetpark/{slug}/{name}"
            jobs.append((f["sourceUrl"], Path(f["_dest"])))
        print(f"  {slug}: {len(files)} files, still gated {len(still_gated)}")

    # unique download jobs
    uniq_jobs = {}
    for url, dest in jobs:
        uniq_jobs[(url, str(dest))] = (url, dest)
    job_list = list(uniq_jobs.values())
    print(f"Downloading {len(job_list)} files…")
    ok = fail = 0
    failed_urls: set[str] = set()
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(download_one, url, dest): (url, dest) for url, dest in job_list}
        for i, fut in enumerate(as_completed(futs), 1):
            url, dest = futs[fut]
            try:
                res = fut.result()
                ok += 1
                if i % 40 == 0:
                    print(f"  {i}/{len(job_list)} {dest.name} {res['bytes']}b")
            except Exception as exc:  # noqa: BLE001
                fail += 1
                failed_urls.add(url)
                print("FAIL", url, exc)

    extracted_n = 0
    dwg_n = 0
    for row in series:
        slug = row["slug"]
        doc_dir = DOC_ROOT / slug
        have = {(d.get("sourceUrl"), d.get("variant"), d.get("href")) for d in row.get("documents") or []}
        hrefs = {d.get("href") for d in row.get("documents") or []}
        added = []
        for f in planned.get(slug, []):
            dest = Path(f.get("_dest") or "")
            public = f.get("_public")
            if not public or not dest.exists() or dest.stat().st_size == 0:
                if f["sourceUrl"] in failed_urls:
                    remaining_gated.append(
                        {
                            "product": row["name"],
                            "slug": slug,
                            "name": f["label"],
                            "sourceUrl": f["sourceUrl"],
                            "variant": f.get("variant"),
                            "fetchedAt": FETCHED_AT,
                            "reason": "download-failed",
                        }
                    )
                continue
            key = (f["sourceUrl"], f.get("variant"), public)
            if public in hrefs or key in have:
                pass
            else:
                added.append(to_doc(f, public))
                hrefs.add(public)
            if dest.suffix.lower() in {".rar", ".zip"}:
                extras = extract_inners(dest, doc_dir, used_names[slug], f)
                for extra in extras:
                    if extra["publicPath"] in hrefs:
                        continue
                    extracted_n += 1
                    if extra["format"] in {"DWG", "DXF"}:
                        dwg_n += 1
                    added.append(
                        to_doc(
                            {
                                "title": extra["title"],
                                "label": extra["title"],
                                "typeLabel": extra["typeLabel"],
                                "format": extra["format"],
                                "kind": extra["kind"],
                                "sourceUrl": extra["sourceUrl"],
                                "variant": extra.get("variant"),
                                "appliesTo": extra.get("appliesTo"),
                            },
                            extra["publicPath"],
                        )
                    )
                    hrefs.add(extra["publicPath"])
        if added:
            row["documents"] = (row.get("documents") or []) + added

    polish_gaps = polish_attached_docs(series)
    remaining_gated.extend(polish_gaps)
    stats = recount(series)
    series_doc["counts"]["documents"] = stats["documents"]
    series_doc["counts"]["gated"] = len(remaining_gated)
    series_doc["counts"]["authDownloadOk"] = ok
    series_doc["counts"]["authDownloadFail"] = fail
    series_doc["counts"]["extractedFromArchives"] = extracted_n
    series_doc["counts"]["dwgOrDxf"] = stats["dwgOrDxf"]
    series_doc["counts"]["docKinds"] = stats["docKinds"]
    series_doc["counts"]["docFormats"] = stats["docFormats"]
    series_doc["fetchedAt"] = FETCHED_AT

    SERIES_PATH.write_text(json.dumps(series_doc, ensure_ascii=False, indent=2) + "\n")
    GATED_PATH.write_text(json.dumps({"fetchedAt": FETCHED_AT, "items": remaining_gated}, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(series_doc["counts"], indent=2))
    print("remaining gated", len(remaining_gated), "extracted", extracted_n, "new dwg listed", dwg_n)
    strip_public_datasheets()


def strip_public_datasheets() -> None:
    script = Path(__file__).with_name("strip-streetpark-datasheets.py")
    ns = runpy.run_path(str(script))
    ns["strip_all"]()


def polish_only() -> None:
    series_doc = json.loads(SERIES_PATH.read_text())
    gaps = polish_attached_docs(series_doc["series"])
    stats = recount(series_doc["series"])
    series_doc["counts"].update(stats)
    series_doc["counts"]["gated"] = len(gaps)
    SERIES_PATH.write_text(json.dumps(series_doc, ensure_ascii=False, indent=2) + "\n")
    GATED_PATH.write_text(json.dumps({"fetchedAt": FETCHED_AT, "items": gaps}, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(series_doc["counts"], indent=2))
    print("mismatch gaps", len(gaps))


if __name__ == "__main__":
    if "--polish-only" in sys.argv:
        polish_only()
    else:
        main()
