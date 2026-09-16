# Nästa implementation (efter mockup-godkännande)

Starta inte detta förrän informationsarkitektur, Specification Atlas och hybrid produktsida är uttryckligen godkända i prototypen.

## Fas 2 — plattform

- Next.js App Router, TypeScript, Tailwind, shadcn/ui i repots rot (inte i `design-concepts/`)
- Payload CMS mot Postgres: område, kategori, underkategori, serie, produkt, variant, dokument, miljö, offertärende
- Statusfält `draft | needs_work | published | archived`
- Completeness per sektion så tomma block inte renderas
- i18n-struktur (`sv` först)
- Design tokens från prototypen (ink `#1C2B26`, sage `#5C7268`, paper `#F4F2EC`)
- Logotyp oförändrad

## Fas 3 — kärnflöde

- Treområdeskrom: `/`, `/skola`, `/vard` med separata offertlistor
- Produktlista, sök inom område, hybrid produktsida
- Offertlista + tre-stegs formulär, e-post + intern JSON
- Säker upload: MIME-whitelist, storlek, viruskontroll, privat storage
- Admin för redaktörer utan kodändringar

## Fas 4 — tillit

- Dokumentcenter när verifierade filer finns
- Jämförelse max 3 inom samma kategori
- Miljöer/projekt endast med verifierade foton
- JSON-LD Product utan pris, absoluta canonicals, fungerande sitemap
- WCAG 2.2 AA

## Fas 5 — cutover

- 301 från Lovable-URL:er (ta bort `mirplay-`/`gerom-`-prefix)
- www/apex, robots: sluta blockera riktiga dokument
- Migrera **endast** grupp 1 publicerat, grupp 2 som `needs_work`, grupp 3 som `draft`

Se [`catalog-inventory/TRIAGE.md`](../catalog-inventory/TRIAGE.md).
