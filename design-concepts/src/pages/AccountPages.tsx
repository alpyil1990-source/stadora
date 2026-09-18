import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError, api } from '../lib/api'
import { safeReturnPath, withNextQuery } from '../lib/returnPath'

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  minLength,
}: {
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 w-full border border-line bg-sheet px-3 py-2"
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
      />
    </label>
  )
}

function FormError({ message }: { message: string }) {
  if (!message) return null
  return <p className="border border-dashed border-line bg-sheet px-3 py-2 text-sm">{message}</p>
}

export function RegisterPage() {
  const { user, refresh } = useAuth()
  const [params] = useSearchParams()
  const next = safeReturnPath(params.get('next'))
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [pending, setPending] = useState(false)

  if (user) return <Navigate to={next} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      const data = await api<{ message: string }>('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          privacy: form.get('privacy') === 'on',
          newsletter: form.get('newsletter') === 'on',
          company_url: form.get('company_url'),
        }),
      })
      setDone(data.message)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registreringen kunde inte slutföras.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="kicker">Intern testmiljö</p>
        <h1 className="mt-2 text-3xl">Skapa dokumentkonto</h1>
        <p className="mt-3 text-sm text-muted">
          Kontot ger inte automatiskt tillgång till leverantörsfiler. Nya dokument är interna tills
          STADORA öppnar dem. Registrering är inte en prenumeration.
        </p>
      </div>
      {done ? (
        <p className="border border-line bg-sheet p-4 text-sm">
          {done}{' '}
          <Link className="underline" to={withNextQuery('/konto/logga-in', next)}>
            Logga in
          </Link>
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormError message={error} />
          <Field label="E-postadress" name="email" type="email" autoComplete="email" required />
          <Field
            label="Lösenord (minst 10 tecken)"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
          <div className="absolute left-[-10000px]" aria-hidden="true">
            <label>
              Webbplats
              <input name="company_url" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="privacy" required className="mt-1" />
            <span>
              Jag har läst och godkänner{' '}
              <Link className="underline" to="/integritet">
                integritetspolicyn
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="newsletter" className="mt-1" />
            <span>
              Jag vill få nyhetsbrev eller produktinformation (frivilligt, inte förkryssat). Ett
              dokumentkonto innebär inte marknadsföring.
            </span>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet disabled:opacity-40"
          >
            Skapa konto
          </button>
        </form>
      )}
      <p className="text-sm">
        Har du redan konto?{' '}
        <Link className="underline" to={withNextQuery('/konto/logga-in', next)}>
          Logga in
        </Link>
      </p>
    </div>
  )
}

export function LoginPage() {
  const { user, refresh } = useAuth()
  const [params] = useSearchParams()
  const next = safeReturnPath(params.get('next'))
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  if (user) return <Navigate to={next} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      })
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inloggningen misslyckades.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="kicker">Intern testmiljö</p>
        <h1 className="mt-2 text-3xl">Logga in</h1>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormError message={error} />
        <Field label="E-postadress" name="email" type="email" autoComplete="email" required />
        <Field
          label="Lösenord"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet disabled:opacity-40"
        >
          Logga in
        </button>
      </form>
      <p className="text-sm">
        <Link className="underline" to="/konto/glomt">
          Glömt lösenord
        </Link>
        {' · '}
        <Link className="underline" to={withNextQuery('/konto/skapa', next)}>
          Skapa konto
        </Link>
      </p>
    </div>
  )
}

export function VerifyPage() {
  const [params] = useSearchParams()
  const [message, setMessage] = useState('Bekräftar e-postadressen…')
  const token = params.get('token') || ''

  useEffect(() => {
    if (!token) {
      setMessage('Länken saknar token.')
      return
    }
    api('/api/verify', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setMessage('E-postadressen är bekräftad. Du kan logga in.'))
      .catch((err) =>
        setMessage(err instanceof ApiError ? err.message : 'Länken kunde inte användas.'),
      )
  }, [token])

  return (
    <div className="mx-auto max-w-md space-y-4">
      <p className="kicker">Dokumentkonto</p>
      <h1 className="mt-2 text-3xl">Bekräfta e-post</h1>
      <p className="text-sm text-muted">{message}</p>
      <p className="text-sm">
        <Link className="underline" to="/konto/logga-in">
          Till inloggning
        </Link>
      </p>
    </div>
  )
}

