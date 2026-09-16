import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { AreaId } from '../data/content'
import { QuoteProvider } from '../context/QuoteContext'
import { useTheme } from '../context/ThemeContext'
import { ConceptBar } from './ConceptBar'
import { AreaBar } from './AreaBar'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'

function areaFromPath(pathname: string): AreaId {
  if (pathname.startsWith('/vard')) return 'vard'
  if (pathname.startsWith('/skola')) return 'skola'
  return 'offentlig'
}

function isFlush(theme: string, pathname: string) {
  if (theme !== 'atelje') return false
  return pathname === '/' || pathname === '/miljoer/bostadsgard' || pathname === '/skola'
}

export function AppShell() {
  const location = useLocation()
  const { theme } = useTheme()
  const [area, setArea] = useState<AreaId>(() => areaFromPath(location.pathname))
  const flush = isFlush(theme, location.pathname)

  useEffect(() => {
    setArea(areaFromPath(location.pathname))
  }, [location.pathname])

  return (
    <QuoteProvider area={area} setArea={setArea}>
      <div className="min-h-svh bg-paper text-ink">
        <ConceptBar />
        <AreaBar />
        <SiteHeader area={area} />
        <main className={flush ? '' : 'shell py-8 md:py-12'}>
          <Outlet />
        </main>
        <SiteFooter area={area} />
      </div>
    </QuoteProvider>
  )
}
