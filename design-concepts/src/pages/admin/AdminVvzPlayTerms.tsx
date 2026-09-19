import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { productPath } from '../../data/content'
import { VVZ_PLAY_SLUGS, vvzPlayGaps, vvzPlayProducts } from '../../data/vvz-play'
import {
  formatEur,
  vvzPlayFamilies,
  vvzPlayPriceCounts,
  vvzPlayPriceMeta,
  vvzPlayPrices,
  VVZ_PLAY_DEFAULT_DISCOUNT,
} from '../../data/vvz-play-prices'

const ALL = 'all'

export function AdminVvzPlayTerms() {
  const images = VVZ_PLAY_SLUGS.reduce((n, slug) => n + (vvzPlayProducts[slug]?.images.length ?? 0), 0)
  const docs = VVZ_PLAY_SLUGS.reduce((n, slug) => n + (vvzPlayProducts[slug]?.documents?.length ?? 0), 0)
  const certs = VVZ_PLAY_SLUGS.reduce(
    (n, slug) =>
      n + (vvzPlayProducts[slug]?.documents?.filter((d) => d.kind === 'certificate' || d.access === 'internal_only').length ?? 0),
    0,
  )
  const cad = VVZ_PLAY_SLUGS.reduce(
    (n, slug) => n + (vvzPlayProducts[slug]?.documents?.filter((d) => d.format === 'DWG').length ?? 0),
    0,
  )

  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState(ALL)
  const families = vvzPlayFamilies()
  const produkt = params.get('produkt') ?? ALL

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return vvzPlayPrices.filter((r) => {
      if (family !== ALL && r.subcategorySlug !== family) return false
      if (produkt !== ALL && r.slug !== produkt) return false
      if (!q) return true
      return [r.sku, r.name, r.subcategory].join(' ').toLowerCase().includes(q)
    })
  }, [family, produkt, query])

  function setProdukt(value: string) {
    const next = new URLSearchParams(params)
    if (value === ALL) next.delete('produkt')
    else next.set('produkt', value)
    setParams(next, { replace: true })
  }

  const withGaps = vvzPlayGaps.filter((g) => g.gaps.length > 0 || g.contradiction)

  return (
    <div className="space-y-4">
      <section id="inkopspris" className="scroll-mt-8 space-y-6 border border-line bg-sheet p-5">
        <div>
          <p className="kicker">Intern inköpslista</p>
          <h2 className="mt-2 text-xl">{vvzPlayPriceMeta.list}</h2>
          <p className="mt-2 text-sm text-muted">
            {vvzPlayPriceMeta.note} Listpris, {VVZ_PLAY_DEFAULT_DISCOUNT} % rabatt och netto syns
            bara här, inte på katalogen. Ingen omräkning till SEK.{' '}
            {vvzPlayPriceCounts.rows} rader · {vvzPlayPriceCounts.products} katalogprodukter.
          </p>
        </div>

        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <li>
            <span className="text-muted">Juridiskt namn</span>
            <p className="font-medium">{vvzPlayPriceMeta.legal}</p>
          </li>
          <li>
            <span className="text-muted">Tillverkare</span>
            <p className="font-medium">VVZ-Play — endast intern, aldrig publik</p>
          </li>
          <li>
            <span className="text-muted">Adress</span>
            <p className="font-medium">{vvzPlayPriceMeta.address}</p>
          </li>
          <li>
            <span className="text-muted">Webb</span>
            <p className="font-medium">{vvzPlayPriceMeta.website}</p>
          </li>
        </ul>

        <p className="text-sm text-muted">{vvzPlayPriceMeta.vat}</p>

        <div className="overflow-x-auto">
          <table className="spec-table text-sm">
            <thead>
              <tr>
                <th>Villkor</th>
                <th>Värde</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Rabatt mot listpris</td>
                <td className="tabular-nums">{VVZ_PLAY_DEFAULT_DISCOUNT} %</td>
              </tr>
              <tr>
                <td>Nettoinköp</td>
                <td>Listpris × 0,70</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Underkategori
            <select
              className="mt-1 block w-full border border-line bg-sheet px-3 py-2"
              value={family}
              onChange={(e) => {
                setFamily(e.target.value)
                setProdukt(ALL)
              }}
            >
              <option value={ALL}>Alla</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Produkt
            <select
              className="mt-1 block w-full border border-line bg-sheet px-3 py-2"
              value={produkt}
              onChange={(e) => setProdukt(e.target.value)}
            >
              <option value={ALL}>Alla med pris ({vvzPlayPrices.length})</option>
              {vvzPlayPrices
                .filter((r) => family === ALL || r.subcategorySlug === family)
                .map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium">
          Sök artikelnummer eller modell
          <input
            className="mt-1 w-full border border-line bg-sheet px-3 py-2"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="t.ex. PHP004 eller VZ1"
          />
        </label>

        <div className="overflow-x-auto">
          <table className="spec-table text-sm">
            <thead>
              <tr>
                <th>Art.nr</th>
                <th>Produkt</th>
                <th>Ordinarie pris</th>
                <th>Rabatt</th>
                <th>Nettoinköp</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted">
                    Ingen rad matchar filtret.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const p = vvzPlayProducts[r.slug]
                  return (
                    <tr key={r.sku}>
                      <td className="tabular-nums">{r.sku}</td>
                      <td>
                        {p ? (
                          <Link className="font-medium underline" to={productPath(p)}>
                            {r.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.name}</span>
                        )}
                        <span className="mt-1 block text-xs text-muted">{r.subcategory}</span>
                      </td>
                      <td className="tabular-nums">{formatEur(r.listEur)}</td>
                      <td className="tabular-nums">{r.discountPercent} %</td>
                      <td className="tabular-nums font-medium">{formatEur(r.netEur)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted">{rows.length} rader visade.</p>
      </section>

      <section className="space-y-4 border border-line bg-sheet p-5">
        <p className="font-medium">VVZ-Play-import</p>
        <p className="text-sm text-muted">
          {VVZ_PLAY_SLUGS.length} lekplatsprodukter · {images} bilder · {docs} dokument, varav {cad}{' '}
          DWG och {certs} intern-only certifikat. Tillverkare och leverantörens artikelnummer syns
          bara här. Certifikat öppnas på intern produktsida, inte för kund.
        </p>
        <ul className="max-h-64 overflow-auto divide-y divide-line border border-line text-sm">
          {VVZ_PLAY_SLUGS.map((slug) => {
            const p = vvzPlayProducts[slug]
            if (!p) return null
            const internCerts = (p.documents ?? []).filter(
              (d) => d.kind === 'certificate' || d.access === 'internal_only',
            )
            return (
              <li key={slug} className="px-3 py-2">
                <Link className="underline" to={productPath(p)}>
                  {p.name}
                </Link>
                {' · '}
                <Link className="underline" to={`/intern/produkt/${p.slug}`}>
                  Intern vy
                </Link>
                <span className="block text-xs text-muted">
                  Art.nr {p.sku} · {p.images.length} bilder · {p.documents?.length ?? 0} dokument
                  {internCerts.length ? ` · ${internCerts.length} certifikat intern` : ''}
                </span>
              </li>
            )
          })}
        </ul>
        {withGaps.length > 0 && (
          <div>
            <p className="text-sm font-medium">Luckor och motsägelser</p>
            <ul className="mt-2 max-h-64 overflow-auto divide-y divide-line border border-line text-sm">
              {withGaps.map((row) => (
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
        )}
      </section>
    </div>
  )
}
