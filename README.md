# STADORA

Nytt repo för omtaget av [stadora.se](https://www.stadora.se). Den publicerade sajten ligger kvar i Lovable. **Detta repo innehåller inte produktionssajten ännu.**

Godkänd riktning från planeringen:

- Tre affärsområden: Offentlig miljö, Skola, Vård
- Designriktning **Specification Atlas**
- Produktsida **C (hybrid)**
- Offertbaserad försäljning, inga priser, ingen kassa

## Vad som finns här

| Sökväg | Innehåll |
|---|---|
| [`design-concepts/`](design-concepts/) | Klickbar designprototyp (Vite + React). Inte CMS, inte produktion. |
| [`catalog-inventory/`](catalog-inventory/) | Inventering av live-katalogen i grupperna publicera / förbättra / utkast. |
| [`docs/NEXT-IMPLEMENTATION.md`](docs/NEXT-IMPLEMENTATION.md) | Fas 2–5: Next.js, Payload CMS, offertflöde — startas först efter godkännande av mockups. |

## Köra designprototypen

```bash
cd design-concepts
npm install
npm run dev
```

Öppnas på `http://127.0.0.1:4317`. Börja på `/design` för en förteckning över alla skärmar.

Skola och vård avvaktar. Offentlig miljö byggs först. Leverantörer, kontaktperson och produktantal ligger i prototypen under `/admin/leverantorer`. Produktbilder ska komma från leverantörens länk, inte skrapas från den publicerade sajten.

Första riktiga leverantörsutkastet är **BINSIGNIA** (Paula Stirbu / FORWARD SUPPORT SRL): fem modeller på `/design/binsignia`. Listpriser i euro syns bara i admin. Inga priser på den publika katalogen.

## Vad som inte ska göras än

Ingen migrering av Lovable-data, inga produktionsroutes, ingen databas. Vänta på uttryckligt godkännande av mockups innan implementationen i Fas 2.

STADORA är ett varumärke inom Relicon AB, org.nr 559174-4551.
