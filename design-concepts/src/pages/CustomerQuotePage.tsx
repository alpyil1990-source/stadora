import { Link, Navigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useCommerce } from '../context/CommerceContext'
import { isStadoraArticleNumber } from '../data/content'
import {
  formatSek,
  lineTotal,
  quoteTotalExVat,
  statusLabel,
  vat,
} from '../data/commerce'

export function CustomerQuotePage() {
  const { id } = useParams()
  const { quotes, setStatus } = useCommerce()
  const q = quotes.find((x) => x.id === id)
  const [done, setDone] = useState<'ok' | 'change' | 'no' | null>(null)

  if (!q) return <Navigate to="/" replace />

  const priced = q.lines.every((l) => l.unitPrice != null)
  const ex = quoteTotalExVat(q)
  const canDecide = q.status === 'skickad' || q.status === 'forhandling'

  if (done === 'ok' || q.status === 'accepterad' || q.status === 'order' || q.status === 'fakturering' || q.status === 'betald') {
    return (
      <div className="max-w-xl">
        <p className="kicker">{q.id}</p>
        <h1 className="mt-2 text-3xl">Offerten är godkänd</h1>
        <p className="mt-4 text-muted">
          Tack. Det här är en orderavsikt, inte en webbetalning. STADORA skickar orderbekräftelse och
          därefter faktura till {q.email}. Betalning sker enligt fakturans förfallodatum.
        </p>
        <p className="mt-4 text-sm text-muted">Status internt: {statusLabel[q.status === 'skickad' ? 'accepterad' : q.status]}</p>
      </div>
    )
  }

  if (done === 'change') {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl">Ändring begärd</h1>
        <p className="mt-4 text-muted">
          Vi har noterat att ni vill justera. Sälj återkommer på {q.email}. Ingen faktura är skapad.
        </p>
      </div>
    )
  }

  if (done === 'no' || q.status === 'forlorad') {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl">Offerten avböjd</h1>
        <p className="mt-4 text-muted">Ärende {q.id} är stängt. Ni kan skicka en ny förfrågan när ni vill.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="kicker">Offert från STADORA</p>
        <h1 className="mt-2 text-3xl">{q.project}</h1>
        <p className="mt-3 text-muted">
          {q.id} · {q.org} · giltig t.o.m. {q.validUntil ?? 'anges vid utskick'}
        </p>
        {!priced && (
          <p className="mt-4 border border-dashed border-line p-4 text-sm">
            Den här förfrågan har inte prissatts ännu. Länken blir aktiv när STADORA skickat offerten.
          </p>
        )}
        {priced && (
          <table className="spec-table mt-8 text-sm">
            <tbody>
              {q.lines.map((l) => (
                <tr key={l.name}>
                  <th>
                    {l.name}
                    {isStadoraArticleNumber(l.sku) && (
                      <span className="block text-xs font-normal text-muted">{l.sku}</span>
                    )}
                  </th>
                  <td className="tabular-nums">{l.qty} st</td>
                  <td className="tabular-nums">{formatSek(l.unitPrice ?? 0)}</td>
                  <td className="tabular-nums">{formatSek(lineTotal(l))}</td>
                </tr>
              ))}
              {q.freight ? (
                <tr>
                  <th>Frakt</th>
                  <td />
                  <td />
                  <td className="tabular-nums">{formatSek(q.freight)}</td>
                </tr>
              ) : null}
              <tr>
                <th>Exkl. moms</th>
                <td />
                <td />
                <td className="tabular-nums font-medium">{formatSek(ex)}</td>
              </tr>
              <tr>
                <th>Moms 25 %</th>
                <td />
                <td />
                <td className="tabular-nums">{formatSek(vat(ex))}</td>
              </tr>
              <tr>
                <th>Inkl. moms</th>
                <td />
                <td />
                <td className="tabular-nums font-medium">{formatSek(ex + vat(ex))}</td>
              </tr>
            </tbody>
          </table>
        )}
        <p className="mt-6 text-xs text-muted">
          Priser enligt offert. Godkännande är en orderavsikt.
        </p>
      </div>
      <aside className="h-fit border border-line bg-sheet p-5 lg:col-span-5">
        <p className="kicker">Ert svar</p>
        <p className="mt-3 text-sm text-muted">
          {canDecide && priced
            ? 'Välj ett av alternativen. Svaret syns direkt hos STADORA.'
            : 'Väntar på att STADORA skickar en prissatt offert.'}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={!canDecide || !priced}
            className="bg-ink px-4 py-3 text-sm text-sheet disabled:opacity-40"
            onClick={() => {
              setStatus(q.id, 'accepterad', 'Kunden godkände via länken.')
              setDone('ok')
            }}
          >
            Godkänn offerten
          </button>
          <button
            type="button"
            disabled={!canDecide || !priced}
            className="border border-ink px-4 py-3 text-sm disabled:opacity-40"
            onClick={() => {
              setStatus(q.id, 'forhandling', 'Kunden begärde ändring via länken.')
              setDone('change')
            }}
          >
            Begär ändring
          </button>
          <button
            type="button"
            disabled={!canDecide || !priced}
            className="px-4 py-3 text-sm underline disabled:opacity-40"
            onClick={() => {
              setStatus(q.id, 'forlorad', 'Kunden avböjde via länken.')
              setDone('no')
            }}
          >
            Tacka nej
          </button>
        </div>
        <p className="mt-6 text-xs text-muted">
          Intern vy:{' '}
          <Link className="underline" to={`/admin/offerter/${q.id}`}>
            öppna ärendet
          </Link>
        </p>
      </aside>
    </div>
  )
}
