import { Link } from 'react-router-dom'
import { company, type AreaId } from '../data/content'
import { BrandMark } from './BrandMark'

export function SiteFooter({ area }: { area: AreaId }) {
  return (
    <footer className="mt-16 bg-ink text-sheet">
      <div className="shell grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Link to={area === 'offentlig' ? '/' : `/${area}`} className="inline-flex flex-col text-sheet">
            <BrandMark className="h-14 w-auto" />
            <span className="mt-3 font-ui text-xl font-semibold">STADORA</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-sheet/70">
            {area === 'vard'
              ? 'Produkter för professionella vårdmiljöer.'
              : area === 'skola'
                ? 'Möbler och inredning för skola och förskola.'
                : 'Produkter för professionella och offentliga utemiljöer.'}
          </p>
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-sheet/50">Sortiment</p>
          <ul className="mt-3 space-y-2 text-sm text-sheet/80">
            {area === 'offentlig' ? (
              <>
                <li>
                  <Link to="/produkter">Alla kategorier</Link>
                </li>
                <li>
                  <Link to="/produkter/lek-aktivitet">Lek och aktivitet</Link>
                </li>
                <li>
                  <Link to="/produkter/parkmobler">Parkmöbler</Link>
                </li>
              </>
            ) : area === 'skola' ? (
              <li>
                <Link to="/skola">Skolprodukter</Link>
              </li>
            ) : (
              <li>
                <Link to="/vard">Vårdprodukter</Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-sheet/50">Underlag</p>
          <ul className="mt-3 space-y-2 text-sm text-sheet/80">
            <li>
              <Link to="/offert">Offertförfrågan</Link>
            </li>
            <li>
              <Link to="/dokument">Dokument</Link>
            </li>
            <li>
              <Link to="/design">Om detta koncept</Link>
            </li>
          </ul>
        </div>
        <address className="not-italic text-sm text-sheet/80">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-sheet/50">Kontakt</p>
          <p className="mt-3">
            {company.address[0]}
            <br />
            {company.address[1]}
          </p>
          <p className="mt-2">
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          <p className="mt-2">
            {company.name} · {company.legal}
            <br />
            Org.nr {company.orgNr}
          </p>
        </address>
      </div>
      <div className="border-t border-sheet/15">
        <div className="shell flex flex-col gap-1 py-5 text-xs text-sheet/50 md:flex-row md:justify-between">
          <p>© 2026 STADORA</p>
          <p>VAT {company.vat}</p>
          <p>Designkoncept — ingen e-handel</p>
        </div>
      </div>
    </footer>
  )
}
