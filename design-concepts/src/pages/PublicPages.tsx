import { Link } from 'react-router-dom'
import { benches, products } from '../data/content'
import { ProductCard } from '../components/ProductCard'
import { useTheme } from '../context/ThemeContext'

const missions = [
  {
    title: 'Park och torg',
    text: 'Bänkar och sitt för högt slitage.',
    href: '/produkter/parkmobler/parkbankar',
    img: '/images/env-park.jpg',
  },
  {
    title: 'Avfall',
    text: 'Kärl och stationer för gård och gata.',
    href: '/produkt/papperskorg-rodberga-100',
    img: '/images/rodberga-miljo.jpg',
  },
  {
    title: 'Cykelparkering',
    text: 'Sortimentet kompletteras. Inga demo-SKU:er i konceptet.',
    href: '/produkter/parkmobler',
    img: '/images/env-cykel.jpg',
  },
  {
    title: 'Lek och aktivitet',
    text: 'Publiceras när verifierade produkter finns.',
    href: '/produkter/parkmobler',
    img: '/images/env-skola.jpg',
  },
]

export function HomePage() {
  const { theme } = useTheme()
  if (theme === 'atelje') return <AteljeHome />
  return <AtlasHome />
}

function AteljeHome() {
  return (
    <div>
      <section className="relative">
        <img
          src="/images/hero.jpg"
          alt="Offentlig utemiljö med sittplatser och plantering"
          className="h-[min(78svh,720px)] w-full object-cover"
        />
        <div className="shell relative z-10 -mt-28 pb-6 md:-mt-36">
          <div className="max-w-xl bg-sheet p-6 shadow-[0_24px_60px_rgba(27,25,20,0.12)] md:p-10">
            <p className="kicker">Offentlig miljö</p>
            <h1 className="mt-3 text-4xl leading-[1.05] md:text-6xl">
              Möbler för platsen, underlag för projektet.
            </h1>
            <p className="mt-5 max-w-md text-muted">
              Kommun, fastighet, arkitekt och entreprenad. Samla ett projekt i offertlistan. Pris
              lämnas i offert — ingen kassa.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/produkter/parkmobler"
                className="bg-sage px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
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
        </div>
      </section>

      <div className="shell space-y-24 py-16 md:py-20">
        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="kicker">Ingång efter uppdrag</p>
              <h2 className="mt-2 text-3xl md:text-4xl">Vad gäller projektet?</h2>
            </div>
            <Link to="/produkter/parkmobler" className="text-sm underline">
              Alla kategorier
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {missions.map((m) => (
              <Link key={m.title} to={m.href} className="group block">
                <img src={m.img} alt="" className="aspect-[16/10] w-full object-cover" />
                <h3 className="display mt-4 text-2xl">{m.title}</h3>
                <p className="mt-1 text-sm text-muted">{m.text}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <p className="kicker">Verifierade produkter i konceptet</p>
          <h2 className="mt-2 text-3xl md:text-4xl">Parkbänkar med mått och artikelnummer</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Listan visar bara produkter som uppfyller miniminivån i inventeringen. Platssnamn-SKU:er
            med demo-bild och identisk text är utkast och visas inte här.
          </p>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
            {benches.map((p, i) => (
              <div key={p.slug} className={i === 0 ? 'sm:col-span-2 lg:col-span-6' : 'lg:col-span-3'}>
                <ProductCard product={p} featured={i === 0} />
              </div>
            ))}
          </div>
        </section>

        <section className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="kicker">Från plats till offert</p>
            <h2 className="mt-2 text-3xl">Tre steg, ingen kassa</h2>
            <ol className="mt-8 space-y-6">
              {[
                ['Berätta om platsen', 'Gata, park, skolgård eller gård. Bifoga handling om ni har den.'],
                ['Vi tar fram underlag', 'Förslag, mått och infästning utifrån det som är verifierat.'],
                ['Offert mot tidplan', 'Pris och leverans i offerten — inte på produktsidan.'],
              ].map(([t, d], i) => (
                <li key={t}>
                  <p className="kicker">0{i + 1}</p>
                  <p className="mt-2 text-xl">{t}</p>
                  <p className="mt-1 text-sm text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-7">
            <img src="/images/env-gaard.jpg" alt="" className="aspect-[4/3] w-full object-cover" />
          </div>
        </section>

        <section className="border-t border-line pt-12">
          <p className="kicker">Kontakt</p>
          <h2 className="mt-2 max-w-xl text-3xl md:text-4xl">Prata med oss innan ni ritar.</h2>
          <p className="mt-4 max-w-xl text-muted">
            STADORA är ett varumärke inom Relicon AB. Mejla plats, ungefärlig volym och tidplan.
          </p>
          <Link
            to="/offert"
            className="mt-6 inline-block bg-sage px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
          >
            Begär offert
          </Link>
        </section>
      </div>
    </div>
  )
}

function AtlasHome() {
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
              to="/produkter/parkmobler"
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
          <Link to="/produkter/parkmobler" className="text-sm underline">
            Alla kategorier
          </Link>
        </div>
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {missions.map((m) => (
            <Link key={m.title} to={m.href} className="bg-sheet p-6 hover:bg-paper">
              <h3 className="text-lg">{m.title}</h3>
              <p className="mt-2 text-sm text-muted">{m.text}</p>
            </Link>
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

export function CategoryPage() {
  return (
    <div>
      <p className="kicker">Sortiment</p>
      <h1 className="mt-2 text-4xl">Parkmöbler</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Bänkar, bord och sittsystem för parker, gårdar och gemensamma platser. I detta koncept visas
        endast bänkar med verifierade mått och artikelnummer.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        <li>
          <Link to="/produkter/parkmobler/parkbankar" className="block border border-line bg-sheet p-5">
            <p className="font-medium">Parkbänkar</p>
            <p className="mt-1 text-sm text-muted">5 verifierade produkter i konceptet</p>
          </Link>
        </li>
        <li className="border border-dashed border-line p-5 text-sm text-muted">
          Picknickbord — Enskede har data men ligger i förbättringsgruppen tills unika texter finns
          för hela underkategorin.
        </li>
        <li className="border border-dashed border-line p-5 text-sm text-muted">
          Modulära sitt — flera poster är utkast med demo-bild.
        </li>
      </ul>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benches.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
        <ProductCard product={products['papperskorg-rodberga-100']} />
      </div>
    </div>
  )
}

export function ProductListPage() {
  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <h1 className="text-3xl">Parkbänkar</h1>
        <p className="mt-3 text-sm text-muted">
          Filter är en taxonomi, inte råa leverantörssträngar. Endast värden som faktiskt finns i
          urvalet.
        </p>
        <form className="mt-6 space-y-5 text-sm" onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend className="font-medium">Ryggstöd</legend>
            <label className="mt-2 flex gap-2">
              <input type="checkbox" defaultChecked /> Med ryggstöd
            </label>
            <label className="mt-2 flex gap-2">
              <input type="checkbox" defaultChecked /> Utan ryggstöd
            </label>
          </fieldset>
          <fieldset>
            <legend className="font-medium">Montering</legend>
            <label className="mt-2 flex gap-2">
              <input type="checkbox" defaultChecked /> Fristående
            </label>
            <label className="mt-2 flex gap-2">
              <input type="checkbox" defaultChecked /> Skruvas i underlaget
            </label>
          </fieldset>
          <fieldset>
            <legend className="font-medium">Material</legend>
            <label className="mt-2 flex gap-2">
              <input type="checkbox" defaultChecked /> Arkitektonisk betong
            </label>
            <label className="mt-2 flex gap-2">
              <input type="checkbox" defaultChecked /> Trä
            </label>
          </fieldset>
        </form>
      </aside>
      <div className="lg:col-span-9">
        <p className="text-sm text-muted">{benches.length} produkter · pris i offert</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {benches.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </div>
  )
}
