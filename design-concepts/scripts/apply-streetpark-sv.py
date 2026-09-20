#!/usr/bin/env python3
"""Apply Swedish copy from STREETPARK English source. No invented specs."""

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
PARSED = Path("/tmp/streetpark/parsed-products.json")
UA = "STADORA-catalog-import/1.0 (Relicon AB; catalog@stadora.se)"

# Complete Swedish texts from the supplier pages. Location marketing omitted.
COPY: dict[str, dict[str, str]] = {
    "askkopp-d-n-a-ash": {
        "summary": "Askkopp D.N.A. ASH med fimpsläckare i rostfritt stål.",
        "description": "Askkopp D.N.A. ASH med fimpsläckare i rostfritt stål. Konstruktionen är avsedd för park, trafikmiljö och entréer. Utförande KDA102 har dessutom ett integrerat låsbart avfallskärl nertill med löstagbart galvaniserat innerkärl 10 l. Bärande konstruktion galvaniserad och pulverlackerad. Täckplåt i galvaniserad pulverlackerad plåt eller rostfri plåt. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Bärande konstruktion galvaniserad och pulverlackerad. Täckplåt i galvaniserad pulverlackerad plåt eller rostfri plåt.",
    },
    "askkopp-raila-ash": {
        "summary": "Askkopp RAILA ASH i samma formspråk som papperskorg RAILA.",
        "description": "Askkopp RAILA ASH i samma formspråk som papperskorg RAILA och hundavfallskärl RAILA DOG. Under den löstagbara rostfria plåten sitter ett galvaniserat löstagbart innerkärl, säkrat med stålwire. Bärande konstruktion galvaniserad och pulverlackerad. Täckplåt i rostfritt stål. Fyra hål i botten för förankring i underlaget. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Bärande konstruktion galvaniserad och pulverlackerad. Täckplåt i rostfritt stål. Fyra hål i botten för förankring i underlaget.",
    },
    "bord-betl": {
        "summary": "Bord BETL som komplement till bänkarna BETLA.",
        "description": "Bord BETL som komplement till bänkarna BETLA. Sidostycken i arkitektonisk betong. Skivan fästs via dolda galvaniserade beslag. Sidostycken i hård arkitektonisk betong. Bordsskiva av massiva trälister fästa i det galvaniserade beslaget med dolda rostfria skruvar. Beslaget skruvas i sidostyckena med kraftiga metriskskruvar. Benen har galvaniserade stålplattor med hål för förankring i underlaget. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Sidostycken i hård arkitektonisk betong. Bordsskiva av massiva trälister i galvaniserat beslag med dolda rostfria skruvar. Galvaniserade bottenplattor med hål för förankring.",
    },
    "bord-mat": {
        "summary": "Bord MAT med betongskiva på ett centralt metallben.",
        "description": "Bord MAT med betongskiva på ett centralt metallben. Skivan kan ha schackrutor eller Fia med knuff, gjutet med svart betong i den ljusa skivans matris. Finns i två utföranden: förankring i ytan eller under ytan. STREETPARK anger att kompletta grupper kan byggas med bänkar i förkortad längd 600 mm. Bärande konstruktion i galvaniserat stål, pulverlackerad. Bordsskivan är en tvåfärgad betongplatta fäst i det centrala benet. I fotens nederdel är en platta med hål för förankring svetsad. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Bärande konstruktion i galvaniserat stål, pulverlackerad. Tvåfärgad betongskiva fäst i centralt ben. Svetsad platta med hål för förankring i fotens nederdel.",
    },
    "bord-piko": {
        "summary": "Bord PIKO på T-ben, avsett att kombineras med STREETPARKs bänkar.",
        "description": "Bord PIKO på T-ben. STREETPARK anger att bordet kan kombineras med nästan alla bänkar i sortimentet. Fyra utföranden med olika träprofiler, samma som på bänkarna. Bärande konstruktion i galvaniserat stål, pulverlackerad. Skiva av massiva trälister eller brädor, fästa med rostfria skruvar. I benens nederdel svetsade armeringar med hål för förankring i underlaget. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Bärande konstruktion i galvaniserat stål, pulverlackerad. Skiva av massiva trälister eller brädor med rostfria skruvar. Svetsade armeringar med hål för förankring.",
    },
    "bord-sadko": {
        "summary": "Bord SADKO med massiv stålkonstruktion, avsett där vandalismrisken är hög.",
        "description": "Bord SADKO med massiv stålkonstruktion av kraftiga band avsedda att gjutas fast. STREETPARK anger användningen för platser med högre vandalismrisk, till exempel utmed cykelvägar. Konstruktion i galvaniserat stål, pulverlackerad. Bordsskiva av massiva träbrädor, infällda i konstruktionen och säkrade med metriskskruvar och muttrar. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Bordsskiva av massiva träbrädor, infällda och säkrade med metriskskruvar och muttrar.",
    },
    "picknickgrupp-gauss": {
        "summary": "Picknickgrupp GAUSS med sitsar och bordsskiva i kompaktlaminat.",
        "description": "Picknickgrupp GAUSS. STREETPARK beskriver den som ett utomhussystem med sits och bord, avsett för torg, parker, café- och restaurangträdgårdar, campus och rastplatser. Motståndskraft mot väder, enkel hantering och förvaring anges som egenskaper. Sits- och bordsytor kan kombineras med metallstomme i samma eller olika kulörer. Hål i bordsskivan för parasoll. Galvaniserad stålkonstruktion, pulverlackerad. Sitsdynor och bordsskiva i kompaktlaminatskivor. Kan ställas utan förankring eller förankras med gängstänger i rostfritt stål i förgjutna fundament. Formgivning: vinvin studio. Tillverkare: STREETPARK.",
        "material": "Galvaniserad stålkonstruktion, pulverlackerad. Sitsdynor och bordsskiva i kompaktlaminatskivor. Utan förankring, eller med gängstänger i rostfritt stål i förgjutna fundament.",
    },
    "picknickgrupp-jura": {
        "summary": "Picknickgrupp JURA i douglastall, 4000 × 4500 mm.",
        "description": "Picknickgrupp JURA av träprismor. STREETPARK anger yttermått 4000 × 4500 mm. Sättet beskrivs som picknickbord med bänkar, cykelställ och vilplats. Träet arbetar; sprickor ingår i materialets utseende enligt leverantören. Bärande konstruktion av sju fast hopfogade, obehandlade prismor i douglastall. Ytan är slät men obehandlad. De undre prismorna förankras dolt i betongfundament. På fast underlag, till exempel beläggning, behövs enligt leverantören ingen förankring. Formgivning: Pavel Jura. Tillverkare: STREETPARK.",
        "material": "Sju hopfogade, obehandlade prismor i douglastall. Slät men obehandlad yta. Undre prismor kan förankras dolt i betongfundament.",
    },
    "picknickgrupp-sibelo": {
        "summary": "Bordserie SIBELO som följer bänkarna SIBELA.",
        "description": "Bordserie SIBELO som följer bänkarna SIBELA. Betongsidostycken och enkel stomme. Bärande konstruktion i varmförzinkat stål. Skiva av längs- eller tvärlagda massiva träbrädor, fästa med rostfria skruvar. Stommen skruvas i betongsidostyckena med åtta metriskbultar. I sidostyckenas undersida fyra gängade hål för förankring i underlaget. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Varmförzinkat stål. Massiva träbrädor med rostfria skruvar. Åtta metriskbultar mot betongsidostycken. Fyra gängade hål i undersidan för förankring.",
    },
    "picknickgrupp-vega": {
        "summary": "Picknickgrupp VEGA med skurna metallsidor och träsitsar.",
        "description": "Picknickgrupp VEGA. Metallsidorna är skurna och, sett framifrån, delvis böjda inåt på bänkarna och utåt på bordet. STREETPARK anger att detaljen ökar komfort och styvhet. Sits och skiva förstärks med metallramar. Flera bords längder, en eller två bänkar, samt utförande med plats för rullstol. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och bordsskiva av massiva träbrädor med rostfria skruvar. Hål i botten för förankring i underlaget. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Sits och bordsskiva av massiva träbrädor med rostfria skruvar. Hål i botten för förankring.",
    },
    "cykelstall-bikeme": {
        "summary": "Cykelställ BIKEME med gummihylsa som skyddar lacken.",
        "description": "Cykelställ BIKEME. Enkelt stödsystem för cyklar med gummihylsa som skyddar lacken. Bärande konstruktion i galvaniserat stål, pulverlackerad. Gummihylsor trädda på den övre delen. I nederdelen två svetsade plattor med hål för förankring i underlaget. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Gummihylsor på den övre delen. Två svetsade bottenplattor med hål för förankring.",
    },
    "cykelstall-cdb": {
        "summary": "Cykelställ CDB, parkeringsstolpe med gummiremsa och låshål.",
        "description": "Cykelställ CDB. Parkeringsstolpe. Grundelementet är ett stålsvetsgods med gummiremsa som skyddar cykelramen. Hål upptill för cykellås. Under hålet sitter en cyklistsymbol; STREETPARK anger att den på begäran kan bytas mot stadssymbol. Bärande konstruktion i galvaniserat stål, pulverlackerad. Gummiremsa i EPDM, UV-beständig enligt leverantören. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Gummiremsa i EPDM, UV-beständig enligt leverantören.",
    },
    "cykelstall-probike": {
        "summary": "Modulärt cykelställ PROBIKE för fyra, sex eller åtta cyklar.",
        "description": "Modulärt cykelställ PROBIKE. Standard för fyra, sex eller åtta cyklar; fler platser kan beställas. Gummihylsa skyddar lacken. Ekonomiskt utförande utan gummi skydd finns enligt leverantören. Galvaniserad stålkonstruktion, pulverlackerad. Lamellerna kopplas med rostfria rör och skruvförband. Gummihylsor upptill. I nederdelen fyra svetsade rostfria plattor med hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Rostfria rör och skruvförband. Gummihylsor upptill. Fyra svetsade rostfria bottenplattor med hål för förankring.",
    },
    "cykelstall-rubig": {
        "summary": "Cykelställ RUBIG med låshål och förankringsplatta.",
        "description": "Cykelställ RUBIG. Stödsystem för säker låsning. Cyklistsymbol eller vertikal skåra kan användas för att föra igenom lås. Bärande konstruktion i varmförzinkat stål, kan pulverlackeras. I nederdelen svetsad förankringsplatta med fyra hål. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Varmförzinkat stål, kan pulverlackeras. Svetsad förankringsplatta med fyra hål.",
    },
    "cykelstall-sandwich": {
        "summary": "Cykelställ SANDWICH med gummiremsa och cyklistsymbol.",
        "description": "Cykelställ SANDWICH. Stålsvetsgods med gummiremsa som skyddar ramen. Cyklistsymbol på stället. Bärande konstruktion i galvaniserat stål, pulverlackerad. Gummiprofil med rektangulärt tvärsnitt i EPDM, UV-beständig enligt leverantören. Förankringsplatta i nederdelen. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Gummiprofil med rektangulärt tvärsnitt i EPDM. Förankringsplatta i nederdelen.",
    },
    "cykelstall-santo": {
        "summary": "Cykelställ SANTO med gummiprofil runtom och låshål.",
        "description": "Cykelställ SANTO. Stålsvetsgods med gummiprofil längs kanten. Hål i den utskurna metalldelen för cykellås. Text eller logotyp kan läggas i den gasskurna metalldelen enligt leverantören. Bärande konstruktion i galvaniserat stål, pulverlackerad. Gummiprofil med cirkulärt tvärsnitt i EPDM, UV-beständig. Förankringsplatta med fyra hål. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Gummiprofil med cirkulärt tvärsnitt i EPDM. Förankringsplatta med fyra hål.",
    },
    "cykelstall-tomi": {
        "summary": "Cykelställ TOMI i två storlekar, med eller utan gummiprofil.",
        "description": "Cykelställ TOMI. Stålsvetsgods med kvadratiskt tvärsnitt. Gummiprofil kan fästas på de inre vertikala sidorna och skyddar ramen. Två storlekar, båda med möjlighet till gummiremsa. STREETPARK anger placering i öppen yta eller till exempel under cykeltak. Bärande konstruktion i galvaniserat stål, pulverlackerad. Gummiprofil i EPDM, UV-beständig. Förankringsplattor i nederdelen. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Gummiprofil i EPDM. Förankringsplattor i nederdelen.",
    },
    "cykelstall-velone": {
        "summary": "Cykelställ VELONE för parkering från båda sidor, med träbrädor.",
        "description": "Cykelställ VELONE. Parkering av alla cykeltyper från båda sidor. Träbrädor skyddar lacken. Bärande konstruktion i galvaniserat stål, pulverlackerad. Brädor i massivträ. Förankringsplatta i nederdelen. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Brädor i massivträ. Förankringsplatta i nederdelen.",
    },
    "cykelstall-weldi": {
        "summary": "Cykelställ WELDI med längsgående rör som håller framhjulet.",
        "description": "Cykelställ WELDI. Cykeln står stadigt; längsgående rör hindrar framhjulet från att rulla, vilket enligt leverantören gör stället användbart även i måttlig lutning. Parkering från båda sidor. Låsning mot den massiva ramen. Vanligen fyra, sex eller åtta fack. Svetsad konstruktion i varmförzinkat eller rostfritt stål. Fyra hål i hörnen för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Svetsad konstruktion i varmförzinkat eller rostfritt stål. Fyra hål i hörnen för förankring.",
    },
    "sparkcykelstall-scooty": {
        "summary": "Sparkcykelställ SCOOTY för upp till fem sparkcyklar.",
        "description": "Sparkcykelställ SCOOTY för upp till fem sparkcyklar. Ställen kan kopplas till längre rader med ett kopplingselement. STREETPARK anger användning vid skolgårdar, lekplatser, förskolor, kulturhus och parker. Bärande konstruktion i galvaniserat stål, pulverlackerad. Övre del med urtag i kompaktlaminatskiva. Förankring med gängstänger i förgjutna betongfundament eller alternativt i vägg. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Övre del med urtag i kompaktlaminatskiva. Förankring med gängstänger i förgjutna fundament eller i vägg.",
    },
    "hundavfallskarl-d-n-a-dog": {
        "summary": "Hundavfallskärl D.N.A. DOG för pappers- och plastpåsar.",
        "description": "Hundavfallskärl D.N.A. DOG, påshållare för både pappers- och plastpåsar. Utförande KDA202 har integrerat avfallskärl med löstagbart galvaniserat innerkärl 10 l. Konstruktion galvaniserad och pulverlackerad. Lucka i galvaniserad pulverlackerad plåt eller rostfritt stål AISI 316. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserad och pulverlackerad konstruktion. Lucka i galvaniserad pulverlackerad plåt eller rostfritt stål AISI 316.",
    },
    "hundavfallskarl-raila-dog": {
        "summary": "Hundavfallskärl RAILA DOG för papperspåsar FEDOG och ECODOG.",
        "description": "Hundavfallskärl RAILA DOG i samma formspråk som papperskorg och askkopp RAILA. Avsett för papperspåsar FEDOG och ECODOG med integrerad liten skyffel. Utförande SRD2 har låda för papperspåsar och löstagbart galvaniserat kärl 15 l för använda påsar. Bärande konstruktion i galvaniserat stål, pulverlackerad. Täckplåt i rostfritt stål. Fyra hål i botten för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Täckplåt i rostfritt stål. Fyra hål i botten för förankring.",
    },
    "papperskorg-bas": {
        "summary": "Papperskorg BAS i fyrkant och cylinder, 35–70 liter.",
        "description": "Papperskorg BAS i enkla geometriska former. Fyra utföranden: kvadratisk vy 70 och 40 liter, samt cirkulär vy på sockel eller mittben 35 liter. Alla med eller utan uppfällbart lock. Locket kan förses med askkopp och fimpsläckare. Galvaniserad stålkonstruktion, pulverlackerad. Fyra hål i botten för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Fyra hål i botten för förankring.",
    },
    "papperskorg-bas-m": {
        "summary": "Papperskorg BAS M med perforerad plåt i stället för trä.",
        "description": "Papperskorg BAS M, samma grundformer som BAS men med perforerad plåt som mantel i stället för massivträ. Fyra utföranden: kvadratisk vy 70 och 40 liter, cirkulär vy på sockel eller mittben 35 liter. Med eller utan uppfällbart lock. Locket kan förses med askkopp och fimpsläckare. Galvaniserad stålkonstruktion, pulverlackerad. Fyra hål i botten för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Fyra hål i botten för förankring.",
    },
    "papperskorg-beko": {
        "summary": "Papperskorg BEKO i monolitiskt betong, inte förankrad.",
        "description": "Papperskorg BEKO. Tung monolitisk betongkorg, avsedd där vandalismrisken är hög. Löstagbart galvaniserat innerkärl. Metallskylt med kommunvapen eller annan grafik kan sättas på framsidan. Betong gjuten i form, klass C35/45. Metalldelar galvaniserade och pulverlackerade. Kärlet förankras inte; det använder egenvikten. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Betong gjuten i form, klass C35/45. Metalldelar galvaniserade och pulverlackerade. Löstagbart galvaniserat innerkärl. Fristående, egenvikt.",
    },
    "papperskorg-casla": {
        "summary": "Papperskorg CASLA i exponerad betong, natur eller antracit.",
        "description": "Papperskorg CASLA i exponerad betong, natur eller antracit. Kub med kvadratisk bas och fyra justerbara fötter. Utförande med låsbart tak och valfri fimpsläckare och askkopp, eller utan tak med färgat stålram. Fasbetong gjuten i silikonform, klass C35/45. Metalldelar galvaniserade med pulverlack som härdats i ugn. Löstagbart innerkärl i plast. I nederdelen fyra höjdjusterbara ben med plattor för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Fasbetong i silikonform, klass C35/45. Metall galvaniserad med ugnshärdad pulverlack. Löstagbart plastkärl. Fyra höjdjusterbara ben med förankringsplattor.",
    },
    "papperskorg-flexbin": {
        "summary": "Papperskorg FLEXBIN med utbyggbara funktioner.",
        "description": "Papperskorg FLEXBIN. STREETPARK anger att systemet kan kombineras med påshållare för hundavfall, kärl för sorterat avfall eller batterier. Galvaniserad stålkonstruktion, pulverlackerad. Innerkärl i polypropen. Fyra hål i botten för förankring under gatunivå. Formgivning: David Beke. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Innerkärl i polypropen. Fyra hål för förankring under gatunivå.",
    },
    "papperskorg-koln": {
        "summary": "Papperskorg KOLN i betong, kvadratisk bas som övergår i cirkel.",
        "description": "Papperskorg KOLN i betong, natur eller antracit. Kvadratisk bas som upptill övergår i cirkel. Med eller utan tak, valfri askkopp med fimpsläckare. Arkitektonisk betong gjuten i silikonform, klass C35/45. Metalldelar galvaniserade och pulverlackerade. Löstagbart galvaniserat innerkärl. Fyra höjdjusterbara ben med plattor för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Arkitektonisk betong i silikonform, klass C35/45. Metall galvaniserad och pulverlackerad. Löstagbart galvaniserat innerkärl. Fyra höjdjusterbara ben med förankringsplattor.",
    },
    "papperskorg-krouk": {
        "summary": "Papperskorg KROUK i höghållfast betong med perforerat mönster.",
        "description": "Papperskorg KROUK i höghållfast betong (HSC) gjuten i silikonform. Gjuttekniken ger ett perforerat plåtmönster. Utrymme i mitten för kommunvapen, logotyp eller ortnamn. Två identiska betongdelar hopfogade med metallelement som också fäster valfritt gångjärnslock. Natur eller antracit. Metallkulör från STREETPARKs kulörkarta. Metalldelar galvaniserade och pulverlackerade. Löstagbart galvaniserat innerkärl. Fyra höjdjusterbara fötter. Förankring i gatunivå via platta som sitter i den plåt som fogar betongdelarna. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Höghållfast betong (HSC) i silikonform. Metall galvaniserad och pulverlackerad. Löstagbart galvaniserat innerkärl. Fyra höjdjusterbara fötter. Förankring via fogplåtens platta.",
    },
    "papperskorg-mag": {
        "summary": "Papperskorg MAG med eller utan lock, på ben eller sockel.",
        "description": "Papperskorg MAG. Med eller utan lock, med askkopp och fimpsläckare, på ben eller sockel, tre volymer samt kombination för källsortering. Front i horisontella eller vertikala trälister, plåt, perforerad plåt eller rostfritt stål. Löstagbart polypropenkärl. Galvaniserad stålkonstruktion, pulverlackerad. Fyra hål i ben eller sockel för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Löstagbart polypropenkärl. Fyra hål i ben eller sockel för förankring.",
    },
    "papperskorg-raila": {
        "summary": "Papperskorg RAILA med låsbar lucka och löstagbart polypropenkärl.",
        "description": "Papperskorg RAILA. Stålkropp med låsbar lucka framtill och löstagbart polypropenkärl. Två kulörer, två volymer, tak med fimpsläckare och askkopp, samt treenigt kärl för källsortering. Bärande konstruktion i galvaniserat stål, pulverlackerad. Lucka pulverlackerad, med träpanel eller i rostfritt stål. Fyra hål i botten för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Lucka pulverlackerad, med träpanel eller rostfri. Fyra hål i botten för förankring.",
    },
    "papperskorg-robust": {
        "summary": "Papperskorg ROBUST i gasskuret stål och sträckmetall.",
        "description": "Papperskorg ROBUST i gasskurna ståldelar och grov sträckmetall. Låsbart lock med inkast skyddar löstagbart polypropenkärl. Galvaniserad konstruktion, pulverlackerad. Fyra hål i botten för förankring. Formgivning: Ondřej Smolík, Jaromír Kosnar. Tillverkare: STREETPARK.",
        "material": "Galvaniserad konstruktion, pulverlackerad. Löstagbart polypropenkärl. Fyra hål i botten för förankring.",
    },
    "papperskorg-stadium": {
        "summary": "Papperskorg STADIUM, enkel eller för källsortering.",
        "description": "Papperskorg STADIUM. Enkla kärl och kärl för sorterat avfall. Främre låsbar lucka i vertikala trälister, plåt eller perforerad plåt. Med eller utan integrerad fimpsläckare och askkopp. Galvaniserad stålkonstruktion, pulverlackerad. Hål i benets nederdel för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Hål i benets nederdel för förankring.",
    },
    "papperskorg-strok": {
        "summary": "Papperskorg STROK av sju betongringar.",
        "description": "Papperskorg STROK av sju betongringar. Med eller utan gångjärnstak. Arkitektonisk betong gjuten i silikonform, klass C30/37. Ringarna bildar en helhet, förstärkt med tre gängstänger M10. Metalldelar galvaniserade och pulverlackerade. Löstagbart galvaniserat innerkärl. Tre höjdjusterbara ben. Förankring behövs inte på grund av vikten, enligt leverantören. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Arkitektonisk betong i silikonform, klass C30/37. Tre gängstänger M10. Metall galvaniserad och pulverlackerad. Löstagbart galvaniserat innerkärl. Tre höjdjusterbara ben. Fristående, egenvikt.",
    },
    "papperskorg-zet": {
        "summary": "Papperskorg ZET, cylinder på asymmetriskt ben, ljusstolpe eller sockel.",
        "description": "Papperskorg ZET. Cylinderform på asymmetriskt ben, ljusstolpe eller sockel, med uppfällbart lock och inkast. Två varianter: inkast uppifrån eller framifrån. Påshållare för hundavfall kan fästas bak. Galvaniserad konstruktion, pulverlackerad. Löstagbart galvaniserat innerkärl. Fyra hål i botten för förankring under marknivå. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserad konstruktion, pulverlackerad. Löstagbart galvaniserat innerkärl. Fyra hål för förankring under marknivå.",
    },
    "parkbank-aluma": {
        "summary": "Parkbänk ALUMA med sidostycken i aluminiumlegering.",
        "description": "Parkbänk ALUMA. Sidostycken i aluminiumlegering med mjuka kurvor för sits och rygg. Sidostycken i aluminiumlegering och längsgående förbindning i galvaniserat stål kan pulverlackeras. Sits och rygg i massiva trälister, fästa med rostfria skruvar. Fyra hål i benen för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Sidostycken i aluminiumlegering. Längsgående förbindning i galvaniserat stål, kan pulverlackeras. Massiva trälister med rostfria skruvar. Fyra hål i benen för förankring.",
    },
    "parkbank-audito": {
        "summary": "Sittmodul AUDITO i två eller tre höjdnivåer.",
        "description": "Sittmodul AUDITO. Modulärt utomhussitt i två eller tre höjdnivåer. Enheterna kan läggas i raka linjer eller böjda förlopp. STREETPARK anger användning för vilytor, mindre utomhusauditorier och informella mötesytor. Bärande konstruktion i galvaniserat stål med pulverlack. Sittyta av massiva trälister med rostfria skruvar. Bas med hål för förankring i mark. Formgivning: vinvin studio och Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål med pulverlack. Massiva trälister med rostfria skruvar. Bas med hål för förankring.",
    },
    "parkbank-babia": {
        "summary": "Parkbänk BABIA, helmetall med sits och rygg i en stomme.",
        "description": "Parkbänk BABIA. Helmetall, sits och rygg i en stomme. Två basutföranden. STREETPARK anger användning vid trafikbyggnader och köpcentrum, eller där trä inte är lämpligt. Galvaniserad sits med rygg: stålsvetsgods av precisionsbearbetade bränndetaljer och stänger, pulverlackerat. Förankring i fyra eller åtta punkter beroende på bas. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stålsvetsgods, pulverlackerat. Förankring i fyra eller åtta punkter beroende på bas.",
    },
    "parkbank-berga": {
        "summary": "Parkbänk BERGA med två lamellbredder, även dubbelsidig.",
        "description": "Parkbänk BERGA. Två lamellbredder. Dubbelsidig finns. Klassisk och dubbelsidig även i helmetall eller med träsits och metallrygg. Sittryggen viks uppåt, vilket leverantören beskriver som ergonomiskt. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och rygg av massiva träbrädor med rostfria skruvar, eller galler av stål-U-profiler. Fyra ben för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Sits och rygg av massiva träbrädor med rostfria skruvar, eller galler av stål-U-profiler. Fyra ben för förankring.",
    },
    "parkbank-betla": {
        "summary": "Parkbänk BETLA med sidostycken i arkitektonisk betong.",
        "description": "Parkbänk BETLA. Sidostycken i arkitektonisk betong. Sits och rygg fästs via dolt galvaniserat metallbeslag. Sidostycken i massiv arkitektonisk betong. Sits och rygg i massivträ, fästa i beslaget med dolda rostfria skruvar. Beslaget skruvas i sidostyckena med kraftiga metriskskruvar. Galvaniserade stålplattor på benen med hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Sidostycken i massiv arkitektonisk betong. Massivträ i galvaniserat beslag med dolda rostfria skruvar. Galvaniserade bottenplattor med hål för förankring.",
    },
    "parkbank-bled": {
        "summary": "Sittelement BLED i arkitektonisk betong, med eller utan LED.",
        "description": "Sittelement BLED i arkitektonisk betong, fyra utföranden i två delar. Övre sits kan sitta på basben — då kan LED-lister fästas underifrån. Alternativt vilar sitsen på en bas med samma mått, avsett för grupper. Sits i arkitektonisk betong klass C 35/45. Förankring krävs inte på grund av vikten. I benets nederdel fyra hål för pinnar som lägesfixerar. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Arkitektonisk betong klass C 35/45. Fristående, egenvikt. Fyra hål i benet för lägesfixerande pinnar.",
    },
    "parkbank-bordo": {
        "summary": "Parkbänk BORDO av vertikala profiler, kan kopplas till rader.",
        "description": "Parkbänk BORDO av vertikalt staplade profiler med metall- och gummimellanlägg. Kantmellanläggen fungerar som bas. Stommen fästs med dolda gängstänger. Bänkar kan kopplas till rader, kvadrater, trianglar eller förankras mot vägg. Sidobord som tillval. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och rygg av massiva träbrädor med rostfria gängstänger och skruvar. Fyra hål i botten för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva träbrädor med rostfria gängstänger och skruvar. Fyra hål i botten för förankring.",
    },
    "parkbank-borola": {
        "summary": "Parkbänk BOROLA med sidostycken i aluminiumlegering.",
        "description": "Parkbänk BOROLA. Böjda sidostycken i aluminiumlegering och vågig sitslamell med rygg som slutar i bänkens bakkant. Sidostycken i aluminiumlegering, natur eller pulverlackerade. Sits med rygg i massiva trälister, fästa med rostfria skruvar. Fyra hål i basen för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Sidostycken i aluminiumlegering, natur eller pulverlackerade. Massiva trälister med rostfria skruvar. Fyra hål i basen för förankring.",
    },
    "parkbank-cube": {
        "summary": "Sittelement CUBE i stål, tillverkat av restprofiler.",
        "description": "Sittelement CUBE. STREETPARK anger att det görs av stålrester — kapbitar av fyrkantsprofiler från övrig tillverkning. Kubformen kan stå ensam eller grupperas. Bärande konstruktion i galvaniserat stål med pulverlack som härdats i ugn. Bas med fyra hål för förankring. Formgivning: Přemysl Pospíšil. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål med pulverlack som härdats i ugn. Bas med fyra hål för förankring.",
    },
    "parkbank-dina": {
        "summary": "Parkbänk DINA med integrerade armstöd i stommen.",
        "description": "Parkbänk DINA med integrerade armstöd i den bärande stommen. Träelement mellan de böjda metallsidorna. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och rygg i massivträ med rostfria skruvar. Fyra hål i nederdelen för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Sits och rygg i massivträ med rostfria skruvar. Fyra hål för förankring.",
    },
    "parkbank-ekta": {
        "summary": "Parkbänk EKTA med sidoväggar i stålplåt och sned ryggstomme.",
        "description": "Parkbänk EKTA. Sidoväggar i stålplåt bär stommen där träbrädorna fästs. Rektangeln bryts av en sned linje — ryggens bärande konstruktion. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och rygg av massiva träbrädor med rostfria skruvar. Fyra ben med hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva träbrädor med rostfria skruvar. Fyra ben med hål för förankring.",
    },
    "parkbank-floria-grand": {
        "summary": "Parkbänk FLORIA GRAND i betong, trä och stål, med integrerade planteringsdelar.",
        "description": "Parkbänk FLORIA GRAND. Kombination av arkitektonisk betong, trä och stål. Integrerade planteringsdelar. Alla bänktyper med planteringsdelar och olika baser kan ställas ensamma eller kopplas i 30°, 45°, 60° och 90°. Bärande konstruktion i galvaniserat stål med pulverlack som härdats i ugn. Sits av massiva trälister med rostfria skruvar. Planteringsdelar i UHPC-betong (Ultra-High Performance Concrete), armerad med kompositfibrer. Betongens kulör kan variera och förändras över tid. Ytan kan ha porer eller mikrosprickor, vilket enligt leverantören ingår i betongens karaktär. Formgivning: Tomáš Vacek. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål med pulverlack som härdats i ugn. Massiva trälister med rostfria skruvar. Planteringsdelar i UHPC-betong armerad med kompositfibrer.",
    },
    "parkbank-gradua": {
        "summary": "Parkbänk GRADUA, sittkuddar i olika längd, bredd och höjd.",
        "description": "Parkbänk GRADUA. Gruppering av sitsar i olika längd, bredd och höjd, som kan kombineras fritt. Vissa mått har ryggstöd. STREETPARK anger användning där många unga rör sig. Galvaniserad stålkonstruktion, pulverlackerad. Sits och rygg av massiva trälister med rostfria skruvar. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva trälister med rostfria skruvar.",
    },
    "parkbank-inoa": {
        "summary": "Parkbänk INOA, rak eller rund, med eller utan armstöd och rygg.",
        "description": "Parkbänk INOA. Många utföranden: med eller utan armstöd, med eller utan rygg, trälister eller brädor. Runda utföranden med rygg som komplement till linjära, till exempel runt ett träd. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och rygg i massiva trälister med rostfria skruvar. Fyra ben med hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva trälister med rostfria skruvar. Fyra ben med hål för förankring.",
    },
    "parkbank-nisha": {
        "summary": "Parkbänk NISHA med sidostycken i gjutjärn.",
        "description": "Parkbänk NISHA. Rundad våg av sits och rygg i olika brädabredder, buren av två gjutjärnsgjutningar. Sidostycken i gjutjärn, pulverlackerade. Sits och rygg av massivträ i olika bredder, fästa med rostfria skruvar. Kraftiga armeringar i marken för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Sidostycken i gjutjärn, pulverlackerade. Massivträ i olika brädabredder med rostfria skruvar. Armeringar i marken för förankring.",
    },
    "parkbank-radiano": {
        "summary": "Parkbänk RADIANO utan rygg, rak eller bågformad.",
        "description": "Parkbänk RADIANO utan rygg. Bågform kan slutas till cirkel, till exempel runt ett träd, eller bilda kurvor med raka och böjda delar. Utförande med isatta ben eller väggmontage. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits av massiva trälister med rostfria skruvar. Fyra hål för förankring i varje ben. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva trälister med rostfria skruvar. Fyra hål för förankring i varje ben.",
    },
    "parkbank-robusta": {
        "summary": "Parkbänk ROBUSTA med betongsidostycken och limmat trä.",
        "description": "Parkbänk ROBUSTA. Massiv sits och rygg av limmade profiler på två betongsidostycken. Fogarna trä–betong har metallelement så att bänken kan monteras på plats. Formen är avsedd för högre sittställning på ryggen med fötterna på sitsen. Sidostycken i massiv arkitektonisk betong. Sits och rygg som prismor av limmat massivträ i galvaniserat beslag med dolda rostfria skruvar. Beslaget fästs i sidostyckena med gängstänger. I sidostyckenas nederdel fyra hål för pinnar som lägesfixerar. Formgivning: Ondřej Smolík, Jaromír Kosnar. Tillverkare: STREETPARK.",
        "material": "Sidostycken i massiv arkitektonisk betong. Limmat massivträ i galvaniserat beslag med dolda rostfria skruvar. Hål för lägesfixerande pinnar.",
    },
    "parkbank-rosty": {
        "summary": "Parkbänk ROSTY utan armstöd, sits av trälister i olika längd.",
        "description": "Parkbänk ROSTY utan armstöd. Sits av massivträlistor i olika längd, hopsatta till en skiva med rostfria gängstänger och distanser. Skivan fästs i galvaniserad stomme med rostfria skruvar. Stommen pulverlackerad. Fyra ben med hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Sits av massivträlistor med rostfria gängstänger och distanser. Galvaniserad stomme, pulverlackerad. Fyra ben med hål för förankring.",
    },
    "parkbank-sadka": {
        "summary": "Parkbänk SADKA i 8 mm laserskuren stålplåt, avsedd där vandalismrisken är hög.",
        "description": "Parkbänk SADKA. Stålkonstruktion av laserskurna 8 mm-plåtar, avsedd att förankras i underkonstruktion under mark. STREETPARK anger användning vid cykelvägar, utsatta bostadsområden och översvämningskänsliga lägen på grund av minimerad sidoprofil. Galvaniserat stål, pulverlackerat. Sits och rygg av massiva träbrädor, klämda mellan metalldelar och säkrade med rostfria skruvar. Ben avslutade under mark med plattor för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva träbrädor klämda mellan metalldelar med rostfria skruvar. Ben med underjordiska förankringsplattor.",
    },
    "parkbank-sibela": {
        "summary": "Parkbänk SIBELA med smala betongsidostycken och träbrädor.",
        "description": "Parkbänk SIBELA. Smala betongsidostycken. Längs- eller tvärlagda träribbor, två längder, två bredder och en bågformad bänk. Raka utföranden med längsgående ribbor och rygg finns. Bärande konstruktion i varmförzinkat stål. Sits och rygg av massiva träbrädor med rostfria skruvar. Stommen fästs i betongsidostyckena med åtta metriskbultar. I undersidan fyra gängade hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Varmförzinkat stål. Massiva träbrädor med rostfria skruvar. Åtta metriskbultar mot betongsidostycken. Fyra gängade hål för förankring.",
    },
    "parkbank-twistula": {
        "summary": "Parkbänk TWISTULA i ett massivt trästycke, med eller utan vridning.",
        "description": "Parkbänk TWISTULA. Objekt format som ett hugget stockblock, med synlig vridning. Andra utföranden saknar vridningen. Ryggstöd och helmetallarmstöd som tillval. Ett stycke massivträ med två galvaniserade baser underifrån, rostfria skruvar. Rygg och armstöd fästs i sitsen. Bearbetat trä; sprickor och kvistar förekommer. Ytan kan vara grov. Träet grånar till nästan svart utomhus, enligt leverantören. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Ett stycke massivträ. Två galvaniserade baser med rostfria skruvar. Träet grånar utomhus enligt leverantören.",
    },
    "parkbank-vega": {
        "summary": "Parkbänk VEGA med skurna metallsidor, med eller utan rygg.",
        "description": "Parkbänk VEGA. Metallsidor skurna och delvis böjda inåt eller utåt. Flera längder, med eller utan rygg. Picknickgrupper med en eller två bänkar och utförande för rullstol finns i serien. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits, rygg och bordsskiva av massiva träbrädor med rostfria skruvar. Hål i botten för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva träbrädor med rostfria skruvar. Hål i botten för förankring.",
    },
    "parkbank-vela": {
        "summary": "Parkbänk VELA med vågig lamellsits.",
        "description": "Parkbänk VELA. Flera utföranden. Lamellvåg som sits. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits och rygg i massiva trälister med rostfria skruvar. Fyra hål i nederdelen för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva trälister med rostfria skruvar. Fyra hål för förankring.",
    },
    "sitto-penta-islands": {
        "summary": "Sittö PENTA ISLANDS, kan kopplas och kombineras med planteringskärl.",
        "description": "Sittö PENTA ISLANDS. Kombinationer av sitsar, även med planteringskärl. Bärande konstruktion i galvaniserat stål, pulverlackerad. Sits av massiva träbrädor med rostfria skruvar. Sitsarna kopplas med rostfria förbindningar. Ben med justerbara hål för förankring. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Galvaniserat stål, pulverlackerat. Massiva träbrädor med rostfria skruvar. Rostfria kopplingar. Ben med justerbara hål för förankring.",
    },
    "pollare-jeko": {
        "summary": "Pollare JEKO, rektangulärt tvärsnitt med runt hål upptill.",
        "description": "Pollare JEKO. Rektangulärt tvärsnitt med runt hål upptill. Fällbar variant finns. Stålkonstruktion, pulverlackerad. I nederdelen svetsad fläns med hål för förankring under marknivå. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Stål, pulverlackerat. Svetsad fläns med hål för förankring under marknivå.",
    },
    "pollare-katao": {
        "summary": "Pollare KATAO i arkitektonisk betong, variabelt tvärsnitt.",
        "description": "Pollare KATAO i arkitektonisk betong, variabelt tvärsnitt. Dekorelement kan sättas i övre delen. Stadsvapen kan gjutas in i stolpen. Arkitektonisk betong i silikonform, klass C30/37, naturlig betongkulör. Metalldelar galvaniserade. Nederdelen vidgas till fläns med fyra hål för förankring under marknivå. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Arkitektonisk betong i silikonform, klass C30/37, naturlig betongkulör. Metall galvaniserad. Fläns med fyra hål för förankring under marknivå.",
    },
    "pollare-simple": {
        "summary": "Pollare SIMPLE, runt tvärsnitt, fast eller löstagbar förankring.",
        "description": "Pollare SIMPLE. Runt tvärsnitt. Fast eller löstagbar förankring. Stålkonstruktion varmförzinkad eller pulverlackerad. I nederdelen svetsad fläns med hål för förankring under marknivå, eller förlängning för direkt ingjutning. Formgivning: Jan Padrnos. Tillverkare: STREETPARK.",
        "material": "Stål, varmförzinkat eller pulverlackerat. Svetsad fläns för förankring under mark, eller förlängning för ingjutning.",
    },
}

