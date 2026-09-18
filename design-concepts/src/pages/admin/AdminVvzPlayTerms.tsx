import { Link } from 'react-router-dom'
import { productPath } from '../../data/content'
import { VVZ_PLAY_SLUGS, vvzPlayGaps, vvzPlayProducts } from '../../data/vvz-play'

export function AdminVvzPlayTerms() {
  const images = VVZ_PLAY_SLUGS.reduce((n, slug) => n + (vvzPlayProducts[slug]?.images.length ?? 0), 0)
  const docs = VVZ_PLAY_SLUGS.reduce((n, slug) => n + (vvzPlayProducts[slug]?.documents?.length ?? 0), 0)
  return (
    <section id="inkopspris" className="scroll-mt-8 space-y-4 border border-line bg-sheet p-5">
      <div>
        <p className="kicker">Intern inköpslista</p>
        <h2 className="mt-2 text-xl">Inköpspris saknas i den här miljön</h2>
        <p className="mt-2 text-sm text-muted">
          Stickprov: två lekplatsprodukter, inte parkbänkar eller sopkärl. Leverantören har godkänt
          användning av produktbilder. Wholesale pricelist 2026 fanns inte som fil bland bilagorna
          här, så inga EUR är inlagda — fältet lämnas tomt, aldrig 0 kr. Tillverkare VVZ-Play
          registreras här och visas inte på den publika produktsidan eller offerten. Artikelnummer
          följer med offerten. Originaldokument, inklusive märkning.
        </p>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li>
          <span className="text-muted">Tillverkare</span>
          <p className="font-medium">Veríme v Zábavu, s.r.o. (VVZ-Play)</p>
        </li>
        <li>
          <span className="text-muted">Produkter</span>
          <p className="font-medium">{VVZ_PLAY_SLUGS.length} · publika</p>
        </li>
        <li>
          <span className="text-muted">Bilder / dokument</span>
          <p className="font-medium">
            {images} bilder · {docs} dokument
          </p>
        </li>
        <li>
          <span className="text-muted">Webb</span>
          <p className="font-medium">https://www.vvz-play.com</p>
        </li>
      </ul>
      <ul className="divide-y divide-line border border-line text-sm">
        {VVZ_PLAY_SLUGS.map((slug) => {
          const p = vvzPlayProducts[slug]
          if (!p) return null
          return (
            <li key={slug} className="px-3 py-2">
              <Link className="underline" to={productPath(p)}>
                {p.name}
              </Link>
              <span className="block text-xs text-muted">
                Art.nr {p.sku} · {p.images.length} bilder · {p.documents?.length ?? 0} dokument
              </span>
            </li>
          )
        })}
      </ul>
      <div>
        <p className="text-sm font-medium">Luckor och motsägelser</p>
        <ul className="mt-2 divide-y divide-line border border-line text-sm">
          {vvzPlayGaps.map((row) => (
            <li key={row.slug} className="px-3 py-2">
              <p className="font-medium">
                {row.name} {row.sku}
              </p>
              {row.contradiction && <p className="mt-1 text-muted">{row.contradiction}</p>}
              {row.gaps.map((g) => (
                <p key={g} className="mt-1 text-muted">
                  {g}
                </p>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
