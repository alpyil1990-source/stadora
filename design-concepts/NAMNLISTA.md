# Namnlista — publikt sortiment (förslag)

**Status:** endast granskning. Inga produktnamn, slugs, URL:er, produkt-ID, ST-nummer eller leverantörs-SKU är ändrade i katalogen.

Alper granskar namnen innan något går in i `name`. Platssnamn är STADORA:s kommersiella modellnamn, inte ursprung eller tillverkningsland. De ska inte läsas som att produkten är tillverkad i Sverige eller i den namngivna stadsdelen.

Format: **Produkttyp + modellnamn** (exempel: Parkbänk Hammarby). Mått, material, ryggstöd, volym och funktion hör till sammanfattning och spec, inte till titeln.

Leverantörens artikelnummer syns bara i kolumnen Admin-SKU. Publikt artikelnummer är ST-… när det finns, annars —.

## Sammanfattning

| | Antal |
|---|---:|
| Produkter i publika katalogen | 199 |
| **BEHÅLL** (etablerat namn, redan i rätt form) | 58 |
| **FÖRESLÅ** (nytt modellnamn eller prefixjustering) | 141 |

| Underkategori | Antal | BEHÅLL | FÖRESLÅ |
|---|---:|---:|---:|
| Parkbänkar | 24 | 5 | 19 |
| Bord och picknick | 9 | 0 | 9 |
| Modulära sitt | 1 | 0 | 1 |
| Papperskorgar | 34 | 5 | 29 |
| Askkoppar | 1 | 1 | 0 |
| Källsortering | 49 | 47 | 2 |
| Cykelställ | 3 | 0 | 3 |
| Planteringskärl | 37 | 0 | 37 |
| Pollare | 41 | 0 | 41 |

Skola och vård är pausade i prototypen och ingår inte i tabellen. Utkastnamn på tomma underkategorier (demo på live-sajten) ingår inte — de är inte köpbara kort här.

För Investim är **leverantörens namn** den svenska katalograden från importen. Polskt originalnamn saknas i underlaget. För BINSIGNIA är leverantörens namn serienamnet (LUNA, ALBRIS, AMPATO …). Relicon-raderna använder det publicerade STADORA-namnet.

## Så här läser du tabellen

- **BEHÅLL** — behåll publikt namn som det står.
- **FÖRESLÅ** — förslag tills du godkänt. Slug/URL oförändrad.
- Samma föreslagna modellnamn på två rader betyder verifierad serie (samma serienummer eller belagd variant), inte att sidorna ska slås ihop.
- Liknande foto räcker inte för att dela namn (670 och 673 förblir olika modeller).

## Förslag på fältet `modelName` (inte infört)

När namnen är godkända kan publikt `name` härledas, utan att slug eller ID ändras:

```ts
/** Kommersiellt modellnamn utan produkttyp. Publikt namn = typeNoun + " " + modelName. */
modelName?: string
/** Svensk produkttyp i titeln, t.ex. Parkbänk, Papperskorg, Källsortering. */
typeNoun?: string
```

Exempel: `typeNoun: "Parkbänk"`, `modelName: "Hammarby"` → publikt namn `Parkbänk Hammarby`. Relicon-ST och leverantörs-SKU ligger kvar i befintliga fält. Införs inte förrän namnen är godkända.

## Namn som inte återanvänds

Redan i denna katalog: Årsta, Hammarby, Gröndal, Aspudden, Enskede, Rödberga, Puck, Rogal, LUNA, ALBRIS, BERNINA, EIGER, GEMINI och övriga BINSIGNIA-serienamn.

Live stadora.se (finns inte som kort här, undviks för att inte krocka vid senare migrering): Ängen, Aspö, Backen, Mörkö, Muren, Ödeshög, Sälen, Silverdal, Storsjö, Uppsala, Norra Djurgården, Stadshag, Bergshamra, Rimsjö, Rinkeby, Rissne, Tallen, Ulvsunda, Mariehäll, Djurö, Granö, Solna, Skarpnäck, Hornsberg, Sandö, Danderyd, Skylten, Stigen, Koni, Tanto, Långholmen, Fridhem, Vasastan, Bromma, Slussen, Liljeholmen, Norrtull, Alvik, Hagastaden, Rosendal, Ulriksdal, Årstadal, Hagalund, samt övriga platssnamn i `catalog.ts` draftExamples / liveReady.

Picknickbord Enskede på live återanvänds inte på Investim-borden — Enskede är redan Parkbänk i denna katalog, och ingen gemensam serie är belagd.

## Parkmöbler / Parkbänkar

