import { Link } from 'react-router-dom'
import { products } from '../data/content'
import { ProductCard } from '../components/ProductCard'

function PausedArea({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{title}</h1>
      <p className="text-muted">
        Den här grenen hämtas inte in nu. När ni ger leverantörens namn, kontaktperson och länk till
        produktbilder lägger vi in det i intern admin — en rad per leverantör, med antal produkter
        i STADORA-katalogen. Vi skrapar inte bilder från stadora.se.
      </p>
      <p className="text-sm">
        <Link className="underline" to="/admin/leverantorer">
          Öppna leverantörer i admin
        </Link>
        {' · '}
        <Link className="underline" to="/">
          Tillbaka till offentlig miljö
        </Link>
      </p>
    </div>
  )
}

export function CareHomePage() {
  return <PausedArea kicker="STADORA Vård" title="Vårdsortimentet avvaktar" />
}

export function SchoolHomePage() {
  return <PausedArea kicker="STADORA Skola" title="Skolsortimentet avvaktar" />
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
        aldrig “finns på begäran” utan bekräftelse. För BINSIGNIA lämnas ritningar och PDF-datablad
        per projekt eller order — de publiceras inte i katalogen.
      </p>
      <div className="mt-8 border border-dashed border-line p-6 text-sm text-muted">
        Exempel på rad när ett datablad finns: Datablad · Svenska · PDF · v1.2 · 2026-03-12
      </div>
    </div>
  )
}
