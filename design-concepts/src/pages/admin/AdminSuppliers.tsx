import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSuppliers } from '../../context/SupplierContext'
import { emptyContact, supplierStatusLabel, type SupplierStatus } from '../../data/suppliers'
import { products } from '../../data/content'

const statuses: SupplierStatus[] = ['aktiv', 'invantar_underlag', 'pausad']

export function AdminSuppliers() {
  const { suppliers, add, reset, productCount, unassignedSlugs } = useSuppliers()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [mediaSource, setMediaSource] = useState('')
  const [error, setError] = useState('')

  const totals = useMemo(() => {
    const inConcept = suppliers.reduce((n, s) => n + productCount(s.id), 0)
    const missingContact = suppliers.filter((s) => !s.contact.name.trim()).length
    const waiting = suppliers.filter((s) => s.status === 'invantar_underlag').length
    return { inConcept, missingContact, waiting, unassigned: unassignedSlugs.length }
  }, [productCount, suppliers, unassignedSlugs.length])

  function onAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Namn krävs.')
      return
    }
    const id = add({
      name: trimmed,
      status: 'invantar_underlag',
      orgNr: '',
      website: website.trim(),
      mediaSource: mediaSource.trim(),
      contact: { ...emptyContact(), email: email.trim() },
      address: '',
      notes: 'Ny rad. Fyll kontaktperson och bildlänk när ni har dem från leverantören.',
    })
    setName('')
    setEmail('')
    setWebsite('')
    setMediaSource('')
    setError('')
    setOpen(false)
    navigate(`/admin/leverantorer/${id}`)
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Inköp / katalog</p>
          <h1 className="mt-2 text-3xl">Leverantörer</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            En rad per leverantör: kontaktperson, hur många produkter vi har från dem, och var
            bilderna ska hämtas. Produktfoton kommer från leverantörens länk — inte från den
            publicerade sajten. Skola och vård väntar; räkna bara offentlig miljö just nu.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <button type="button" className="underline" onClick={reset}>
            Återställ exempel
          </button>
          <button
            type="button"
            className="bg-ink px-4 py-2 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
            onClick={() => setOpen(true)}
          >
            Ny leverantör
          </button>
        </div>
      </div>

      <section className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Leverantörer" value={String(suppliers.length)} />
        <Stat label="Produkter kopplade" value={String(totals.inConcept)} />
        <Stat label="Saknar kontaktperson" value={String(totals.missingContact)} />
        <Stat label="Inväntar underlag" value={String(totals.waiting)} />
      </section>

      <p className="border border-line bg-sheet px-4 py-3 text-sm text-muted">
        Skola och vård är pausade. Inga Mirplay-, Gerom- eller vårdleverantörer läggs in förrän ni
        skickar namn, kontakt och bildlänkar.
      </p>

      {open && (
        <form className="max-w-xl space-y-3 border border-line bg-sheet p-5" onSubmit={onAdd}>
          <p className="font-medium">Ny leverantör</p>
          <label className="block text-sm">
            Namn
            <input
              className="mt-1 w-full border border-line px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Kontakt e-post
            <input
              type="email"
              className="mt-1 w-full border border-line px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Webb
            <input
              className="mt-1 w-full border border-line px-3 py-2"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </label>
          <label className="block text-sm">
            Bildkälla från leverantören
            <input
              className="mt-1 w-full border border-line px-3 py-2"
              value={mediaSource}
              onChange={(e) => setMediaSource(e.target.value)}
              placeholder="Katalog-URL, asset-bank eller mapp ni får av dem"
            />
          </label>
          {error && <p className="text-sm text-warn">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-ink px-4 py-2 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
            >
              Spara
            </button>
            <button type="button" className="border border-line px-4 py-2 text-sm" onClick={() => setOpen(false)}>
              Avbryt
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2 pr-3 font-medium">Leverantör</th>
              <th className="py-2 pr-3 font-medium">Kontaktperson</th>
              <th className="py-2 pr-3 font-medium">Produkter</th>
              <th className="py-2 pr-3 font-medium">Bildkälla</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const n = productCount(s.id)
              const contact = s.contact.name.trim() || s.contact.email.trim() || '—'
              return (
                <tr key={s.id} className="border-b border-line">
                  <td className="py-3 pr-3">
                    <Link className="font-medium underline" to={`/admin/leverantorer/${s.id}`}>
                      {s.name}
                    </Link>
                    {s.orgNr && <p className="text-xs text-muted">Org.nr {s.orgNr}</p>}
                  </td>
                  <td className="py-3 pr-3">
                    {contact}
                    {s.contact.role && <p className="text-xs text-muted">{s.contact.role}</p>}
                  </td>
                  <td className="py-3 pr-3 tabular-nums">{n}</td>
                  <td className="py-3 pr-3 text-muted">
                    {s.mediaSource.trim() ? 'Angiven' : 'Saknas'}
                  </td>
                  <td className="py-3">{supplierStatusLabel[s.status]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="text-xl">Status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {statuses.map((st) => (
            <div key={st} className="border border-line bg-sheet p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">{supplierStatusLabel[st]}</p>
              <p className="mt-2 text-2xl tabular-nums">
                {suppliers.filter((s) => s.status === st).length}
              </p>
            </div>
          ))}
        </div>
      </section>

      {unassignedSlugs.length > 0 && (
        <section>
          <h2 className="text-xl">Offentliga produkter utan leverantör</h2>
          <ul className="mt-3 text-sm text-muted">
            {unassignedSlugs.map((slug) => (
              <li key={slug} className="border-b border-line py-2">
                {products[slug]?.name ?? slug}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sheet p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl tabular-nums">{value}</p>
    </div>
  )
}
