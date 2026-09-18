import { Link } from 'react-router-dom'
import { company } from '../data/content'

export function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="kicker">Relicon AB</p>
        <h1 className="mt-2 text-3xl md:text-4xl">Integritetspolicy</h1>
        <p className="mt-3 text-sm text-muted">
          Gäller STADORA, ett varumärke för {company.legal}, org.nr {company.orgNr}. Texten beskriver
          den interna testmiljön för dokumentkonto. Inget dokumentkonto är aktiverat publikt utan
          särskilt beslut.
        </p>
      </div>

      <section>
        <h2 className="text-xl">Personuppgiftsansvarig</h2>
        <p className="mt-3 text-sm text-muted">
          {company.legal} ({company.name}), {company.address.join(', ')}. E-post{' '}
          <a className="underline" href={`mailto:${company.email}`}>
            {company.email}
          </a>
          . Webb {company.web}.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Varför vi registrerar konto och nedladdningar</h2>
        <p className="mt-3 text-sm text-muted">
          Ett dokumentkonto finns för att kunna lämna ut ritningar, produktblad och övriga
          leverantörsfiler till rätt mottagare, och för att kunna visa att en fil hämtats av en
          identifierad användare. Nedladdningsloggen används för åtkomstkontroll, licens- och
          avtalsuppföljning mot leverantörer samt för att kunna utreda missbruk. Loggen är inte
          publik och används inte för säljutskick.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Uppgifter som sparas</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>E-postadress och lösenordshash (aldrig lösenord i klartext).</li>
          <li>Godkännande av denna policy vid registrering.</li>
          <li>Namn och företag om du fyller i dem senare. De krävs inte för att skapa kontot.</li>
          <li>
            Frivilligt val om nyhetsbrev eller produktinformation. Valet är avmarkerat från början.
            Registrering för dokumentåtkomst är inte en prenumeration.
          </li>
          <li>Bekräftelse av e-postadress och tidpunkt för konto, inloggning och radering.</li>
          <li>
            Vid dokumentnedladdning: användar-ID, e-postadress, produkt, artikelnummer,
            dokumentnamn, dokumenttyp, leverantör samt datum och tid.
          </li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Lagringsadresser till originalfiler visas inte i sidans kod. Filer lämnas ut via tillfälliga
          signerade länkar som upphör efter kort tid.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Rättslig grund</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>
            Avtal och steg före avtal (art. 6.1 b GDPR): att skapa och administrera kontot samt att
            lämna ut begärda handlingar.
          </li>
          <li>
            Berättigat intresse (art. 6.1 f): att skydda filer, följa leverantörsvillkor och föra
            intern nedladdningslogg.
          </li>
          <li>Samtycke (art. 6.1 a): nyhetsbrev eller produktinformation, om du kryssar i valet.</li>
          <li>Rättslig förpliktelse (art. 6.1 c): bokföring och svar på myndighetsbegäran när det krävs.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl">Lagringstid</h2>
        <p className="mt-3 text-sm text-muted">
          Kontouppgifter sparas tills du raderar kontot eller tills Relicon AB tar bort det efter
          inaktivitet i 24 månader. Nedladdningsloggen sparas i 24 månader och kan därefter finnas
          kvar i aggregerad form utan e-postadress. Bekräftelse- och återställningslänkar upphör efter
          24 respektive 2 timmar. Signerade fillänkar upphör efter cirka 10 minuter.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Rättelse och radering</h2>
        <p className="mt-3 text-sm text-muted">
          Du kan uppdatera namn, företag och nyhetsbrevsval i kontot, och radera kontot där. Du kan
          också begära registerutdrag, rättelse, begränsning, invändning eller radering genom att
          mejla {company.email}. En begäran handläggs av Relicon AB. Du kan klaga till
          Integritetsskyddsmyndigheten.
        </p>
      </section>

      <section>
        <h2 className="text-xl">Vad vi inte gör</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Vi skickar inte säljmejl för att du har laddat ner ett dokument.</li>
          <li>Leverantörsportalens inloggning lagras inte i denna databas och visas inte för besökare.</li>
          <li>
            NOVUM-originalfiler är tills vidare endast interna. Extern nedladdning kräver separat
            skriftligt godkännande.
          </li>
        </ul>
      </section>

      <p className="text-sm">
        <Link className="underline" to="/konto/skapa">
          Testregistrering (intern)
        </Link>
        {' · '}
        <Link className="underline" to="/">
          Till startsidan
        </Link>
      </p>
    </article>
  )
}
