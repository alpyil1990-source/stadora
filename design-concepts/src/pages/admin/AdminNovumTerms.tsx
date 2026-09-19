import { Link } from 'react-router-dom'
import { productPath } from '../../data/content'
import { NOVUM_SLUGS } from '../../data/catalog-index'
import { useProductCatalog } from '../../context/ProductCatalogContext'

export function AdminNovumTerms() {
  const { products, novumGaps } = useProductCatalog()
  const images = NOVUM_SLUGS.reduce((n, slug) => n + (products[slug]?.images.length ?? 0), 0)
  const docs = NOVUM_SLUGS.reduce((n, slug) => n + (products[slug]?.documents?.length ?? 0), 0)
  return (
    <section id="novum-testimport" className="scroll-mt-8 space-y-4 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Testimport · opublicerat</p>
        <h2 className="mt-2 text-xl">NOVUM Fitness Devices — två produkter</h2>
        <p className="mt-2 text-sm text-muted">
          Endast Runner (44103W) och Airwalker (4403Z). Övriga Fitness Devices är inte importerade.
          Tillverkare NOVUM registreras här och visas inte publikt. Inga priser. Offertförfrågan.
          Alla originalfiler har behörighet internal_only tills skriftligt godkännande finns för
          extern nedladdning. Portaluppgifter ligger i miljövariabler, aldrig i källkod eller databas.
        </p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>
          <span className="text-muted">Produkter</span>
          <p className="font-medium">{NOVUM_SLUGS.length} · intern förhandsgranskning</p>
        </li>
        <li>
          <span className="text-muted">Bilder / dokument</span>
          <p className="font-medium">
            {images} bilder · {docs} dokument
          </p>
        </li>
        <li>
          <span className="text-muted">Kategori</span>
          <p className="font-medium">Lek och aktivitet → Utegym (tomt publikt)</p>
        </li>
        <li>
          <span className="text-muted">Webb</span>
          <p className="font-medium">https://novum4kids.com/fitness-devices/</p>
        </li>
      </ul>
      <ul className="divide-y divide-line border border-line text-sm">
        {NOVUM_SLUGS.map((slug) => {
          const p = products[slug]
          if (!p) return null
          return (
            <li key={slug} className="px-3 py-2">
              <Link className="underline" to={productPath(p)}>
                {p.name}
              </Link>
              <span className="block text-xs text-muted">
                Art.nr {p.sku} · {p.images.length} bilder · {p.documents?.length ?? 0} dokument ·{' '}
                {p.sourceUrl}
              </span>
            </li>
          )
        })}
      </ul>
      <div>
        <p className="text-sm font-medium">Luckor och motsägelser</p>
        <ul className="mt-2 divide-y divide-line border border-line text-sm">
          {novumGaps.map((row) => (
            <li key={row.slug} className="px-3 py-2">
              <p className="font-medium">
                {row.name} {row.sku}
              </p>
              {row.contradiction && <p className="mt-1 text-muted">{row.contradiction}</p>}
              {row.gaps.map((g) => (
                <p key={g} className="mt-1 text-muted">
                  {g}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