24 produkter · BEHÅLL 5 · FÖRESLÅ 19

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| BEHÅLL | `parkbank-hammarby` | Parkbänk | Parkbänk Hammarby | **Parkbänk Hammarby** | ST-1207 | ST-1207 | Parkbänk Hammarby (Relicon) | Etablerat Relicon-namn. Utan ryggstöd hör till spec, inte titel. Inte samma katalogpost som Investim 670 även om måtten liknar varandra. |
| BEHÅLL | `parkbank-arsta` | Parkbänk | Parkbänk Årsta | **Parkbänk Årsta** | ST-1208 | ST-1208 | Parkbänk Årsta (Relicon) | Etablerat Relicon-namn. Med ryggstöd i spec. Inte samma katalogpost som Investim 671. |
| BEHÅLL | `parkbank-grondal` | Parkbänk | Parkbänk Gröndal | **Parkbänk Gröndal** | ST-1210 | ST-1210 | Parkbänk Gröndal (Relicon) | Etablerat Relicon-namn. Utan ryggstöd i spec. Inte samma katalogpost som Investim 673. |
| BEHÅLL | `parkbank-aspudden` | Parkbänk | Parkbänk Aspudden | **Parkbänk Aspudden** | ST-1211 | ST-1211 | Parkbänk Aspudden (Relicon) | Etablerat Relicon-namn. Med ryggstöd i spec. Inte samma katalogpost som Investim 674. |
| BEHÅLL | `parkbank-enskede` | Parkbänk | Parkbänk Enskede | **Parkbänk Enskede** | ST-1212 | ST-1212 | Parkbänk Enskede (Relicon) | Etablerat Relicon-namn. Live-sajten har även Picknickbord Enskede och Fällpollare Enskede — återanvänds inte här för andra produkttyper (ingen verifierad gemensam serie i denna katalog). |
| FÖRESLÅ | `parkbank-tvattad-rygg` | Parkbänk | Bänk med rygg, tvättad betong, 210 cm | **Parkbänk Skanstull** | — | 107 | Bänk med rygg, tvättad betong, 210 cm | Endast med-rygg-sidan är importerad (prislistan har även utan rygg). Ryggstöd, tvättad betong och 210 cm hör till spec. Inte sammanslagen med stålbänkarna 224/260. |
| FÖRESLÅ | `parkbank-stal-rygg` | Parkbänk | Bänk med rygg, stål, 180 cm | **Parkbänk Zinkensdamm** | — | 224 | Bänk med rygg, stål, 180 cm | Stålstomme med rygg, 180 cm. Prislistan har även utan rygg — den sidan finns inte. Inte samma serie som 260 (metallstomme) eller 156 (rör). |
| FÖRESLÅ | `parkbank-stal-rygg-metall` | Parkbänk | Bänk med rygg, metallstomme, 180 cm | **Parkbänk Eriksdal** | — | 260 | Bänk med rygg, metallstomme, 180 cm | Annat katalognummer än 224. Armstöd nämns i prislistan men inte i specen. Inte sammanslagen med 224 p.g.a. liknande foto. |
| FÖRESLÅ | `parkbank-stal` | Parkbänk | Bänk utan rygg, stålrör, 192 cm | **Parkbänk Högalid** | — | 156 | Bänk utan rygg, stålrör, 192 cm | Stålrör, utan rygg, 192 cm. Prislistan har även med rygg och dubbelbänk — de sidorna finns inte. Inte 209. |
| FÖRESLÅ | `parkbank-stal-tra` | Parkbänk | Bänk utan rygg, stål och trä, 180 cm | **Parkbänk Sofia** | — | 209 | Bänk utan rygg, stål och trä, 180 cm | Stål och trä, utan rygg, 180 cm. Eget katalognummer 209. Inte sammanslagen med 156. |
| FÖRESLÅ | `parkbank-arkitektur-sits` | Parkbänk | Bänk med träsits, 180 cm | **Parkbänk Sickla** | — | 601 | Bänk med träsits, 180 cm | Katalog 601. Delar modellnamn med 601-ZO (verifierat samma serienummer, annat utförande och andra mått). Träsits och 180 cm i spec. Sidorna slås inte ihop. |
| FÖRESLÅ | `parkbank-arkitektur-rygg` | Parkbänk | Bänk med rygg, 240 cm | **Parkbänk Sickla** | — | 601-ZO | Bänk med rygg, 240 cm | Katalog 601-ZO. Samma serie som 601 enligt prislistan. 240 cm och rygg i spec. Inte 605/652/659 bara för att de också har rygg. |
| FÖRESLÅ | `parkbank-arkitektur-smal` | Parkbänk | Bänk med smal sits, 180 cm | **Parkbänk Nacka** | — | 603 | Bänk med smal sits, 180 cm | Katalog 603, smal sits. Egen serie. Inte 601. |
| FÖRESLÅ | `parkbank-arkitektur-rygg-200` | Parkbänk | Bänk med rygg, 200 cm | **Parkbänk Järla** | — | 605 | Bänk med rygg, 200 cm | Katalog 605. Fristående / i mark är monteringsvarianter på samma sida — delar namn. Inte 652 (annat nummer) trots liknande längd 200 cm. |
| FÖRESLÅ | `parkbank-modul` | Parkbänk | Modulär bänk, 120 cm | **Parkbänk Henriksdal** | — | 608 | Modulär bänk, 120 cm | Katalog 608. Med och utan ryggstöd är verifierade varianter på samma produktsida — delar modellnamn. 120 cm i spec. |
| FÖRESLÅ | `parkbank-puck` | Parkbänk | Bänk Puck | **Parkbänk Puck** | — | 651 | Bänk Puck | Etablerat modellnamn redan i katalogen (Puck). Endast prefix Bänk → Parkbänk. Utan ryggstöd i spec. |
| FÖRESLÅ | `parkbank-arkitektur-200` | Parkbänk | Bänk utan rygg, 200 cm | **Parkbänk Finnboda** | — | 652 | Bänk utan rygg, 200 cm | Katalog 652. Delar modellnamn med 652-ZO (samma serienummer). Ingen egen utan-rygg-rad i prislistan. Inte 673 (annat nummer, andra mått). |
| FÖRESLÅ | `parkbank-arkitektur-200-rygg` | Parkbänk | Bänk med rygg, 200 × 55 cm | **Parkbänk Finnboda** | — | 652-ZO | Bänk med rygg, 200 × 55 cm | Katalog 652-ZO. Samma serie som 652. 200 × 55 cm och rygg i spec. Inte 605 och inte 674. |
| FÖRESLÅ | `parkbank-rogal` | Parkbänk | Bänk Rogal | **Parkbänk Rogal** | — | 655 | Bänk Rogal | Etablerat modellnamn redan i katalogen (Rogal). Endast prefix Bänk → Parkbänk. |
| FÖRESLÅ | `parkbank-arkitektur-rygg-180` | Parkbänk | Bänk med rygg, 180 cm | **Parkbänk Ektorp** | — | 659 | Bänk med rygg, 180 cm | Katalog 659. Egen serie. Inte 601 och inte Relicon-bänkarna. |
| FÖRESLÅ | `parkbank-arkitektur-190` | Parkbänk | Bänk utan rygg, 190 cm | **Parkbänk Midsommarkransen** | — | 670 | Bänk utan rygg, 190 cm | Katalog 670. Mått nära Relicon Hammarby (ST-1207) men separat katalogpost. Inte sammanslagen med 673 (anvisning: 670 och 673 är olika modeller). Inte 671 utan Relicon-beslut — Relicon namnger med/utan rygg som olika modeller. |
| FÖRESLÅ | `parkbank-arkitektur-190-rygg` | Parkbänk | Bänk med rygg, 190 cm | **Parkbänk Axelsberg** | — | 671 | Bänk med rygg, 190 cm | Katalog 671. Mått nära Relicon Årsta (ST-1208) men separat post. Inte 670 (Relicon-mönster: olika modellnamn för med/utan rygg när de är egna sidor). Inte 674. |
| FÖRESLÅ | `parkbank-arkitektur-200-45` | Parkbänk | Bänk utan rygg, 200 × 45 cm | **Parkbänk Örnsberg** | — | 673 | Bänk utan rygg, 200 × 45 cm | Katalog 673. Mått nära Relicon Gröndal men separat post. Inte 670. Inte 652. |
| FÖRESLÅ | `parkbank-arkitektur-200-45-rygg` | Parkbänk | Bänk med rygg, 200 × 45 cm | **Parkbänk Trekanten** | — | 674 | Bänk med rygg, 200 × 45 cm | Katalog 674. Mått nära Relicon Aspudden men separat post. Inte 673 som eget namn (egna sidor). Inte 652-ZO. |

## Parkmöbler / Bord och picknick

9 produkter · BEHÅLL 0 · FÖRESLÅ 9

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| FÖRESLÅ | `picknickbord-stal` | Picknickbord | Picknickbord, stål och trä | **Picknickbord Huddinge** | — | 128 | Picknickbord, stål och trä | Katalog 128, stål och trä. Inte 144/196. Inte live Tanto eller Långholmen. |
| FÖRESLÅ | `schackbord-stal` | Schackbord | Schackbord, stål och sten | **Schackbord Flemingsberg** | — | 226 | Schackbord, stål och sten | Katalog 226. Delar modellnamn med schackbordet i betong/granit (samma katalognummer i prislistan, annat material). Material i spec. Sidorna slås inte ihop. |
| FÖRESLÅ | `picknickbord-betong-tra` | Picknickbord | Picknickbord, betong och trä | **Picknickbord Stuvsta** | — | 144 | Picknickbord, betong och trä | Katalog 144. Inte 196 (rektangulärt, annat nummer). |
| FÖRESLÅ | `torgbord-betong` | Bord | Torgbord i betong | **Bord Fullersta** | — | 157 | Torgbord i betong | Katalog 157. Nuvarande titel Torgbord — produkttyp Bord enligt redan använd noun. Stål i spec (sammanfattningen). |
| FÖRESLÅ | `schackbord-fyra-sitt` | Schackbord | Schackbord för fyra | **Schackbord Tullinge** | — | 230 | Schackbord för fyra | Katalog 230, fyra sittplatser. Inte 226. |
| FÖRESLÅ | `bord-stal-tra` | Bord | Bord, stål och trä | **Bord Tumba** | — | 185 | Bord, stål och trä | Katalog 185. Inte picknick 128. |
| FÖRESLÅ | `picknickbord-betong` | Picknickbord | Picknickbord rektangulärt, betong och trä | **Picknickbord Rönninge** | — | 196 | Picknickbord rektangulärt, betong och trä | Katalog 196. Inte 144. Inte live Picknickbord Enskede. |
| FÖRESLÅ | `bord-bank-arkitektur` | Bord | Bord och bänk | **Bord Snättringe** | — | 192 | Bord och bänk | Katalog 192, bord och bänk i arkitektonisk betong. Kombinationsmöbel — typ Bord. Inte en parkbänk. |
| FÖRESLÅ | `schackbord-betong` | Schackbord | Schackbord, betong och granit | **Schackbord Flemingsberg** | — | 226 | Schackbord, betong och granit | Katalog 226, betong och granit. Samma serie som stål/sten-sidan. Inte 230. |

## Parkmöbler / Modulära sitt

1 produkt · BEHÅLL 0 · FÖRESLÅ 1

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| FÖRESLÅ | `sitt-betong` | Sittelement | Sitt utan rygg, betong | **Sittelement Länna** | — | 225 | Sitt utan rygg, betong | Katalog 225. Underkategori Modulära sitt — prefix Sittelement (Relicon-mönster). Inte live Skarpnäck, Hornsberg, Sandö eller Danderyd. Utan rygg i spec. |

## Avfall och återvinning / Papperskorgar

