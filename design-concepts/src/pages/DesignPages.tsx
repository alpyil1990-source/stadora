import { Link } from 'react-router-dom'
import { BINSIGNIA_SLUGS, INVESTIM_SLUGS, STREETPARK_SLUGS, productPath } from '../data/content'
import { CatalogGate } from '../components/CatalogStatus'
import { useProductCatalog } from '../context/ProductCatalogContext'

export function DesignIndexPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Designkoncept</p>
        <h1 className="mt-2 text-3xl md:text-4xl">STADORA Specification Atlas</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Klickbar prototyp för informationsarkitektur, hybrid produktsida och offertflöde. Ingen
          produktion, ingen databas, inga påhittade certifikat.
        </p>
      </div>
      <section>
        <h2 className="text-xl">Skärmar att granska</h2>
        <ol className="mt-4 columns-1 gap-8 text-sm sm:columns-2">
          {[
            ['Avfallskatalog', '/design/binsignia'],
            ['Startsida offentlig miljö', '/'],
            ['Hela sortimentet (kategorier)', '/produkter'],
            ['Källsortering', '/produkter/avfall-atervinning/kallsortering'],
            ['Askkoppar (LUNA)', '/produkter/avfall-atervinning/askkoppar'],
            ['Lek och aktivitet', '/produkter/lek-aktivitet'],
            ['Utegym (intern testlistning)', '/intern'],
            ['Huvudkategori Parkmöbler', '/produkter/parkmobler'],
            ['Produktlista Parkbänkar', '/produkter/parkmobler/parkbankar'],
            ['Produktlista Betongbänkar', '/produkter/parkmobler/betongbankar'],
            ['Parkbänk Rogal', '/produkt/parkbank-rogal'],
            ['Parkbänk LAB.21.04', '/produkt/parkbank-lab-21-04'],
            ['Produktsida C hybrid (rekommenderas)', '/produkt/parkbank-arsta'],
            ['Produktsida A upphandling', '/design/produktsida-a'],
            ['Produktsida B arkitektur', '/design/produktsida-b'],
            ['Rödberga: storlek byter bild', '/produkt/papperskorg-rodberga-100'],
            ['LUNA: material + RAL', '/produkt/askkopp-luna'],
            ['ALBRIS källsortering', '/produkt/kallsortering-albris'],
            ['Offertlista', '/offertlista'],
            ['Offertformulär', '/offert'],
            ['Admin: VD-översikt', '/admin'],
            ['Admin: så går offerten till', '/admin/flode'],
            ['Admin: offertärenden', '/admin/offerter'],
            ['Kundens offertlänk (godkänn)', '/q/Q-2026-0164'],
            ['Admin: fakturor', '/admin/fakturor'],
            ['Admin: leverantörer', '/admin/leverantorer'],
            ['Admin: BINSIGNIA (Paula Stirbu)', '/admin/leverantorer/binsignia'],
            ['Admin: STREETPARK', '/admin/leverantorer/streetpark'],
            ['Admin: Inoplex (intern)', '/admin/leverantorer/inoplex'],
            ['Admin: ZANO', '/admin/leverantorer/zano'],
            ['Solstol DUO 02.052', '/produkt/solstol-duo-02-052'],
            ['ZANO parkbänkar', '/produkter/parkmobler/parkbankar'],
            ['Väntzon och korridor', '/produkter/vantzon-korridor'],
            ['V-Care Fold', '/produkt/v-care-fold'],
            ['Admin: Kusch+Co', '/admin/leverantorer/kusch-co'],
            ['Lekplatsutrustning', '/produkter/lek-aktivitet/lekplatsutrustning'],
            ['Kombinerad lektorn VZ1-006-15', '/produkt/kombinerad-lektorn-vz1-006-15'],
            ['Vippgunga båge PHP004', '/produkt/vippgunga-bage-php004'],
            ['Admin: VVZ-Play', '/admin/leverantorer/vvz-play'],
            ['Solstolar', '/produkter/parkmobler/solstolar'],
            ['Planteringskärl DO.23.02', '/produkt/planteringskarl-do-23-02'],
            ['Parkbänk LA.20.19', '/produkt/parkbank-la-20-19'],
            ['Intern översikt STREETPARK', '/design/streetpark'],
            ['Parkbänk FLORIA GRAND', '/produkt/parkbank-floria-grand'],
            ['Parkbänkar och pollare (intern översikt)', '/design/park-pollare'],
            ['Pollare', '/produkter/pollare-racken/pollare'],
            ['Cykelställ', '/produkter/cykelparkering/cykelstall'],
            ['Planteringskärl', '/produkter/plantering/planteringskarl'],
            ['Parkbänk i tvättad betong', '/produkt/parkbank-tvattad-rygg'],
            ['Miljö: bostadsgård', '/miljoer/bostadsgard'],
            ['Dokumentcenter', '/dokument'],
            ['Integritetspolicy', '/integritet'],
            ['Intern förhandsgranskning (NOVUM-test)', '/intern'],
            ['Intern Runner', '/intern/produkt/utegym-runner'],
            ['Intern Airwalker', '/intern/produkt/utegym-airwalker'],
            ['Dokumentkonto (test)', '/konto/skapa'],
            ['Admin: NOVUM', '/admin/leverantorer/novum'],
            ['Admin: dokumentkonton', '/admin/konton'],
            ['Admin: nedladdningslogg', '/admin/nedladdningar'],
            ['Tre designriktningar', '/design/riktningar'],
            ['Skola (pausad gren)', '/skola'],
            ['Vård (pausad gren)', '/vard'],
          ].map(([label, href]) => (
            <li key={href} className="break-inside-avoid border-b border-line py-2">
              <Link className="underline-offset-2 hover:underline" to={href}>
                {label}
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Mobil</h2>
        <p className="mt-2 text-muted">
          Prototypen är responsiv. Under 1024 px: hamburgermeny med accordion-kategorier, offertlista
          och primär knapp. Produktsidan har fast bottenbar för “Lägg i offertlista”. Öppna
          startsidan, listan och Årsta i ett smalt fönster eller i enhetens förhandsgranskning.
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Avfallskatalog</h2>
        <p className="mt-2 text-muted">
          54 serier från prislistan september 2026, med foton från leverantörens sajt. Inga priser
          och inga leverantörsartikelnummer på den publika sidan. EUR-lista i admin.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/design/binsignia">
            Intern översikt
          </Link>
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Parkbänkar och pollare</h2>
        <p className="mt-2 text-muted">
          Parkbänkar, pollare, cykelställ och planteringskärl från de skickade länkarna och
          betongpollar-listan. Fluorescerande pollare är undantagen. Inga priser och inga
          katalognummer på den publika sidan. Listpris, rabatt och netto ligger i intern admin.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/design/park-pollare">
            Intern översikt
          </Link>
          {' · '}
          <Link className="underline" to="/admin/leverantorer/investim">
            Inköpslista EUR
          </Link>
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">STREETPARK</h2>
        <p className="mt-2 text-muted">
          Parkbänkar, sittmöbler, papperskorgar, cykel- och sparkcykelställ, bord, picknickgrupper
          och pollare från streetpark.eu. Tillverkare STREETPARK syns inte på den publika
          produktsidan. Inga priser på den publika sidan. Listpris och inköpsnetto i EUR ligger i
          intern admin. Modellnamn syns publikt. Leverantörens artikelnummer syns bara i admin,
          inte på hemsidan eller offerten. Ritningar i avsnittet Dokument och underlag.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/design/streetpark">
            Intern översikt
          </Link>
          {' · '}
          <Link className="underline" to="/admin/leverantorer/streetpark">
            Inköpslista EUR
          </Link>
          {' · '}
          <Link className="underline" to="/produkt/cykelstall-bikeme">
            Cykelställ BIKEME
          </Link>
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">ZANO</h2>
        <p className="mt-2 text-muted">
          Parkmöbler, avfall, cykelzon, plantering, pollare, skyltar och pergolor från zano.se.
          Kategorin Övrigt (fågelmatare, lyktor, desinfektionsstationer) är inte importerad.
          Tillverkare: Zano står på produktsidan, inte i produktnamnet och inte på listkorten. Märkning på originalbilder och dokument är kvar.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/produkt/solstol-duo-02-052">
            Solstol DUO 02.052
          </Link>
          {' · '}
          <Link className="underline" to="/produkter/parkmobler/parkbankar">
            Parkbänkar
          </Link>
          {' · '}
          <Link className="underline" to="/produkter/parkmobler/bord-picknick">
            Bord och picknick
          </Link>
          {' · '}
          <Link className="underline" to="/produkter/parkmobler/solstolar">
            Solstolar
          </Link>
          {' · '}
          <Link className="underline" to="/admin/leverantorer/zano">
            Intern leverantörssida
          </Link>
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Kusch+Co / Nowy Styl</h2>
        <p className="mt-2 text-muted">
          Ett produktkort för vägghängd V-Care Fold i Väntzon och korridor, 1–4 sittplatser.
          Utförande är trä. Välj ytbehandling, stomkulör och fällmekanism. Tillverkare syns
          bara internt. Leverantörens produktkod syns bara i admin. Pris på förfrågan. Prislista
          endast intern.
          Inga golvstående Fold och inga vanliga V-Care-bänkar.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/produkt/v-care-fold">
            V-Care Fold
          </Link>
          {' · '}
          <Link className="underline" to="/produkter/vantzon-korridor/vagghangda-fallstolar">
            Vägghängda fällstolar och fällbänkar
          </Link>
          {' · '}
          <Link className="underline" to="/admin/leverantorer/kusch-co">
            Intern leverantörssida
          </Link>
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">VVZ-Play</h2>
        <p className="mt-2 text-muted">
          Lekplatsutrustning från wholesale pricelist 2026 — inte parkbänkar eller sopkärl.
          Underkategorier för inköp: lekställningar, gungor, vippgungor, rutschkanor, karuseller,
          fjäderlek, lekhus, klättring, tillgänglig lek och övrig lekplatsutrustning. Tillverkare
          syns bara internt. Leverantörens artikelnummer syns bara i admin, inte på hemsidan eller
          offerten. Pris på förfrågan. Listpris, 30 % rabatt och nettoinköp (list × 0,70) i intern
          admin. Certifikat endast internt. DWG för kund efter inloggning på STADORA. Originalbilder
          och dokument från vvz-play.com.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/produkter/lek-aktivitet/lekstallningar">
            Lekställningar
          </Link>
          {' · '}
          <Link className="underline" to="/produkter/lek-aktivitet/gungor">
            Gungor
          </Link>
          {' · '}
          <Link className="underline" to="/produkt/kombinerad-lektorn-vz1-006-15">
            Kombinerad lektorn
          </Link>
          {' · '}
          <Link className="underline" to="/produkt/vippgunga-bage-php004">
            Vippgunga båge
          </Link>
          {' · '}
          <Link className="underline" to="/admin/leverantorer/vvz-play">
            Intern leverantörssida
          </Link>
        </p>
      </section>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Kulör, storlek och bild</h2>
        <p className="mt-2 text-muted">
          En produktsida, väljare för storlek och kulör. Finns en bild märkt med valet byts
          huvudbilden. Saknas bild ligger exempelutförandet kvar, med en tydlig notis. Nya foton
          kommer från leverantörens länk i admin — inte från stadora.se. Skola och vård väntar.
        </p>
      </section>
    </div>
  )
}

export function BinsigniaDraftPage() {
  const { products } = useProductCatalog()
  const items = BINSIGNIA_SLUGS.map((slug) => products[slug]).filter(Boolean)
  const groups = [
    { name: 'Askkoppar', slug: 'askkoppar', href: '/produkter/avfall-atervinning/askkoppar' },
    { name: 'Källsortering', slug: 'kallsortering', href: '/produkter/avfall-atervinning/kallsortering' },
    { name: 'Papperskorgar', slug: 'papperskorgar', href: '/produkter/avfall-atervinning/papperskorgar' },
  ]

  return (
    <CatalogGate>
    <div className="space-y-10">
      <div>
        <p className="kicker">Intern översikt · avfall</p>
        <h1 className="mt-2 text-3xl md:text-4xl">Avfallskatalog</h1>
        <p className="mt-4 max-w-2xl text-muted">
          {items.length} serier från prislistan september 2026. Publika sidor visar namn, material och
          kapacitet — inte leverantör, inte EUR, inte leverantörens artikelnummer. PETALSTEEL finns
          på leverantörens webb men inte på prislistan och är inte importerad. Skola och vård väntar.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/leverantorer/binsignia">
            Intern EUR-lista och kontakt
          </Link>
        </p>
      </div>
      {groups.map((g) => {
        const rows = items.filter((p) => p.subcategorySlug === g.slug)
        return (
          <section key={g.slug}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl">
                {g.name} · {rows.length}
              </h2>
              <Link className="text-sm underline" to={g.href}>
                Öppna underkategorin
              </Link>
            </div>
            <ul className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2 lg:columns-3">
              {rows.map((p) => (
                <li key={p.slug} className="break-inside-avoid border-b border-line py-2">
                  <Link className="underline-offset-2 hover:underline" to={productPath(p)}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Vad som gäller</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>Foton från leverantörens sajt, inte från stadora.se.</li>
          <li>Kapacitet och mått från sidorna och prislistan september 2026.</li>
          <li>PC och SST som material. AISI 304 bara på rostfritt — inte på pulverlack.</li>
          <li>Inga priser och inga leverantörsartikelnummer på produktsidan.</li>
          <li>Ritningar och PDF-datablad publiceras inte. De lämnas per projekt.</li>
        </ul>
      </section>
    </div>
    </CatalogGate>
  )
}

export function InvestimDraftPage() {
  const { products } = useProductCatalog()
  const items = INVESTIM_SLUGS.map((slug) => products[slug]).filter(Boolean)
  const groups = [
    { name: 'Parkbänkar', slug: 'parkbankar', href: '/produkter/parkmobler/parkbankar' },
    { name: 'Betongbänkar', slug: 'betongbankar', href: '/produkter/parkmobler/betongbankar' },
    { name: 'Bord och picknick', slug: 'bord-picknick', href: '/produkter/parkmobler/bord-picknick' },
    { name: 'Modulära sitt', slug: 'modulara-sitt', href: '/produkter/parkmobler/modulara-sitt' },
    { name: 'Pollare', slug: 'pollare', href: '/produkter/pollare-racken/pollare' },
    { name: 'Cykelställ', slug: 'cykelstall', href: '/produkter/cykelparkering/cykelstall' },
    { name: 'Planteringskärl', slug: 'planteringskarl', href: '/produkter/plantering/planteringskarl' },
    { name: 'Papperskorgar', slug: 'papperskorgar', href: '/produkter/avfall-atervinning/papperskorgar' },
  ]

  return (
    <CatalogGate>
    <div className="space-y-10">
      <div>
        <p className="kicker">Intern översikt · park och pollare</p>
        <h1 className="mt-2 text-3xl md:text-4xl">Parkbänkar och pollare</h1>
        <p className="mt-4 max-w-2xl text-muted">
          {items.length} serier från prislistan 2026 EUR och de skickade produktsidorna.
          Fluorescerande pollare är inte importerad. Publika sidor visar namn, material och mått —
          inte leverantör, inte EUR, inte katalognummer.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/leverantorer/investim">
            Intern EUR-lista, rabatt och netto
          </Link>
        </p>
      </div>
      {groups.map((g) => {
        const rows = items.filter((p) => p.subcategorySlug === g.slug)
        return (
          <section key={g.slug}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl">
                {g.name} · {rows.length}
              </h2>
              <Link className="text-sm underline" to={g.href}>
                Öppna underkategorin
              </Link>
            </div>
            <ul className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2 lg:columns-3">
              {rows.map((p) => (
                <li key={p.slug} className="break-inside-avoid border-b border-line py-2">
                  <Link className="underline-offset-2 hover:underline" to={productPath(p)}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Vad som gäller</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>Foton från leverantörens sajt, inte från stadora.se.</li>
          <li>Arkitektonisk betong 10 %. Tvättad betong 20 %, bänkar 10 % (även stålbänkar). Papperskorg i tvättad granit med trä och stållock 5 %.</li>
          <li>Papperskorg i tvättad granit med trä och stållock 5 % — ingen sådan produkt i den här importen.</li>
          <li>Inga priser och inga katalognummer på produktsidan.</li>
          <li>Ritningar publiceras inte. De lämnas per projekt i offerten.</li>
        </ul>
      </section>
    </div>
    </CatalogGate>
  )
}

export function StreetparkDraftPage() {
  const { products } = useProductCatalog()
  const items = STREETPARK_SLUGS.map((slug) => products[slug]).filter(Boolean)
  const groups = [
    { name: 'Parkbänkar', slug: 'parkbankar', href: '/produkter/parkmobler/parkbankar' },
    { name: 'Modulära sitt', slug: 'modulara-sitt', href: '/produkter/parkmobler/modulara-sitt' },
    { name: 'Bord och picknick', slug: 'bord-picknick', href: '/produkter/parkmobler/bord-picknick' },
    { name: 'Papperskorgar', slug: 'papperskorgar', href: '/produkter/avfall-atervinning/papperskorgar' },
    { name: 'Askkoppar', slug: 'askkoppar', href: '/produkter/avfall-atervinning/askkoppar' },
    { name: 'Cykelställ', slug: 'cykelstall', href: '/produkter/cykelparkering/cykelstall' },
    { name: 'Pollare', slug: 'pollare', href: '/produkter/pollare-racken/pollare' },
  ]

  return (
    <CatalogGate>
    <div className="space-y-10">
      <div>
        <p className="kicker">Intern översikt · STREETPARK</p>
        <h1 className="mt-2 text-3xl md:text-4xl">STREETPARK i katalogen</h1>
        <p className="mt-4 max-w-2xl text-muted">
          {items.length} serier från streetpark.eu. Tillverkare syns inte på den publika sidan. Inga
          priser på den publika sidan. Leverantörens artikelnummer syns bara i admin. JPG-ritningar och
          produktblad går att öppna utan konto. DWG, RAR och övriga originalfiler kräver inloggning.
          Buss- och cykelväderskydd ingår inte.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/leverantorer/streetpark">
            Leverantör och intern EUR-lista
          </Link>
        </p>
      </div>
      {groups.map((g) => {
        const rows = items.filter((p) => p.subcategorySlug === g.slug)
        if (rows.length === 0) return null
        return (
          <section key={g.slug}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl">
                {g.name} · {rows.length}
              </h2>
              <Link className="text-sm underline" to={g.href}>
                Öppna underkategorin
              </Link>
            </div>
            <ul className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2 lg:columns-3">
              {rows.map((p) => (
                <li key={p.slug} className="break-inside-avoid border-b border-line py-2">
                  <Link className="underline-offset-2 hover:underline" to={productPath(p)}>
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
    </CatalogGate>
  )
}

export function DirectionsPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Visuella riktningar</p>
        <h1 className="mt-2 text-3xl">Tre uttryck, samma logotyp</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Prototypen kör riktning 2. Riktning 1 och 3 visas som jämförelse — inte som alternativa
          appar.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Direction
          id="1"
          title="Civic Continuity"
          rec={false}
          body="Sand, bläck, sage, Instrument Serif. Nära dagens Lovable-sajt. Tryggt för varumärket, riskerar magasin-känsla och låg täthet i spec-tabeller."
        />
        <Direction
          id="2"
          title="Specification Atlas"
          rec
          body="Papper, bläck, sage som enda accent. IBM Plex Sans / Manrope. Spec som tabell, produktfoto på neutral yta. Byggd för inköpare, ingenjör och arkitekt. Rekommenderas."
        />
        <Direction
          id="3"
          title="Nordic Project Gallery"
          rec={false}
          body="Fullbredd foto, mörkare ytor, Vestre-led. Starkt för landskapsarkitekt. Sämre läsbarhet för tabeller, vård och skolmöbler; tyngre bilder."
        />
      </div>
      <section className="grid gap-6 md:grid-cols-3">
        <Swatch name="Ink" value="#1C2B26" />
        <Swatch name="Sage" value="#5C7268" />
        <Swatch name="Paper" value="#F4F2EC" />
      </section>
    </div>
  )
}

function Direction({
  id,
  title,
  body,
  rec,
}: {
  id: string
  title: string
  body: string
  rec: boolean
}) {
  return (
    <article className={`border p-5 ${rec ? 'border-ink bg-sheet' : 'border-line'}`}>
      <p className="kicker">Riktning {id}{rec ? ' · vald' : ''}</p>
      <h2 className="mt-2 text-xl">{title}</h2>
      <p className="mt-3 text-sm text-muted">{body}</p>
    </article>
  )
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="border border-line">
      <div className="h-20" style={{ background: value }} />
      <p className="p-3 text-sm">
        {name} · {value}
      </p>
    </div>
  )
}
