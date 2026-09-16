import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AreaId } from '../data/content'

export type QuoteLine = {
  id: string
  slug: string
  name: string
  sku?: string
  variant?: string
  qty: number
  comment: string
  href: string
  image?: string
  imageAlt?: string
}

type QuoteState = Record<AreaId, QuoteLine[]>

type QuoteContextValue = {
  lines: QuoteLine[]
  area: AreaId
  setArea: (area: AreaId) => void
  add: (line: Omit<QuoteLine, 'id' | 'comment'> & { comment?: string }) => void
  update: (id: string, patch: Partial<QuoteLine>) => void
  remove: (id: string) => void
  clear: () => void
  count: number
  pieces: number
}

const QuoteContext = createContext<QuoteContextValue | null>(null)

const STORAGE_KEY = 'stadora-quote-v1'

function blank(): QuoteState {
  return { offentlig: [], skola: [], vard: [] }
}

function loadState(): QuoteState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return blank()
    const parsed = JSON.parse(raw) as Partial<QuoteState>
    return {
      offentlig: Array.isArray(parsed.offentlig) ? parsed.offentlig : [],
      skola: Array.isArray(parsed.skola) ? parsed.skola : [],
      vard: Array.isArray(parsed.vard) ? parsed.vard : [],
    }
  } catch {
    return blank()
  }
}

export function QuoteProvider({
  children,
  area,
  setArea,
}: {
  children: ReactNode
  area: AreaId
  setArea: (area: AreaId) => void
}) {
  const [state, setState] = useState<QuoteState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<QuoteContextValue>(() => {
    const lines = state[area]
    return {
      lines,
      area,
      setArea,
      add: (line) => {
        setState((prev) => {
          const list = prev[area]
          const existing = list.find(
            (l) => l.slug === line.slug && l.variant === line.variant,
          )
          if (existing) {
            return {
              ...prev,
              [area]: list.map((l) =>
                l.id === existing.id ? { ...l, qty: l.qty + line.qty } : l,
              ),
            }
          }
          return {
            ...prev,
            [area]: [
              ...list,
              {
                ...line,
                comment: line.comment ?? '',
                id: crypto.randomUUID(),
              },
            ],
          }
        })
      },
      update: (id, patch) => {
        setState((prev) => ({
          ...prev,
          [area]: prev[area].map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }))
      },
      remove: (id) => {
        setState((prev) => ({
          ...prev,
          [area]: prev[area].filter((l) => l.id !== id),
        }))
      },
      clear: () => setState((prev) => ({ ...prev, [area]: [] })),
      count: lines.length,
      pieces: lines.reduce((n, l) => n + l.qty, 0),
    }
  }, [area, setArea, state])

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('QuoteProvider missing')
  return ctx
}
