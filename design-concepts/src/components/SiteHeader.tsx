import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Search, X } from 'lucide-react'
import { areas, publicNav, type AreaId } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import { useTheme } from '../context/ThemeContext'
import { BrandMark } from './BrandMark'

export function SiteHeader({ area }: { area: AreaId }) {
  const { count } = useQuote()
  const { theme } = useTheme()
  const atelje = theme === 'atelje'
  const [open, setOpen] = useState(false)
  const [mega, setMega] = useState(false)
  const location = useLocation()
  const meta = areas[area]
  const quoteHref = area === 'offentlig' ? '/offertlista' : `/${area === 'skola' ? 'skola' : 'vard'}/offertlista`
  const home = meta.path

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
            { label: 'Produkter', to: '/vard' },
            { label: 'Verksamheter', to: '/vard' },
            { label: 'Dokument', to: '/dokument' },
            { label: 'Om STADORA Vård', to: '/vard' },
            { label: 'Kontakt', to: '/offert' },
          ]

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-sheet/95 backdrop-blur">
      <div className="shell flex h-[4.25rem] items-center justify-between gap-4 lg:h-20">
        <Link to={home} className="flex items-center gap-3 text-ink" aria-label="STADORA startsida">
          <BrandMark className="h-10 w-auto" />
          <span className="hidden sm:block">
            <span className={`block text-[1.35rem] font-semibold leading-none tracking-tight ${atelje ? 'display' : 'font-ui'}`}>
              STADORA
            </span>
            <span className="mt-1 block font-ui text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {meta.tagline}
            </span>
          </span>
        </Link>

        <nav className="site-nav hidden items-center gap-6 font-ui text-[0.78rem] font-medium uppercase tracking-[0.1em] lg:flex">
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
            to="/offert"
            className={`hidden px-4 py-2.5 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] md:inline-block ${
              atelje
                ? 'bg-sage text-sheet hover:bg-sage-dark'
                : 'bg-ink text-sheet hover:bg-sage-dark'
            }`}
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

      {mega && area === 'offentlig' && (
        <div className="hidden border-t border-line bg-sheet lg:block">
          <div className="shell grid grid-cols-3 gap-10 py-8">
            <div>
              <p className="kicker">Kategorier</p>
              <ul className="mt-3 space-y-2 text-sm">
                {publicNav.products.map((c) => (
                  <li key={c.name}>
                    <Link className="hover:underline" to={c.href}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker">Parkmöbler</p>
              <ul className="mt-3 space-y-2 text-sm">
                {publicNav.products[0].children.map((c) => (
                  <li key={c.name}>
                    <Link className="hover:underline" to={c.href}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="kicker">Verifierade exempel i konceptet</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link className="hover:underline" to="/produkt/parkbank-arsta">
                    Parkbänk Årsta · ST-1208
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" to="/produkt/papperskorg-rodberga-100">
                    Papperskorg Rödberga 100
                  </Link>
                </li>
                <li>
                  <Link className="hover:underline" to="/produkt/askkopp-luna">
                    Askkopp LUNA
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div id="mobile-nav" className="border-t border-line bg-sheet lg:hidden">
          <nav className="shell flex flex-col gap-1 py-4 text-base">
            {area === 'offentlig' &&
              publicNav.products.map((c) => (
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
            <Link to="/offert" className="bg-ink px-4 py-3 text-center text-sheet">
              Begär offert
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
