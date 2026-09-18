import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

type MailRow = {
  id: string
  kind: string
  to: string
  subject: string
  text: string
  link?: string
  at: string
}

export function AdminMail() {
  const [rows, setRows] = useState<MailRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/preview/enter', { method: 'POST' })
      .then(() => api<{ messages: MailRow[] }>('/api/admin/mail'))
      .then((data) => setRows(data.messages))
      .catch(() => setError('Kunde inte läsa intern testbrevlåda.'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker">Intern testmiljö</p>
        <h1 className="mt-2 text-3xl">Testbrevlåda</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Inget externt mejl skickas. Bekräftelse och återställning dumpas här. Lösenord ingår inte.
        </p>
        <p className="mt-3 text-sm">
          <Link className="underline" to="/admin/konton">
            Tillbaka till konton
          </Link>
        </p>
      </div>
      {error && <p className="border border-dashed border-line p-4 text-sm">{error}</p>}
      {rows.length === 0 && !error ? (
        <p className="border border-dashed border-line p-6 text-sm text-muted">Inga testmejl ännu.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((m) => (
            <li key={m.id} className="border border-line bg-sheet p-4 text-sm">
              <p className="text-xs text-muted">
                {m.at} · {m.kind} · till {m.to}
              </p>
              <p className="mt-1 font-medium">{m.subject}</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-muted">{m.text}</pre>
              {m.link && (
                <p className="mt-2">
                  <a className="underline" href={m.link}>
                    Öppna länk
                  </a>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
