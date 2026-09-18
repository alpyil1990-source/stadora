import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

type DownloadRow = {
  id: string
  at: string
  userId: string
  email: string
  productSlug: string
  sku: string
  documentName: string
  documentType: string
  supplier: string
}

type ProductStat = {
  productSlug: string
  sku: string
  downloads: number
  uniqueUsers: number
}

export function AdminDownloads() {
  const [downloads, setDownloads] = useState<DownloadRow[]>([])
  const [products, setProducts] = useState<ProductStat[]>([])
  const [error, setError] = useState('')
  const [supplier, setSupplier] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function load(next = { supplier, from, to }) {
    const q = new URLSearchParams()
    if (next.supplier) q.set('supplier', next.supplier)
    if (next.from) q.set('from', next.from)
    if (next.to) q.set('to', next.to)
    const suffix = q.toString() ? `?${q}` : ''
    api<{ downloads: DownloadRow[]; products: ProductStat[] }>(`/api/admin/downloads${suffix}`)
      .then((data) => {
        setDownloads(data.downloads)
        setProducts(data.products)
        setError('')
      })
      .catch(() => setError('Kunde inte hämta loggen. Dokument-API:t måste köra.'))
  }

  useEffect(() => {
    let cancelled = false
    api('/api/preview/enter', { method: 'POST' })
      .catch(() => undefined)
      .then(async () => {
        const q = new URLSearchParams()
        const data = await api<{ downloads: DownloadRow[]; products: ProductStat[] }>(
          `/api/admin/downloads${q.toString() ? `?${q}` : ''}`,
        )
        if (cancelled) return
        setDownloads(data.downloads)
        setProducts(data.products)
      })
      .catch(() => {
        if (!cancelled) setError('Kunde inte hämta loggen. Dokument-API:t måste köra.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function onFilter(e: FormEvent) {
    e.preventDefault()
    load()
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="kicker">Intern testmiljö</p>
        <h1 className="mt-2 text-3xl">Dokumentnedladdningar</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Loggen är inte publik. En nedladdning är inte ett säljmejl. NOVUM-filer är internal_only.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/konton">
            Konton
          </Link>
          {' · '}
          <a
            className="underline"
            href={`/api/admin/downloads.csv?${new URLSearchParams({
              ...(supplier ? { supplier } : {}),
              ...(from ? { from } : {}),
              ...(to ? { to } : {}),
            }).toString()}`}
          >
            Exportera CSV
          </a>
        </p>
      </div>
      <form className="flex flex-wrap items-end gap-3 text-sm" onSubmit={onFilter}>
        <label>
          Leverantör
          <input
            className="mt-1 block border border-line px-3 py-2"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="t.ex. NOVUM"
          />
        </label>
        <label>
          Från
          <input
            type="date"
            className="mt-1 block border border-line px-3 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Till
          <input
            type="date"
            className="mt-1 block border border-line px-3 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button type="submit" className="border border-ink px-4 py-2">
          Filtrera
        </button>
      </form>
      {error && <p className="border border-dashed border-line p-4 text-sm">{error}</p>}
      <section>
        <h2 className="text-xl">Produkter med flest nedladdningar</h2>
        {products.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Ingen nedladdning registrerad.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border border-line bg-sheet text-sm">
            {products.map((p) => (
              <li key={p.productSlug} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                <span>
                  {p.productSlug}
                  <span className="block text-xs text-muted">Art.nr {p.sku}</span>
                </span>
                <span className="text-muted">
                  {p.downloads} filer · {p.uniqueUsers} unika användare
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-xl">Logg</h2>
        {downloads.length === 0 ? (
          <p className="mt-3 border border-dashed border-line p-6 text-sm text-muted">
            Tom logg för valt filter.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto border border-line bg-sheet">
            <table className="spec-table w-full text-sm">
              <thead>
                <tr>
                  <th>Tid</th>
                  <th>Användare</th>
                  <th>Produkt</th>
                  <th>Artikel</th>
                  <th>Dokument</th>
                  <th>Leverantör</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr key={d.id}>
                    <td className="tabular-nums">{d.at.slice(0, 19).replace('T', ' ')}</td>
                    <td>
                      {d.email}
                      <span className="block text-xs text-muted">{d.userId}</span>
                    </td>
                    <td>{d.productSlug}</td>
                    <td>{d.sku}</td>
                    <td>
                      {d.documentName}
                      <span className="block text-xs text-muted">{d.documentType}</span>
                    </td>
                    <td>{d.supplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