export function ForgotPage() {
  const [done, setDone] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      const data = await api<{ message: string }>('/api/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: form.get('email') }),
      })
      setDone(data.message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunde inte skicka länk.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <p className="kicker">Dokumentkonto</p>
        <h1 className="mt-2 text-3xl">Glömt lösenord</h1>
        <p className="mt-3 text-sm text-muted">
          I testmiljön läggs länken i den interna brevlådan, inte i ett externt mejl.
        </p>
      </div>
      {done ? (
        <p className="border border-line bg-sheet p-4 text-sm">{done}</p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormError message={error} />
          <Field label="E-postadress" name="email" type="email" autoComplete="email" required />
          <button
            type="submit"
            disabled={pending}
            className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet disabled:opacity-40"
          >
            Skicka återställningslänk
          </button>
        </form>
      )}
    </div>
  )
}

export function ResetPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      await api('/api/reset', {
        method: 'POST',
        body: JSON.stringify({ token, password: form.get('password') }),
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lösenordet kunde inte ändras.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <p className="kicker">Dokumentkonto</p>
      <h1 className="mt-2 text-3xl">Välj nytt lösenord</h1>
      {done ? (
        <p className="text-sm">
          Lösenordet är uppdaterat.{' '}
          <Link className="underline" to="/konto/logga-in">
            Logga in
          </Link>
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormError message={error} />
          <Field
            label="Nytt lösenord (minst 10 tecken)"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
          />
          <button
            type="submit"
            disabled={pending || !token}
            className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet disabled:opacity-40"
          >
            Spara lösenord
          </button>
        </form>
      )}
    </div>
  )
}

export function AccountPage() {
  const { user, loading, refresh, logout } = useAuth()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [pending, setPending] = useState(false)

  if (loading) return <p className="text-sm text-muted">Hämtar konto…</p>
  if (!user) return <Navigate to="/konto/logga-in" replace />

  async function onProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaved('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      await api('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          company: form.get('company'),
          newsletter: form.get('newsletter') === 'on',
        }),
      })
      await refresh()
      setSaved('Uppgifterna är sparade.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kunde inte spara.')
    } finally {
      setPending(false)
    }
  }

  async function onDelete(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!window.confirm('Radera kontot? Nedladdningsloggen anonymiseras.')) return
    setError('')
    setPending(true)
    const form = new FormData(e.currentTarget)
    try {
      await api('/api/account/delete', {
        method: 'POST',
        body: JSON.stringify({ password: form.get('password') }),
      })
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kontot kunde inte raderas.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <p className="kicker">Dokumentkonto</p>
        <h1 className="mt-2 text-3xl">Mitt konto</h1>
        <p className="mt-3 text-sm text-muted">
          {user.email}
          {user.verified ? ' · e-post bekräftad' : ' · e-post inte bekräftad än'}
          {user.role === 'admin' ? ' · administratör' : ''}
        </p>
      </div>
      <FormError message={error} />
      {saved && <p className="text-sm">{saved}</p>}
      <form className="space-y-4 border border-line bg-sheet p-5" onSubmit={onProfile}>
        <p className="font-medium">Valfria uppgifter</p>
        <p className="text-sm text-muted">Namn och företag krävs inte för att skapa kontot.</p>
        <label className="block text-sm">
          Namn
          <input
            className="mt-1 w-full border border-line px-3 py-2"
            name="name"
            defaultValue={user.name}
            autoComplete="name"
          />
        </label>
        <label className="block text-sm">
          Företag
          <input
            className="mt-1 w-full border border-line px-3 py-2"
            name="company"
            defaultValue={user.company}
            autoComplete="organization"
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="newsletter" defaultChecked={user.newsletter} className="mt-1" />
          Nyhetsbrev eller produktinformation
        </label>
        <button
          type="submit"
          disabled={pending}
          className="border border-ink px-4 py-2 text-sm disabled:opacity-40"
        >
          Spara
        </button>
      </form>
      <form className="space-y-3 border border-dashed border-line p-5" onSubmit={onDelete}>
        <p className="font-medium">Radera konto</p>
        <p className="text-sm text-muted">
          Kräver lösenord. Personuppgifter tas bort. Nedladdningsraderna behålls utan e-post.
        </p>
        <Field
          label="Bekräfta med lösenord"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <button type="submit" disabled={pending} className="text-sm underline disabled:opacity-40">
          Radera mitt konto
        </button>
      </form>
      <button type="button" className="text-sm underline" onClick={() => void logout()}>
        Logga ut
      </button>
    </div>
  )
}
