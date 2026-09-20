#!/usr/bin/env python3
"""Polish STREETPARK catalog: Swedish copy, sittmöbler, unicode retries, gated list."""

from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "src" / "data" / "generated"
PUBLIC = ROOT / "public"
SERIES = GEN / "streetpark-series.json"
GATED = GEN / "streetpark-gated.json"
PARSED = Path("/tmp/streetpark/parsed-products.json")
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"

SITT = {
    "parkbank-cube": ("Sittelement CUBE", "Sittelement"),
    "parkbank-bled": ("Sittelement BLED", "Sittelement"),
    "parkbank-audito": ("Sittmodul AUDITO", "Sittmodul"),
    "sitto-penta-islands": ("Sittö PENTA ISLANDS", "Sittö"),
}

SKIP_PARA = re.compile(
    r"(can be found|can also be found|can be seen|take a look|you can find|"
    r"stands out|fits perfectly|is installed at many|is named after|"
    r"is suitable for public parks \(for example|"
    r"is an excellent fit for transport|"
    r"are utilized, for example|"
    r"is popular among students|"
    r"has found its place|"
    r"complements public spaces in|"
    r"is used in front of|"
    r"development of this product was co-financed)",
    re.I,
)

PHRASES = [
    ("Ultra-High Performance Concrete", "UHPC-betong (Ultra-High Performance Concrete)"),
    ("high-strength concrete (HSC)", "höghållfast betong (HSC)"),
    ("High-strength concrete (HSC)", "Höghållfast betong (HSC)"),
    ("architectural concrete", "arkitektonisk betong"),
    ("exposed concrete", "exponerad betong"),
    ("Face concrete", "Fasbetong"),
    ("powder-coated baked paint finish", "pulverlack som härdats i ugn"),
    ("powder-coated baked paint", "pulverlack som härdats i ugn"),
    ("powder-firing varnish", "pulverlack som härdats i ugn"),
    ("treated with a powder coating", "pulverlackerad"),
    ("treated with powder coating", "pulverlackerad"),
    ("treated with powder-coating", "pulverlackerad"),
    ("powder-coated", "pulverlackerad"),
    ("powder coating", "pulverlackering"),
    ("hot-dip galvanized", "varmförzinkad"),
    ("hot-dip galvanised", "varmförzinkad"),
    ("galvanized steel", "galvaniserat stål"),
    ("galvanised steel", "galvaniserat stål"),
    ("stainless steel", "rostfritt stål"),
    ("cast iron", "gjutjärn"),
    ("aluminium alloy", "aluminiumlegering"),
    ("aluminum alloy", "aluminiumlegering"),
    ("compact boards", "kompaktlaminatskivor"),
    ("compact board", "kompaktlaminatskiva"),
    ("solid wooden lamellas", "massiva trälister"),
    ("solid wood slats", "massiva trälister"),
    ("solid wooden boards", "massiva träbrädor"),
    ("solid wood boards", "massiva träbrädor"),
    ("wooden lamellas", "trälister"),
    ("wooden boards", "träbrädor"),
    ("wooden slats", "trälister"),
    ("supporting structure", "bärande konstruktion"),
    ("load-bearing structure", "bärande konstruktion"),
    ("rubber sleeve", "gummihylsa"),
    ("rubber sleeves", "gummihylsor"),
    ("rubber strip", "gummiremsa"),
    ("rubber profile", "gummiprofil"),
    ("cigarette extinguisher", "fimpsläckare"),
    ("litter bin", "papperskorg"),
    ("waste bin", "avfallskärl"),
    ("ashtray", "askkopp"),
    ("bicycle stand", "cykelställ"),
    ("bike stand", "cykelställ"),
    ("barrier pillar", "pollare"),
    ("picnic set", "picknickgrupp"),
    ("park bench", "parkbänk"),
    ("public spaces", "offentliga miljöer"),
    ("public space", "offentlig miljö"),
    ("anchoring to the base", "förankring i underlaget"),
    ("anchored to the base", "förankrad i underlaget"),
    ("anchor plate", "förankringsplatta"),
    ("threaded rods", "gängstänger"),
    ("stainless steel screws", "rostfria skruvar"),
    ("stainless screws", "rostfria skruvar"),
    ("metric screws", "metriskgängstänger"),
    ("polypropylene container", "polypropenkärl"),
    ("galvanised container", "galvaniserat innerkärl"),
    ("galvanized container", "galvaniserat innerkärl"),
    ("removable container", "löstagbart innerkärl"),
    ("without backrest", "utan ryggstöd"),
    ("with backrest", "med ryggstöd"),
    ("wheelchair", "rullstol"),
    ("Douglas fir", "douglastall"),
    ("composite fibres", "kompositfibrer"),
    ("composite fibers", "kompositfibrer"),
    ("perforated sheet", "perforerad plåt"),
    ("sheet metal", "stålplåt"),
    ("below the ground level", "under marknivå"),
    ("below street level", "under gatunivå"),
    ("height-adjustable", "höjdjusterbara"),
    ("fold-down version", "fällbar variant"),
]