34 produkter · BEHÅLL 5 · FÖRESLÅ 29

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| BEHÅLL | `papperskorg-rodberga-100` | Papperskorg | Papperskorg Rödberga | **Papperskorg Rödberga** | ST-1199 | ST-1198 / ST-1199 | Papperskorg Rödberga (Relicon) | Etablerat namn. 80 cm (ST-1198) och 100 cm (ST-1199) är storleksvarianter på samma produkt — delar modellnamn. Höjd och volym i spec, inte i titel (live hade två artikelsidor). |
| BEHÅLL | `papperskorg-finlay` | Papperskorg | Papperskorg FINLAY | **Papperskorg FINLAY** | — | PC 9599 / SST 9566 | FINLAY | Etablerat serienamn. Live: Rund papperskorg FINLAY — rundhet i spec. Prefix redan Papperskorg. |
| BEHÅLL | `papperskorg-vadret` | Papperskorg | Papperskorg VADRET | **Papperskorg VADRET** | — | PC 13949 / SST 13982 | VADRET | Etablerat serienamn. Pedal i spec, inte i titel (live hade det i typnamnet). |
| BEHÅLL | `papperskorg-vela` | Papperskorg | Papperskorg VELA | **Papperskorg VELA** | — | PC 9895 / SST 9862 | VELA | Etablerat serienamn. |
| BEHÅLL | `papperskorg-zenipole` | Papperskorg | Papperskorg ZENIPOLE | **Papperskorg ZENIPOLE** | — | PC 15676 / SST 15709 | ZENIPOLE | Etablerat serienamn. Stolp- och väggmontage i spec (live hade det i typnamnet). |
| FÖRESLÅ | `papperskorg-rund-40l` | Papperskorg | Papperskorg rund, Ø 48 cm, 62 cm, 40 l | **Papperskorg Farsta** | — | 113 | Papperskorg rund, Ø 48 cm, 62 cm, 40 l | Katalog 113. Inte 218 (också 40 l, annat nummer). Volym i spec. |
| FÖRESLÅ | `papperskorg-rund-40l-2` | Papperskorg | Papperskorg rund, 62 cm, 40 l | **Papperskorg Gubbängen** | — | 218 | Papperskorg rund, 62 cm, 40 l | Katalog 218. Inte 113. |
| FÖRESLÅ | `papperskorg-rund-45l` | Papperskorg | Papperskorg rund, Ø 59 cm, 70 cm, 45 l | **Papperskorg Högdalen** | — | 137 | Papperskorg rund, Ø 59 cm, 70 cm, 45 l | Katalog 137. Egen serie. |
| FÖRESLÅ | `papperskorg-rund-75l` | Papperskorg | Papperskorg rund, Ø 62,5 cm, 80 cm, 75 l | **Papperskorg Bandhagen** | — | 85 | Papperskorg rund, Ø 62,5 cm, 80 cm, 75 l | Katalog 85. Inte 129 (liknande Ø). |
| FÖRESLÅ | `papperskorg-rund-60l` | Papperskorg | Papperskorg rund, Ø 62,5 cm, 81 cm, 60 l | **Papperskorg Stureby** | — | 129 | Papperskorg rund, Ø 62,5 cm, 81 cm, 60 l | Katalog 129. Inte 85. |
| FÖRESLÅ | `papperskorg-rund-70l` | Papperskorg | Papperskorg rund, Ø 64 cm, 80 cm, 70 l | **Papperskorg Örby** | — | 86 | Papperskorg rund, Ø 64 cm, 80 cm, 70 l | Katalog 86. Inte 125/41/114 (alla 70 l, egna nummer). |
| FÖRESLÅ | `papperskorg-rund-70l-2` | Papperskorg | Papperskorg rund, Ø 64 cm, 85 cm, 70 l | **Papperskorg Rågsved** | — | 125 | Papperskorg rund, Ø 64 cm, 85 cm, 70 l | Katalog 125. Inte 86. |
| FÖRESLÅ | `papperskorg-rund-70l-3` | Papperskorg | Papperskorg rund, Ø 60 cm, 60 cm, 70 l | **Papperskorg Fagersjö** | — | 41 | Papperskorg rund, Ø 60 cm, 60 cm, 70 l | Katalog 41. Inte 86. |
| FÖRESLÅ | `papperskorg-rund-70l-4` | Papperskorg | Papperskorg rund, Ø 53 cm, 72 cm, 70 l | **Papperskorg Larsboda** | — | 114 | Papperskorg rund, Ø 53 cm, 72 cm, 70 l | Katalog 114. Inte 86. |
| FÖRESLÅ | `papperskorg-fyrkantig-50l` | Papperskorg | Papperskorg fyrkantig, 50 cm, 50 l | **Papperskorg Svedmyra** | — | 189 | Papperskorg fyrkantig, 50 cm, 50 l | Katalog 189. Inte 146 (50 eller 70 l på en sida, annat nummer). |
| FÖRESLÅ | `papperskorg-fyrkantig-90l` | Papperskorg | Papperskorg fyrkantig, 70 cm, 90 l | **Papperskorg Johanneshov** | — | 159 | Papperskorg fyrkantig, 70 cm, 90 l | Katalog 159. Egen serie. |
| FÖRESLÅ | `papperskorg-70l` | Papperskorg | Papperskorg, 70 cm, 70 l | **Papperskorg Östberga** | — | 108 | Papperskorg, 70 cm, 70 l | Katalog 108, betong och trä. Inte rund/åttkant 70 l. |
| FÖRESLÅ | `papperskorg-sexkantig-40l` | Papperskorg | Papperskorg sexkantig, Ø 63 cm, 65 cm, 40 l | **Papperskorg Västberga** | — | 124 | Papperskorg sexkantig, Ø 63 cm, 65 cm, 40 l | Katalog 124, stål. Inte 130. |
| FÖRESLÅ | `papperskorg-sexkantig-40l-2` | Papperskorg | Papperskorg sexkantig, 60 cm, 40 l | **Papperskorg Årstaberg** | — | 130 | Papperskorg sexkantig, 60 cm, 40 l | Katalog 130, stål. Inte 124. |
| FÖRESLÅ | `papperskorg-sexkantig-50l` | Papperskorg | Papperskorg sexkantig, 70 cm, 50 l | **Papperskorg Gullmarsplan** | — | 122 | Papperskorg sexkantig, 70 cm, 50 l | Katalog 122. Inte fyrkant 189. |
| FÖRESLÅ | `papperskorg-sexkantig-70l` | Papperskorg | Papperskorg sexkantig, 70 cm, 70 l | **Papperskorg Dalen** | — | 213 | Papperskorg sexkantig, 70 cm, 70 l | Katalog 213. Inte 108. |
| FÖRESLÅ | `papperskorg-attkantig-30l` | Papperskorg | Papperskorg åttkantig, Ø 57 cm, 61 cm, 30 l | **Papperskorg Kärrtorp** | — | 47 | Papperskorg åttkantig, Ø 57 cm, 61 cm, 30 l | Katalog 47. Egen serie. |
| FÖRESLÅ | `papperskorg-attkantig-40l` | Papperskorg | Papperskorg åttkantig, 60 cm, 40 l | **Papperskorg Sköndal** | — | 222 | Papperskorg åttkantig, 60 cm, 40 l | Katalog 222. Inte 124 (sexkant 40 l). |
| FÖRESLÅ | `papperskorg-attkantig-45l` | Papperskorg | Papperskorg åttkantig, Ø 57 cm, 70 cm, 45 l | **Papperskorg Blåsut** | — | 74 | Papperskorg åttkantig, Ø 57 cm, 70 cm, 45 l | Katalog 74. Egen serie. |
| FÖRESLÅ | `papperskorg-attkantig-70l` | Papperskorg | Papperskorg åttkantig, Ø 62 cm, 80 cm, 70 l | **Papperskorg Sandsborg** | — | 75 | Papperskorg åttkantig, Ø 62 cm, 80 cm, 70 l | Katalog 75. Inte 210/221. |
| FÖRESLÅ | `papperskorg-attkantig-70l-2` | Papperskorg | Papperskorg åttkantig, 65 cm, 70 l | **Papperskorg Skärmarbrink** | — | 210 | Papperskorg åttkantig, 65 cm, 70 l | Katalog 210. Inte 75. |
| FÖRESLÅ | `papperskorg-attkantig-70l-3` | Papperskorg | Papperskorg åttkantig, 79 cm, 70 l | **Papperskorg Pungpinan** | — | 221 | Papperskorg åttkantig, 79 cm, 70 l | Katalog 221. Inte 75. |
| FÖRESLÅ | `papperskorg-attkantig-120l` | Papperskorg | Papperskorg åttkantig, 90 cm, 120 l | **Papperskorg Skrubba** | — | 172 | Papperskorg åttkantig, 90 cm, 120 l | Katalog 172. Inte 228 (trä, 120 l). |
| FÖRESLÅ | `papperskorg-trapets-70l` | Papperskorg | Papperskorg trapetsformad, 75 cm, 70 l | **Papperskorg Älta** | — | 140 | Papperskorg trapetsformad, 75 cm, 70 l | Katalog 140. Trapets. Inte övriga 70 l. |
| FÖRESLÅ | `papperskorg-med-tra-50l` | Papperskorg | Papperskorg med trä, 50 l, 170 kg | **Papperskorg Bollmora** | — | 117 | Papperskorg med trä, 50 l, 170 kg | Katalog 117. Granityta och trä. Inte 118 (samma volym, annat nummer och vikt). |
| FÖRESLÅ | `papperskorg-med-tra-50l-2` | Papperskorg | Papperskorg med trä, 50 l, 180 kg | **Papperskorg Krusboda** | — | 118 | Papperskorg med trä, 50 l, 180 kg | Katalog 118. Inte 117. |
| FÖRESLÅ | `papperskorg-med-tra-45l` | Papperskorg | Papperskorg med trä, 70 cm, 45 l | **Papperskorg Trollbäcken** | — | 139 | Papperskorg med trä, 70 cm, 45 l | Katalog 139. Inte 137 (rund 45 l utan trä). |
| FÖRESLÅ | `papperskorg-med-tra-120l` | Papperskorg | Papperskorg med trä, 100 cm, 120 l | **Papperskorg Raksta** | — | 228 | Papperskorg med trä, 100 cm, 120 l | Katalog 228, med tak enligt sidan. Inte 172. |
| FÖRESLÅ | `papperskorg-fyrkantig` | Papperskorg | Papperskorg fyrkantig, 50 eller 70 l | **Papperskorg Tyresö** | — | 146 | Papperskorg fyrkantig, 50 eller 70 l | Katalog 146. 50 l och 70 l är kapacitetsvarianter på samma sida — delar namn. Tak är tillval i spec. Inte 189. |