SUM_PHRASES = [
    ("metal construction", "metallkonstruktion"),
    ("stainless steel door", "dörr i rostfritt stål"),
    ("removable galvanised container", "löstagbart galvaniserat innerkärl"),
    ("removable galvanized container", "löstagbart galvaniserat innerkärl"),
    ("galvanised container", "galvaniserat innerkärl"),
    ("bench without backrest", "bänk utan ryggstöd"),
    ("benches without backrest", "bänkar utan ryggstöd"),
    ("bench with backrest", "bänk med ryggstöd"),
    ("open pot", "öppen planteringsdel"),
    ("covered pot", "täckt planteringsdel"),
    ("steel leg", "stålben"),
    ("stand with rubber sleeve", "ställ med gummihylsa"),
    ("without the rubber protection", "utan gummiskydd"),
    ("with rubber sleeve", "med gummihylsa"),
    ("with rubber strip", "med gummiremsa"),
    ("without rubber strip", "utan gummiremsa"),
    ("fold-down", "fällbar"),
    ("fixed", "fast"),
    ("removable", "löstagbar"),
    ("with lid", "med lock"),
    ("without lid", "utan lock"),
    ("with roof", "med tak"),
    ("without roof", "utan tak"),
    ("ashtray", "askkopp"),
    ("cigarette extinguisher", "fimpsläckare"),
    ("on a leg", "på ben"),
    ("on a plinth", "på sockel"),
    ("wooden", "trä"),
    ("perforated", "perforerad"),
    ("sheet metal", "stålplåt"),
    ("stainless steel", "rostfritt stål"),
]


