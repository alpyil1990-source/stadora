import { Link } from 'react-router-dom'
import { useCommerce } from '../../context/CommerceContext'
import { formatSek, invoiceLabel } from '../../data/commerce'

export function AdminInvoices() {
  const { invoices, quotes } = useCommerce()

  return (
    <div>
      <p className="kicker">Ekonomi</p>
      <h1 className="mt-2 text-3xl">Fakturor</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Fakturan skapas efter godkänd offert och order — inte i kassan. I produktion kopplas detta
        till Fortnox/Visma. Kunden betalar enligt förfallodatum, ofta 30 dagar.
      </p>
      <table className="spec-table mt-8 text-sm">
        <tbody>
          {invoices.map((i) => {
            const q = quotes.find((x) => x.id === i.quoteId)
            return (
              <tr key={i.id}>
                <th>
                  {i.id}
                  <span className="block text-xs font-normal text-muted">{invoiceLabel[i.status]}</span>
                </th>
                <td>
                  {i.customer}
                  {q && (
                    <span className="block">
                      <Link className="underline" to={`/admin/offerter/${q.id}`}>
                        {q.id}
                      </Link>
                    </span>
                  )}
                </td>
                <td className="tabular-nums">{formatSek(i.amount)} exkl. moms</td>
                <td>
                  Utställd {i.issuedAt}
                  <span className="block text-muted">
                    {i.paidAt ? `Betald ${i.paidAt}` : `Förfaller ${i.dueAt}`}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