## Avfall och återvinning / Askkoppar

1 produkt · BEHÅLL 1 · FÖRESLÅ 0

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| BEHÅLL | `askkopp-luna` | Askkopp | Askkopp LUNA | **Askkopp LUNA** | — | 9747 / SST 9698 | LUNA | Etablerat serienamn. PC/SST är materialvarianter på samma sida — delar namn. 35 l i spec. |

## Avfall och återvinning / Källsortering

49 produkter · BEHÅLL 47 · FÖRESLÅ 2

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| BEHÅLL | `kallsortering-albris` | Källsortering | Källsortering ALBRIS | **Källsortering ALBRIS** | — | 1088 / SST 1096 | ALBRIS | Etablerat serienamn. 1–4 fraktioner och PC/SST på samma sida. Kapacitet i spec. |
| BEHÅLL | `kallsortering-bernina` | Källsortering | Källsortering BERNINA | **Källsortering BERNINA** | — | 1107 / SST 1114 | BERNINA | Etablerat serienamn. PC/SST och kapacitetsrutnät på samma sida. |
| BEHÅLL | `kallsortering-eiger` | Källsortering | Källsortering EIGER | **Källsortering EIGER** | — | 14300 / SST 14333 | EIGER | Etablerat serienamn. Food court och brickåterlämning i spec, inte i titel (live hade längre typnamn). |
| BEHÅLL | `kallsortering-gemini` | Källsortering | Källsortering GEMINI | **Källsortering GEMINI** | — | 8661 / SST 8532 | GEMINI | Etablerat serienamn. Integrerad askkopp i spec, inte i titel. |
| BEHÅLL | `kallsortering-ampato` | Källsortering | Källsortering AMPATO | **Källsortering AMPATO** | — | PC 6335 / SST 6302 | AMPATO | Etablerat serienamn. PC/SST på samma sida. 3 fack i spec. |
| BEHÅLL | `kallsortering-arizaro` | Källsortering | Källsortering ARIZARO | **Källsortering ARIZARO** | — | PC 4738 / SST 4617 | ARIZARO | Etablerat serienamn. Inte AT och inte Crystal — egna familjer med egna SKU. |
| BEHÅLL | `kallsortering-arizaro-at` | Källsortering | Källsortering ARIZARO AT | **Källsortering ARIZARO AT** | — | PC 9275 / SST 9114 | ARIZARO AT | Publicerat underserienamn ARIZARO AT (med askkopp). Behålls som eget modellnamn. Inte sammanslagen med ARIZARO. |
| BEHÅLL | `kallsortering-arizaro-crystal` | Källsortering | Källsortering ARIZARO Crystal | **Källsortering ARIZARO Crystal** | — | PC 14384 / SST 14513 | ARIZARO CRYSTAL | Publicerat underserienamn ARIZARO Crystal (plexiglas). Behålls. Plexiglas i spec. |
| BEHÅLL | `kallsortering-belvedere` | Källsortering | Källsortering BELVEDERE | **Källsortering BELVEDERE** | — | PC 1025 / SST 1032 | BELVEDERE | Etablerat serienamn. PC/SST på samma sida. |
| BEHÅLL | `kallsortering-bonanza` | Källsortering | Källsortering BONANZA | **Källsortering BONANZA** | — | PC 1057 / SST 1064 | BONANZA | Etablerat serienamn. |
| BEHÅLL | `kallsortering-brend` | Källsortering | Källsortering BREND | **Källsortering BREND** | — | PC 5977 / SST 5871 | BREND | Etablerat serienamn. Trä är material på sidan, redan utanför titeln. |
| BEHÅLL | `kallsortering-cachi` | Källsortering | Källsortering CACHI | **Källsortering CACHI** | — | PC 4884 / SST 4859 | CACHI | Etablerat serienamn. |
| BEHÅLL | `kallsortering-casiri` | Källsortering | Källsortering CASIRI | **Källsortering CASIRI** | — | PC 5386 / SST 5288 | CASIRI | Etablerat serienamn. |
| BEHÅLL | `kallsortering-chani` | Källsortering | Källsortering CHANI | **Källsortering CHANI** | — | PC 4934 / SST 4909 | CHANI | Etablerat serienamn. |
| BEHÅLL | `kallsortering-cimon` | Källsortering | Källsortering CIMON | **Källsortering CIMON** | — | PC 935 / SST 943 | CIMON | Etablerat serienamn. |
| BEHÅLL | `kallsortering-denali` | Källsortering | Källsortering DENALI | **Källsortering DENALI** | — | PC 9501 / SST 9436 | DENALI | Etablerat serienamn. Askkopp i spec, inte i titel (live hade det i typnamnet). |
| BEHÅLL | `kallsortering-ecomonde` | Källsortering | Källsortering ECOMONDE | **Källsortering ECOMONDE** | — | PC 854 / SST 858 | ECOMONDE | Etablerat serienamn. |
| BEHÅLL | `kallsortering-elm` | Källsortering | Källsortering ELM | **Källsortering ELM** | — | PC 879 / SST 887 | ELM | Etablerat serienamn. Delar modellnamn med ELM trä (verifierad trävaryant av samma serie). Sidorna slås inte ihop. |
| FÖRESLÅ | `kallsortering-elm-tra` | Källsortering | Källsortering ELM trä | **Källsortering ELM** | — | PC 894 / SST 901 | ELM TRA | Trä är material/utförande. Föreslagen titel samma som ELM — trä i spec. Inte en ny platsnamnsserie. Eget slug och SKU 894 kvar. |
| BEHÅLL | `kallsortering-eridani` | Källsortering | Källsortering ERIDANI | **Källsortering ERIDANI** | — | PC 9961 / SST 9928 | ERIDANI | Etablerat serienamn. Askkopp i spec. |
| BEHÅLL | `kallsortering-kandel` | Källsortering | Källsortering KANDEL | **Källsortering KANDEL** | — | PC 5580 / SST 5483 | KANDEL | Etablerat serienamn. |
| BEHÅLL | `kallsortering-katyn` | Källsortering | Källsortering KATYN | **Källsortering KATYN** | — | PC 9829 / SST 9796 | KATYN | Etablerat serienamn. Live kallades den Papperskorg med askkopp KATYN; i denna katalog ligger den under Källsortering. Askkopp i spec. Typ följer katalogens underkategori. |
| BEHÅLL | `kallsortering-kobuk` | Källsortering | Källsortering KOBUK | **Källsortering KOBUK** | — | PC 9665 / SST 9632 | KOBUK | Etablerat serienamn. Askkopp i spec. |
| BEHÅLL | `kallsortering-kunka` | Källsortering | Källsortering KUNKA | **Källsortering KUNKA** | — | PC 6269 / SST 6236 | KUNKA | Etablerat serienamn. |
| BEHÅLL | `kallsortering-medele` | Källsortering | Källsortering MEDELE | **Källsortering MEDELE** | — | PC 951 / SST 958 | MEDELE | Etablerat serienamn. |
| BEHÅLL | `kallsortering-medusa` | Källsortering | Källsortering MEDUSA | **Källsortering MEDUSA** | — | PC 5191 / SST 5093 | MEDUSA | Etablerat serienamn. |
| BEHÅLL | `kallsortering-misti` | Källsortering | Källsortering MISTI | **Källsortering MISTI** | — | PC 5026 / SST 4959 | MISTI | Etablerat serienamn. |
| BEHÅLL | `kallsortering-mundin` | Källsortering | Källsortering MUNDIN | **Källsortering MUNDIN** | — | PC 847 / SST 852 | MUNDIN | Etablerat serienamn. |
| BEHÅLL | `kallsortering-nazas` | Källsortering | Källsortering NAZAS | **Källsortering NAZAS** | — | PC 8499 / SST 8466 | NAZAS | Etablerat serienamn. Askkopp i spec. |
| BEHÅLL | `kallsortering-noatak` | Källsortering | Källsortering NOATAK | **Källsortering NOATAK** | — | PC 7884 / SST 8013 | NOATAK | Etablerat serienamn. Askkopp i spec. |
| BEHÅLL | `kallsortering-parana` | Källsortering | Källsortering PARANA | **Källsortering PARANA** | — | PC 8271 / SST 8142 | PARANA | Etablerat serienamn. Askkopp och trä i spec. |
| BEHÅLL | `kallsortering-parral` | Källsortering | Källsortering PARRAL | **Källsortering PARRAL** | — | PC 8985 / SST 8856 | PARRAL | Etablerat serienamn. Askkopp i spec. |
| BEHÅLL | `kallsortering-pegas` | Källsortering | Källsortering PEGAS | **Källsortering PEGAS** | — | PC 872 | PEGAS | Etablerat serienamn. Endast PC i underlaget. |
| BEHÅLL | `kallsortering-persei` | Källsortering | Källsortering PERSEI | **Källsortering PERSEI** | — | PC 8433 / SST 8400 | PERSEI | Etablerat serienamn. Live hade askkopp i typnamnet — funktion i spec. |
| BEHÅLL | `kallsortering-pisco` | Källsortering | Källsortering PISCO | **Källsortering PISCO** | — | PC 4519 / SST 4421 | PISCO | Etablerat serienamn. |
| BEHÅLL | `kallsortering-polaris` | Källsortering | Källsortering POLARIS | **Källsortering POLARIS** | — | PC 1121 / SST 1130 | POLARIS | Etablerat serienamn. Delar modellnamn med POLARIS nät (nätstomme är utförande). Sidorna slås inte ihop. |
| FÖRESLÅ | `kallsortering-polaris-nat` | Källsortering | Källsortering POLARIS nät | **Källsortering POLARIS** | — | PC 1137 / SST 1141 | POLARIS NAT | Nätstomme är utförande. Föreslagen titel samma som POLARIS — nät i spec. Eget slug och SKU 1137 kvar. |
| BEHÅLL | `kallsortering-pollux` | Källsortering | Källsortering POLLUX | **Källsortering POLLUX** | — | PC 990 / SST 996 | POLLUX | Etablerat serienamn. |
| BEHÅLL | `kallsortering-sajama` | Källsortering | Källsortering SAJAMA | **Källsortering SAJAMA** | — | PC 4308 / SST 3965 | SAJAMA | Etablerat serienamn. |
| BEHÅLL | `kallsortering-salliere` | Källsortering | Källsortering SALLIERE | **Källsortering SALLIERE** | — | PC 908 / SST 913 | SALLIERE | Etablerat serienamn. |
| BEHÅLL | `kallsortering-scopi` | Källsortering | Källsortering SCOPI | **Källsortering SCOPI** | — | PC 1040 / SST 1049 | SCOPI | Etablerat serienamn. |
| BEHÅLL | `kallsortering-singla` | Källsortering | Källsortering SINGLA | **Källsortering SINGLA** | — | PC 979 / SST 983 | SINGLA | Etablerat serienamn. |
| BEHÅLL | `kallsortering-spika` | Källsortering | Källsortering SPIKA | **Källsortering SPIKA** | — | PC 967 | SPIKA | Etablerat serienamn. Endast PC i underlaget. |
| BEHÅLL | `kallsortering-stella` | Källsortering | Källsortering STELLA | **Källsortering STELLA** | — | PC 1013 / SST 1020 | STELLA | Etablerat serienamn. |
| BEHÅLL | `kallsortering-tacora` | Källsortering | Källsortering TACORA | **Källsortering TACORA** | — | PC 5774 / SST 5677 | TACORA | Etablerat serienamn. Trä i spec. |
| BEHÅLL | `kallsortering-todi` | Källsortering | Källsortering TODI | **Källsortering TODI** | — | PC 1068 / SST 1076 | TODI | Etablerat serienamn. |
| BEHÅLL | `kallsortering-tolima` | Källsortering | Källsortering TOLIMA | **Källsortering TOLIMA** | — | PC 6155 / SST 6074 | TOLIMA | Etablerat serienamn. Trä i spec. |
| BEHÅLL | `kallsortering-triolet` | Källsortering | Källsortering TRIOLET | **Källsortering TRIOLET** | — | PC 919-1 / SST 929-1 | TRIOLET | Etablerat serienamn. |
| BEHÅLL | `kallsortering-zupo` | Källsortering | Källsortering ZUPO | **Källsortering ZUPO** | — | PC 1003 / SST 1007 | ZUPO | Etablerat serienamn. Live: Källsorteringsbehållare ZUPO — typ Källsortering enligt katalogen. |