def encode_iri(url: str) -> str:
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, quote(unquote(parts.path), safe="/-_.~"), parts.query, parts.fragment))


def translate_summary(text: str | None) -> str | None:
    if not text:
        return None
    out = text
    for src, dst in sorted(SUM_PHRASES, key=lambda x: len(x[0]), reverse=True):
        out = re.sub(re.escape(src), dst, out, flags=re.I)
    return out.strip()


def classify_doc(doc: dict) -> dict:
    blob = f"{doc.get('title','')} {doc.get('href','')} {doc.get('sourceUrl','')}".lower()
    fmt = (doc.get("format") or "").upper()
    cad_fmt = fmt in {"RAR", "ZIP", "DWG", "DXF", "STEP", "STP", "IGS", "IGES", "3DS", "SKP"}
    if "anchor" in blob or "kotveni" in blob:
        doc["kind"] = "anchoring"
        doc["typeLabel"] = "Förankringsanvisning"
    elif "data sheet" in blob or "datasheet" in blob or "product-sheet" in blob or "product sheet" in blob:
        doc["kind"] = "datasheet"
        doc["typeLabel"] = "Produktblad"
    elif "2d" in blob or ("drawing" in blob and fmt in {"JPG", "JPEG", "PNG", "WEBP", "PDF", "DWG", "DXF"}):
        doc["kind"] = "drawing"
        doc["typeLabel"] = "Måttritning"
    elif "perspective" in blob or ("3d" in blob and fmt in {"JPG", "JPEG", "PNG", "WEBP"}):
        doc["kind"] = "perspective"
        doc["typeLabel"] = "3D-perspektivbild"
    elif fmt in {"DWG", "DXF"}:
        doc["kind"] = "cad"
        doc["typeLabel"] = "CAD"
    elif "3d" in blob and cad_fmt:
        doc["kind"] = "cad"
        doc["typeLabel"] = "3D-/CAD-underlag"
    elif cad_fmt:
        doc["kind"] = "cad"
        doc["typeLabel"] = "3D-/CAD-underlag"
    return doc


