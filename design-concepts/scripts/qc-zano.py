#!/usr/bin/env python3
"""Quality-control pass over the imported ZANO catalogue.

Completes stub copy from verified English product pages/docs, marks English
files, fills per-model configurators, and records remaining concrete gaps.
Does not alter original supplier files. Does not import Övrigt or picnic-set
landing pages.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

spec = importlib.util.spec_from_file_location("zano_import", Path(__file__).resolve().parent / "import-zano.py")
mod = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(mod)

BeautifulSoup = __import__("bs4").BeautifulSoup

GEN = ROOT / "src" / "data" / "generated"
PUBLIC = ROOT / "public"
DOC_PUB = PUBLIC / "docs" / "zano"
INTERNAL = ROOT / "internal" / "zano"
PAGES = INTERNAL / "pages-en"
QC_AT = date.today().isoformat()

SV_COPY = {
    "13.033.2": (
        "Bord Amicus 13.033.2 från tillverkaren ZANO har en skiva av betong där schack eller fia kan läggas. "
        "Spelplanen görs med UV-tryck på betongen eller som tryck på en rostfri platta som läggs i en urtagning i skivan. "
        "Stommen erbjuds i kolstål S235JR, pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "13.022": (
        "Bord Tristad 13.022 från tillverkaren ZANO är ett utomhusbord för måltid, picknick eller arbete. "
        "Stommen erbjuds i kolstål S235JR eller rostfritt stål AISI 304, och skivan i europeiskt barrträ, oljat ädelträ, "
        "hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet. Bordet skruvas i fundament."
    ),
    "05.021": (
        "Cykelställ Arcus 05.021 från tillverkaren ZANO är ett U-format rörställ som stöder cykeln i ram och hjul. "
        "ZANO erbjuder stommen i kolstål S235JR eller rostfritt stål AISI 304. "
        "Montering sker genom gjutning i betong eller skruvmontering i fundament."
    ),
    "05.054.1": (
        "Cykelställ Fancy 05.054.1 från tillverkaren ZANO är ett U-format dubbelställ i kolstål S235JR. "
        "Kolstålet kan pulverlackeras i RAL enligt ZANOs stålfärgkarta. "
        "Stället gjuts i betong och är ritat för två cyklar."
    ),
    "05.020": (
        "Cykelställ Piko 05.020 från tillverkaren ZANO är ett slankt U-format rörställ som stöder cykeln i ram och hjul. "
        "Stommen erbjuds i kolstål S235JR eller rostfritt stål AISI 304. "
        "Montering sker genom gjutning i betong eller skruvmontering i fundament."
    ),
    "05.020.1": (
        "Cykelställ Piko 05.020.1 från tillverkaren ZANO är ett dubbelsidigt U-format ställ som stöder cykeln i ram och hjul. "
        "Stommen erbjuds i kolstål S235JR, pulverlackerat i RAL, eller i rostfritt stål AISI 304. "
        "Modellen gjuts i betong."
    ),
    "05.027": (
        "Cykelställ Tristad 05.027 från tillverkaren ZANO är ett U-format ställ som stöder cykeln i ram och hjul. "
        "Stommen erbjuds i kolstål S235JR eller rostfritt stål AISI 304. "
        "Montering sker genom gjutning i betong eller skruvmontering i fundament."
    ),
    "02.612": (
        "Fåtölj Rotary Soft 02.612 från tillverkaren ZANO är en vridbar sittplats med ryggstöd, avsedd att kombineras med bordet Soft 13.012.1. "
        "Stommen erbjuds i kolstål S235JR, galvaniserat och pulverlackerat, eller i rostfritt stål AISI 304. "
        "Sits och ryggstöd erbjuds i europeiskt barrträ, oljat ädelträ, hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet. Fåtöljen skruvas i marken."
    ),
    "18.001": (
        "Servicestation Pauza 18.001 från tillverkaren ZANO är en viloställning för cyklister, så att man kan vänta utan att stiga av. "
        "Stationen är byggd av platta stänger i två höjder: den övre för handen och den undre för foten. "
        "Stommen är kolstål S235JR och fästs med skruvmontering."
    ),
    "18.048.1": (
        "Servicestation Stilo 18.048.1 från tillverkaren ZANO är en självbetjänad cykelverkstad med verktyg fästa i stommen. "
        "Stommen erbjuds helt i rostfritt stål AISI 304, eller i galvaniserat kolstål S235JR pulverlackerat i RAL, då övre cykelhållare och innervägg med verktyg förblir rostfria. "
        "Stationen skruvas i marken. Verktygen är fästa med stålvajrar med PVC-hölje."
    ),
    "15.061": (
        "Källsortering Simple 15.061 från tillverkaren ZANO är en trestavig stålsortering med rostfria avfallsbehållare. "
        "Överdel och sidor erbjuds i rostfritt stål eller i kolstål pulverlackerat i RAL. "
        "Varje fack har märkning för sortering och en urtagbar insats av galvaniserad plåt. Tekniska data anger tre behållare om 30 l styck."
    ),
    "03.061": (
        "Papperskorg Simple 03.061 från tillverkaren ZANO har svetsad stomme av stålplåt i tjocklekarna 2, 6 och 8 mm. "
        "Utförandet erbjuds i kolstål S235JR, galvaniserat och pulverlackerat i RAL med rostfri front, eller helt i rostfritt stål 1.4301 med blank yta. "
        "Korgen har en urtagbar insats av 0,8 mm galvaniserad plåt om 30 l, som töms via en lucka upptill."
    ),
    "02.024.2": (
        "Parkbänk Simple 02.024.2 från tillverkaren ZANO har en laddpanel med två USB 3.0 typ A och en USB 3.0 typ C i Quick Charge, alltid i rostfritt stål. "
        "Portarna är täckta mot smuts och regn. Laddmodulen kräver nätanslutning via kabel från bänkens stomme. "
        "Stommen erbjuds i kolstål S235JR, galvaniserat och pulverlackerat i RAL, eller helt i rostfritt stål. Sits och rygg består av träläkt; ZANO anger europeiskt barrträ, oljat ädelträ, hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet."
    ),
    "02.424": (
        "Parkbänk Simple 02.424 från tillverkaren ZANO är en sittbänk i stål och trä för utomhusmiljö. "
        "Stommen erbjuds i kolstål S235JR, galvaniserat och pulverlackerat i RAL, eller i rostfritt stål AISI 304. "
        "Sitsen erbjuds i europeiskt barrträ, oljat ädelträ, hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet."
    ),
    "06.076.L": (
        "Planteringskärl Quadro 06.076.L från tillverkaren ZANO är 180 cm brett och ritat mot bänkarna 02.476 och 02.076. "
        "Kärlet är modulärt och kan kombineras med andra Quadro-delar. "
        "Stommen erbjuds i galvaniserat kolstål S235JR pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "06.076.M": (
        "Planteringskärl Quadro 06.076.M från tillverkaren ZANO är 120 cm brett och ritat mot bänkarna 02.476.1 och 02.076.1. "
        "Kärlet är modulärt och kan kombineras med andra Quadro-delar. "
        "Stommen erbjuds i galvaniserat kolstål S235JR pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "06.076.S": (
        "Planteringskärl Quadro 06.076.S från tillverkaren ZANO är 60 cm brett och ritat mot Quadro-sitt 02.176 utan ryggstöd och 02.676 med ryggstöd. "
        "Stommen erbjuds i galvaniserat kolstål S235JR pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "06.176.L": (
        "Planteringskärl Quadro 06.176.L från tillverkaren ZANO är 180 cm brett och 100 cm högt, ritat mot bänkarna 02.476 och 02.076. "
        "Kärlet är modulärt och kan kombineras med andra Quadro-delar. "
        "Stommen erbjuds i galvaniserat kolstål S235JR pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "06.176.M": (
        "Planteringskärl Quadro 06.176.M från tillverkaren ZANO är 120 cm brett och 100 cm högt, ritat mot bänkarna 02.476.1 och 02.076.1. "
        "Kärlet är modulärt och kan kombineras med andra Quadro-delar. "
        "Stommen erbjuds i galvaniserat kolstål S235JR pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "06.176.XL": (
        "Planteringskärl Quadro 06.176.XL från tillverkaren ZANO har bas 120 × 120 cm och höjd 100 cm, ritat mot bänkarna 02.476.1 och 02.076.1. "
        "Kärlet är modulärt och kan kombineras med andra Quadro-delar. "
        "Stommen erbjuds i galvaniserat kolstål S235JR pulverlackerat i RAL, eller i rostfritt stål AISI 304."
    ),
    "01.057": (
        "Pollare Largo 01.057 från tillverkaren ZANO är en massiv, statisk pollare av tre järngjutgods och två rör (Ø 11,4 och Ø 16). "
        "ZANO erbjuder kedjefästen och staketsfästen som tillval. "
        "Stommen är kolstål S235JR och gjuts i betong."
    ),
    "02.009": (
        "Solbänk Photon 02.009 från tillverkaren ZANO är en solcellsdriven Smart City-bänk med tre USB A Quick Charge-portar och belysning som tänds efter mörkrets inbrott. "
        "Fem solcellspaneler arbetar var för sig så att bänken kan ladda även vid delvis skugga. "
        "Stommen erbjuds i kolstål S235JR, galvaniserat och pulverlackerat, eller i rostfritt stål. Sits och ryggstöd i europeiskt barrträ, oljat ädelträ, hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet, samt härdat laminerat glas."
    ),
    "02.009.3": (
        "Solbänk Photon 02.009.3 från tillverkaren ZANO är nätokberoende. Solcellspaneler på sammanlagt 100 W lagrar energi i gelbatterier 36 Ah. "
        "Standardutrustning är LED-belysning som tänds efter mörkrets inbrott och tre USB typ A-laddportar. "
        "Stommen erbjuds i galvaniserat kolstål pulverlackerat i RAL eller blankt rostfritt stål. Trädelarna i europeiskt barrträ, oljat ädelträ, hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet. Solcellerna skyddas av dubbelt härdat glas."
    ),
    "02.409": (
        "Solbänk Photon 02.409 från tillverkaren ZANO är den första produkten i Smart City-linjen. "
        "Standard är tre USB A Quick Charge-portar och LED-ljus som tänds efter solnedgång. Fem solcellspaneler arbetar var för sig. "
        "Stommen erbjuds i kolstål, galvaniserat och pulverlackerat, eller rostfritt stål. Sitsen är härdat laminerat glas; träutföranden enligt ZANOs sitsval."
    ),
    "02.409.3": (
        "Solbänk Photon 02.409.3 från tillverkaren ZANO är nätokberoende. Solcellspaneler på sammanlagt 100 W lagrar energi i gelbatterier 36 Ah. "
        "Standardutrustning är LED-belysning som tänds efter mörkrets inbrott och tre USB typ A-laddportar. "
        "Stommen erbjuds i galvaniserat kolstål pulverlackerat i RAL eller blankt rostfritt stål. Trädelarna i europeiskt barrträ, oljat ädelträ, hårt trä av europeiskt ursprung eller ädelträ av högsta kvalitet. Solcellerna skyddas av dubbelt härdat glas."
    ),
}

PICNIC_PAGES = [
    "set-pluris-table-plus-two-benches",
    "set-bergen-table-and-two-benches",
    "picnic-set-with-high-bar-table-scandik",
    "scandik-picnic-set",
    "picnic-table-scandik-with-armchairs",
    "picnic-set-stilo",
    "picnic-set-stilo-with-armchairs",
    "amicus-picnic-set",
    "picnic-set-scandik-plus-domino-90",
]


def page_path(product: dict) -> Path:
    url = (product.get("internal") or {}).get("catalogueUrl") or ""
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    return PAGES / f"{slug}.html"


def parse_product_en(product: dict) -> dict:
    path = page_path(product)
    url = (product.get("internal") or {}).get("catalogueUrl") or ""
    if not path.exists():
        return {}
    html = path.read_text(encoding="utf-8", errors="replace")
    return mod.parse_en_page(html, url)


def is_stub_desc(text: str) -> bool:
    t = (text or "").strip()
    return (not t) or t.endswith("från tillverkaren ZANO.")


def looks_english_material(text: str | None) -> bool:
    if not text:
        return True
    low = text.lower()
    if any(tok in low for tok in ("kolstål", "rostfritt", "barrträ", "ädelträ", "betong")):
        return False
    return any(tok in low for tok in ("steel", "carbon", "stainless", "wood:", "construction -", "sheet steel"))


def material_from_groups(groups: list[dict]) -> str | None:
    construction = []
    seat = []
    wood_label = "Sits"
    for g in groups:
        if g.get("key") == "Konstruktion":
            construction = [o["name"] for o in g.get("options") or []]
        if g.get("key") == "Bordsskiva":
            wood_label = "Bordsskiva"
            seat = [o["name"] for o in g.get("options") or []]
        if g.get("key") == "Sits":
            seat = [o["name"] for o in g.get("options") or []]
    return mod.material_text([], [], construction, seat, wood_label)


def translate_dimensions(rows: list[dict]) -> list[dict]:
    out = []
    seen = set()
    for row in rows or []:
        raw = (row.get("label") or "").strip()
        label = mod.DIM_SV.get(raw.lower(), raw[:1].upper() + raw[1:] if raw else raw)
        if label in seen:
            continue
        seen.add(label)
        item = {"label": label, "value": row.get("value")}
        if row.get("note"):
            item["note"] = row["note"]
        out.append(item)
    return out


def has_sv_datasheet(product: dict) -> bool:
    for d in product.get("documents") or []:
        href = (d.get("href") or "").lower()
        label = (d.get("typeLabel") or "").lower()
        if href.endswith("produktblad.pdf") and "produktblad-en" not in href:
            return True
        if "produktblad" in label and "engelska" not in label and d.get("kind") == "datasheet":
            return True
    return False


def merge_option_groups(existing: list[dict], incoming: list[dict]) -> list[dict]:
    keys = {g.get("key") for g in existing}
    labels_finish = {(g.get("label"), g.get("parentValue")) for g in existing}
    out = list(existing)
    for g in incoming:
        if g.get("key") in keys:
            continue
        if g.get("label") == "Stålfinish" and (g.get("label"), g.get("parentValue")) in labels_finish:
            continue
        if g.get("key") == "Trafinish:barrtra" and "Trafinish:barrtra" in keys:
            continue
        out.append(g)
        keys.add(g.get("key"))
    return out


def publish_en_datasheet(product: dict, en: dict) -> None:
    slug = product["slug"]
    sku = product.get("sku")
    dest_dir = DOC_PUB / slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / "produktblad-en.pdf"
    href = f"/docs/zano/{slug}/produktblad-en.pdf"
    if any(d.get("href") == href for d in product.get("documents") or []):
        return
    chosen = None
    for f in en.get("files") or []:
        url = f.get("href") or ""
        label = (f.get("label") or "").lower()
        low = url.lower()
        if "/product/card/" in low:
            continue
        if not (low.endswith(".pdf") or "technical-data-sheet" in low or "product-card" in low or "product card" in label):
            continue
        if "brochure" in label or "brochure" in low:
            continue
        chosen = url
        if "metric" in low or "product-card" in low or "product card" in label:
            break
    if not chosen:
        return
    name = unquote(Path(urlparse(chosen).path).name) or "produktblad-en.pdf"
    try:
        data, ctype, final = mod.fetch(chosen, INTERNAL / "pdf-en" / f"{sku or slug}-{mod.safe_name(name)}")
    except Exception:
        return
    if not data.startswith(b"%PDF"):
        return
    if not dest.exists():
        dest.write_bytes(data)
    product.setdefault("documents", []).insert(
        0,
        {
            "title": name,
            "typeLabel": "Produktblad, engelska (PDF)",
            "format": "PDF",
            "href": href,
            "kind": "datasheet",
            "previewable": True,
            "variant": None,
            "appliesTo": sku,
            "sourceUrl": final,
            "fetchedAt": QC_AT,
            "language": "en",
        },
    )


def tag_document_language(doc: dict) -> None:
    href = (doc.get("href") or "").lower()
    label = (doc.get("typeLabel") or "")
    source = (doc.get("sourceUrl") or "").lower()
    title = (doc.get("title") or "")
    if doc.get("language"):
        return
    if href.endswith("produktblad-en.pdf") or "engelska" in label.lower():
        doc["language"] = "en"
        if doc.get("kind") == "datasheet" and "engelska" not in label.lower():
            doc["typeLabel"] = "Produktblad, engelska (PDF)"
        return
    if href.endswith("produktblad.pdf"):
        doc["language"] = "sv"
        return
    if "seriebroschyr" in href:
        doc["language"] = "en"
        if "engelska" not in label.lower():
            doc["typeLabel"] = "Seriebroschyr, engelska (PDF)"
        return
    if "technical-data-sheet" in source or "technical_data_sheet" in source or "product-card" in source:
        if doc.get("format") == "PDF":
            doc["language"] = "en"
            if "engelska" not in label.lower() and doc.get("kind") in {"datasheet", "other"}:
                doc["typeLabel"] = label.replace("(PDF)", "").strip() + ", engelska (PDF)" if "PDF" in label else f"{label}, engelska"
        return
    if title.lower().endswith(".pdf") and re.search(r"\b(en|gb|english|metric-units-technical)\b", title.lower()):
        doc["language"] = "en"


def file_ok(href: str) -> tuple[bool, str]:
    if not href.startswith("/"):
        return True, "external"
    path = PUBLIC / href.lstrip("/")
    if not path.exists():
        return False, "missing"
    data = path.read_bytes()[:80]
    suf = path.suffix.lower()
    if suf == ".pdf":
        return (data.startswith(b"%PDF"), "not-pdf" if not data.startswith(b"%PDF") else "ok")
    if suf == ".dwg":
        return (data.startswith(b"AC1"), "not-dwg" if not data.startswith(b"AC1") else "ok")
    if suf == ".svg":
        return (b"<svg" in data.lower() or b"<?xml" in data.lower(), "not-svg")
    if suf in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return (len(data) > 20, "tiny")
    if suf == ".skp":
        blob = path.read_bytes()[:4096]
        if blob[:2] == b"PK" or b"SketchUp" in blob or path.stat().st_size > 1024:
            return True, "ok"
        return False, "not-skp"
    if suf == ".3ds":
        return (path.stat().st_size > 64, "tiny")
    return True, "ok"


def weight_from_en_pdf(product: dict) -> None:
    if product.get("weight"):
        return
    sku = product.get("sku") or product["slug"]
    folder = INTERNAL / "pdf-en"
    candidates = list(folder.glob(f"{sku}*")) + list(folder.glob(f"{product['slug']}*"))
    text = ""
    for path in candidates:
        if path.suffix == ".final" or not path.is_file():
            continue
        data = path.read_bytes()
        if data.startswith(b"%PDF"):
            text = mod.pdf_text(data)
            break
    if not text:
        hrefs = [d.get("href") for d in product.get("documents") or [] if (d.get("href") or "").endswith("produktblad-en.pdf")]
        for href in hrefs:
            path = PUBLIC / href.lstrip("/")
            if path.exists() and path.stat().st_size > 80:
                data = path.read_bytes()
                if data.startswith(b"%PDF"):
                    text = mod.pdf_text(data)
                    break
    if not text:
        return
    nums = []
    for m in re.finditer(r"(\d+(?:[.,]\d+)?)\s*kg\b", text, re.I):
        nums.append(m.group(0))
    wood_lines = []
    for ln in text.splitlines():
        t = re.sub(r"\s+", " ", ln).strip()
        if re.search(r"\d+\s*kg", t, re.I) and any(k in t.lower() for k, _ in mod.WOOD_WEIGHT_KEYS):
            wood_lines.append(t)
    if wood_lines:
        full, summary = mod.weight_fields(wood_lines)
        product["weight"] = full
        product["weightSummary"] = summary
        return
    unique = []
    for n in nums:
        if n not in unique:
            unique.append(n)
    if len(unique) == 1:
        product["weight"] = unique[0].replace(".", ",")
        product["weightSummary"] = product["weight"]


def drop_empty_docs(product: dict) -> None:
    kept = []
    for d in product.get("documents") or []:
        href = d.get("href") or ""
        if href.startswith("/"):
            path = PUBLIC / href.lstrip("/")
            if path.exists() and path.stat().st_size == 0:
                path.unlink(missing_ok=True)
                continue
        kept.append(d)
    product["documents"] = kept


def apply_weight(product: dict) -> None:
    raw = product.get("weight") or ""
    tokens = [t.strip() for t in re.split(r"[;\n]", raw) if t.strip()]
    if not tokens and raw:
        tokens = [raw]
    by = mod.parse_weight_by_option(tokens)
    adel_note = "ädelträ anges inte" in raw.lower()
    if by:
        product["weightByOption"] = by
        text = "; ".join(f"{name}: {kg}" for name, kg in by.items())
        if adel_note:
            text += ". Vikt för ädelträ anges inte."
        product["weight"] = text
        product["weightSummary"] = next(iter(by.values())) if len(by) == 1 else None
        return
    kg_lines = mod.kg_weight_lines(tokens)
    if kg_lines:
        full, summary = mod.weight_fields(kg_lines)
        product["weight"] = full
        product["weightSummary"] = summary
        product["weightByOption"] = None
    elif raw and "kg" not in raw.lower():
        product["weightByOption"] = None


def necessary_gaps(product: dict) -> list[str]:
    gaps: list[str] = []
    if is_stub_desc(product.get("description") or ""):
        gaps.append("Svensk produktbeskrivning saknas.")
    if not (product.get("images") or []):
        gaps.append("Ingen produktbild kunde publiceras.")
    if not (product.get("dimensions") or []):
        gaps.append("Mått saknas i verifierad källa.")
    if not product.get("weight"):
        gaps.append("Vikt saknas i verifierad källa.")
    if not product.get("material") and not (product.get("optionGroups") or []):
        gaps.append("Materialuppgifter saknas i verifierad källa.")
    if not (product.get("documents") or []):
        gaps.append("Inga verifierade dokumentfiler kunde publiceras.")
    broken = []
    for d in product.get("documents") or []:
        ok, why = file_ok(d.get("href") or "")
        if not ok:
            broken.append(f"{d.get('typeLabel')} ({why})")
    if broken:
        gaps.append("Trasig dokumentfil: " + ", ".join(broken[:4]))
    return gaps


def picnic_report() -> list[dict]:
    rows = []
    sku_re = re.compile(r"\b\d{2}\.\d{3}(?:\.\d+)?(?:\.[A-Za-z]{1,3})?\b")
    for slug in PICNIC_PAGES:
        path = PAGES / f"{slug}.html"
        if not path.exists():
            rows.append(
                {
                    "slug": slug,
                    "ownSku": None,
                    "memberSkus": [],
                    "documents": False,
                    "kind": "kombinationssida",
                    "note": "Cachad sida saknas.",
                }
            )
            continue
        soup = BeautifulSoup(path.read_text(encoding="utf-8", errors="replace"), "lxml")
        h1 = soup.find("h1")
        title = re.sub(r"\s+", " ", h1.get_text(" ", strip=True)) if h1 else slug
        text = soup.get_text(" ", strip=True)
        skus = sorted(set(sku_re.findall(text)))
        files = []
        for a in soup.select("a[href]"):
            href = a.get("href") or ""
            if "files.zano" in href or href.lower().endswith((".pdf", ".dwg")):
                files.append(href)
        rows.append(
            {
                "slug": slug,
                "title": title,
                "ownSku": None,
                "memberSkus": skus,
                "documents": bool(files),
                "kind": "kombinationssida",
                "note": (
                    "Samlingssida för separata modeller. Inget eget katalognummer och inget produktkort."
                    if not skus
                    else "Samlingssida för separata modeller med egna nummer. Inget eget set-katalognummer."
                ),
            }
        )
    return rows


def complete_one(product: dict) -> dict:
    sku = product.get("sku") or ""
    en = parse_product_en(product)
    changed = []

    # SKU suffixes
    slug = product["slug"]
    if slug.endswith("-xl") and sku == "06.176":
        product["sku"] = "06.176.XL"
        sku = "06.176.XL"
        for d in product.get("documents") or []:
            if d.get("appliesTo") == "06.176":
                d["appliesTo"] = sku
        changed.append("sku")
    if slug.endswith("-sn") and sku == "05.452":
        product["sku"] = "05.452.SN"
        sku = "05.452.SN"
        for d in product.get("documents") or []:
            if d.get("appliesTo") == "05.452":
                d["appliesTo"] = sku
        changed.append("sku")

    copy_key = sku if sku in SV_COPY else ("06.176.XL" if sku == "06.176.XL" else sku)
    if is_stub_desc(product.get("description") or "") and copy_key in SV_COPY:
        product["description"] = SV_COPY[copy_key]
        changed.append("description")

    if en:
        if not (product.get("dimensions") or []) and en.get("dimensions"):
            product["dimensions"] = en["dimensions"]
            changed.append("dimensions")
        if product.get("dimensions"):
            product["dimensions"] = translate_dimensions(product["dimensions"])
        if not product.get("weight") and en.get("weights"):
            full, summary = mod.weight_fields(en["weights"])
            product["weight"] = full
            product["weightSummary"] = summary
            changed.append("weight")
        if not (product.get("mounting") or []) and en.get("install"):
            inst = [mod.opt_sv(x) for x in en["install"] if x]
            if inst:
                product["mounting"] = list(dict.fromkeys(inst))
                changed.append("mounting")

        existing = product.get("optionGroups") or []
        built, install = mod.build_options({}, en)
        if not existing:
            product["optionGroups"] = built
            if install and not product.get("mounting"):
                product["mounting"] = list(dict.fromkeys(install))
            changed.append("options")
        else:
            merged = merge_option_groups(existing, built)
            if len(merged) != len(existing):
                product["optionGroups"] = merged
                changed.append("options")

        if looks_english_material(product.get("material")):
            mat = material_from_groups(product.get("optionGroups") or [])
            if not mat:
                construction_names = [mod.opt_sv(x) for x in (en.get("construction") or [])]
                seat_names = [mod.opt_sv(x) for x in (en.get("seat") or en.get("top") or [])]
                mat = mod.material_text([], [], construction_names, seat_names)
            if mat:
                product["material"] = mat
                changed.append("material")

        for g in product.get("optionGroups") or []:
            for o in g.get("options") or []:
                o["name"] = mod.opt_sv(o["name"])
            if g.get("parentValue"):
                g["parentValue"] = mod.opt_sv(g["parentValue"])

    if any(g.get("key") == "Trafinish:barrtra" for g in product.get("optionGroups") or []):
        product["wood"] = (
            "För europeiskt barrträ offererar ZANO träkulörerna ek, mahogny, teak, cypress och valnöt, plus egen kulör. "
            "Namnen avser kulören på det valda träslaget, inte massivt ek-, mahogny- eller teakträ."
        )

    if en and not has_sv_datasheet(product):
        before = len(product.get("documents") or [])
        publish_en_datasheet(product, en)
        if len(product.get("documents") or []) > before:
            changed.append("en-datasheet")

    weight_from_en_pdf(product)
    drop_empty_docs(product)

    for d in product.get("documents") or []:
        tag_document_language(d)

    apply_weight(product)

    # Honest gaps: missing Swedish PDF is recorded, but is not a completeness fail.
    product["internal"] = product.get("internal") or {}
    product["internal"]["missingSwedishDatasheet"] = not has_sv_datasheet(product)
    product["internal"]["qcAt"] = QC_AT
    product["gaps"] = necessary_gaps(product)
    return {"sku": sku, "slug": product["slug"], "changed": changed, "gaps": product["gaps"]}


def main() -> None:
    payload = json.loads((GEN / "zano-series.json").read_text())
    series = payload["series"]
    results = [complete_one(p) for p in series]

    picnic = picnic_report()
    no_sv = [p for p in series if p.get("internal", {}).get("missingSwedishDatasheet")]
    no_docs = [p for p in series if not (p.get("documents") or [])]
    overlap = [p for p in no_sv if p in no_docs]
    incomplete = [p for p in series if p.get("gaps")]
    dups: dict[str, list[str]] = {}
    for p in series:
        sku = p.get("sku")
        if not sku:
            continue
        dups.setdefault(sku, []).append(p["slug"])
    dups = {k: v for k, v in dups.items() if len(v) > 1}

    payload["qc"] = {
        "checkedAt": QC_AT,
        "products": len(series),
        "complete": len(series) - len(incomplete),
        "incomplete": [
            {"sku": p.get("sku"), "name": p["name"], "gaps": p.get("gaps")}
            for p in incomplete
        ],
        "withoutSwedishDatasheet": [
            {"sku": p.get("sku"), "name": p["name"], "documents": len(p.get("documents") or [])}
            for p in no_sv
        ],
        "withoutDocuments": [
            {"sku": p.get("sku"), "name": p["name"]}
            for p in no_docs
        ],
        "overlapNoSwedishDatasheetAndNoDocuments": [
            {"sku": p.get("sku"), "name": p["name"]}
            for p in overlap
        ],
        "duplicateSkus": dups,
        "picnicSets": picnic,
        "scope": {
            "excluded": payload.get("skipped"),
            "picnicSetsImported": False,
            "note": "Kombinationssidor för picknickset har inget eget modellnummer och importeras inte.",
        },
    }
    skipped = list(payload.get("skipped") or [])
    if not any(s.get("category") == "Picknickset" for s in skipped):
        skipped.append(
            {
                "category": "Picknickset",
                "en": [f"/street-furniture/catalogue/picnic-tables/{s}" for s in PICNIC_PAGES],
                "reason": "Kombinationssidor utan eget katalognummer. Medlemsprodukterna är importerade var för sig.",
                "memberSkus": sorted({sku for row in picnic for sku in row.get("memberSkus") or []}),
            }
        )
    payload["skipped"] = skipped
    payload["counts"] = {
        "products": len(series),
        "images": sum(len(p.get("images") or []) for p in series),
        "documents": sum(len(p.get("documents") or []) for p in series),
        "complete": payload["qc"]["complete"],
        "incomplete": len(incomplete),
    }
    out = GEN / "zano-series.json"
    tmp = out.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    tmp.replace(out)
    print(
        json.dumps(
            {
                "wrote": str(out),
                "complete": payload["qc"]["complete"],
                "incomplete": len(incomplete),
                "withoutSwedishDatasheet": len(no_sv),
                "withoutDocuments": len(no_docs),
                "overlap": [p.get("sku") for p in overlap],
                "changed": sum(1 for r in results if r["changed"]),
                "picnicSets": len(picnic),
                "sampleIncomplete": payload["qc"]["incomplete"][:12],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
