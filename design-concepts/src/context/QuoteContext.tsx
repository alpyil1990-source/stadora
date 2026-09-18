import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
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
  imageExample?: boolean
}

type QuoteState = Record<AreaId, QuoteLine[]>

type QuoteDraft = Omit<QuoteLine, 'id' | 'comment'> & { comment?: string }

type QuoteContextValue = {
  lines: QuoteLine[]
  area: AreaId
  add: (line: QuoteDraft, bucket?: AreaId) => void
  update: (id: string, patch: Partial<QuoteLine>) => void
  remove: (id: string) => void
  clear: () => void
  count: number
  pieces: number
}

const QuoteContext = createContext<QuoteContextValue | null>(null)

export const QUOTE_STORAGE_KEY = 'stadora-quote-v1'

export function areaFromPath(pathname: string): AreaId {
  if (pathname.startsWith('/vard')) return 'vard'
  if (pathname.startsWith('/skola')) return 'skola'
  return 'offentlig'
}

function blank(): QuoteState {
  return { offentlig: [], skola: [], vard: [] }
}

function newLineId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* insecure context */
  }
  return `q-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function linesFor(state: QuoteState, area: AreaId): QuoteLine[] {
  const list = state[area]
  return Array.isArray(list) ? list : []
}

function loadState(): QuoteState {
  try {
    const raw = localStorage.getItem(QUOTE_STORAGE_KEY)
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

function persist(state: QuoteState) {
  try {
    localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode */
  }
}

export function QuoteProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const area = areaFromPath(location.pathname)
  const [state, setState] = useState<QuoteState>(loadState)

  useEffect(() => {
    persist(state)
  }, [state])

  const value = useMemo<QuoteContextValue>(() => {
    const lines = linesFor(state, area)
    const write = (updater: (prev: QuoteState) => QuoteState) => {
      setState((prev) => {
        const next = updater(prev)
        persist(next)
        return next
      })
    }
    return {
      lines,
      area,
      add: (line, bucket) => {
        const target = bucket ?? area
        write((prev) => {
          const list = linesFor(prev, target)
          const existing = list.find((l) => l.slug === line.slug && l.variant === line.variant)
          if (existing) {
            return {
              ...prev,
              [target]: list.map((l) =>
                l.id === existing.id ? { ...l, qty: l.qty + line.qty } : l,
              ),
            }
          }
          return {
            ...prev,
            [target]: [
              ...list,
              {
                ...line,
                comment: line.comment ?? '',
                id: newLineId(),
              },
            ],
          }
        })
      },
      update: (id, patch) => {
        write((prev) => ({
          ...prev,
          [area]: linesFor(prev, area).map((l) => (l.id === id ? { ...l, ...patch } : l)),
        }))
      },
      remove: (id) => {
        write((prev) => ({
          ...prev,
          [area]: linesFor(prev, area).filter((l) => l.id !== id),
        }))
      },
      clear: () => write((prev) => ({ ...prev, [area]: [] })),
      count: lines.length,
      pieces: lines.reduce((n, l) => n + l.qty, 0),
    }
  }, [area, state])

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('QuoteProvider missing')
  return ctx
}

export function useQuoteOptional() {
  return useContext(QuoteContext)
}
