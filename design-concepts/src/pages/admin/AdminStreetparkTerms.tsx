import { Link } from 'react-router-dom'
import gatedFile from '../../data/generated/streetpark-gated.json'
import { STREETPARK_SLUGS, streetparkProducts } from '../../data/streetpark'
import { productPath } from '../../data/content'

type GatedItem = {
  product?: string
  slug?: string
  name: string
  sourceUrl: string
  variant?: string | null
  fetchedAt?: string
  reason?: string
}

export function AdminStreetparkTerms() {
  const items = (gatedFile.items as GatedItem[]) ?? []
  const products = STREETPARK_SLUGS.map((slug) => streetparkProducts[slug]).filter(Boolean)
  const docs = products.reduce((n, p) => n + (p.documents?.length ?? 0), 0)
  const images = products.reduce((n, p) => n + p.images.length, 0)
  const cad = products.reduce(
    (n, p) => n + (p.documents?.filter((d) => d.format === 'DWG' || d.format === 'DXF').length ?? 0),
    0,
  )

  return (
    <section className="space-y-4 border border-line bg-sheet p-5">
      <p className="font-medium">STREETPARK-import</p>
      <p className="text-sm text-muted">
        {products.length} produkter · {images} produktbilder · {docs} dokument, varav {cad} DWG.
        Tillverkare visas publikt. Artikelnummer följer med offerten. Inga priser. Originalfiler från
        streetpark.eu {gatedFile.fetchedAt}.
      </p>
      <p className="text-sm">
        Exempel:{' '}
        {products.slice(0, 4).map((p, i) => (
          <span key={p.slug}>
            {i > 0 ? ' · ' : ''}
            <Link className="underline" to={productPath(p)}>
              {p.name}
            </Link>
          </span>
        ))}
      </p>
      <div>
        <p className="text-sm font-medium">Luckor efter inloggning</p>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Inga kvarvarande inloggningsluckor i den här körningen. CAD, produktblad och
            förankringsfiler är kopplade till rätt modell på produktsidan.
          </p>
        ) : (
          <ul className="mt-2 max-h-80 overflow-auto divide-y divide-line border border-line text-sm">
            {items.map((g, i) => (
              <li key={`${g.name}-${g.variant ?? ''}-${i}`} className="px-3 py-2">
                <span className="font-medium">{g.name}</span>
                {g.variant ? <span className="text-muted"> · {g.variant}</span> : null}
                {g.product ? <span className="block text-xs text-muted">{g.product}</span> : null}
                <span className="block text-xs text-muted">
                  {g.sourceUrl} · {g.fetchedAt}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
