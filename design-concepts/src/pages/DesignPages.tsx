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
            ['Startsida offentlig miljö', '/'],
            ['Hela sortimentet (kategorier)', '/produkter'],
            ['Lek och aktivitet', '/produkter/lek-aktivitet'],
            ['Gungor (tom underkategori)', '/produkter/lek-aktivitet/gungor'],
            ['Lekställningar', '/produkter/lek-aktivitet/lekstallningar'],
            ['Huvudkategori Parkmöbler', '/produkter/parkmobler'],
            ['Produktlista Parkbänkar', '/produkter/parkmobler/parkbankar'],
            ['Produktsida C hybrid (rekommenderas)', '/produkt/parkbank-arsta'],
            ['Produktsida A upphandling', '/design/produktsida-a'],
            ['Produktsida B arkitektur', '/design/produktsida-b'],
            ['Askkopp LUNA med varianter', '/produkt/askkopp-luna'],
            ['Offertlista', '/offertlista'],
            ['Offertformulär', '/offert'],
            ['Miljö: bostadsgård', '/miljoer/bostadsgard'],
            ['STADORA Vård startsida', '/vard'],
            ['Akutvagn Genius', '/vard/produkt/akutvagn-genius'],
            ['STADORA Skola startsida', '/skola'],
            ['Ada, skolprodukt med luckor', '/skola/produkt/ada-melaminskap'],
            ['Dokumentcenter', '/dokument'],
            ['Tre designriktningar', '/design/riktningar'],
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