def retry_all_missing(series: list[dict], parsed: list[dict]) -> int:
    by_slug = {p["slug"]: p for p in parsed}
    ok = 0
    for row in series:
        p = by_slug.get(row["slug"])
        if not p:
            continue
        have_urls = {im.get("sourceUrl") for im in row["images"]}
        dest_dir = PUBLIC / "images" / "streetpark" / row["slug"]
        dest_dir.mkdir(parents=True, exist_ok=True)
        on_disk = {f.name for f in dest_dir.glob("*") if f.is_file()}
        for img in p.get("images") or []:
            url = img["sourceUrl"]
            fname = re.sub(r"[^A-Za-z0-9._-]+", "-", unquote(url.split("/")[-1]))
            if url in have_urls and fname in on_disk:
                continue
            dest = dest_dir / fname
            if dest.exists() and dest.stat().st_size > 0:
                if url not in have_urls:
                    item = {
                        "src": f"/images/streetpark/{row['slug']}/{fname}",
                        "alt": img.get("alt") or f"{row['name']}, STREETPARK",
                        "kind": "studio",
                        "sourceUrl": url,
                        "fetchedAt": row.get("fetchedAt"),
                    }
                    if img.get("size"):
                        item["size"] = img["size"]
                    row["images"].append(item)
                continue
            try:
                req = Request(encode_iri(url), headers={"User-Agent": UA})
                with urlopen(req, timeout=60) as resp:
                    data = resp.read()
                dest.write_bytes(data)
                item = {
                    "src": f"/images/streetpark/{row['slug']}/{fname}",
                    "alt": img.get("alt") or f"{row['name']}, STREETPARK",
                    "kind": "studio",
                    "sourceUrl": url,
                    "fetchedAt": row.get("fetchedAt"),
                }
                if img.get("size"):
                    item["size"] = img["size"]
                if not any(im["src"] == item["src"] for im in row["images"]):
                    row["images"].append(item)
                ok += 1
                print("got", row["slug"], fname, len(data))
            except Exception as exc:  # noqa: BLE001
                print("still missing", row["slug"], url, exc)
    return ok


