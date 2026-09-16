import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

export function DesignIndexPage() {
  const { theme } = useTheme()

  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Designkoncept</p>
        <h1 className="mt-2 text-3xl md:text-4xl">
          {theme === 'atelje' ? 'STADORA Ateljé' : 'STADORA Specification Atlas'}
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Klickbar prototyp för informationsarkitektur, hybrid produktsida och offertflöde. Ingen
          produktion, ingen databas, inga påhittade certifikat. Växla uttryck uppe i listen — Ateljé
          är det nya ljusa spåret, Atlas det tidigare.
        </p>
        <div className="mt-5">
          <ThemeToggle />
        </div>
      </div>
      <section>
        <h2 className="text-xl">Skärmar att granska</h2>
        <ol className="mt-4 columns-1 gap-8 text-sm sm:columns-2">
          {[
            ['Startsida offentlig miljö', '/'],
            ['Huvudkategori Parkmöbler', '/produkter/parkmobler'],
            ['Produktlista med filter', '/produkter/parkmobler/parkbankar'],
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
  const { theme } = useTheme()

  return (
    <div className="space-y-10">
      <div>
        <p className="kicker">Visuella riktningar</p>
        <h1 className="mt-2 text-3xl">Tre uttryck, samma logotyp</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Ateljé är det ljusa alternativa spåret i prototypen. Atlas ligger ett klick bort om Ateljé
          inte passar. Mörk bakgrund används inte.
        </p>
        <div className="mt-5">
          <ThemeToggle />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Direction
          id="Ateljé"
          title="Ljust ateljéuttryck"
          rec={theme === 'atelje'}
          body="Kalksten, kol och tegelröd accent. Syne + Figtree. Foto i fullbredd med vit textplatta, stående produktkort utan ram. Sage bara i logotypen. Live i prototypen."
        />
        <Direction
          id="Atlas"
          title="Specification Atlas"
          rec={theme === 'atlas'}
          body="Papper, bläck, sage som enda accent. IBM Plex Sans / Manrope. Spec som tabell, produktfoto på neutral yta. Det tidigare spåret — finns kvar som växel."
        />
        <Direction
          id="—"
          title="Civic Continuity"
          rec={false}
          body="Sand, bläck, sage, Instrument Serif. Nära dagens Lovable-sajt. Inte byggt som körbart tema."
        />
      </div>
      <section className="grid gap-6 md:grid-cols-3">
        {theme === 'atelje' ? (
          <>
            <Swatch name="Kalksten" value="#F3EEE4" />
            <Swatch name="Tegel" value="#C45C2A" />
            <Swatch name="Kol" value="#1B1914" />
          </>
        ) : (
          <>
            <Swatch name="Ink" value="#1C2B26" />
            <Swatch name="Sage" value="#5C7268" />
            <Swatch name="Paper" value="#F4F2EC" />
          </>
        )}
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
      <p className="kicker">
        {id}
        {rec ? ' · visas nu' : ''}
      </p>
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