## Cykelparkering / Cykelställ

3 produkter · BEHÅLL 0 · FÖRESLÅ 3

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| FÖRESLÅ | `cykelstall-enkel` | Cykelställ | Cykelställ i betong | **Cykelställ Trångsund** | — | 8 | Cykelställ i betong | Katalog 8. Inte live Vasastan/Bromma/Slussen. Inte Skogås (Relicons adress — skulle kunna läsas som ursprung). |
| FÖRESLÅ | `cykelstall-l` | Cykelställ | Cykelställ L-form | **Cykelställ Vendelsö** | — | 148 | Cykelställ L-form | Katalog 148, L-form. 4/5/6 platser är storleksvarianter på samma sida — delar namn. Platser i spec. |
| FÖRESLÅ | `cykelstall-betong` | Cykelställ | Cykelställ, 5 platser | **Cykelställ Dalarö** | — | 171 | Cykelställ, 5 platser | Katalog 171, 5 platser. Inte 148. |

## Plantering / Planteringskärl

37 produkter · BEHÅLL 0 · FÖRESLÅ 37

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| FÖRESLÅ | `planteringskarl-rektangel-60-46-53` | Planteringskärl | Kärl rektangulärt 60 × 46 × 53 cm | **Planteringskärl Hägersten** | — | 69 | Kärl rektangulärt 60 × 46 × 53 cm | Katalog 69. Mått i spec. Inte sammanslagen med andra rektanglar. |
| FÖRESLÅ | `planteringskarl-rektangel-80-50-35` | Planteringskärl | Kärl rektangulärt 80 × 50 × 35 cm | **Planteringskärl Västertorp** | — | 198 | Kärl rektangulärt 80 × 50 × 35 cm | Katalog 198. Egen serie. |
| FÖRESLÅ | `planteringskarl-rektangel-90-40-50` | Planteringskärl | Kärl rektangulärt 90 × 40 × 50 cm | **Planteringskärl Fruängen** | — | 9 | Kärl rektangulärt 90 × 40 × 50 cm | Katalog 9. Egen serie. |
| FÖRESLÅ | `planteringskarl-rektangel-100-40-40` | Planteringskärl | Kärl rektangulärt 100 × 40 × 40 cm | **Planteringskärl Mälarhöjden** | — | 231 | Kärl rektangulärt 100 × 40 × 40 cm | Katalog 231. Inte 217 (100 × 50 × 50) och inte 657 (AC 100 × 60 × 50). |
| FÖRESLÅ | `planteringskarl-rektangel-100-50-50` | Planteringskärl | Kärl rektangulärt 100 × 50 × 50 cm | **Planteringskärl Bredäng** | — | 217 | Kärl rektangulärt 100 × 50 × 50 cm | Katalog 217. Inte 231/657. |
| FÖRESLÅ | `planteringskarl-rektangel-121-61-48` | Planteringskärl | Kärl rektangulärt 121 × 61 × 48 cm | **Planteringskärl Sätra** | — | 58 | Kärl rektangulärt 121 × 61 × 48 cm | Katalog 58. Egen serie. |
| FÖRESLÅ | `planteringskarl-rektangel-124-39-39` | Planteringskärl | Kärl rektangulärt 124 × 39 × 39 cm | **Planteringskärl Vårberg** | — | 24 | Kärl rektangulärt 124 × 39 × 39 cm | Katalog 24. Egen serie. |
| FÖRESLÅ | `planteringskarl-rektangel-150-45-45` | Planteringskärl | Kärl rektangulärt 150 × 45 × 45 cm | **Planteringskärl Hägerstensåsen** | — | 188 | Kärl rektangulärt 150 × 45 × 45 cm | Katalog 188. Inte 216. |
| FÖRESLÅ | `planteringskarl-rektangel-150-50-50` | Planteringskärl | Kärl rektangulärt 150 × 50 × 50 cm | **Planteringskärl Nybohov** | — | 216 | Kärl rektangulärt 150 × 50 × 50 cm | Katalog 216. Inte 188. |
| FÖRESLÅ | `planteringskarl-rektangel-250-60-40` | Planteringskärl | Kärl rektangulärt 250 × 60 × 40 cm | **Planteringskärl Lövholmen** | — | 211 | Kärl rektangulärt 250 × 60 × 40 cm | Katalog 211. Egen serie. |
| FÖRESLÅ | `planteringskarl-fyrkant-50-50-35` | Planteringskärl | Kärl fyrkantigt 50 × 50 × 35 cm | **Planteringskärl Ekensberg** | — | 212 | Kärl fyrkantigt 50 × 50 × 35 cm | Katalog 212. Inte 166 (samma bas, annan höjd, eget nummer). |
| FÖRESLÅ | `planteringskarl-fyrkant-50-50-50` | Planteringskärl | Kärl fyrkantigt 50 × 50 × 50 cm | **Planteringskärl Reimersholme** | — | 166 | Kärl fyrkantigt 50 × 50 × 50 cm | Katalog 166. Inte 212. |
| FÖRESLÅ | `planteringskarl-fyrkant-60-60-50` | Planteringskärl | Kärl fyrkantigt 60 × 60 × 50 cm | **Planteringskärl Katarina** | — | 10 | Kärl fyrkantigt 60 × 60 × 50 cm | Katalog 10. Inte 656 (AC 60 × 60 × 50, annat nummer). |
| FÖRESLÅ | `planteringskarl-fyrkant-75-75-50` | Planteringskärl | Kärl fyrkantigt 75 × 75 × 50 cm | **Planteringskärl Södermalm** | — | 147 | Kärl fyrkantigt 75 × 75 × 50 cm | Katalog 147. Egen serie. Platsnamn är modellnamn, inte ursprung. |
| FÖRESLÅ | `planteringskarl-fyrkant-100-100-40` | Planteringskärl | Kärl fyrkantigt 100 × 100 × 40 cm | **Planteringskärl Östermalm** | — | 168 | Kärl fyrkantigt 100 × 100 × 40 cm | Katalog 168. Inte 612 (AC 100 × 100 × 70). |
| FÖRESLÅ | `planteringskarl-fyrkant-150-150-100` | Planteringskärl | Kärl fyrkantigt 150 × 150 × 100 cm | **Planteringskärl Norrmalm** | — | 176 | Kärl fyrkantigt 150 × 150 × 100 cm | Katalog 176. Egen serie. |
| FÖRESLÅ | `planteringskarl-sexkant-80-50` | Planteringskärl | Kärl sexkantigt 80 × 50 cm | **Planteringskärl Birkastan** | — | 59 | Kärl sexkantigt 80 × 50 cm | Katalog 59. Inte 134. |
| FÖRESLÅ | `planteringskarl-sexkant-80-40` | Planteringskärl | Kärl sexkantigt 80 × 40 cm | **Planteringskärl Atlas** | — | 134 | Kärl sexkantigt 80 × 40 cm | Katalog 134. Inte 59. |
| FÖRESLÅ | `planteringskarl-oval-100-50-50` | Planteringskärl | Kärl ovalt 100 × 50 × 50 cm | **Planteringskärl Sabbatsberg** | — | 177 | Kärl ovalt 100 × 50 × 50 cm | Katalog 177. Egen serie. |
| FÖRESLÅ | `planteringskarl-oval-120-40-40` | Planteringskärl | Kärl ovalt 120 × 40 × 40 cm | **Planteringskärl Karlberg** | — | 141 | Kärl ovalt 120 × 40 × 40 cm | Katalog 141. Inte 136. |
| FÖRESLÅ | `planteringskarl-oval-120-62-48` | Planteringskärl | Kärl ovalt 120 × 62 × 48 cm | **Planteringskärl Stadion** | — | 136 | Kärl ovalt 120 × 62 × 48 cm | Katalog 136. Inte 141. |
| FÖRESLÅ | `planteringskarl-oval-158-74-78` | Planteringskärl | Kärl ovalt 158 × 74 × 78 cm | **Planteringskärl Djurgården** | — | 90 | Kärl ovalt 158 × 74 × 78 cm | Katalog 90. Inte 91. Inte live Norra Djurgården (annan produkt). |
| FÖRESLÅ | `planteringskarl-oval-158-108-48` | Planteringskärl | Kärl ovalt 158 × 108 × 48 cm | **Planteringskärl Skeppsholmen** | — | 91 | Kärl ovalt 158 × 108 × 48 cm | Katalog 91. Inte 90. |
| FÖRESLÅ | `planteringskarl-rund-50-40` | Planteringskärl | Kärl rund 50 × 40 cm | **Planteringskärl Kastellholmen** | — | 223 | Kärl rund 50 × 40 cm | Katalog 223. Egen serie. |
| FÖRESLÅ | `planteringskarl-rund-60-60` | Planteringskärl | Kärl rund 60 × 60 cm | **Planteringskärl Blasieholmen** | — | 178 | Kärl rund 60 × 60 cm | Katalog 178. Inte 10/656. |
| FÖRESLÅ | `planteringskarl-rund-74-48` | Planteringskärl | Kärl rund 74 × 48 cm | **Planteringskärl Helgalunden** | — | 89 | Kärl rund 74 × 48 cm | Katalog 89. Egen serie. |
| FÖRESLÅ | `planteringskarl-rund-108-48` | Planteringskärl | Kärl rund 108 × 48 cm | **Planteringskärl Eriksdalslund** | — | 87 | Kärl rund 108 × 48 cm | Katalog 87. Egen serie. |
| FÖRESLÅ | `planteringskarl-rund-113-70` | Planteringskärl | Kärl rund 113 × 70 cm | **Planteringskärl Drakenberg** | — | 88 | Kärl rund 113 × 70 cm | Katalog 88. Egen serie. |
| FÖRESLÅ | `planteringskarl-rund-120-80` | Planteringskärl | Kärl rund 120 × 80 cm | **Planteringskärl Heleneborg** | — | 133 | Kärl rund 120 × 80 cm | Katalog 133. Inte 607 (rektangel 120). |
| FÖRESLÅ | `planteringskarl-75-60` | Planteringskärl | Kärl 75 × 60 cm | **Planteringskärl Långsjö** | — | 67 | Kärl 75 × 60 cm | Katalog 67. Egen serie. |
| FÖRESLÅ | `planteringskarl` | Planteringskärl | Kärl, 40 cm | **Planteringskärl Magelungen** | — | 183 | Kärl, 40 cm | Katalog 183, 40 cm. Egen serie. |
| FÖRESLÅ | `planteringskarl-rektangel-120` | Planteringskärl | Kärl rektangulärt 120 × 50 × 40 cm | **Planteringskärl Drevviken** | — | 607 | Kärl rektangulärt 120 × 50 × 40 cm | Katalog 607, arkitektonisk betong. Inte tvättade 120-kärl. |
| FÖRESLÅ | `planteringskarl-bage` | Planteringskärl | Kärl bågformat, 229,5 cm | **Planteringskärl Stensö** | — | 654 | Kärl bågformat, 229,5 cm | Katalog 654. Prislistan har även AC curved bench på samma nummer — den här sidan är kärlet. Inte en bänk. |
| FÖRESLÅ | `planteringskarl-kvadrat-60` | Planteringskärl | Kärl kvadratiskt 60 × 60 × 50 cm | **Planteringskärl Jarlaberg** | — | 656 | Kärl kvadratiskt 60 × 60 × 50 cm | Katalog 656, AC. Inte 10. |
| FÖRESLÅ | `planteringskarl-rektangel-100` | Planteringskärl | Kärl rektangulärt 100 × 60 × 50 cm | **Planteringskärl Finntorp** | — | 657 | Kärl rektangulärt 100 × 60 × 50 cm | Katalog 657, AC. Inte 231/217. |
| FÖRESLÅ | `planteringskarl-kvadrat-100` | Planteringskärl | Kärl kvadratiskt 100 × 100 × 70 cm | **Planteringskärl Nackanäs** | — | 612 | Kärl kvadratiskt 100 × 100 × 70 cm | Katalog 612, AC. Inte 168. |
| FÖRESLÅ | `planteringskarl-rektangel-160` | Planteringskärl | Kärl rektangulärt 160 × 60 × 50 cm | **Planteringskärl Kummelnäs** | — | 658 | Kärl rektangulärt 160 × 60 × 50 cm | Katalog 658, AC. Egen serie. |

