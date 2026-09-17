import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { products } from '../data/content'
import {
  newSupplierId,
  seedSuppliers,
  type Supplier,
  type SupplierContact,
  type SupplierStatus,
} from '../data/suppliers'

type SupplierValue = {
  suppliers: Supplier[]
  add: (draft: Omit<Supplier, 'id' | 'productSlugs'> & { productSlugs?: string[] }) => string
  update: (id: string, patch: Partial<Supplier>) => void
  updateContact: (id: string, patch: Partial<SupplierContact>) => void
  setStatus: (id: string, status: SupplierStatus) => void
  assignProduct: (supplierId: string, slug: string) => void
  unassignProduct: (slug: string) => void
  remove: (id: string) => void
  reset: () => void
  productCount: (id: string) => number
  supplierFor: (slug: string) => Supplier | undefined
  unassignedSlugs: string[]
}

const SupplierContext = createContext<SupplierValue | null>(null)
const STORAGE_KEY = 'stadora-suppliers-v8'

function load(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedSuppliers
    const parsed = JSON.parse(raw) as { suppliers?: Supplier[] }
    if (!Array.isArray(parsed.suppliers) || parsed.suppliers.length === 0) return seedSuppliers
    return parsed.suppliers
  } catch {
    return seedSuppliers
  }
}

export function SupplierProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ suppliers }))
  }, [suppliers])

  const value = useMemo<SupplierValue>(() => {
    const known = new Set(Object.keys(products))
    return {
      suppliers,
      add: (draft) => {
        const id = newSupplierId()
        setSuppliers((prev) => [
          {
            ...draft,
            id,
            productSlugs: draft.productSlugs ?? [],
          },
          ...prev,
        ])
        return id
      },
      update: (id, patch) => {
        setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, id: s.id } : s)))
      },
      updateContact: (id, patch) => {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, contact: { ...s.contact, ...patch } } : s)),
        )
      },
      setStatus: (id, status) => {
        setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
      },
      assignProduct: (supplierId, slug) => {
        setSuppliers((prev) =>
          prev.map((s) => {
            const without = s.productSlugs.filter((p) => p !== slug)
            if (s.id === supplierId) return { ...s, productSlugs: [...without, slug] }
            return { ...s, productSlugs: without }
          }),
        )
      },
      unassignProduct: (slug) => {
        setSuppliers((prev) =>
          prev.map((s) => ({ ...s, productSlugs: s.productSlugs.filter((p) => p !== slug) })),
        )
      },
      remove: (id) => {
        setSuppliers((prev) => prev.filter((s) => s.id !== id))
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY)
        setSuppliers(seedSuppliers)
      },
      productCount: (id) =>
        suppliers.find((s) => s.id === id)?.productSlugs.filter((slug) => known.has(slug)).length ?? 0,
      supplierFor: (slug) => suppliers.find((s) => s.productSlugs.includes(slug)),
      unassignedSlugs: Object.keys(products).filter(
        (slug) =>
          products[slug].area === 'offentlig' &&
          !suppliers.some((s) => s.productSlugs.includes(slug)),
      ),
    }
  }, [suppliers])

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>
}

export function useSuppliers() {
  const ctx = useContext(SupplierContext)
  if (!ctx) throw new Error('SupplierProvider missing')
  return ctx
}
