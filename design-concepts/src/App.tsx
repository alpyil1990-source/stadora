import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { AdminShell } from './components/AdminShell'
import { QuoteReplyShell } from './components/QuoteReplyShell'
import { CatalogLoading } from './components/CatalogStatus'
import { HomePage } from './pages/PublicPages'
import { CatalogIndexPage, CategoryHubPage, SubcategoryListPage } from './pages/CatalogPages'
import { ProductLayoutA, ProductLayoutB, ProductPage } from './pages/ProductPages'
import { QuoteFormPage, QuoteListPage } from './pages/QuotePages'
import {
  CareAboutPage,
  CareHomePage,
  CareOperationsPage,
  DocumentsPage,
  EnvironmentPage,
  SchoolHomePage,
} from './pages/AreaPages'
import { DesignIndexPage, DirectionsPage, BinsigniaDraftPage, InvestimDraftPage, StreetparkDraftPage } from './pages/DesignPages'
import { CustomerQuotePage } from './pages/CustomerQuotePage'
import { CommerceProvider } from './context/CommerceContext'
import { QuoteProvider } from './context/QuoteContext'
import { ProductCatalogProvider } from './context/ProductCatalogContext'
import { SupplierProvider } from './context/SupplierContext'
import { AuthProvider } from './context/AuthContext'
import { InternHomePage, InternLayout } from './pages/InternPages'
import {
  AccountPage,
  ForgotPage,
  LoginPage,
  RegisterPage,
  ResetPage,
  VerifyPage,
} from './pages/AccountPages'
import { PrivacyPage } from './pages/PrivacyPage'

const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const AdminQuotes = lazy(() => import('./pages/admin/AdminQuotes').then((m) => ({ default: m.AdminQuotes })))
const AdminQuoteDetail = lazy(() =>
  import('./pages/admin/AdminQuoteDetail').then((m) => ({ default: m.AdminQuoteDetail })),
)
const AdminInvoices = lazy(() =>
  import('./pages/admin/AdminInvoices').then((m) => ({ default: m.AdminInvoices })),
)
const AdminFlow = lazy(() => import('./pages/admin/AdminFlow').then((m) => ({ default: m.AdminFlow })))
const AdminSuppliers = lazy(() =>
  import('./pages/admin/AdminSuppliers').then((m) => ({ default: m.AdminSuppliers })),
)
const AdminSupplierDetail = lazy(() =>
  import('./pages/admin/AdminSupplierDetail').then((m) => ({ default: m.AdminSupplierDetail })),
)
const AdminAccounts = lazy(() =>
  import('./pages/admin/AdminAccounts').then((m) => ({ default: m.AdminAccounts })),
)
const AdminDownloads = lazy(() =>
  import('./pages/admin/AdminDownloads').then((m) => ({ default: m.AdminDownloads })),
)
const AdminMail = lazy(() => import('./pages/admin/AdminMail').then((m) => ({ default: m.AdminMail })))

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
      <ProductCatalogProvider>
      <CommerceProvider>
        <SupplierProvider>
        <QuoteProvider>
        <Suspense fallback={<CatalogLoading title="Laddar sidan…" />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/design" element={<DesignIndexPage />} />
            <Route path="/design/binsignia" element={<BinsigniaDraftPage />} />
            <Route path="/design/park-pollare" element={<InvestimDraftPage />} />
            <Route path="/design/streetpark" element={<StreetparkDraftPage />} />
            <Route path="/design/riktningar" element={<DirectionsPage />} />
            <Route path="/design/produktsida-a" element={<ProductLayoutA />} />
            <Route path="/design/produktsida-b" element={<ProductLayoutB />} />
            <Route path="/produkter" element={<CatalogIndexPage />} />
            <Route path="/produkter/:categorySlug" element={<CategoryHubPage />} />
            <Route path="/produkter/:categorySlug/:subcategorySlug" element={<SubcategoryListPage />} />
            <Route path="/produkt/:slug" element={<ProductPage />} />
            <Route path="/offertlista" element={<QuoteListPage />} />
            <Route path="/offert" element={<QuoteFormPage />} />
            <Route path="/miljoer/bostadsgard" element={<EnvironmentPage />} />
            <Route path="/dokument" element={<DocumentsPage />} />
            <Route path="/integritet" element={<PrivacyPage />} />
            <Route path="/intern" element={<InternLayout />}>
              <Route index element={<InternHomePage />} />
              <Route path="produkt/:slug" element={<ProductPage intern />} />
            </Route>
            <Route path="/konto" element={<AccountPage />} />
            <Route path="/konto/skapa" element={<RegisterPage />} />
            <Route path="/konto/logga-in" element={<LoginPage />} />
            <Route path="/konto/bekrafta" element={<VerifyPage />} />
            <Route path="/konto/glomt" element={<ForgotPage />} />
            <Route path="/konto/aterstall" element={<ResetPage />} />
            <Route path="/vard" element={<CareHomePage />} />
            <Route path="/vard/produkter" element={<CatalogIndexPage />} />
            <Route path="/vard/produkter/:categorySlug" element={<CategoryHubPage />} />
            <Route
              path="/vard/produkter/:categorySlug/:subcategorySlug"
              element={<SubcategoryListPage />}
            />
            <Route path="/vard/produkt/:slug" element={<ProductPage />} />
            <Route path="/vard/offertlista" element={<QuoteListPage />} />
            <Route path="/vard/offert" element={<QuoteFormPage />} />
            <Route path="/vard/verksamheter" element={<CareOperationsPage />} />
            <Route path="/vard/om" element={<CareAboutPage />} />
            <Route path="/vard/dokument" element={<DocumentsPage />} />
            <Route path="/skola" element={<SchoolHomePage />} />
            <Route path="/skola/produkt/:slug" element={<ProductPage />} />
            <Route path="/skola/offertlista" element={<QuoteListPage />} />
          </Route>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/flode" element={<AdminFlow />} />
            <Route path="/admin/offerter" element={<AdminQuotes />} />
            <Route path="/admin/offerter/:id" element={<AdminQuoteDetail />} />
            <Route path="/admin/fakturor" element={<AdminInvoices />} />
            <Route path="/admin/leverantorer" element={<AdminSuppliers />} />
            <Route path="/admin/leverantorer/:id" element={<AdminSupplierDetail />} />
            <Route path="/admin/konton" element={<AdminAccounts />} />
            <Route path="/admin/nedladdningar" element={<AdminDownloads />} />
            <Route path="/admin/testmejl" element={<AdminMail />} />
          </Route>
          <Route element={<QuoteReplyShell />}>
            <Route path="/q/:id" element={<CustomerQuotePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/design" replace />} />
        </Routes>
        </Suspense>
        </QuoteProvider>
        </SupplierProvider>
      </CommerceProvider>
      </ProductCatalogProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
