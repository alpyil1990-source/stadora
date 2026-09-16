import { Outlet } from 'react-router-dom'
import { ConceptBar } from './ConceptBar'
import { BrandLockup } from './BrandMark'
import { Link } from 'react-router-dom'

export function QuoteReplyShell() {
  return (
    <div className="min-h-svh bg-paper text-ink">
      <ConceptBar />
      <header className="border-b border-line bg-sheet">
        <div className="shell flex h-[4.5rem] items-center justify-between md:h-20">
          <Link to="/" className="inline-flex items-center gap-3 text-ink" aria-label="STADORA — startsidan">
            <BrandLockup />
          </Link>
          <p className="text-xs text-muted">Personlig offertlänk · inte e-handel</p>
        </div>
      </header>
      <main className="shell py-8 md:py-12">
        <Outlet />
      </main>
    </div>
  )
}
