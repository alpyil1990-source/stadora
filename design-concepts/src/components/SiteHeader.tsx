import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { areas, careNav, publicNav, type AreaId } from '../data/content'
import { useQuoteOptional } from '../context/QuoteContext'
import { BrandLockup } from './BrandMark'

export function SiteHeader({ area }: { area: AreaId }) {
  const count = useQuoteOptional()?.count ?? 0
  const [open, setOpen] = useState(false)
  const [mega, setMega] = useState(false)
  const location = useLocation()
  const meta = areas[area]
  const quoteHref = area === 'offentlig' ? '/offertlista' : `/${area === 'skola' ? 'skola' : 'vard'}/offertlista`
  const quoteFormHref = area === 'vard' ? '/vard/offert' : '/offert'
  const home = meta.path
  const megaNav = area === 'vard' ? careNav : publicNav
  const showMega = area === 'offentlig' || area === 'vard'

  useEffect(() => {
    setOpen(false)
    setMega(false)
  }, [location.pathname])

  const links =
    area === 'offentlig'
      ? [
          { label: 'Produkter', type: 'mega' as const },
          { label: 'Miljöer', to: '/miljoer/bostadsgard' },
          { label: 'Dokument', to: '/dokument' },
          { label: 'Upphandling', to: '/dokument' },
          { label: 'Om', to: '/design' },
          { label: 'Kontakt', to: '/offert' },
        ]
      : area === 'skola'
        ? [
            { label: 'Produkter', to: '/skola' },
            { label: 'Lärmiljöer', to: '/skola' },
            { label: 'Dokument', to: '/dokument' },
            { label: 'Om', to: '/skola' },
            { label: 'Kontakt', to: '/offert' },
          ]
        : [
            { label: 'Produkter', type: 'mega' as const },
            { label: 'Verksamheter', to: '/vard/verksamheter' },
            { label: 'Dokument', to: '/vard/dokument' },
            { label: 'Om STADORA Vård', to: '/vard/om' },
            { label: 'Kontakt', to: '/vard/offert' },
          ]

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sheet/95 backdrop-blur">
      <div className="shell flex h-[4.5rem] items-center justify-between gap-6 md:h-24">
        <Link to={home} className="inline-flex items-center gap-3 text-ink" aria-label="STADORA — startsidan">
          <BrandLockup />
        </Link>

        <nav className="hidden items-center gap-6 font-ui text-[0.78rem] font-medium uppercase tracking-[0.1em] lg:flex">
          {links.map((item) =>
            'type' in item && item.type === 'mega' ? (
              <button
                key={item.label}
                className="py-2 hover:text-sage-dark"
                aria-expanded={mega}
                onClick={() => setMega((v) => !v)}
              >
                {item.label}
              </button>
            ) : (
              <NavLink key={item.label} to={'to' in item ? item.to : '/'} className="py-2 hover:text-sage-dark">
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" className="p-2 text-muted" aria-label="Sök" disabled>
            <Search className="h-4 w-4" />
          </button>
          <Link
            to={quoteHref}
            className="hidden items-center gap-2 border border-line px-3 py-2 text-[0.72rem] uppercase tracking-[0.08em] md:inline-flex"
          >
            Offertlista ({count})
          </Link>
          <Link
            to={quoteFormHref}
            className="hidden bg-ink px-4 py-2.5 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet hover:bg-sage-dark md:inline-block"
          >
            Begär offert
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Stäng meny' : 'Öppna meny'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mega && showMega && (
        <div className="hidden border-t border-line bg-sheet lg:block">
          <div className="shell grid grid-cols-2 gap-8 py-8 lg:grid-cols-4">
            {megaNav.products.map((c) => (
              <div key={c.name}>
                <Link to={c.href} className="kicker hover:underline">
                  {c.name}
                </Link>
                <ul className="mt-3 space-y-2 text-sm">
                  {c.children.map((ch) => (
                    <li key={ch.name}>
                      <Link className="hover:underline" to={ch.href}>
                        {ch.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="shell border-t border-line py-4 text-sm">
            <Link className="underline" to={area === 'vard' ? '/vard/produkter' : '/produkter'}>
              Alla kategorier
            </Link>
          </div>
        </div>
      )}

      {open && (
        <div id="mobile-nav" className="border-t border-line bg-sheet lg:hidden">
          <nav className="shell flex flex-col gap-1 py-4 text-base">
            {showMega &&
              megaNav.products.map((c) => (
                <details key={c.name} className="border-b border-line py-2">
                  <summary className="cursor-pointer font-medium">{c.name}</summary>
                  <div className="mt-2 flex flex-col gap-2 pb-2 pl-3 text-muted">
                    <Link to={c.href}>Alla i kategorin</Link>
                    {c.children.map((ch) => (
                      <Link key={ch.name} to={ch.href}>
                        {ch.name}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}
            {links
              .filter((l): l is { label: string; to: string } => 'to' in l)
              .map((l) => (
                <Link key={l.label} to={l.to} className="border-b border-line py-3">
                  {l.label}
                </Link>
              ))}
            <Link to={quoteHref} className="py-3">
              Offertlista ({count})
            </Link>
            <Link to={quoteFormHref} className="bg-ink px-4 py-3 text-center text-sheet">
              Begär offert
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