def encode_iri(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/-_.~")
    return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def translate(text: str | None) -> str:
    if not text:
        return ""
    out = text
    for src, dst in sorted(PHRASES, key=lambda x: len(x[0]), reverse=True):
        out = re.sub(re.escape(src), dst, out, flags=re.I)
    out = re.sub(r"[ \t]+", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    return out.strip()


def clean_blocks(en: str) -> str:
    blocks = [b.strip() for b in re.split(r"\n+", en or "") if b.strip()]
    kept = []
    for b in blocks:
        if SKIP_PARA.search(b):
            continue
        if len(b) < 8 and b in {".", ",", "-"}:
            continue
        kept.append(translate(b))
    return " ".join(kept)


def designer_sv(raw: str | None) -> str | None:
    if not raw:
        return None
    d = re.sub(r"^design\s+(by\s+)?", "", raw, flags=re.I).strip()
    if not d:
        return None
    return f"Formgivning: {d}."


def mounting_sv(en: str) -> list[str]:
    t = (en or "").lower()
    out: list[str] = []
    if "not anchored" in t or "does not have to be anchored" in t or "uses its own weight" in t:
        out.append("Fristående. Egenvikt enligt leverantören; förankring krävs inte.")
    if "possible pins" in t or "preventing it from" in t:
        out.append("Hål för pinnar som lägesfixerar enligt leverantören.")
    if "fold-down" in t:
        out.append("Fällbar variant enligt modell.")
    if "removable anchoring" in t:
        out.append("Fast eller löstagbar förankring enligt modell.")
    if "pre-cast" in t or "pre-concreted" in t or "threaded rod" in t:
        out.append("Förankring med gängstänger i gjutet fundament enligt STREETPARKs underlag.")
    if "wall" in t and "anchor" in t:
        out.append("Kan förankras i vägg enligt leverantören.")
    if "holes for anchoring" in t or "anchor plate" in t or "anchoring to the base" in t or "anchored to the base" in t:
        if not any("Förankr" in x or "förankr" in x for x in out):
            out.append("Förankras i underlaget enligt STREETPARKs underlag.")
    if "direct concreting" in t:
        out.append("Alternativt ingjutning enligt leverantören.")
    return out


def first_sentence(text: str, fallback: str) -> str:
    if not text:
        return fallback
    part = re.split(r"(?<=\.)\s+", text, maxsplit=1)[0].strip()
    if part and not part.endswith("."):
        part += "."
    return part or fallback


def build_copy(parsed: dict, series_row: dict) -> None:
    slug = parsed["slug"]
    en = parsed.get("descriptionEn") or ""
    mat_en = parsed.get("materialEn") or ""
    body = clean_blocks(en)
    material = translate(mat_en) if mat_en and len(mat_en.strip()) > 4 else None
    extra = designer_sv(parsed.get("designer"))
    bits = [body]
    if extra and extra not in body:
        bits.append(extra)
    bits.append("Tillverkare: STREETPARK.")
    desc = " ".join(b for b in bits if b)
    series_row["description"] = desc
    series_row["summary"] = first_sentence(desc, f"{series_row['name']} från STREETPARK.")
    series_row["material"] = material
    series_row["mounting"] = mounting_sv(en + " " + mat_en)
    for size in series_row.get("sizes") or []:
        if size.get("summary"):
            size["summary"] = translate(size["summary"])
    if slug in SITT:
        name, noun = SITT[slug]
        series_row["name"] = name
        series_row["subcategory"] = "Modulära sitt"
        series_row["subcategorySlug"] = "modulara-sitt"
        series_row["summary"] = first_sentence(desc, f"{name} från STREETPARK.")


def retry_unicode(series: list[dict], parsed: list[dict]) -> int:
    url_to_slug_size: dict[str, tuple[str, str | None]] = {}
    for p in parsed:
        for img in p.get("images") or []:
            url_to_slug_size[img["sourceUrl"]] = (p["slug"], img.get("size"))
    fails = []
    for p in parsed:
        have = {im["src"] for s in series if s["slug"] == p["slug"] for im in s["images"]}
        for img in p.get("images") or []:
            public_guess = None
            name = img["sourceUrl"].split("/")[-1]
            # if file missing on disk
            folder = PUBLIC / "images" / "streetpark" / p["slug"]
            candidates = list(folder.glob("*")) if folder.exists() else []
            names = {c.name for c in candidates}
            raw_name = name
            ascii_name = re.sub(r"[^A-Za-z0-9._-]+", "-", raw_name)
            if ascii_name not in names and raw_name not in names:
                fails.append((p["slug"], img["sourceUrl"], img.get("size"), img.get("alt") or ""))
    ok = 0
    for slug, url, size, alt in fails:
        dest_dir = PUBLIC / "images" / "streetpark" / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        fname = re.sub(r"[^A-Za-z0-9._-]+", "-", unquote(url.split("/")[-1]))
        dest = dest_dir / fname
        try:
            req = Request(encode_iri(url), headers={"User-Agent": UA})
            with urlopen(req, timeout=60) as resp:
                data = resp.read()
            dest.write_bytes(data)
            public = f"/images/streetpark/{slug}/{fname}"
            row = next(s for s in series if s["slug"] == slug)
            if not any(im["src"] == public for im in row["images"]):
                item = {
                    "src": public,
                    "alt": alt or f"{row['name']}, STREETPARK",
                    "kind": "studio",
                    "sourceUrl": url,
                    "fetchedAt": row.get("fetchedAt"),
                }
                if size:
                    item["size"] = size
                row["images"].append(item)
            ok += 1
            print("retry ok", slug, fname, len(data))
        except Exception as exc:  # noqa: BLE001
            print("retry fail", url, exc)
    return ok


def main() -> None:
    series_doc = json.loads(SERIES.read_text())
    parsed = json.loads(PARSED.read_text())
    by_slug = {p["slug"]: p for p in parsed}
    for row in series_doc["series"]:
        p = by_slug.get(row["slug"])
        if p:
            build_copy(p, row)
        else:
            print("missing parsed", row["slug"])

    sitt_slugs = [s for s in SITT]
    park = [s for s in series_doc["catalog"]["parkbankar"] if s not in sitt_slugs]
    series_doc["catalog"]["parkbankar"] = park
    series_doc["catalog"]["sitto"] = [s for s in sitt_slugs if any(r["slug"] == s for r in series_doc["series"])]

    retried = retry_unicode(series_doc["series"], parsed)

    gated = json.loads(GATED.read_text())
    seen = set()
    slim = []
    for item in gated.get("items") or []:
        if "/en/product/" not in (item.get("sourceUrl") or ""):
            continue
        key = (item.get("slug"), item.get("name"), item.get("variant"))
        if key in seen:
            continue
        seen.add(key)
        slim.append(item)
    gated["items"] = slim
    GATED.write_text(json.dumps(gated, ensure_ascii=False, indent=2) + "\n")

    still_en = [
        r["slug"]
        for r in series_doc["series"]
        if re.search(r"\b(the|and|with|from|which|this)\b", r["description"], re.I)
    ]
    series_doc["counts"]["gated"] = len(slim)
    series_doc["counts"]["images"] = sum(len(r["images"]) for r in series_doc["series"])
    series_doc["counts"]["englishLeftover"] = len(still_en)
    series_doc["counts"]["unicodeRetried"] = retried
    SERIES.write_text(json.dumps(series_doc, ensure_ascii=False, indent=2) + "\n")
    print("gated", len(slim), "english leftover", len(still_en), still_en[:12])
    print("sitto", series_doc["catalog"]["sitto"])
    print("parkbankar", len(series_doc["catalog"]["parkbankar"]))


if __name__ == "__main__":
    main()
