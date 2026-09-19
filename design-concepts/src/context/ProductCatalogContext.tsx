import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { products as coreProducts, type Product } from '../data/content'
import {
  emptySeriesMeta,
  loadSeriesCatalog,
  type LoadedSeriesCatalog,
} from '../data/loadProducts'

void loadSeriesCatalog()

export type ProductCatalogStatus = 'loading' | 'ready' | 'error'

export type ProductCatalogValue = {
  products: Record<string, Product>
  status: ProductCatalogStatus
  error?: string
  reload: () => void
  inoplexGaps: LoadedSeriesCatalog['inoplexGaps']
  zanoGaps: LoadedSeriesCatalog['zanoGaps']
  zanoQc: LoadedSeriesCatalog['zanoQc']
  zanoRemovedRedirects: Record<string, string>
  vvzPlayGaps: LoadedSeriesCatalog['vvzPlayGaps']
  novumGaps: LoadedSeriesCatalog['novumGaps']
}

const ProductCatalogContext = createContext<ProductCatalogValue | null>(null)

function mergeProducts(series: Record<string, Product>) {
  return { ...series, ...coreProducts }
}

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<LoadedSeriesCatalog | null>(null)
  const [status, setStatus] = useState<ProductCatalogStatus>('loading')
  const [error, setError] = useState<string | undefined>()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(undefined)
    loadSeriesCatalog(tick > 0)
      .then((loaded) => {
        if (cancelled) return
        setSeries(loaded)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Kunde inte läsa produktkatalogen.')
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const value = useMemo<ProductCatalogValue>(() => {
    const meta = series ?? emptySeriesMeta
    return {
      products: series ? mergeProducts(series.products) : coreProducts,
      status,
      error,
      reload: () => setTick((n) => n + 1),
      inoplexGaps: meta.inoplexGaps,
      zanoGaps: meta.zanoGaps,
      zanoQc: meta.zanoQc,
      zanoRemovedRedirects: meta.zanoRemovedRedirects,
      vvzPlayGaps: meta.vvzPlayGaps,
      novumGaps: meta.novumGaps,
    }
  }, [error, series, status])

  return <ProductCatalogContext.Provider value={value}>{children}</ProductCatalogContext.Provider>
}

export function useProductCatalog() {
  const ctx = useContext(ProductCatalogContext)
  if (!ctx) throw new Error('ProductCatalogProvider missing')
  return ctx
}
