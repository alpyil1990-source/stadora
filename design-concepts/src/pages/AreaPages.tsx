import { Link } from 'react-router-dom'
import { careProducts, products } from '../data/content'
import { ProductCard } from '../components/ProductCard'

export function CareHomePage() {
  return (
    <div className="space-y-14">
      <section className="max-w-2xl">
        <p className="kicker">STADORA Vård</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Utrustning för professionella vårdmiljöer</h1>
        <p className="mt-5 text-muted">
          Vagnar, förvaring, avskärmning och vårdmöbler för sjukhus, kliniker och omsorg. Samma
          varumärke som STADORA, eget sortiment och egen offertlista.
        </p>
        <div className="mt-7 flex gap-3">
          <Link
            to="/vard/produkt/akutvagn-genius"
            className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
          >
            Utforska sortimentet
          </Link>
          <Link to="/offert" className="border border-ink px-5 py-3 text-sm">
            Begär offert
          </Link>
        </div>
      </section>
      <section>
        <p className="kicker">Produktområden</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {['Vagnar', 'Förvaring', 'Avskärmning', 'Vårdmöbler'].map((n) => (
            <div key={n} className="border border-line bg-sheet p-4">
              {n}
            </div>
          ))}
        </div>
      </section>
      <section>
        <p className="kicker">Verifierade produkter</p>
        <h2 className="mt-2 text-2xl">Nio produkter i live-sortimentet</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Texterna nedan är hämtade från stadora.se. Inga extra certifikat har lagts till.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {careProducts.map((p) =>
            'images' in p ? (
              <ProductCard key={p.slug} product={products['akutvagn-genius']} />
            ) : (
              <article key={p.slug} className="border border-line bg-sheet p-5">
                <p className="kicker">{p.category}</p>
                <h3 className="mt-2 text-lg">{p.name}</h3>
                <p className="mt-2 text-sm text-muted">{p.summary}</p>
              </article>
            ),
          )}
        </div>
      </section>
    </div>
  )
}

export function SchoolHomePage() {
  return (
    <div className="space-y-14">
      <section className="max-w-2xl">
        <p className="kicker">STADORA Skola</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Möbler för skola och förskola</h1>
        <p className="mt-5 text-muted">
          Eget affärsområde, skilt från utemiljö och vård. Offertlista och filter delas inte med
          lekplats eller akutvagnar.
        </p>
      </section>
      <section className="grid gap-8 lg:grid-cols-2">
        <ProductCard product={products['ada-melaminskap']} />
        <div className="border border-line bg-sheet p-6">
          <p className="kicker">Publiceringsstatus</p>
          <p className="mt-3 text-sm text-muted">
            Live-sajten har ett stort skolsortiment (Mirplay, Gerom). Många poster har unik
            identitet men korta, upprepade texter. De klassas som “publicera men förbättra” i
            inventeringen — inte som utkast, men inte heller som färdiga spec-sidor.
          </p>
          <p className="mt-3 text-sm text-muted">
            Ada visas som exempel: kulörer är verifierade. Mått saknas på sidan och utelämnas.
          </p>
        </div>
      </section>
    </div>
  )
}

export function EnvironmentPage() {
  return (
    <div className="space-y-10">
      <p className="kicker">Miljöer</p>
      <h1 className="text-4xl">Bostadsgård</h1>
      <p className="max-w-2xl text-muted">
        Typmiljö — inte ett påhittat referensprojekt. Produkter länkas bara när de är verifierade.
        Riktiga projekt publiceras när foto, plats och produktlista är bekräftade.
      </p>
      <img src="/images/env-gaard.jpg" alt="Bostadsgård" className="aspect-[16/8] w-full object-cover" />
      <section>
        <h2 className="text-2xl">Produkter som ofta specificeras tillsammans</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <ProductCard product={products['parkbank-arsta']} />
          <ProductCard product={products['parkbank-hammarby']} />
          <ProductCard product={products['papperskorg-rodberga-100']} />
        </div>
      </section>
    </div>
  )
}

export function DocumentsPage() {
  return (
    <div className="max-w-2xl">
      <p className="kicker">Dokument och underlag</p>
      <h1 className="mt-2 text-3xl">Centret är tomt tills filerna är verifierade</h1>
      <p className="mt-4 text-muted">
        På den publicerade sajten är <code>/dokument</code> 404 och dessutom blockerad i robots.txt.
        Inga PDF, DWG eller certifikat hämtades från produktsidorna.
      </p>
      <p className="mt-4 text-sm">
        När dokument finns ska varje fil visa typ, språk, format, versionsnummer och datum. Visa
        aldrig “finns på begäran” utan bekräftelse.
      </p>
      <div className="mt-8 border border-dashed border-line p-6 text-sm text-muted">
        Exempel på rad när ett datablad finns: Datablad · Svenska · PDF · v1.2 · 2026-03-12
      </div>
    </div>
  )
}
