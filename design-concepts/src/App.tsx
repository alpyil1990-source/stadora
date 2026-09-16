import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ScrollToTop } from './components/ScrollToTop'
import { AdminShell } from './components/AdminShell'
import { QuoteReplyShell } from './components/QuoteReplyShell'
import { HomePage } from './pages/PublicPages'
import { CatalogIndexPage, CategoryHubPage, SubcategoryListPage } from './pages/CatalogPages'
import { ProductLayoutA, ProductLayoutB, ProductPage } from './pages/ProductPages'
import { QuoteFormPage, QuoteListPage } from './pages/QuotePages'
import {
  CareHomePage,
  DocumentsPage,
  EnvironmentPage,
  SchoolHomePage,
} from './pages/AreaPages'
import { DesignIndexPage, DirectionsPage, BinsigniaDraftPage, InvestimDraftPage } from './pages/DesignPages'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminQuotes } from './pages/admin/AdminQuotes'
import { AdminQuoteDetail } from './pages/admin/AdminQuoteDetail'
import { AdminInvoices } from './pages/admin/AdminInvoices'
import { AdminFlow } from './pages/admin/AdminFlow'
import { CustomerQuotePage } from './pages/CustomerQuotePage'
import { CommerceProvider } from './context/CommerceContext'
import { SupplierProvider } from './context/SupplierContext'
import { AdminSuppliers } from './pages/admin/AdminSuppliers'
import { AdminSupplierDetail } from './pages/admin/AdminSupplierDetail'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CommerceProvider>
        <SupplierProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/design" element={<DesignIndexPage />} />
            <Route path="/design/binsignia" element={<BinsigniaDraftPage />} />
            <Route path="/design/park-pollare" element={<InvestimDraftPage />} />
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
            <Route path="/vard" element={<CareHomePage />} />
            <Route path="/vard/produkt/:slug" element={<ProductPage />} />
            <Route path="/vard/offertlista" element={<QuoteListPage />} />
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
          </Route>
          <Route element={<QuoteReplyShell />}>
            <Route path="/q/:id" element={<CustomerQuotePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/design" replace />} />
        </Routes>
        </SupplierProvider>
      </CommerceProvider>
    </BrowserRouter>
  )
}
