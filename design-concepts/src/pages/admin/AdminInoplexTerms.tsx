import { Link } from 'react-router-dom'
import { INOPLEX_SLUGS, inoplexGaps, inoplexProducts } from '../../data/inoplex'
import { productPath } from '../../data/content'

export function AdminInoplexTerms() {
  const withGaps = inoplexGaps.filter((g) => g.gaps.length > 0)
  return (
    <section id="inkopspris" className="scroll-mt-8 space-y-4 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Intern inköpslista</p>
        <h2 className="mt-2 text-xl">Inköpspris saknas</h2>
        <p className="mt-2 text-sm text-muted">
          Leverantören lämnar pris vid offertförfrågan. Fältet lämnas tomt — aldrig 0 kr. Intern
          markering: leverantörsoffert krävs före kundpris. {INOPLEX_SLUGS.length} produkter i
          katalogen. Tillverkare och originalnamn syns bara här, inte på den publika sidan.
        </p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>
          <span className="text-muted">Juridiskt namn</span>
          <p className="font-medium">INOPLEX</p>
        </li>
        <li>
          <span className="text-muted">Webb</span>
          <p className="font-medium">https://inoplex.pl/en</p>
        </li>
        <li className="sm:col-span-2">
          <span className="text-muted">Undantag</span>
          <p className="font-medium">Baseboards / socklar är inte importerade.</p>
        </li>
      </ul>
      <p className="text-sm">
        Exempel:{' '}
        {INOPLEX_SLUGS.slice(0, 4).map((slug, i) => {
          const p = inoplexProducts[slug]
          if (!p) return null
          return (
            <span key={slug}>
              {i > 0 ? ' · ' : ''}
              <Link className="underline" to={productPath(p)}>
                {p.name}
              </Link>
            </span>
          )
        })}
      </p>
      {withGaps.length > 0 && (
        <div>
          <p className="text-sm font-medium">Informationsluckor</p>
          <ul className="mt-2 max-h-64 overflow-auto divide-y divide-line border border-line text-sm">
            {withGaps.map((g) => (
              <li key={g.slug} className="px-3 py-2">
                <span className="font-medium">{g.name}</span>
                <span className="block text-xs text-muted">{g.gaps.join(' · ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