def main() -> None:
    missing = sorted(set(json.loads(PARSED.read_text())[i]["slug"] for i in range(len(json.loads(PARSED.read_text())))) - set(COPY))
    # simpler:
    parsed = json.loads(PARSED.read_text())
    parsed_slugs = {p["slug"] for p in parsed}
    copy_slugs = set(COPY)
    print("copy", len(COPY), "parsed", len(parsed_slugs), "missing copy", sorted(parsed_slugs - copy_slugs))
    data = json.loads(SERIES.read_text())
    for row in data["series"]:
        c = COPY.get(row["slug"])
        if not c:
            print("NO COPY", row["slug"])
            continue
        row["summary"] = c["summary"]
        row["description"] = c["description"]
        row["material"] = c["material"]
        for size in row.get("sizes") or []:
            size["summary"] = translate_summary(size.get("summary"))
        for doc in row.get("documents") or []:
            classify_doc(doc)
            if doc.get("appliesTo") is None:
                doc.pop("appliesTo", None)
            if doc.get("variant") is None:
                doc.pop("variant", None)
        en = next((p.get("descriptionEn", "") + " " + (p.get("materialEn") or "") for p in parsed if p["slug"] == row["slug"]), "")
        mount = []
        t = en.lower()
        if "not anchored" in t or "does not have to be anchored" in t or "uses its own weight" in t or "not necessary to anchor" in t:
            mount.append("Fristående. Egenvikt enligt leverantören.")
        if "possible pins" in t or "preventing it from" in t:
            mount.append("Hål för pinnar som lägesfixerar enligt leverantören.")
        if "fold-down" in t:
            mount.append("Fällbar variant enligt modell.")
        if "removable anchoring" in t or "fixed or removable" in t:
            mount.append("Fast eller löstagbar förankring enligt modell.")
        if "pre-cast" in t or "pre-concreted" in t:
            mount.append("Förankring med gängstänger i gjutet fundament enligt STREETPARKs underlag.")
        if "direct concreting" in t:
            mount.append("Alternativt ingjutning enligt leverantören.")
        if "holes for anchoring" in t or "anchor plate" in t or "anchoring to the base" in t or "anchored to the" in t or "flange with holes" in t:
            if not any("Förankr" in x or "förankr" in x or "Fristående" in x for x in mount):
                mount.append("Förankras i underlaget enligt STREETPARKs underlag.")
        elif "without the need for anchoring" in t:
            mount.append("Kan ställas utan förankring, eller förankras enligt leverantörens underlag.")
        row["mounting"] = mount

    retried = retry_all_missing(data["series"], parsed)
    data["counts"]["images"] = sum(len(r["images"]) for r in data["series"])
    data["counts"]["documents"] = sum(len(r["documents"]) for r in data["series"])
    data["counts"]["unicodeRetried2"] = retried
    kinds = {}
    for r in data["series"]:
        for d in r["documents"]:
            kinds[d["kind"]] = kinds.get(d["kind"], 0) + 1
    data["counts"]["docKinds"] = kinds
    SERIES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    leftover = [r["slug"] for r in data["series"] if re.search(r"\b(the|and|with|from|which|this)\b", r["description"])]
    print("leftover english", leftover)
    print("counts", data["counts"])


if __name__ == "__main__":
    main()
