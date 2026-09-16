import { Link, NavLink, useLocation } from 'react-router-dom'
import { areas, type AreaId } from '../data/content'
import { useQuote } from '../context/QuoteContext'

const screens = [
  { to: '/', label: 'Startsida' },
  { to: '/produkter/parkmobler', label: 'Kategori' },
  { to: '/produkter/parkmobler/parkbankar', label: 'Produktlista' },
  { to: '/produkt/parkbank-arsta', label: 'Produktsida C' },
  { to: '/design/produktsida-a', label: 'Produktsida A' },
  { to: '/design/produktsida-b', label: 'Produktsida B' },
  { to: '/offertlista', label: 'Offertlista' },
  { to: '/offert', label: 'Offertformulär' },
  { to: '/miljoer/bostadsgard', label: 'Miljö' },
  { to: '/vard', label: 'Vård' },
  { to: '/skola', label: 'Skola' },
  { to: '/design/riktningar', label: 'Tre riktningar' },
]

export function ConceptBar() {
  const { area } = useQuote()
  const location = useLocation()

  return (
    <div className="border-b border-line bg-ink text-[0.75rem] text-sheet">
      <div className="shell flex flex-col gap-2 py-2 lg:flex-row lg:items-center lg:justify-between">
        <p>
          Designkoncept — Specification Atlas.{' '}
          <span className="text-sheet/70">Inte den publicerade sajten.</span>{' '}
          <Link className="underline decoration-sage" to="/design">
            Alla skärmar
          </Link>
        </p>
        <nav aria-label="Konceptskärmar" className="flex flex-wrap gap-x-3 gap-y-1 text-sheet/85">
          {screens.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                isActive || location.pathname === s.to
                  ? 'text-sheet underline'
                  : 'hover:text-sheet'
              }
            >
              {s.label}
            </NavLink>
          ))}
          <span className="text-sheet/50">Område: {areas[area as AreaId].label}</span>
        </nav>
      </div>
    </div>
  )
}
