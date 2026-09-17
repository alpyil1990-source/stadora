import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  familyLabel,
  formatEur,
  investimDiscountRules,
  investimGroups,
  investimPriceMeta,
  investimPrices,
} from '../../data/investim-prices'
import { productPath, products } from '../../data/content'

const ALL = 'all'
const groups = investimGroups()

export function AdminInvestimTerms() {
  const [params, setParams] = useSearchParams()
  const group = params.get('grupp') ?? ALL
  const produkt = params.get('produkt')
  const rows = useMemo(() => {
    if (produkt) return investimPrices.filter((r) => r.slug === produkt)
    return group === ALL ? investimPrices : investimPrices.filter((r) => r.family === group)
  }, [group, produkt])

  return (
    <section id="inkopspris" className="scroll-mt-8 space-y-6 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Intern inköpslista</p>
        <h2 className="mt-2 text-xl">{investimPriceMeta.list}</h2>
        <p className="mt-2 text-sm text-muted">
          EUR exkl. moms. Leverantörens katalognummer och listpris syns bara här. Netto är listpris
          minus den rabatt ni skickade. Ingen omräkning till SEK.{' '}
          {investimPrices.length} rader i den här importen.
        </p>
      </div>

      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>
          <span className="text-muted">Juridiskt namn</span>
          <p className="font-medium">{investimPriceMeta.legal}</p>
        </li>
        <li>
          <span className="text-muted">NIP / KRS / VAT</span>
          <p className="font-medium">
            {investimPriceMeta.nip} · {investimPriceMeta.krs} · {investimPriceMeta.vatNr}
          </p>
        </li>
        <li>
          <span className="text-muted">Kontor</span>
          <p className="font-medium">{investimPriceMeta.addressOffice}</p>
        </li>
        <li>
          <span className="text-muted">Produktion</span>
          <p className="font-medium">{investimPriceMeta.addressPlant}</p>
        </li>
        <li>
          <span className="text-muted">Kontakt</span>
          <p className="font-medium">
            {investimPriceMeta.contact.name}, {investimPriceMeta.contact.role}
          </p>
          <p className="text-muted">
            {investimPriceMeta.contact.phone} · {investimPriceMeta.contact.email}
          </p>
        </li>
      </ul>

      <div className="overflow-x-auto">
        <table className="spec-table text-sm">
          <thead>
            <tr>
              <th>Sortiment</th>
              <th>Rabatt</th>
              <th>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {investimDiscountRules.map((d) => (
              <tr key={d.family}>
                <td>{d.label}</td>
                <td className="tabular-nums">{d.percent == null ? 'Ej angiven' : `${d.percent} %`}</td>
                <td className="text-muted">{d.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted">{investimPriceMeta.vat}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
        {investimPriceMeta.extras.map((t) => (
          <li key={t}>{t}</li>
        ))}
        {investimPriceMeta.skipped.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div>
        <label className="text-sm font-medium">
          Listpris per grupp
          <select
            className="mt-1 block max-w-full border border-line bg-sheet px-3 py-2"
            value={produkt ? ALL : group}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.delete('produkt')
              if (e.target.value === ALL) next.delete('grupp')
              else next.set('grupp', e.target.value)
              setParams(next, { replace: true })
            }}
          >
            <option value={ALL}>Alla ({investimPrices.length})</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {familyLabel(g)}
              </option>
            ))}
          </select>
        </label>
        {produkt && products[produkt] && (
          <p className="mt-2 text-sm">
            Visar {products[produkt].name}.{' '}
            <button
              type="button"
              className="underline"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('produkt')
                setParams(next, { replace: true })
              }}
            >
              Visa hela gruppen
            </button>
          </p>
        )}
        <div className="mt-3 overflow-x-auto">
          <table className="spec-table text-sm">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Kat.nr</th>
                <th>Variant</th>
                <th>Listpris</th>
                <th>Rabatt</th>
                <th>Netto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const product = products[r.slug]
                return (
                  <tr key={`${r.slug}-${r.variant}`}>
                    <td>
                      {product ? (
                        <Link className="underline" to={productPath(product)}>
                          {r.name}
                        </Link>
                      ) : (
                        r.name
                      )}
                      {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
                    </td>
                    <td className="tabular-nums">{r.sku}</td>
                    <td>{r.variant}</td>
                    <td className="tabular-nums">{formatEur(r.listEur)}</td>
                    <td className="tabular-nums">
                      {r.discountPercent == null ? '—' : `${r.discountPercent} %`}
                    </td>
                    <td className="tabular-nums font-medium">{formatEur(r.netEur)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
