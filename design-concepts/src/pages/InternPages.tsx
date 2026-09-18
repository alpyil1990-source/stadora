import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { unpublishedProducts } from '../data/content'
import { novumGaps } from '../data/novum'
import { api } from '../lib/api'

export function InternLayout() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/preview/enter', { method: 'POST' })
      .then(() => setReady(true))
      .catch(() =>
        setError(
          'Intern förhandsgranskning kunde inte öppnas. Dokument-API:t på port 4318 körs inte.',
        ),
      )
  }, [])

  if (error) {
    return (
      <div className="max-w-xl border border-dashed border-line p-6">
        <p className="font-medium">Intern testmiljö</p>
        <p className="mt-2 text-sm text-muted">{error}</p>
      </div>
    )
  }

  if (!ready) {
    return <p className="text-sm text-muted">Öppnar intern förhandsgranskning…</p>
  }

  return <Outlet />
}

export function InternHomePage() {
  const items = unpublishedProducts()
  return (
    <div className="space-y-8">
      <div>
        <p className="kicker">Intern testmiljö</p>
        <h1 className="mt-2 text-3xl md:text-4xl">Opublicerade produkter</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Endast intern förhandsgranskning. Ingenting här är publicerat. NOVUM Fitness Devices är
          begränsat till Runner och Airwalker tills du ger godkännande att importera resten.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/leverantorer/novum">
            NOVUM i admin
          </Link>
          {' · '}
          <Link className="underline" to="/admin/konton">
            Dokumentkonton
          </Link>
          {' · '}
          <Link className="underline" to="/konto/skapa">
            Testa registrering
          </Link>
        </p>
      </div>
      {items.length === 0 ? (
        <p className="border border-dashed border-line p-6 text-sm text-muted">
          Inga opublicerade produkter i den här miljön.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
      {novumGaps.length > 0 && (
        <section>
          <h2 className="text-xl">Luckor i testimporten</h2>
          <ul className="mt-3 divide-y divide-line border border-line bg-sheet text-sm">
            {novumGaps.map((row) => (
              <li key={row.slug} className="p-4">
                <p className="font-medium">
                  {row.name} · art.nr {row.sku}
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
        </section>
      )}
    </div>
  )
}
