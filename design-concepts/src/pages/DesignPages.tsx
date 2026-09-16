import { Link } from 'react-router-dom'

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
            ['BINSIGNIA-utkast (5 produkter)', '/design/binsignia'],
            ['Startsida offentlig miljö', '/'],
            ['Hela sortimentet (kategorier)', '/produkter'],
            ['Källsortering (ALBRIS, BERNINA, EIGER, GEMINI)', '/produkter/avfall-atervinning/kallsortering'],
            ['Askkoppar (LUNA)', '/produkter/avfall-atervinning/askkoppar'],
            ['Lek och aktivitet', '/produkter/lek-aktivitet'],
            ['Gungor (tom underkategori)', '/produkter/lek-aktivitet/gungor'],
            ['Lekställningar', '/produkter/lek-aktivitet/lekstallningar'],
            ['Huvudkategori Parkmöbler', '/produkter/parkmobler'],
            ['Produktlista Parkbänkar', '/produkter/parkmobler/parkbankar'],
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
            ['Miljö: bostadsgård', '/miljoer/bostadsgard'],
            ['Dokumentcenter', '/dokument'],
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
        <h2 className="text-lg">BINSIGNIA-utkast</h2>
        <p className="mt-2 text-muted">
          Fem modeller med foton från binsignia.com, Paula Stirbu som kontakt och intern EUR-lista.
          Inga priser på den publika sidan. Resten av sortimentet väntar på att du godkänner utkastet.
        </p>
        <p className="mt-3">
          <Link className="underline" to="/design/binsignia">
            Granska de fem produkterna
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
  const items = [
    {
      slug: 'askkopp-luna',
      name: 'LUNA',
      why: 'Askkopp, en kapacitet. Visar material PC/SST, RAL och enkel SKU per material.',
      href: '/produkt/askkopp-luna',
    },
    {
      slug: 'kallsortering-albris',
      name: 'ALBRIS',
      why: 'Modulär källsortering, 12 konfigurationer, perforerad front.',
      href: '/produkt/kallsortering-albris',
    },
    {
      slug: 'kallsortering-bernina',
      name: 'BERNINA',
      why: 'Enklare rak station — samma kapacitetsgrid, annan kropp.',
      href: '/produkt/kallsortering-bernina',
    },
    {
      slug: 'kallsortering-eiger',
      name: 'EIGER',
      why: 'Food court 3 × 100 l med brickyta. En enda storlek.',
      href: '/produkt/kallsortering-eiger',
    },
    {
      slug: 'kallsortering-gemini',
      name: 'GEMINI',
      why: 'Källsortering med askkopp för gård och terrass.',
      href: '/produkt/kallsortering-gemini',
    },
  ]

  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Utkast · inte hela katalogen</p>
        <h1 className="mt-2 text-3xl md:text-4xl">Fem BINSIGNIA-produkter</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Paula Stirbu har gett tillstånd att använda produktfoton, beskrivningar och övergripande
          specifikationer på stadora.se. Det här är fem modeller så att du kan se hur serie, material,
          kapacitet och intern prislista sitter innan vi tar in resterande cirka 100 modeller.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.slug} className="border border-line bg-sheet p-5">
            <p className="kicker">{item.name}</p>
            <p className="mt-2 font-medium">
              <Link className="underline" to={item.href}>
                Öppna produktsidan
              </Link>
            </p>
            <p className="mt-2 text-sm text-muted">{item.why}</p>
          </li>
        ))}
      </ul>
      <section className="border border-line bg-sheet p-6 text-sm">
        <h2 className="text-lg">Vad som ligger i utkastet</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          <li>Foton hämtade från binsignia.com, inte från stadora.se.</li>
          <li>Kapacitet och mått från tillverkarens sidor och prislista september 2026.</li>
          <li>PC och SST som material. AISI 304 bara på rostfritt — inte på pulverlack.</li>
          <li>Inga priser på produktsidan. EUR-lista, rabatt 15/22/30 % och fraktregler i admin.</li>
          <li>
            Kontakt: Paula Stirbu, FORWARD SUPPORT SRL, Vulcan / Brașov.{' '}
            <Link className="underline" to="/admin/leverantorer/binsignia">
              Öppna leverantörskortet
            </Link>
          </li>
          <li>Ritningar och PDF-datablad publiceras inte. De lämnas per projekt enligt mejlet.</li>
        </ul>
      </section>
      <section className="border border-dashed border-line p-6 text-sm">
        <h2 className="text-lg">Inte inlagt än</h2>
        <p className="mt-2 text-muted">
          Resterande modeller på binsignia.com (ELM, ZUPO, ARIZARO, DENALI med flera), skola och vård.
          Säg till när de fem ser rätt ut så tar vi nästa batch.
        </p>
      </section>
    </div>
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
