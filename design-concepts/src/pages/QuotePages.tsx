import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuote, type QuoteLine } from '../context/QuoteContext'
import { products, quoteShowsArticleNumber } from '../data/content'

function lineImage(line: QuoteLine) {
  if (line.image) return { src: line.image, alt: line.imageAlt ?? line.name }
  const fallback = products[line.slug]?.images[0]
  if (fallback) return { src: fallback.src, alt: fallback.alt }
  return null
}

function QuoteThumb({ line, size = 'md' }: { line: QuoteLine; size?: 'sm' | 'md' }) {
  const img = lineImage(line)
  const box = size === 'sm' ? 'h-10 w-10' : 'h-16 w-16'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-line bg-paper ${box}`}
    >
      {img ? (
        <img src={img.src} alt={img.alt} className="h-full w-full object-contain p-1" />
      ) : (
        <span className="text-[0.6rem] text-muted" aria-hidden>
          —
        </span>
      )}
    </span>
  )
}

export function QuoteListPage() {
  const { lines, update, remove, count, pieces, area } = useQuote()

  return (
    <div>
      <p className="kicker">Offertlista · {area}</p>
      <h1 className="mt-2 text-3xl">Produkter i förfrågan</h1>
      <p className="mt-3 max-w-xl text-muted">
        {count} rader · {pieces} st totalt. Inget pris visas. Listan är separat per affärsområde.
      </p>
      {lines.length === 0 ? (
        <p className="mt-8 border border-dashed border-line p-6 text-sm text-muted">
          Inga produkter ännu.{' '}
          <Link className="underline" to="/produkter/parkmobler/parkbankar">
            Gå till parkbänkar
          </Link>
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border border-line bg-sheet">
          {lines.map((line) => (
            <li key={line.id} className="grid gap-4 p-4 md:grid-cols-12 md:items-center">
              <div className="flex items-center gap-3 md:col-span-5">
                <QuoteThumb line={line} />
                <div className="min-w-0">
                  <Link className="font-medium hover:underline" to={line.href}>
                    {line.name}
                  </Link>
                  {quoteShowsArticleNumber(products[line.slug], line.sku) && (
                    <p className="text-xs text-muted">Art.nr {line.sku}</p>
                  )}
                  {line.variant && <p className="text-sm text-muted">{line.variant}</p>}
                  {products[line.slug]?.quoteOnRequest && (
                    <p className="text-xs text-muted">Pris på förfrågan</p>
                  )}
                </div>
              </div>
              <label className="text-sm md:col-span-2">
                Antal
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border border-line px-2 py-1"
                  value={line.qty}
                  onChange={(e) => update(line.id, { qty: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
              <label className="text-sm md:col-span-4">
                Kommentar
                <textarea
                  className="mt-1 w-full border border-line px-2 py-1"
                  rows={2}
                  value={line.comment}
                  onChange={(e) => update(line.id, { comment: e.target.value })}
                  placeholder="Utförande, infästning, färg…"
                />
              </label>
              <button
                type="button"
                className="text-sm underline md:col-span-1 md:mt-6"
                onClick={() => remove(line.id)}
              >
                Ta bort
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/offert"
          className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
        >
          Fortsätt till offertförfrågan
        </Link>
        <Link to="/produkter/parkmobler/parkbankar" className="border border-ink px-5 py-3 text-sm">
          Lägg till fler produkter
        </Link>
      </div>
    </div>
  )
}

export function QuoteFormPage() {
  const { lines, pieces, area, clear } = useQuote()
  const [sent, setSent] = useState(false)
  const [ref] = useState(() => {
    const d = new Date()
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 90 + 10))}`
    return id
  })

  if (sent) {
    return (
      <div className="max-w-xl">
        <p className="kicker">Bekräftelse</p>
        <h1 className="mt-2 text-3xl">Förfrågan skickad</h1>
        <p className="mt-4 text-muted">
          Ärendenummer <strong className="text-ink tabular-nums">{ref}</strong>. I produktion skickas
          en kopia till den angivna e-postadressen. Detta koncept skickar inget meddelande.
        </p>
        <p className="mt-4 text-sm">
          Intern titel skulle bli: {ref} · {area} · {pieces} st. I admin landar det som inkommen
          förfrågan utan pris.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="underline" to="/admin/offerter/Q-2026-0188">
            Se ett inkommet ärende i admin
          </Link>
          <Link className="underline" to="/admin/flode">
            Hela kedjan förfrågan → faktura
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form
      className="grid gap-12 lg:grid-cols-12"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
        clear()
      }}
    >
      <div className="lg:col-span-7 space-y-10">
        <div>
          <p className="kicker">Steg 1</p>
          <h1 className="mt-2 text-3xl">Begär offert</h1>
          <p className="mt-3 text-sm text-muted">
            {lines.length} produkter · {pieces} st. En offertförfrågan är inte en bindande
            beställning.
          </p>
          {lines.length === 0 && (
            <p className="mt-4 text-sm">
              Listan är tom.{' '}
              <Link className="underline" to="/offertlista">
                Öppna offertlistan
              </Link>
            </p>
          )}
        </div>

        <fieldset className="space-y-4">
          <legend className="text-xl">Projekt</legend>
          <Field label="Projektnamn" name="project" required />
          <Field label="Plats / fastighet" name="site" required />
          <label className="block text-sm">
            Skede
            <select name="stage" className="mt-1 w-full border border-line bg-sheet px-3 py-2" required>
              <option value="">Välj skede</option>
              <option>Program</option>
              <option>Systemhandling</option>
              <option>Bygghandling</option>
              <option>Produktion / avrop</option>
              <option>Förvaltning / komplettering</option>
            </select>
          </label>
          <Field label="Önskad tidplan" name="timeline" />
          <label className="block text-sm">
            Önskemål och tekniska krav
            <textarea name="requirements" rows={5} className="mt-1 w-full border border-line bg-sheet px-3 py-2" />
          </label>
          <label className="block text-sm">
            Bilaga (PDF, DWG, DXF eller ZIP)
            <input
              type="file"
              name="file"
              accept=".pdf,.dwg,.dxf,.zip,application/pdf"
              className="mt-1 block w-full text-sm"
            />
            <span className="mt-1 block text-xs text-muted">
              Koncept: filen laddas inte upp. I produktion: MIME-whitelist, storleksgräns, viruskontroll,
              ingen publik URL.
            </span>
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xl">Beställare</legend>
          <Field label="Organisation" name="company" required />
          <Field label="Organisationsnummer" name="orgNr" />
          <label className="block text-sm">
            Roll
            <select name="role" className="mt-1 w-full border border-line bg-sheet px-3 py-2">
              <option>Inköpare / upphandlare</option>
              <option>Arkitekt / landskapsarkitekt</option>
              <option>Projektör / ingenjör</option>
              <option>Entreprenör</option>
              <option>Förvaltare / BRF</option>
              <option>Annan</option>
            </select>
          </label>
          <Field label="Kontaktperson" name="contact" required />
          <Field label="E-post" name="email" type="email" required />
          <Field label="Telefon" name="phone" required />
          <Field label="Leveransadress" name="address" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Postnummer" name="zip" />
            <Field label="Ort" name="city" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1" />
            Jag godkänner att uppgifterna används för att ta fram offert, enligt integritetspolicyn.
          </label>
        </fieldset>

        <button
          type="submit"
          className="bg-ink px-6 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
        >
          Skicka offertförfrågan
        </button>
      </div>

      <aside className="h-fit border border-line bg-sheet p-5 lg:col-span-5 lg:sticky lg:top-28">
        <p className="kicker">Sammanfattning</p>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3">
              <QuoteThumb line={l} size="sm" />
              <span>
                <span className="font-medium">{l.name}</span>
                {quoteShowsArticleNumber(products[l.slug], l.sku) && (
                  <span className="block text-xs text-muted">Art.nr {l.sku}</span>
                )}
                {l.variant && <span className="block text-xs text-muted">{l.variant}</span>}
                <span className="text-muted"> · {l.qty} st</span>
              </span>
            </li>
          ))}
          {lines.length === 0 && <li className="text-muted">Inga rader</li>}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Internt underlag: ärende-ID, område, rader med artikelnummer, variant, antal, kommentar,
          produktsida och bilagor.
        </p>
      </aside>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      {label}
      {required ? ' *' : ''}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full border border-line bg-sheet px-3 py-2"
      />
    </label>
  )
}
