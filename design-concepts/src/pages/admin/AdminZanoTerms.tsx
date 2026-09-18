import { Link } from 'react-router-dom'
import { ZANO_SLUGS, zanoGaps, zanoProducts, zanoQc } from '../../data/zano'
import { productPath } from '../../data/content'

export function AdminZanoTerms() {
  const withGaps = zanoGaps.filter((g) => g.gaps.length > 0)
  const noSv = zanoQc.withoutSwedishDatasheet ?? []
  const noDocs = zanoQc.withoutDocuments ?? []
  const overlap = zanoQc.overlapNoSwedishDatasheetAndNoDocuments ?? []
  const picnic = zanoQc.picnicSets ?? []
  return (
    <section id="inkopspris" className="scroll-mt-8 space-y-4 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Intern inköpslista</p>
        <h2 className="mt-2 text-xl">Inköpspris saknas</h2>
        <p className="mt-2 text-sm text-muted">
          Katalogimport utom kategorin Övrigt. Leverantören lämnar pris vid offertförfrågan. Fältet lämnas tomt —
          aldrig 0 kr. Intern markering: leverantörsoffert krävs före kundpris. Tillverkare ZANO ska
          synas publikt. Produktbilder och dokument behåller ZANO-märkning. Kategorin Övrigt på zano.se
          (fågelmatare, lyktor, desinfektionsstationer) är undantagen. Picknickset-sidor utan eget
          modellnummer är inte importerade.
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
          <span className="text-muted">Kompletta poster</span>
          <p className="font-medium">
            {zanoQc.complete ?? ZANO_SLUGS.length} av {zanoQc.products ?? ZANO_SLUGS.length}
          </p>
        </li>
        <li>
          <span className="text-muted">Webb</span>
          <p className="font-medium">https://www.zano.se</p>
        </li>
      </ul>
      <ul className="max-h-64 overflow-auto divide-y divide-line border border-line text-sm">
        {ZANO_SLUGS.map((slug) => {
          const p = zanoProducts[slug]
          if (!p) return null
          return (
            <li key={slug} className="px-3 py-1.5">
              <Link className="underline" to={productPath(p)}>
                {p.name}
              </Link>
            </li>
          )
        })}
      </ul>
      <div>
        <p className="text-sm font-medium">Kvalitetskontroll</p>
        <p className="mt-1 text-xs text-muted">
          Saknat svenskt produktblad räknas inte som ofullständig post. Engelska produktkort är märkta
          som engelska. Överlapp utan dokument och utan svenskt blad: {overlap.length} modeller.
        </p>
        <p className="mt-3 text-xs font-medium">Utan svenskt produktblad ({noSv.length})</p>
        <ul className="mt-1 max-h-40 overflow-auto divide-y divide-line border border-line text-sm">
          {noSv.map((row) => (
            <li key={row.sku ?? row.name} className="px-3 py-1.5">
              {row.name}
              <span className="block text-xs text-muted">
                {row.sku} · {row.documents} övriga filer
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-medium">Utan dokument ({noDocs.length})</p>
        {noDocs.length === 0 ? (
          <p className="mt-1 text-sm text-muted">Inga. De tre som saknade filer har engelskt produktkort.</p>
        ) : (
          <ul className="mt-1 divide-y divide-line border border-line text-sm">
            {noDocs.map((row) => (
              <li key={row.sku ?? row.name} className="px-3 py-1.5">
                {row.name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs font-medium">Överhoppade picknickset ({picnic.length})</p>
        <ul className="mt-1 max-h-40 overflow-auto divide-y divide-line border border-line text-sm">
          {picnic.map((row) => (
            <li key={row.slug} className="px-3 py-1.5">
              {row.title ?? row.slug}
              <span className="block text-xs text-muted">
                Eget modellnummer: nej
                {row.memberSkus && row.memberSkus.length
                  ? ` · medlemsnummer ${row.memberSkus.join(', ')}`
                  : ' · inga medlemsnummer i sidtexten'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {withGaps.length > 0 && (
        <div>
          <p className="text-sm font-medium">Kvarstående uppgiftsluckor ({withGaps.length})</p>
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
