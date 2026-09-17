import { Link } from 'react-router-dom'
import { ZANO_SLUGS, zanoGaps, zanoProducts } from '../../data/zano'
import { productPath } from '../../data/content'

export function AdminZanoTerms() {
  const withGaps = zanoGaps.filter((g) => g.gaps.length > 0)
  return (
    <section id="inkopspris" className="scroll-mt-8 space-y-4 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Intern inköpslista</p>
        <h2 className="mt-2 text-xl">Inköpspris saknas</h2>
        <p className="mt-2 text-sm text-muted">
          Testimport ersatt av katalogimport. Leverantören lämnar pris vid offertförfrågan. Fältet lämnas tomt —
          aldrig 0 kr. Intern markering: leverantörsoffert krävs före kundpris. Tillverkare ZANO ska
          synas publikt. Produktbilder och dokument behåller ZANO-märkning. Kategorin Övrigt på zano.se
          (fågelmatare, lyktor, desinfektionsstationer) är undantagen.
        </p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>
          <span className="text-muted">Tillverkare</span>
          <p className="font-medium">ZANO</p>
        </li>
        <li>
          <span className="text-muted">Modell</span>
          <p className="font-medium">{ZANO_SLUGS.length} modeller</p>
        </li>
        <li>
          <span className="text-muted">Webb</span>
          <p className="font-medium">https://www.zano.se</p>
        </li>
        <li>
          <span className="text-muted">Produkter i testet</span>
          <p className="font-medium">{ZANO_SLUGS.length}</p>
        </li>
      </ul>
      <p className="text-sm">
        {ZANO_SLUGS.map((slug, i) => {
          const p = zanoProducts[slug]
          if (!p) return null
          return (
            <span key={slug}>
              {i > 0 ? ' · ' : ''}
              <Link className="underline" to={productPath(p)}>
                {p.name}
              </Link>
            </span>
          )
        })}
      </p>
      {withGaps.length > 0 && (
        <div>
          <p className="text-sm font-medium">Informationsluckor</p>
          <ul className="mt-2 max-h-64 overflow-auto divide-y divide-line border border-line text-sm">
            {withGaps.map((g) => (
              <li key={g.slug} className="px-3 py-2">
                <span className="font-medium">{g.name}</span>
                <span className="block text-xs text-muted">{g.gaps.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