## Pollare och räcken / Pollare

41 produkter · BEHÅLL 0 · FÖRESLÅ 41

| Status | Slug | Produkttyp | Nuvarande publikt namn | Föreslaget publikt namn | Publikt art.nr | Admin-SKU | Leverantörens namn (admin) | Anteckning |
|---|---|---|---|---|---|---|---|---|
| FÖRESLÅ | `pollare-fyrkant-119` | Pollare | Pollare fyrkantig 39 cm | **Pollare Kristineberg** | — | 119 | Pollare fyrkantig 39 cm | Katalog 119. 39 och 44 cm är höjdvarianter på samma sida — delar namn. Höjd i spec. |
| FÖRESLÅ | `pollare-fyrkant-57` | Pollare | Pollare fyrkantig 57 cm | **Pollare Fredhäll** | — | 12 | Pollare fyrkantig 57 cm | Katalog 12. Fyrkant 57 cm. Inte sammanslagen med andra fyrkanter p.g.a. liknande form. |
| FÖRESLÅ | `pollare-fyrkant-42` | Pollare | Pollare fyrkantig 42 cm | **Pollare Marieberg** | — | 13 | Pollare fyrkantig 42 cm | Katalog 13. Egen serie. |
| FÖRESLÅ | `pollare-fyrkant-60` | Pollare | Pollare fyrkantig 60 cm | **Pollare Essingen** | — | 14 | Pollare fyrkantig 60 cm | Katalog 14. Inte 37 (Pollare 60 cm, annat nummer). |
| FÖRESLÅ | `pollare-fyrkant-44` | Pollare | Pollare fyrkantig 44 cm, 40 × 40 cm | **Pollare Traneberg** | — | 17 | Pollare fyrkantig 44 cm, 40 × 40 cm | Katalog 17, 40 × 40 cm. Inte 21 (samma höjd 44 cm, annan bas 30 × 30). |
| FÖRESLÅ | `pollare-fyrkant-44-2` | Pollare | Pollare fyrkantig 44 cm, 30 × 30 cm | **Pollare Nockeby** | — | 21 | Pollare fyrkantig 44 cm, 30 × 30 cm | Katalog 21, 30 × 30 cm. Inte 17. |
| FÖRESLÅ | `pollare-fyrkant-47` | Pollare | Pollare fyrkantig 47 cm | **Pollare Äppelviken** | — | 27 | Pollare fyrkantig 47 cm | Katalog 27. Egen serie. |
| FÖRESLÅ | `pollare-fyrkant-88` | Pollare | Pollare fyrkantig 88 cm | **Pollare Smedslätten** | — | 35 | Pollare fyrkantig 88 cm | Katalog 35. Egen serie. |
| FÖRESLÅ | `pollare-fyrkant-58` | Pollare | Pollare fyrkantig 58 cm | **Pollare Ålsten** | — | 39 | Pollare fyrkantig 58 cm | Katalog 39. Egen serie. |
| FÖRESLÅ | `pollare-fyrkant-80` | Pollare | Pollare fyrkantig 80 cm | **Pollare Blackeberg** | — | 154 | Pollare fyrkantig 80 cm | Katalog 154. Inte rund 80 cm-pollarna 46/155/170. |
| FÖRESLÅ | `pollare-fyrkant-70` | Pollare | Pollare fyrkantig 70 cm | **Pollare Råcksta** | — | 169 | Pollare fyrkantig 70 cm | Katalog 169. Egen serie. |
| FÖRESLÅ | `pollare-fyrkant-83` | Pollare | Pollare fyrkantig 83 cm | **Pollare Hässelby** | — | 7 | Pollare fyrkantig 83 cm | Katalog 7. Saknas i prislistan 2026 EUR. Egen post ändå. |
| FÖRESLÅ | `pollare-sexkant-74` | Pollare | Pollare sexkantig 74 cm | **Pollare Spånga** | — | 01 | Pollare sexkantig 74 cm | Katalog 01. Sexkant. Inte åttkant 19 (samma höjd 74 cm, annan form). |
| FÖRESLÅ | `pollare-attkant-96` | Pollare | Pollare åttkantig 96 cm | **Pollare Tensta** | — | 03 | Pollare åttkantig 96 cm | Katalog 03. Åttkant. Egen serie. |
| FÖRESLÅ | `pollare-attkant-74` | Pollare | Pollare åttkantig 74 cm | **Pollare Akalla** | — | 19 | Pollare åttkantig 74 cm | Katalog 19. Inte sexkant 01. |
| FÖRESLÅ | `pollare-betong-60` | Pollare | Pollare 60 cm | **Pollare Husby** | — | 37 | Pollare 60 cm | Katalog 37. Inte fyrkant 14 och inte rund 11. |
| FÖRESLÅ | `pollare-rund-82` | Pollare | Pollare rund 82 cm, Ø 30 cm | **Pollare Hallonbergen** | — | 05 | Pollare rund 82 cm, Ø 30 cm | Katalog 05, Ø 30 cm. Inte 96 (Ø 40) och inte 142 (Ø 44) trots samma höjd 82 cm. |
| FÖRESLÅ | `pollare-rund-60` | Pollare | Pollare rund 60 cm, Ø 30 cm | **Pollare Huvudsta** | — | 11 | Pollare rund 60 cm, Ø 30 cm | Katalog 11. Delar modellnamn med 11A (samma Ø 30 cm, annan höjd — verifierad katalogvariant). Sidorna slås inte ihop. Inte övriga 60 cm-rundar (36, 97, 152, 227). |
| FÖRESLÅ | `pollare-rund-50` | Pollare | Pollare rund 50 cm, Ø 30 cm | **Pollare Huvudsta** | — | 11A | Pollare rund 50 cm, Ø 30 cm | Katalog 11A. Samma serie som 11. Höjd 50 cm i spec. Inte 150/266. |
| FÖRESLÅ | `pollare-rund-26` | Pollare | Pollare rund, två diametrar | **Pollare Råsunda** | — | 26 | Pollare rund, två diametrar | Katalog 26. Två diametrar (Ø 30 / 40 cm) på samma sida — delar namn. |
| FÖRESLÅ | `pollare-rund-60-2` | Pollare | Pollare rund 60 cm, Ø 30 / 20 cm | **Pollare Mörby** | — | 36 | Pollare rund 60 cm, Ø 30 / 20 cm | Katalog 36, Ø 30/20 cm. Inte 11. |
| FÖRESLÅ | `pollare-rund-56` | Pollare | Pollare rund 56 cm, Ø 28 cm | **Pollare Stocksund** | — | 38 | Pollare rund 56 cm, Ø 28 cm | Katalog 38. Egen serie. |
| FÖRESLÅ | `pollare-rund-80` | Pollare | Pollare rund 80 cm, Ø 40 cm | **Pollare Täby** | — | 46 | Pollare rund 80 cm, Ø 40 cm | Katalog 46, Ø 40 cm. Inte 155/170. |
| FÖRESLÅ | `pollare-rund-79` | Pollare | Pollare rund 79 cm, Ø 63 cm | **Pollare Vaxholm** | — | 52 | Pollare rund 79 cm, Ø 63 cm | Katalog 52, Ø 63 cm. Egen serie. |
| FÖRESLÅ | `pollare-rund-0` | Pollare | Pollare rund 61 cm, Ø 46 cm | **Pollare Lidingö** | — | 92 | Pollare rund 61 cm, Ø 46 cm | Katalog 92, Ø 46 cm. Inte 93 (samma diameter, annan höjd — egna nummer, inte belagd som samma serie). |
| FÖRESLÅ | `pollare-rund-52` | Pollare | Pollare rund 52 cm, Ø 46 cm | **Pollare Sticklinge** | — | 93 | Pollare rund 52 cm, Ø 46 cm | Katalog 93. Inte 92. |
| FÖRESLÅ | `pollare-rund-38` | Pollare | Pollare rund 38 cm, Ø 62 cm | **Pollare Gåshaga** | — | 94 | Pollare rund 38 cm, Ø 62 cm | Katalog 94, Ø 62 cm. Inte 95. |
| FÖRESLÅ | `pollare-rund-35` | Pollare | Pollare rund 35 cm, Ø 62 cm | **Pollare Brevik** | — | 95 | Pollare rund 35 cm, Ø 62 cm | Katalog 95. Inte 94. |
| FÖRESLÅ | `pollare-rund-82-2` | Pollare | Pollare rund 82 cm, Ø 40 cm | **Pollare Torsvik** | — | 96 | Pollare rund 82 cm, Ø 40 cm | Katalog 96, Ø 40 cm. Inte 05. |
| FÖRESLÅ | `pollare-rund-60-3` | Pollare | Pollare rund 60 cm, Ø 37 cm | **Pollare Hersby** | — | 97 | Pollare rund 60 cm, Ø 37 cm | Katalog 97, Ø 37 cm. Inte 11/36. |
| FÖRESLÅ | `pollare-rund-82-3` | Pollare | Pollare rund 82 cm, Ø 44 cm | **Pollare Käppala** | — | 142 | Pollare rund 82 cm, Ø 44 cm | Katalog 142, Ø 44 cm. Inte 05/96. |
| FÖRESLÅ | `pollare-rund-50-2` | Pollare | Pollare rund 50 cm, Ø 36 cm | **Pollare Baggeby** | — | 150 | Pollare rund 50 cm, Ø 36 cm | Katalog 150, Ø 36 cm. Inte 11A och inte 151. |
| FÖRESLÅ | `pollare-rund-63` | Pollare | Pollare rund 63 cm, Ø 36 cm | **Pollare Bodal** | — | 151 | Pollare rund 63 cm, Ø 36 cm | Katalog 151. Inte 150. |
| FÖRESLÅ | `pollare-rund-60-4` | Pollare | Pollare rund 60 cm, Ø 23 cm | **Pollare Larsberg** | — | 152 | Pollare rund 60 cm, Ø 23 cm | Katalog 152, Ø 23 cm. Inte övriga 60 cm. |
| FÖRESLÅ | `pollare-rund-80-2` | Pollare | Pollare rund 80 cm, Ø 36 cm | **Pollare Islinge** | — | 155 | Pollare rund 80 cm, Ø 36 cm | Katalog 155, Ø 36 cm. Inte 46/170. |
| FÖRESLÅ | `pollare-rund-107` | Pollare | Pollare rund 107 cm, Ø 42 cm | **Pollare Rudboda** | — | 167 | Pollare rund 107 cm, Ø 42 cm | Katalog 167. Egen serie. |
| FÖRESLÅ | `pollare-rund-80-3` | Pollare | Pollare rund 80 cm, Ø 35,5 cm | **Pollare Kottla** | — | 170 | Pollare rund 80 cm, Ø 35,5 cm | Katalog 170, Ø 35,5 cm. Inte 46/155. |
| FÖRESLÅ | `pollare-rund-60-5` | Pollare | Pollare rund 60 cm, Ø 37 / 27 cm | **Pollare Elfvik** | — | 227 | Pollare rund 60 cm, Ø 37 / 27 cm | Katalog 227. Prislistan har även AC-version — den här sidan är standard. Inte 11. |
| FÖRESLÅ | `pollare-rund-50-3` | Pollare | Pollare rund 50 cm, Ø 38 cm | **Pollare Näset** | — | 266 | Pollare rund 50 cm, Ø 38 cm | Katalog 266. Inte 11A/150. |
| FÖRESLÅ | `pollare-rund-613` | Pollare | Pollare rund, tre höjder | **Pollare Skärsätra** | — | 613 | Pollare rund, tre höjder | Katalog 613, arkitektonisk betong. Tre höjder (50/70/85 cm) på samma sida — delar namn. Inte tvättad-betong-rundarna. |
| FÖRESLÅ | `pollare-skylt` | Pollare | Pollare rund med fäste för skylt, 75 cm | **Pollare Skogsö** | — | 132 | Pollare rund med fäste för skylt, 75 cm | Katalog 132, fäste för skylt. Inte live-namnet Skylten (annan produkt, inte i denna katalog). Skyltfunktion i spec. |

