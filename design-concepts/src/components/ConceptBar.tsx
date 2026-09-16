import { Link, NavLink, useLocation } from 'react-router-dom'
import { areas, type AreaId } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import { useTheme } from '../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

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
  { to: '/design/riktningar', label: 'Riktningar' },
]

export function ConceptBar() {
  const { area } = useQuote()
  const { theme } = useTheme()
  const location = useLocation()
  const light = theme === 'atelje'

  return (
    <div
      className={
        light
          ? 'border-b border-line bg-paper text-[0.75rem] text-ink'
          : 'border-b border-line bg-ink text-[0.75rem] text-sheet'
      }
    >
      <div className="shell flex flex-col gap-2 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p>
            Designkoncept — {light ? 'Ateljé' : 'Specification Atlas'}.{' '}
            <span className={light ? 'text-muted' : 'text-sheet/70'}>Inte den publicerade sajten.</span>{' '}
            <Link className="underline decoration-sage" to="/design">
              Alla skärmar
            </Link>
          </p>
          <ThemeToggle />
        </div>
        <nav
          aria-label="Konceptskärmar"
          className={`flex flex-wrap gap-x-3 gap-y-1 ${light ? 'text-muted' : 'text-sheet/85'}`}
        >
          {screens.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                isActive || location.pathname === s.to
                  ? light
                    ? 'text-ink underline'
                    : 'text-sheet underline'
                  : light
                    ? 'hover:text-ink'
                    : 'hover:text-sheet'
              }
            >
              {s.label}
            </NavLink>
          ))}
          <span className={light ? 'text-muted/80' : 'text-sheet/50'}>
            Område: {areas[area as AreaId].label}
          </span>
        </nav>
      </div>
    </div>
  )
}
