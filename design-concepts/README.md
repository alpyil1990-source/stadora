# STADORA designkoncept

Klickbar prototyp för omtaget. **Inte** den publicerade webbplatsen och **inte** produktionssajten.

Riktning: Specification Atlas (papper, bläck, sage, IBM Plex Sans / Manrope). Produktsida C (hybrid) är standard. A och B finns som jämförelse.

## Köra

```bash
npm install
npm run dev
```

Dev-servern lyssnar på port **4317**.

## Skärmar

Se `/design` i prototypen, eller:

- `/` startsida offentlig miljö
- `/produkter` sju huvudkategorier
- `/produkter/lek-aktivitet` underkategorier (gungor, lekställ, lekhus …)
- `/produkter/lek-aktivitet/gungor` tom underkategori (utkast från live-sajten)
- `/produkter/parkmobler` huvudkategori
- `/produkter/parkmobler/parkbankar` lista + filter
- `/produkt/parkbank-arsta` hybrid produktsida (C)
- `/produkt/papperskorg-rodberga-100` storlek (80/100 cm) — bilden byts när foto finns
- `/produkt/askkopp-luna` material PC/SST + RAL, foton från binsignia.com
- `/produkt/kallsortering-albris` (och BERNINA, EIGER, GEMINI)
- `/design/binsignia` utkastöversikt innan resten av sortimentet
- `/design/produktsida-a` upphandlingsledd
- `/design/produktsida-b` arkitekturledd
- `/offertlista` och `/offert`
- `/admin` VD-översikt, `/admin/flode` offertkedjan, `/admin/offerter`, `/admin/leverantorer`, `/q/Q-2026-0164` kundens godkännandelänk
- `/miljoer/bostadsgard`
- `/skola` och `/vard` är pausade grenar (ingen katalog just nu)
- `/dokument`

Mobil: smal viewport. Meny under 1024 px, fast offertknapp på produktsidan.

## Innehållsregel

Endast uppgifter som finns hos källan (live-sajten eller leverantörens sida/prislista). Inga påhittade mått, certifikat eller dokument. Tomma sektioner förklaras eller utelämnas. Produktbilder ska komma från leverantörens länk i intern admin, inte hämtas från stadora.se. BINSIGNIA-foton i utkastet är hämtade från binsignia.com med skriftligt tillstånd.
