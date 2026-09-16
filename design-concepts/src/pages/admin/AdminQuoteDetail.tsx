import { Link, Navigate, useParams } from 'react-router-dom'
import { useCommerce } from '../../context/CommerceContext'
import {
  formatSek,
  lineTotal,
  nextActions,
  quoteGoods,
  quoteTotalExVat,
  statusLabel,
  vat,
} from '../../data/commerce'

export function AdminQuoteDetail() {
  const { id } = useParams()
  const { quotes, setStatus, fillExamplePrices } = useCommerce()
  const q = quotes.find((x) => x.id === id)
  if (!q) return <Navigate to="/admin/offerter" replace />

  const goods = quoteGoods(q)
  const freight = q.freight ?? 0
  const ex = quoteTotalExVat(q)
  const priced = q.lines.every((l) => l.unitPrice != null)
  const actions = nextActions[q.status] ?? []

  return (
    <div className="space-y-8">
      <p className="text-sm">
        <Link className="underline" to="/admin/offerter">
          Alla offerter
        </Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">{statusLabel[q.status]}</p>
          <h1 className="mt-2 text-3xl">{q.id}</h1>
          <p className="mt-2 text-muted">
            {q.org} · {q.project}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {q.status === 'skickad' && (
            <Link to={`/q/${q.id}`} className="border border-ink px-4 py-2 text-sm">
              Öppna kundens länk
            </Link>
          )}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="border border-line bg-sheet p-5 lg:col-span-2">
          <h2 className="text-lg">Rader</h2>
          <p className="mt-1 text-xs text-muted">
            Enhetspris sätts av sälj/kalkyl. Kunden ser pris först när offerten är skickad.
          </p>
          <table className="spec-table mt-4 text-sm">
            <tbody>
              {q.lines.map((l) => (
                <tr key={l.name + l.sku}>
                  <th>
                    <span className="flex items-center gap-3">
                      {l.image && (
                        <img src={l.image} alt="" className="h-10 w-10 object-contain bg-paper" />
                      )}
                      <span>
                        {l.name}
                        {l.sku && <span className="block text-xs text-muted">Art.nr {l.sku}</span>}
                        {l.comment && <span className="block text-xs text-muted">{l.comment}</span>}
                      </span>
                    </span>
                  </th>
                  <td className="tabular-nums">{l.qty} st</td>
                  <td className="tabular-nums">
                    {l.unitPrice != null ? formatSek(l.unitPrice) : 'Ej prissatt'}
                  </td>
                  <td className="tabular-nums">
                    {l.unitPrice != null ? formatSek(lineTotal(l)) : '—'}
                  </td>
                </tr>
              ))}
              <tr>
                <th>Frakt / leverans</th>
                <td />
                <td />
                <td className="tabular-nums">{freight ? formatSek(freight) : '—'}</td>
              </tr>
              <tr>
                <th>Summa exkl. moms</th>
                <td />
                <td />
                <td className="tabular-nums font-medium">{priced ? formatSek(ex) : '—'}</td>
              </tr>
              <tr>
                <th>Moms 25 %</th>
                <td />
                <td />
                <td className="tabular-nums">{priced ? formatSek(vat(ex)) : '—'}</td>
              </tr>
              <tr>
                <th>Att betala inkl. moms</th>
                <td />
                <td />
                <td className="tabular-nums font-medium">
                  {priced ? formatSek(ex + vat(ex)) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
          {goods === 0 && (
            <p className="mt-3 text-sm text-muted">
              Inkommen förfrågan har inga priser. Ta in i kalkyl och fyll exempelpris innan utskick.
            </p>
          )}
          {q.status === 'kalkyl' && q.lines.some((l) => l.unitPrice == null) && (
            <button
              type="button"
              className="mt-4 border border-ink px-3 py-2 text-sm"
              onClick={() => fillExamplePrices(q.id)}
            >
              Fyll exempelpris (koncept)
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div className="border border-line bg-sheet p-5 text-sm">
            <p className="kicker">Beställare</p>
            <p className="mt-3 font-medium">{q.org}</p>
            {q.orgNr && <p className="text-muted">Org.nr {q.orgNr}</p>}
            <p className="mt-2">{q.contact}</p>
            <p>{q.email}</p>
            {q.phone && <p>{q.phone}</p>}
            <p className="mt-3 text-muted">
              {q.site}
              <br />
              Skede: {q.stage}
            </p>
            <p className="mt-3">Ansvarig: {q.owner}</p>
            {q.validUntil && <p>Giltig t.o.m. {q.validUntil}</p>}
            {q.lostReason && <p className="mt-2">Skäl: {q.lostReason}</p>}
          </div>
          <div className="border border-line bg-sheet p-5">
            <p className="kicker">Nästa steg</p>
            <div className="mt-3 flex flex-col gap-2">
              {actions.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  className="bg-ink px-3 py-2 text-left text-sm text-sheet"
                  onClick={() => setStatus(q.id, a.to, a.label)}
                  disabled={a.to === 'skickad' && !priced}
                >
                  {a.label}
                </button>
              ))}
              {actions.length === 0 && (
                <p className="text-sm text-muted">Inga fler steg i konceptet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {q.status === 'skickad' && (
        <section className="border border-line bg-sheet p-5">
          <p className="kicker">Mejl till kund</p>
          <h2 className="mt-2 text-lg">Så här ser utskicket ut</h2>
          <div className="mt-4 max-w-xl border border-line bg-paper p-4 text-sm">
            <p className="text-muted">Till: {q.email}</p>
            <p className="mt-1 font-medium">Ämne: Offert {q.id} från STADORA — {q.project}</p>
            <p className="mt-4">Hej {q.contact.split(' ')[0]},</p>
            <p className="mt-3">
              Bifogat finns offert {q.id} för {q.project}. Totalt {formatSek(ex)} exkl. moms (
              {formatSek(ex + vat(ex))} inkl. moms). Giltig t.o.m. {q.validUntil}.
            </p>
            <p className="mt-3">
              Pris visas inte på webbplatsen. Öppna länken för att granska raderna och godkänna,
              begära ändring eller tacka nej. Godkännande är en orderavsikt — ingen kortbetalning.
              Faktura skickas efter leverans/avtal.
            </p>
            <p className="mt-4">
              <Link className="underline" to={`/q/${q.id}`}>
                Öppna offerten
              </Link>
            </p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg">Händelser</h2>
        <ol className="mt-3 space-y-3 border-t border-line pt-3 text-sm">
          {q.events.map((e, i) => (
            <li key={i} className="flex gap-4">
              <span className="w-36 shrink-0 tabular-nums text-muted">{e.at}</span>
              <span>
                <span className="text-muted">{e.actor}: </span>
                {e.text}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
