import { NavLink } from 'react-router-dom'
import { areas, type AreaId } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import { useTheme } from '../context/ThemeContext'

export function AreaBar() {
  const { setArea } = useQuote()
  const { theme } = useTheme()
  const atelje = theme === 'atelje'

  return (
    <div className="border-b border-line bg-sheet">
      <div className="shell flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="kicker">Välj område</p>
        <div className="area-tabs flex" role="tablist" aria-label="Affärsområde">
          {(Object.keys(areas) as AreaId[]).map((id) => (
            <NavLink
              key={id}
              to={areas[id].path}
              role="tab"
              onClick={() => setArea(id)}
              end={id === 'offentlig'}
              className={({ isActive }) =>
                atelje
                  ? `min-h-10 min-w-0 flex-1 px-3 py-2 text-center text-sm sm:min-w-36 sm:flex-none ${
                      isActive ? 'text-ink' : 'text-muted hover:text-ink'
                    }`
                  : `min-h-10 min-w-0 flex-1 border px-3 py-2 text-center text-sm sm:min-w-36 sm:flex-none ${
                      isActive
                        ? 'border-ink bg-ink text-sheet'
                        : 'border-line bg-sheet text-ink hover:border-ink'
                    }`
              }
            >
              {areas[id].label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}
