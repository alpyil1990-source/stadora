import { Link } from 'react-router-dom'

const steps = [
  {
    n: '01',
    title: 'Kunden samlar produkter',
    body: 'På sajten finns inga priser och ingen kassa. Kunden lägger rader i offertlistan (miniatyr, antal, kommentar) per affärsområde.',
    to: '/offertlista',
    link: 'Offertlista',
  },
  {
    n: '02',
    title: 'Förfrågan skickas',
    body: 'Formuläret tar projekt, plats, skede, kontakt och ev. handling. Bekräftelse med ärendenummer till kunden. Internt skapas Q-år-löpnummer utan belopp.',
    to: '/offert',
    link: 'Offertformulär',
  },
  {
    n: '03',
    title: 'Inkommen i admin',
    body: 'Sälj tar ärendet. Antingen kalkyl, eller komplettera om handling saknas (vanligt vid lek/utegym). Demo-SKU:er prissätts inte.',
    to: '/admin/offerter/Q-2026-0188',
    link: 'Exempel: inkommen Q-2026-0188',
  },
  {
    n: '04',
    title: 'Intern kalkyl',
    body: 'Enhetspris, frakt och giltighet sätts här. Större affärer kan kräva intern granskning. Först nu finns ett offertvärde för VD/ekonomi.',
    to: '/admin/offerter/Q-2026-0171',
    link: 'Exempel: kalkyl Q-2026-0171',
  },
  {
    n: '05',
    title: 'Offert mejlas',
    body: 'Kunden får PDF/sammanställning plus en personlig länk. Mejlet är inte en faktura och inte en betallänk.',
    to: '/admin/offerter/Q-2026-0164',
    link: 'Exempel: skickad Q-2026-0164',
  },
  {
    n: '06',
    title: 'Kunden godkänner',
    body: 'På länken syns rader och pris. Tre val: godkänn, begär ändring, tacka nej. Godkännande är orderavsikt — ingen kortbetalning, ingen e-handel.',
    to: '/q/Q-2026-0164',
    link: 'Kundens vy för Q-2026-0164',
  },
  {
    n: '07',
    title: 'Order och faktura',
    body: 'Efter godkännande: orderbekräftelse, leverans, sedan faktura (Fortnox/Visma i produktion) med förfallodatum. Påminnelse vid dröjsmål. Offentlig sektor betalar via sitt system, inte checkout.',
    to: '/admin/fakturor',
    link: 'Fakturor',
  },
  {
    n: '08',
    title: 'Betald / stängd',
    body: 'Inbetalning bokas mot fakturan. Ärendet blir betald. Förlorade affärer stängs med skäl för vinstandel i översikten.',
    to: '/admin',
    link: 'VD-översikt',
  },
]

export function AdminFlow() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <p className="kicker">Process</p>
        <h1 className="mt-2 text-3xl">Från förfrågan till betalning</h1>
        <p className="mt-4 text-muted">
          STADORA säljer mot offert. Kunden ser aldrig pris i katalogen. Betalning sker mot faktura,
          inte i en varukorg. Siffrorna i admin är konceptexempel.
        </p>
      </div>
      <p className="border border-line bg-sheet px-4 py-3 text-sm text-muted">
        Produktbilder och ny katalogdata kommer från leverantören (länk i{' '}
        <Link className="underline" to="/admin/leverantorer">
          admin → leverantörer
        </Link>
        ), inte genom att hämta filer från stadora.se.
      </p>
      <ol className="space-y-8">
        {steps.map((s) => (
          <li key={s.n} className="border-t border-line pt-6">
            <p className="kicker">{s.n}</p>
            <h2 className="mt-2 text-xl">{s.title}</h2>
            <p className="mt-2 text-sm text-muted">{s.body}</p>
            <Link className="mt-3 inline-block text-sm underline" to={s.to}>
              {s.link}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