## Verifierade serier som delar modellnamn

| Modell | Slug | Skäl |
|---|---|---|
| Parkbänk Sickla | `parkbank-arkitektur-sits`, `parkbank-arkitektur-rygg` | Samma katalognummer 601 / 601-ZO |
| Parkbänk Finnboda | `parkbank-arkitektur-200`, `parkbank-arkitektur-200-rygg` | Samma katalognummer 652 / 652-ZO |
| Pollare Huvudsta | `pollare-rund-60`, `pollare-rund-50` | 11 och 11A, samma Ø 30 cm |
| Schackbord Flemingsberg | `schackbord-stal`, `schackbord-betong` | Samma katalognummer 226, olika material |
| Källsortering ELM | `kallsortering-elm`, `kallsortering-elm-tra` | ELM trä är trävaryant av ELM |
| Källsortering POLARIS | `kallsortering-polaris`, `kallsortering-polaris-nat` | POLARIS nät är nätstomme av POLARIS |
| Papperskorg Rödberga | `papperskorg-rodberga-100` | 80/100 cm redan varianter på en sida |

Övriga med/utan rygg som egna sidor (t.ex. 670 och 671, Relicon Hammarby/Årsta) får **olika** modellnamn — samma mönster som Relicon, och sidorna är inte belagda som en enda serie i katalogen.

## Inte infört

Inga `name`-fält är uppdaterade. Godkänn listan innan namn appliceras.
