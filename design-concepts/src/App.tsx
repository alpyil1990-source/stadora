import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
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
import { DesignIndexPage, DirectionsPage } from './pages/DesignPages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/design" element={<DesignIndexPage />} />
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
          <Route path="*" element={<Navigate to="/design" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
