import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useSuppliers } from '../../context/SupplierContext'
import { products, productPath } from '../../data/content'
import { colorChoices, hasColorTaggedImages, hasSizeTaggedImages } from '../../data/gallery'
import { purchaseHint, supplierHasPurchaseList } from '../../data/purchase-admin'
import { supplierStatusLabel, type SupplierStatus } from '../../data/suppliers'
import { AdminBinsigniaTerms } from './AdminBinsigniaTerms'
import { AdminInvestimTerms } from './AdminInvestimTerms'
import { AdminInoplexTerms } from './AdminInoplexTerms'
import { AdminStreetparkTerms } from './AdminStreetparkTerms'

const statuses: SupplierStatus[] = ['aktiv', 'invantar_underlag', 'pausad']

export function AdminSupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { suppliers, update, updateContact, assignProduct, unassignProduct, remove, productCount } =
    useSuppliers()
  const supplier = suppliers.find((s) => s.id === id)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [pick, setPick] = useState('')

  if (!supplier) return <Navigate to="/admin/leverantorer" replace />

  const linked = supplier.productSlugs
    .map((slug) => products[slug])
    .filter(Boolean)
  const assignable = Object.values(products).filter(
    (p) => p.area === 'offentlig' && !supplier.productSlugs.includes(p.slug),
  )

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm">
          <Link className="underline" to="/admin/leverantorer">
            Alla leverantörer
          </Link>
        </p>
        <p className="kicker mt-4">Leverantör</p>
        <h1 className="mt-2 text-3xl">{supplier.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {productCount(supplier.id)} produkter i konceptet · bilder ska komma från den här
          leverantörens länk.
          {supplierHasPurchaseList(supplier.id)
            ? ' Inköpspris (listpris och netto i EUR) ligger i listan på den här sidan, inte på den publika produktsidan.'
            : ''}
        </p>
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <form
          className="space-y-3 border border-line bg-sheet p-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <p className="font-medium">Företag</p>
          <Field
            label="Namn"
            value={supplier.name}
            onChange={(v) => update(supplier.id, { name: v })}
          />
          <Field
            label="Org.nr / reg."
            value={supplier.orgNr}
            onChange={(v) => update(supplier.id, { orgNr: v })}
          />
          <Field
            label="VAT"
            value={supplier.vatNr ?? ''}
            onChange={(v) => update(supplier.id, { vatNr: v })}
          />
          <Field
            label="Juridiskt namn"
            value={supplier.legalName ?? ''}
            onChange={(v) => update(supplier.id, { legalName: v })}
          />
          <Field
            label="Webb"
            value={supplier.website}
            onChange={(v) => update(supplier.id, { website: v })}
          />
          <Field
            label="Adress"
            value={supplier.address}
            onChange={(v) => update(supplier.id, { address: v })}
          />
          <label className="block text-sm">
            Status
            <select
              className="mt-1 w-full border border-line bg-sheet px-3 py-2"
              value={supplier.status}
              onChange={(e) => update(supplier.id, { status: e.target.value as SupplierStatus })}
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {supplierStatusLabel[st]}
                </option>
              ))}
            </select>
          </label>
        </form>

        <form
          className="space-y-3 border border-line bg-sheet p-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <p className="font-medium">Kontaktperson</p>
          <Field
            label="Namn"
            value={supplier.contact.name}
            onChange={(v) => updateContact(supplier.id, { name: v })}
            placeholder="Saknas — fylls i när ni har namnet"
          />
          <Field
            label="Roll"
            value={supplier.contact.role}
            onChange={(v) => updateContact(supplier.id, { role: v })}
            placeholder="t.ex. säljare, katalogansvarig"
          />
          <Field
            label="E-post"
            value={supplier.contact.email}
            onChange={(v) => updateContact(supplier.id, { email: v })}
          />
          <Field
            label="Telefon"
            value={supplier.contact.phone}
            onChange={(v) => updateContact(supplier.id, { phone: v })}
          />
          <Field
            label="Mobil"
            value={supplier.contact.mobile ?? ''}
            onChange={(v) => updateContact(supplier.id, { mobile: v })}
          />
        </form>
      </section>

      <section className="space-y-3 border border-line bg-sheet p-5">
        <p className="font-medium">Bilder och katalog från leverantören</p>
        <p className="text-sm text-muted">
          Klistra in den länk ni får (asset-bank, produkt-PDF, FTP, webbkatalog). Prototypen hämtar
          inte filer automatiskt än — fältet visar var underlaget ska ligga i admin.
        </p>
        <Field
          label="Bildkälla / katalog-URL"
          value={supplier.mediaSource}
          onChange={(v) => update(supplier.id, { mediaSource: v })}
          placeholder="https://… från leverantören, inte stadora.se"
        />
        <label className="block text-sm">
          Intern notering
          <textarea
            className="mt-1 w-full border border-line px-3 py-2"
            rows={4}
            value={supplier.notes}
            onChange={(e) => update(supplier.id, { notes: e.target.value })}
          />
        </label>
      </section>

      {supplier.id === 'binsignia' && <AdminBinsigniaTerms />}
      {supplier.id === 'investim' && <AdminInvestimTerms />}
      {supplier.id === 'streetpark' && <AdminStreetparkTerms />}
      {supplier.id === 'inoplex' && <AdminInoplexTerms />}

      <section>
        <h2 className="text-xl">Produkter från den här leverantören</h2>
        <p className="mt-2 text-sm text-muted">
          Antalet är det ni säljer i STADORA-katalogen, inte hela leverantörens sortiment. Skola och
          vård kopplas inte här ännu.
        </p>
        {linked.length === 0 ? (
          <p className="mt-4 border border-dashed border-line p-4 text-sm text-muted">
            Inga produkter kopplade.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border border-line bg-sheet">
            {linked.map((p) => {
              const colors = colorChoices(p)
              const sizes = p.sizes ?? []
              const colorPhotos = hasColorTaggedImages(p.images)
              const sizePhotos = hasSizeTaggedImages(p.images)
              const hint = purchaseHint(supplier.id, p.slug)
              return (
                <li key={p.slug} className="grid gap-3 p-4 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-5">
                    <Link className="font-medium underline" to={productPath(p)}>
                      {p.name}
                    </Link>
                    {hint && (
                      <p className={`mt-1 text-xs ${hint.missing ? 'text-muted' : ''}`}>
                        {hint.label}{' '}
                        <Link className="underline" to={hint.href}>
                          Visa rader
                        </Link>
                      </p>
                    )}
                    {p.sku && !p.materials?.length && <p className="text-xs text-muted">Art.nr {p.sku}</p>}
                    {p.materials && p.materials.length > 0 && (
                      <p className="text-xs text-muted">
                        {p.materials.map((m) => `${m.code} ${m.sku}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted md:col-span-5">
                    {sizes.length > 0 && (
                      <p>
                        Storlekar:{' '}
                        {sizes
                          .map((s) =>
                            `${s.name}${
                              sizePhotos && !p.images.some((i) => i.size === s.name)
                                ? ' (bild saknas)'
                                : ''
                            }`,
                          )
                          .join(' · ')}
                      </p>
                    )}
                    {colors.length > 0 && (
                      <p>
                        Kulörer: {colors.map((c) => c.name).join(', ')}
                        {colorPhotos ? '' : ' — ingen kulörspecifik bild'}
                      </p>
                    )}
                    {p.ralInQuote && <p>RAL anges i offerten. Ingen unik bild per kulör.</p>}
                    {sizes.length === 0 && colors.length === 0 && !p.ralInQuote && (
                      <p>Ingen variantmärkt bild i konceptet.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-left text-sm underline md:col-span-2 md:text-right"
                    onClick={() => unassignProduct(p.slug)}
                  >
                    Ta bort koppling
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {assignable.length > 0 && (
          <form
            className="mt-4 flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!pick) return
              assignProduct(supplier.id, pick)
              setPick('')
            }}
          >
            <label className="text-sm">
              Koppla offentlig produkt
              <select
                className="mt-1 block border border-line bg-sheet px-3 py-2"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">Välj…</option>
                {assignable.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="border border-ink px-3 py-2 text-sm">
              Koppla
            </button>
          </form>
        )}
      </section>

      <section className="border border-line p-5">
        {confirmRemove ? (
          <div className="space-y-3 text-sm">
            <p>Ta bort leverantören från konceptet? Produktkopplingar släpps.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="bg-ink px-4 py-2 text-sheet"
                onClick={() => {
                  remove(supplier.id)
                  navigate('/admin/leverantorer')
                }}
              >
                Ta bort
              </button>
              <button type="button" className="border border-line px-4 py-2" onClick={() => setConfirmRemove(false)}>
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="text-sm underline" onClick={() => setConfirmRemove(true)}>
            Ta bort leverantör
          </button>
        )}
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        className="mt-1 w-full border border-line px-3 py-2"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
