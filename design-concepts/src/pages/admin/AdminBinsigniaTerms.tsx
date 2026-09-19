import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  binsigniaDiscounts,
  binsigniaModels,
  binsigniaPrices,
  binsigniaPriceMeta,
  formatEur,
  netEur,
} from '../../data/binsignia-prices'
import { productPath } from '../../data/content'
import { useProductCatalog } from '../../context/ProductCatalogContext'

const models = binsigniaModels()

export function AdminBinsigniaTerms() {
  const { products } = useProductCatalog()
  const [params, setParams] = useSearchParams()
  const requested = params.get('serie')
  const model = requested && models.includes(requested) ? requested : (models[0] ?? 'ALBRIS')
  const rows = useMemo(() => binsigniaPrices.filter((r) => r.model === model), [model])
  const slug = rows[0]?.slug
  const product = slug ? products[slug] : undefined
  const showVariant = rows.some((r) => r.variant)
  const anomalies = rows.filter((r) => r.anomaly)

  return (
    <section id="inkopspris" className="scroll-mt-8 space-y-6 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Intern inköpslista</p>
        <h2 className="mt-2 text-xl">{binsigniaPriceMeta.list}</h2>
        <p className="mt-2 text-sm text-muted">
          EUR exkl. moms. Leverantörens artikelnummer och listpris syns bara här, inte på katalogen
          eller i kundens offertlista. Ingen omräkning till SEK. Rabatt 15 % från 1 set enligt
          partneravtalet. {binsigniaPrices.length} rader · {models.length} serier.
        </p>
      </div>

      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>
          <span className="text-muted">Juridiskt namn</span>
          <p className="font-medium">{binsigniaPriceMeta.legal}</p>
        </li>
        <li>
          <span className="text-muted">VAT / reg.</span>
          <p className="font-medium">
            {binsigniaPriceMeta.vatNr} · {binsigniaPriceMeta.regNr}
          </p>
        </li>
        <li className="sm:col-span-2">
          <span className="text-muted">Ingår i listpris</span>
          <p className="font-medium">{binsigniaPriceMeta.included.join('. ')}.</p>
        </li>
      </ul>

      <div className="overflow-x-auto">
        <table className="spec-table text-sm">
          <thead>
            <tr>
              <th>Antal set</th>
              <th>Rabatt</th>
              <th>Frakt — partneravtal (Paula)</th>
              <th>Frakt — tryckt lista</th>
            </tr>
          </thead>
          <tbody>
            {binsigniaDiscounts.map((d) => (
              <tr key={d.min}>
                <td className="tabular-nums">{d.max ? `${d.min}–${d.max}` : `${d.min}+`}</td>
                <td className="tabular-nums">{d.percent} %</td>
                <td>{d.freightPartner}</td>
                <td className="text-muted">{d.freightList}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted">{binsigniaPriceMeta.vat}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        {binsigniaPriceMeta.terms.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <p className="text-sm">
        Vippbart lock, tillägg per lock: PC 35/40/45 EUR (35/60/100 l), SST 40/45/50 EUR.
      </p>

      <div>
        <label className="text-sm font-medium">
          Listpris per serie
          <select
            className="mt-1 block max-w-full border border-line bg-sheet px-3 py-2"
            value={model}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.set('serie', e.target.value)
              setParams(next, { replace: true })
            }}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {product && (
          <p className="mt-2 text-sm">
            <Link className="underline" to={productPath(product)}>
              Öppna {product.name} (utan pris och utan artikelnummer)
            </Link>
          </p>
        )}
        {anomalies.length > 0 && (
          <p className="mt-3 border border-dashed border-line bg-paper px-3 py-2 text-sm">
            Kontrollera mot leverantör: {anomalies.map((r) => `${r.sku} ${r.config} = ${formatEur(r.listEur)}`).join('; ')}.
            Beloppet ser ut som en felskrivning i den tryckta listan.
          </p>
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="spec-table text-sm">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Material</th>
                {showVariant && <th>Variant</th>}
                <th>Kapacitet</th>
                <th>Listpris</th>
                <th>Netto 15 %</th>
                <th>Netto 22 %</th>
                <th>Netto 30 %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.sku}-${r.variant ?? ''}-${r.config}`}>
                  <td className="tabular-nums">{r.sku}</td>
                  <td>{r.material}</td>
                  {showVariant && <td>{r.variant ?? '—'}</td>}
                  <td>{r.config}</td>
                  <td className={`tabular-nums ${r.anomaly ? 'font-medium' : ''}`}>
                    {formatEur(r.listEur)}
                  </td>
                  <td className="tabular-nums">{formatEur(netEur(r.listEur, 1))}</td>
                  <td className="tabular-nums">{formatEur(netEur(r.listEur, 20))}</td>
                  <td className="tabular-nums">{formatEur(netEur(r.listEur, 51))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
