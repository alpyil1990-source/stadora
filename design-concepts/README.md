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
- `/produkter/parkmobler/parkbankar` lista + filter (Relicon + import 2026)
- `/produkter/pollare-racken/pollare` betongpollare
- `/produkt/parkbank-arsta` hybrid produktsida (C)
- `/produkt/parkbank-tvattad-rygg` exempelbänk från 2026-importen
- `/design/park-pollare` intern översikt parkbänkar och pollare
- `/admin/leverantorer/investim` intern EUR-lista, rabatt och netto
- `/admin/leverantorer/binsignia` intern EUR-lista, rabatt och netto
- `/produkt/papperskorg-rodberga-100` storlek (80/100 cm) — bilden byts när foto finns
- `/produkt/askkopp-luna` material PC/SST + RAL
- `/produkter/avfall-atervinning/kallsortering` hela källsorteringsserien
- `/design/binsignia` intern översikt av avfallskatalogen
- `/design/produktsida-a` upphandlingsledd
- `/design/produktsida-b` arkitekturledd
- `/offertlista` och `/offert`
- `/admin` VD-översikt, `/admin/flode` offertkedjan, `/admin/offerter`, `/admin/leverantorer`, `/q/Q-2026-0164` kundens godkännandelänk
- `/miljoer/bostadsgard`
- `/skola` och `/vard` är pausade grenar (ingen katalog just nu)
- `/dokument`
- `/produkt/cykelstall-bikeme` STREETPARK med ritning, DWG, förankring och produktblad per modell
- `/design/streetpark` intern översikt
- `/admin/leverantorer/streetpark` intern EUR-lista (listpris och netto), luckor och importrapport
- `/admin/leverantorer/inoplex` intern leverantörssida (inköpspris saknas, offert krävs)
- `/produkt/planteringskarl-do-23-02` och `/produkt/parkbank-la-20-19` Inoplex-kontrollprodukter (tillverkare dold)
- `/produkt/solstol-duo-02-052` ZANO Solstol DUO (tillverkare syns, märkning kvar, pris på förfrågan)
- `/produkter/parkmobler/parkbankar` och övriga underkategorier med ZANO-katalog (Övrigt är inte importerat)
- `/admin/leverantorer/zano` intern ZANO-sida (inköpspris saknas)

Mobil: smal viewport. Meny under 1024 px, fast offertknapp på produktsidan.

### STREETPARK-dokument (CAD)

Öppna filer (JPG-ritningar, materialprov, garanti) hämtas utan inloggning. CAD, produktblad och förankring kräver partnerinloggning mot streetpark.eu. Lösenord ska **inte** sparas i repot.

```bash
STREETPARK_USER='din@epost' STREETPARK_PASSWORD='…' python3 scripts/fetch-streetpark-auth.py
```

## Innehållsregel

Endast uppgifter som finns hos källan (live-sajten eller leverantörens sida/prislista). Inga påhittade mått, certifikat eller dokument. Tomma sektioner förklaras eller utelämnas. Produktbilder ska komma från leverantörens länk i intern admin, inte hämtas från stadora.se. Avfallsfoton är hämtade från leverantörens sajt med skriftligt tillstånd. Leverantörens artikelnummer syns bara i admin, utom STREETPARK, Inoplex-modellkoder och ZANO-modellnummer som följer med offerten. Inoplex namnges inte på publika produktsidor. ZANO namnges publikt och originalmärkning på bilder/dokument ska vara kvar. ZANO-kategorin Övrigt (fågelmatare, lyktor, desinfektionsstationer) importeras inte.
