import { Link, NavLink, useLocation } from 'react-router-dom'
import { areas, type AreaId } from '../data/content'
import { useQuoteOptional } from '../context/QuoteContext'

const screens = [
  { to: '/design/binsignia', label: 'Avfallsutkast' },
  { to: '/', label: 'Startsida' },
  { to: '/produkter', label: 'Sortiment' },
  { to: '/offertlista', label: 'Offertlista' },
  { to: '/offert', label: 'Offertformulär' },
  { to: '/admin', label: 'Admin' },
  { to: '/admin/flode', label: 'Offertflöde' },
  { to: '/admin/offerter', label: 'Ärenden' },
  { to: '/admin/leverantorer', label: 'Leverantörer' },
  { to: '/q/Q-2026-0164', label: 'Kundens offertlänk' },
]

export function ConceptBar() {
  const quote = useQuoteOptional()
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
                isActive || location.pathname === s.to ? 'text-sheet underline' : 'hover:text-sheet'
              }
            >
              {s.label}
            </NavLink>
          ))}
          {quote && (
            <span className="text-sheet/50">Område: {areas[quote.area as AreaId].label}</span>
          )}
        </nav>
      </div>
    </div>
  )
}
