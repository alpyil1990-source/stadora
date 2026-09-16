import { Link } from 'react-router-dom'
import { useCommerce } from '../../context/CommerceContext'
import { formatSek, quoteTotalExVat, statusLabel, type QuoteStatus } from '../../data/commerce'

const columns: QuoteStatus[] = [
  'inkommande',
  'komplettera',
  'kalkyl',
  'skickad',
  'accepterad',
  'fakturering',
  'betald',
  'forlorad',
]

export function AdminQuotes() {
  const { quotes } = useCommerce()

  return (
    <div>
      <p className="kicker">Sälj</p>
      <h1 className="mt-2 text-3xl">Offerter</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Ett ärende per förfrågan. Pris sätts här, aldrig på produktsidan. Klicka ett ärende för att
        kalkylera, skicka och följa kundens godkännande.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2 pr-3 font-medium">Ärende</th>
              <th className="py-2 pr-3 font-medium">Kund</th>
              <th className="py-2 pr-3 font-medium">Område</th>
              <th className="py-2 pr-3 font-medium">Steg</th>
              <th className="py-2 pr-3 font-medium">Värde ex moms</th>
              <th className="py-2 font-medium">Ansvarig</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-line">
                <td className="py-3 pr-3">
                  <Link className="font-medium underline" to={`/admin/offerter/${q.id}`}>
                    {q.id}
                  </Link>
                  <p className="text-xs text-muted">{q.project}</p>
                </td>
                <td className="py-3 pr-3">{q.org}</td>
                <td className="py-3 pr-3 capitalize">{q.area}</td>
                <td className="py-3 pr-3">{statusLabel[q.status]}</td>
                <td className="py-3 pr-3 tabular-nums">
                  {q.lines.some((l) => l.unitPrice != null) ? formatSek(quoteTotalExVat(q)) : '—'}
                </td>
                <td className="py-3">{q.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((s) => {
          const n = quotes.filter((q) => q.status === s).length
          return (
            <div key={s} className="border border-line bg-sheet p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">{statusLabel[s]}</p>
              <p className="mt-2 text-2xl tabular-nums">{n}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
