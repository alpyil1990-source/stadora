import { NavLink, Outlet } from 'react-router-dom'
import { ConceptBar } from './ConceptBar'

const nav = [
  { to: '/admin', label: 'Översikt', end: true },
  { to: '/admin/flode', label: 'Så går det till' },
  { to: '/admin/offerter', label: 'Offerter' },
  { to: '/admin/fakturor', label: 'Fakturor' },
  { to: '/admin/leverantorer', label: 'Leverantörer' },
]

export function AdminShell() {
  return (
    <div className="min-h-svh bg-paper text-ink">
      <ConceptBar />
      <div className="md:flex">
        <aside className="border-b border-line bg-sheet md:w-56 md:shrink-0 md:border-b-0 md:border-r">
          <div className="px-4 py-5">
            <p className="kicker">Intern</p>
            <p className="mt-1 font-medium">STADORA admin</p>
            <p className="mt-2 text-xs text-muted">Koncept. Ingen inloggning, inga skarpa mejl.</p>
          </div>
          <nav className="flex flex-wrap gap-1 px-3 pb-4 md:flex-col">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm ${isActive ? 'bg-ink text-sheet' : 'hover:bg-paper'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink to="/" className="px-3 py-2 text-sm text-muted hover:text-ink">
              Till sajten
            </NavLink>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
