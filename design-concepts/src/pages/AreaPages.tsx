import { Link, useLocation } from 'react-router-dom'
import { careProducts, isPublicProduct, products } from '../data/content'
import { useProductCatalog } from '../context/ProductCatalogContext'
import { areaFromPath } from '../context/QuoteContext'
import { PRODUCT_LISTING_GRID, ProductCard } from '../components/ProductCard'

function PausedArea({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="max-w-2xl space-y-6">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{title}</h1>
      <p className="text-muted">
        Den här grenen hämtas inte in nu. När ni ger leverantörens namn, kontaktperson och länk till
        produktbilder lägger vi in det i intern admin — en rad per leverantör, med antal produkter
        i STADORA-katalogen. Vi skrapar inte bilder från stadora.se.
      </p>
      <p className="text-sm">
        <Link className="underline" to="/admin/leverantorer">
          Öppna leverantörer i admin
        </Link>
        {' · '}
        <Link className="underline" to="/">
          Tillbaka till offentlig miljö
        </Link>
      </p>
    </div>
  )
}

export function CareHomePage() {
  const { products: loaded } = useProductCatalog()
  const genius = products['akutvagn-genius']
  const waiting = loaded['v-care-fold']
  const published = careProducts.filter(isPublicProduct)

  return (
    <div className="space-y-20">
      <section className="grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="kicker">STADORA Vård</p>
          <h1 className="mt-3 max-w-xl text-4xl leading-tight md:text-5xl">
            Underlag för avdelning, väntrum och korridor.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            För inköp till sjukhus, region och vårdverksamhet. Ni anger enhet, rumstyp, antal och
            tidplan. Vi svarar med verifierade mått och klassning där källan finns — pris i offert,
            inte som listpris.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/vard/produkter"
              className="bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
            >
              Utforska sortimentet
            </Link>
            <Link
              to="/vard/offert"
              className="border border-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
            >
              Begär offert
            </Link>
          </div>
        </div>
        <div className="lg:col-span-7">
          {genius.images[0] ? (
            <img
              src={genius.images[0].src}
              alt={genius.images[0].alt}
              className="aspect-[16/10] w-full bg-sheet object-contain p-6"
            />
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 border-y border-line py-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="kicker">Inför avrop</p>
          <h2 className="mt-2 text-2xl">Vad vi behöver i förfrågan</h2>
        </div>
        <ol className="grid gap-6 sm:grid-cols-2 lg:col-span-8">
          {[
            ['Sjukhus och enhet', 'Vilket sjukhus, vilken avdelning eller mottagning avropet gäller.'],
            ['Rumstyp', 'Akutrum, vårdavdelning, mottagning, väntrum eller korridor.'],
            ['Antal och tidplan', 'Ungefärlig volym och om det är nybyggnad, ombyggnad eller komplettering.'],
            ['Er handling', 'Bifoga rumsschema eller krav om ni har det. Vi hittar inte på spec som saknas.'],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="font-ui text-sm tabular-nums text-muted">0{i + 1}</span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="kicker">Ingång efter uppdrag</p>
            <h2 className="mt-2 text-2xl md:text-3xl">Var ska produkterna stå?</h2>
          </div>
          <Link to="/vard/verksamheter" className="text-sm underline">
            Alla verksamheter
          </Link>
        </div>
        <div className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Akut och avdelning', 'Akutvagn mot rumstyp och antal.', '/vard/produkter/vagnar'],
            [
              'Läkemedel',
              'Läkemedelsvagnar när underlag finns.',
              '/vard/produkter/vagnar/lakemedelsvagnar',
            ],
            ['Förvaring', 'Medicinskåp när underlag finns.', '/vard/produkter/forvaring'],
            [
              'Väntrum och korridor',
              'Vägghängda fällstolar och fällbänkar.',
              '/vard/produkter/vantzon-korridor',
            ],
          ].map(([title, text, href]) => (
            <Link key={title} to={href} className="bg-sheet p-6 hover:bg-paper">
              <h3 className="text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Vagnar</p>
            <h2 className="mt-2 text-2xl md:text-3xl">Akutvagn med verifierade mått</h2>
            <p className="mt-3 max-w-2xl text-sm text-muted">
              Publicerad produkt: {genius.name}. {genius.summary} Övriga vagnar läggs in när
              specifikation och bild är verifierade.
            </p>
          </div>
          <Link to="/vard/produkter/vagnar/akutvagnar" className="text-sm underline">
            Alla akutvagnar
          </Link>
        </div>
        <div className={`mt-8 ${PRODUCT_LISTING_GRID}`}>
          {published.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {waiting && isPublicProduct(waiting) ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Väntrum och korridor</p>
              <h2 className="mt-2 text-2xl md:text-3xl">Vägghängt sitt för väntrum</h2>
              <p className="mt-3 max-w-2xl text-sm text-muted">
                Samma listlayout som i offentlig miljö. Stolen fälls in mot väggen när den inte
                används. Antal sittplatser och utförande anges i offertlistan.
              </p>
            </div>
            <Link
              to="/vard/produkter/vantzon-korridor/vagghangda-fallstolar"
              className="text-sm underline"
            >
              Alla fällstolar
            </Link>
          </div>
          <div className={`mt-8 ${PRODUCT_LISTING_GRID}`}>
            <ProductCard product={waiting} />
          </div>
        </section>
      ) : null}

      <section>
        <p className="kicker">Kommer när underlag finns</p>
        <h2 className="mt-2 text-2xl md:text-3xl">Förberedda kategorier utan produktkort</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Vi visar inte modeller som saknar bild och specifikation. Kategorierna finns så att ni
          kan begära offert mot rumstyp redan nu.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            [
              'Läkemedelsvagnar',
              'Tom underkategori tills mått, bild och klassning är verifierade.',
              '/vard/produkter/vagnar/lakemedelsvagnar',
            ],
            [
              'Medicinskåp',
              'Tom underkategori tills mått, bild och förvaringsmått är verifierade.',
              '/vard/produkter/forvaring/medicinskap',
            ],
          ].map(([title, text, href]) => (
            <Link
              key={title}
              to={href}
              className="block border border-dashed border-line p-6 hover:border-ink"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm text-muted">{text}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.08em] text-sage-dark">0 produkter</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="kicker">Från rum till offert</p>
          <h2 className="mt-2 text-2xl">Tre steg till offert</h2>
          <ol className="mt-6 space-y-4">
            {[
              [
                'Ange enhet och rum',
                'Sjukhus, avdelning och rumstyp. Bifoga handling om ni har den.',
              ],
              [
                'Vi tar fram underlag',
                'Mått, material och klassning utifrån det som är verifierat. Inget annat.',
              ],
              ['Offert mot avrop', 'Pris och leverans i offerten. Inte som listpris på sajten.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 border-t border-line pt-4">
                <span className="font-ui text-sm tabular-nums text-muted">0{i + 1}</span>
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="border border-line bg-sheet p-6">
          <p className="kicker">Klassning</p>
          <h2 className="mt-2 text-2xl">Bara det som står på produkten</h2>
          <p className="mt-4 text-sm text-muted">
            {genius.name} är angiven som medicinteknisk produkt klass I. Tillverkarens
            ledningssystem och övrig klassning står på produktsidan. Vi lägger inte till CE, MDR
            eller hygienkrav som saknar källa.
          </p>
          <Link to="/vard/produkt/akutvagn-genius" className="mt-6 inline-block text-sm underline">
            Öppna {genius.name}
          </Link>
        </div>
      </section>

      <section className="border-t border-line pt-10">
        <p className="kicker">Kontakt</p>
        <h2 className="mt-2 max-w-xl text-2xl md:text-3xl">Skicka avropet innan ni ritar om rummet.</h2>
        <p className="mt-4 max-w-xl text-muted">
          STADORA är ett varumärke inom Relicon AB. Mejla sjukhus, enhet, ungefärligt antal och
          tidplan.
        </p>
        <Link
          to="/vard/offert"
          className="mt-6 inline-block bg-ink px-5 py-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
        >
          Begär offert
        </Link>
      </section>
    </div>
  )
}

export function CareOperationsPage() {
  return (
    <div className="space-y-12">
      <div>
        <p className="kicker">Verksamheter</p>
        <h1 className="mt-2 text-4xl">Var produkterna ska användas</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Inte referensprojekt. Ingång efter rumstyp, så att inköp kan märka förfrågan med rätt
          enhet.
        </p>
      </div>
      <ul className="grid gap-px bg-line md:grid-cols-2">
        {[
          [
            'Akutrum',
            'Akutvagn mot antal rum. Genius är publicerad med mått, lådindelning och klass I. Övriga vagnar väntar på underlag.',
            '/vard/produkter/vagnar/akutvagnar',
          ],
          [
            'Vårdavdelning',
            'Samma vagnar som i akut, ofta i högre volym. Ange avdelning, om det är nybyggnad eller komplettering, och tidplan för avrop.',
            '/vard/produkter/vagnar',
          ],
          [
            'Mottagning',
            'Mindre antal, samma specifikation när den är verifierad. Märk förfrågan med mottagning och antal rum.',
            '/vard/offert',
          ],
          [
            'Väntrum och korridor',
            'Vägghängda fällstolar och fällbänkar där golvytan ska vara fri när stolen inte används.',
            '/vard/produkter/vantzon-korridor',
          ],
        ].map(([title, text, href]) => (
          <li key={title} className="bg-sheet p-6">
            <h2 className="text-xl">{title}</h2>
            <p className="mt-3 text-sm text-muted">{text}</p>
            <Link to={href} className="mt-4 inline-block text-sm underline">
              Gå vidare
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CareAboutPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="kicker">Om STADORA Vård</p>
        <h1 className="mt-2 text-4xl">Offert mot avdelning, inte e-handel</h1>
        <p className="mt-4 text-muted">
          STADORA är ett varumärke inom Relicon AB. Vårdgrenen är till för inköp, fastighet och
          projektör som tar fram underlag till sjukhus och vårdverksamhet.
        </p>
      </div>
      <section className="space-y-3 text-sm text-muted">
        <p>
          Produkter publiceras när bild, mått och specifikation är verifierade. Tomma kategorier är
          förberedda, inte dolda lager. Klassning anges bara på den produkt där källan finns.
        </p>
        <p>
          Pris lämnas i offert. Artikelnummer från leverantör visas inte publikt. Dokument ligger på
          respektive produktsida, inte i ett separat arkiv.
        </p>
      </section>
      <p className="text-sm">
        <Link className="underline" to="/vard/produkter">
          Sortiment
        </Link>
        {' · '}
        <Link className="underline" to="/vard/offert">
          Begär offert
        </Link>
        {' · '}
        <Link className="underline" to="/">
          Offentlig miljö
        </Link>
      </p>
    </div>
  )
}

export function SchoolHomePage() {
  return <PausedArea kicker="STADORA Skola" title="Skolsortimentet avvaktar" />
}

export function EnvironmentPage() {
  return (
    <div className="space-y-10">
      <p className="kicker">Miljöer</p>
      <h1 className="text-4xl">Bostadsgård</h1>
      <p className="max-w-2xl text-muted">
        Typmiljö — inte ett påhittat referensprojekt. Produkter länkas bara när de är verifierade.
        Riktiga projekt publiceras när foto, plats och produktlista är bekräftade.
      </p>
      <img src="/images/env-gaard.jpg" alt="Bostadsgård" className="aspect-[16/8] w-full object-cover" />
      <section>
        <h2 className="text-2xl">Produkter som ofta specificeras tillsammans</h2>
        <div className={`mt-5 ${PRODUCT_LISTING_GRID}`}>
          <ProductCard product={products['parkbank-arsta']} />
          <ProductCard product={products['parkbank-hammarby']} />
          <ProductCard product={products['papperskorg-rodberga-100']} />
        </div>
      </section>
    </div>
  )
}

export function DocumentsPage() {
  const { pathname } = useLocation()
  const area = areaFromPath(pathname)
  if (area === 'vard') {
    return (
      <div className="max-w-2xl">
        <p className="kicker">Dokument och underlag</p>
        <h1 className="mt-2 text-3xl">Dokument ligger på produktsidan</h1>
        <p className="mt-4 text-muted">
          Ritningar, produktblad och originalfiler publiceras i avsnittet Dokument och underlag på
          respektive produkt. Det här centret duplicerar inte samma filer.
        </p>
        <p className="mt-4 text-sm">
          Akutvagn Genius har klassning på produktsidan. Filer läggs ut när de är verifierade. Tomma
          kategorier har inga dokument att visa.
        </p>
        <p className="mt-6 text-sm">
          <Link className="underline" to="/vard/produkt/akutvagn-genius">
            Öppna Akutvagn Genius
          </Link>
          {' · '}
          <Link className="underline" to="/vard/produkter">
            Sortiment
          </Link>
        </p>
      </div>
    )
  }
  return (
    <div className="max-w-2xl">
      <p className="kicker">Dokument och underlag</p>
      <h1 className="mt-2 text-3xl">Dokument ligger på produktsidan</h1>
      <p className="mt-4 text-muted">
        Verifierade ritningar, produktblad och originalfiler publiceras i avsnittet Dokument och
        underlag på respektive produkt. Det här centret duplicerar inte samma filer.
      </p>
      <p className="mt-4 text-sm">
        STREETPARK: måttritningar, 3D-perspektivbilder, produktblad, förankringsanvisningar och CAD
        (DWG) från leverantören. En
        3D-perspektivbild i JPG är en bild, inte CAD. BINSIGNIA och INVESTIM har fortfarande inga
        publicerade ritningar i katalogen. NOVUM-originalfiler är interna och inte tillgängliga här.
      </p>
      <div className="mt-8 border border-dashed border-line p-6 text-sm text-muted">
        Måttritning och 3D-perspektivbild i JPG går att öppna utan konto. CAD och övriga originalfiler
        (DWG, 3DS, RAR) kräver inloggning. NOVUM-originalfiler är fortfarande bara interna.
      </div>
    </div>
  )
}
