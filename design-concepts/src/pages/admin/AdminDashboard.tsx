import { Link } from 'react-router-dom'
import { useCommerce, useKpis } from '../../context/CommerceContext'
import {
  formatSek,
  quoteTotalExVat,
  type QuoteStatus,
} from '../../data/commerce'

const funnel: { status: QuoteStatus; label: string }[] = [
  { status: 'inkommande', label: 'Förfrågan' },
  { status: 'kalkyl', label: 'Kalkyl' },
  { status: 'skickad', label: 'Skickad' },
  { status: 'accepterad', label: 'Godkänd' },
  { status: 'fakturering', label: 'Faktura' },
  { status: 'betald', label: 'Betald' },
]

export function AdminDashboard() {
  const { quotes, invoices, reset } = useCommerce()
  const k = useKpis()
  const byArea = (['offentlig', 'skola', 'vard'] as const).map((area) => ({
    area,
    label: area === 'offentlig' ? 'Offentlig miljö' : area === 'skola' ? 'Skola' : 'Vård',
    n: quotes.filter((q) => q.area === area).length,
    v: quotes.filter((q) => q.area === area).reduce((s, q) => s + quoteTotalExVat(q), 0),
  }))
  const maxFunnel = Math.max(
    ...funnel.map((f) => quotes.filter((q) => q.status === f.status).length),
    1,
  )
  const aging = quotes
    .filter((q) => q.status === 'skickad' || q.status === 'forhandling')
    .sort((a, b) => (a.validUntil ?? '').localeCompare(b.validUntil ?? ''))

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">VD / ekonomi</p>
          <h1 className="mt-2 text-3xl">Översikt</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Siffror från konceptdata (exkl. moms). Inte live-ekonomi. Katalogpriser finns inte — värde
            uppstår först i kalkyl och offert.
          </p>
        </div>
        <button type="button" className="text-sm underline" onClick={reset}>
          Återställ exempel
        </button>
      </div>

      <section className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Orderingång YTD" value={formatSek(k.ordersYtd)} hint="Godkända offerter och vidare" />
        <Kpi label="Fakturerat YTD" value={formatSek(k.invoicedYtd)} hint="Utestående + betalt" />
        <Kpi label="Inbetalt YTD" value={formatSek(k.collectedYtd)} hint="Kundinbetalningar" />
        <Kpi label="Kundfordringar" value={formatSek(k.receivables)} hint="Skickade obetalda fakturor" />
        <Kpi label="Pipeline" value={formatSek(k.pipeline)} hint="Kalkyl + skickad + förhandling" />
        <Kpi label="Vinstandel" value={`${k.winRate} %`} hint="Vunna / (vunna + förlorade)" />
        <Kpi label="Öppna ärenden" value={String(k.openQuotes)} hint="Inte betald, förlorad eller utgången" />
        <Kpi label="Snitt RFQ → offert" value={`${k.avgDaysToSend} dagar`} hint="Konceptantagande" />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl">Tratt</h2>
          <p className="mt-1 text-sm text-muted">Antal ärenden i respektive steg just nu.</p>
          <ul className="mt-5 space-y-3">
            {funnel.map((f) => {
              const n = quotes.filter((q) => q.status === f.status).length
              return (
                <li key={f.status}>
                  <div className="flex justify-between text-sm">
                    <span>{f.label}</span>
                    <span className="tabular-nums">{n}</span>
                  </div>
                  <div className="mt-1 h-2 bg-line">
                    <div className="h-2 bg-ink" style={{ width: `${(n / maxFunnel) * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <h2 className="text-xl">Per affärsområde</h2>
          <table className="spec-table mt-4 text-sm">
            <thead>
              <tr>
                <th>Område</th>
                <td className="font-medium">Ärenden</td>
                <td className="font-medium">Värde i kalkyl</td>
              </tr>
            </thead>
            <tbody>
              {byArea.map((r) => (
                <tr key={r.area}>
                  <th>{r.label}</th>
                  <td className="tabular-nums">{r.n}</td>
                  <td className="tabular-nums">{formatSek(r.v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl">Offerter som väntar på kund</h2>
        {aging.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Inga skickade offerter just nu.</p>
        ) : (
          <table className="spec-table mt-4 text-sm">
            <tbody>
              {aging.map((q) => (
                <tr key={q.id}>
                  <th>
                    <Link className="underline" to={`/admin/offerter/${q.id}`}>
                      {q.id}
                    </Link>
                  </th>
                  <td>
                    {q.org}
                    <span className="text-muted"> · {q.project}</span>
                  </td>
                  <td className="tabular-nums">{formatSek(quoteTotalExVat(q))}</td>
                  <td>Giltig t.o.m. {q.validUntil ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-xl">Likviditet — fakturor</h2>
        <ul className="mt-4 divide-y divide-line border border-line bg-sheet text-sm">
          {invoices.map((i) => (
            <li key={i.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
              <span>
                <Link className="underline" to="/admin/fakturor">
                  {i.id}
                </Link>
                <span className="text-muted"> · {i.customer}</span>
              </span>
              <span className="tabular-nums">
                {formatSek(i.amount)} · {i.status === 'betald' ? `betald ${i.paidAt}` : `förfaller ${i.dueAt}`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-sheet p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  )
}
