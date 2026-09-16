import { Link } from 'react-router-dom'
import { benches, binsigniaDraft } from '../data/content'
import { ProductCard } from '../components/ProductCard'

export function HomePage() {
  return (
    <div className="space-y-20">
      <section className="grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker">Offentlig miljö</p>
          <h1 className="mt-3 max-w-xl text-4xl leading-tight md:text-5xl">
            Underlag för park, torg och gård — inte en varukorg.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Produkter för kommun, fastighet, arkitekt och entreprenad. Samla ett projekt i
            offertlistan. Pris lämnas i offert.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/produkter"
              className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
            >
              Utforska sortimentet
            </Link>
            <Link
              to="/offert"
              className="border border-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            >
              Begär offert
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          <img
            src="/images/hero.jpg"
            alt="Offentlig utemiljö med sittplatser och plantering"
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="kicker">Ingång efter uppdrag</p>
            <h2 className="mt-2 text-2xl md:text-3xl">Vad gäller projektet?</h2>
          </div>
          <Link to="/produkter" className="text-sm underline">
            Alla kategorier
          </Link>
        </div>
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Park och torg', 'Bänkar och sitt för högt slitage.', '/produkter/parkmobler'],
            ['Avfall', 'Kärl och stationer för gård och gata.', '/produkter/avfall-atervinning'],
            ['Cykelparkering', 'Ställ, tak och service. Underkategorier finns, produkterna är utkast.', '/produkter/cykelparkering'],
            ['Lek och aktivitet', 'Gungor, lekställ, lekhus. Klicka in — även tomma hyllor.', '/produkter/lek-aktivitet'],
          ].map(([title, text, href]) => (
            <Link key={title} to={href} className="bg-sheet p-6 hover:bg-paper">
              <h3 className="text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="kicker">Utkast · avfall</p>
        <h2 className="mt-2 text-2xl md:text-3xl">Fem modeller för granskning</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Askkopp och källsortering med kapacitet och materialval. Pris syns inte här. Resten av
          sortimentet väntar.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {binsigniaDraft.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section>
        <p className="kicker">Verifierade produkter i konceptet</p>
        <h2 className="mt-2 text-2xl md:text-3xl">Parkbänkar med mått och artikelnummer</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Listan visar bara produkter som uppfyller miniminivån i inventeringen. Platssnamn-SKU:er
          med demo-bild och identisk text är utkast och visas inte här.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benches.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="kicker">Från plats till offert</p>
          <h2 className="mt-2 text-2xl">Tre steg, ingen kassa</h2>
          <ol className="mt-6 space-y-4">
            {[
              ['Berätta om platsen', 'Gata, park, skolgård eller gård. Bifoga handling om ni har den.'],
              ['Vi tar fram underlag', 'Förslag, mått och infästning utifrån det som är verifierat.'],
              ['Offert mot tidplan', 'Pris och leverans i offerten — inte på produktsidan.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 border-t border-line pt-4">
                <span className="font-ui text-sm tabular-nums text-muted">0{i + 1}</span>
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <img src="/images/env-gaard.jpg" alt="" className="h-full max-h-80 w-full object-cover" />
        </div>
      </section>

      <section className="border-t border-line pt-10">
        <p className="kicker">Kontakt</p>
        <h2 className="mt-2 max-w-xl text-2xl md:text-3xl">Prata med oss innan ni ritar.</h2>
        <p className="mt-4 max-w-xl text-muted">
          STADORA är ett varumärke inom Relicon AB. Mejla plats, ungefärlig volym och tidplan.
        </p>
        <Link
          to="/offert"
          className="mt-6 inline-block bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
        >
          Begär offert
        </Link>
      </section>
    </div>
  )
}
