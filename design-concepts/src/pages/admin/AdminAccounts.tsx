import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

type AccountRow = {
  id: string
  email: string
  role: string
  verified: boolean
  newsletter: boolean
  name: string
  company: string
  createdAt: string
  downloads: number
}

export function AdminAccounts() {
  const [rows, setRows] = useState<AccountRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/preview/enter', { method: 'POST' })
      .then(() => api<{ accounts: AccountRow[] }>('/api/admin/accounts'))
      .then((data) => setRows(data.accounts))
      .catch(() => setError('Kunde inte hämta konton. Kontrollera att dokument-API:t körs.'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker">Intern testmiljö</p>
        <h1 className="mt-2 text-3xl">Dokumentkonton</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Leverantörsoberoende konton. Inget konto är publikt aktiverat. Lösenordshashar visas inte.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/nedladdningar">
            Nedladdningslogg
          </Link>
          {' · '}
          <Link className="underline" to="/admin/testmejl">
            Intern testbrevlåda
          </Link>
        </p>
      </div>
      {error && <p className="border border-dashed border-line p-4 text-sm">{error}</p>}
      {rows.length === 0 && !error ? (
        <p className="border border-dashed border-line p-6 text-sm text-muted">
          Inga registrerade konton ännu.
        </p>
      ) : (
        <div className="overflow-x-auto border border-line bg-sheet">
          <table className="spec-table w-full text-sm">
            <thead>
              <tr>
                <th>E-post</th>
                <th>Namn / företag</th>
                <th>Status</th>
                <th>Nyhetsbrev</th>
                <th>Nedladdningar</th>
                <th>Skapat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.email}
                    <span className="block text-xs text-muted">{r.id}</span>
                  </td>
                  <td>
                    {r.name || '—'}
                    <span className="block text-xs text-muted">{r.company || 'företag saknas'}</span>
                  </td>
                  <td>
                    {r.role === 'admin' ? 'admin' : 'kund'}
                    {r.verified ? ' · verifierad' : ' · ej verifierad'}
                  </td>
                  <td>{r.newsletter ? 'ja' : 'nej'}</td>
                  <td>{r.downloads}</td>
                  <td className="tabular-nums">{r.createdAt.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
