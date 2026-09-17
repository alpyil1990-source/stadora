import { Outlet } from 'react-router-dom'
import { useQuote } from '../context/QuoteContext'
import { ConceptBar } from './ConceptBar'
import { AreaBar } from './AreaBar'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'

export function AppShell() {
  const { area } = useQuote()

  return (
    <div className="min-h-svh bg-paper text-ink">
      <ConceptBar />
      <AreaBar />
      <SiteHeader area={area} />
      <main className="shell py-8 md:py-12">
        <Outlet />
      </main>
      <SiteFooter area={area} />
    </div>
  )
}
