import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  computeKpis,
  seedInvoices,
  seedQuotes,
  type Invoice,
  type QuoteCase,
  type QuoteStatus,
} from '../data/commerce'

type CommerceValue = {
  quotes: QuoteCase[]
  invoices: Invoice[]
  setStatus: (id: string, status: QuoteStatus, event: string) => void
  fillExamplePrices: (id: string) => void
  reset: () => void
}

const CommerceContext = createContext<CommerceValue | null>(null)
const STORAGE_KEY = 'stadora-commerce-v1'

function load(): { quotes: QuoteCase[]; invoices: Invoice[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { quotes: seedQuotes, invoices: seedInvoices }
    const parsed = JSON.parse(raw) as { quotes?: QuoteCase[]; invoices?: Invoice[] }
    if (!Array.isArray(parsed.quotes) || parsed.quotes.length === 0) {
      return { quotes: seedQuotes, invoices: seedInvoices }
    }
    return {
      quotes: parsed.quotes,
      invoices: Array.isArray(parsed.invoices) ? parsed.invoices : seedInvoices,
    }
  } catch {
    return { quotes: seedQuotes, invoices: seedInvoices }
  }
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<QuoteCase[]>(() => load().quotes)
  const [invoices, setInvoices] = useState<Invoice[]>(() => load().invoices)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ quotes, invoices }))
  }, [quotes, invoices])

  const value = useMemo<CommerceValue>(
    () => ({
      quotes,
      invoices,
      setStatus: (id, status, event) => {
        const now = new Date()
        const stamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        setQuotes((prev) =>
          prev.map((q) => {
            if (q.id !== id) return q
            const next: QuoteCase = {
              ...q,
              status,
              events: [...q.events, { at: stamp, actor: 'Koncept', text: event }],
            }
            if (status === 'skickad') {
              next.sentAt = now.toISOString().slice(0, 10)
              const until = new Date(now)
              until.setDate(until.getDate() + 30)
              next.validUntil = until.toISOString().slice(0, 10)
            }
            return next
          }),
        )
        if (status === 'fakturering') {
          setInvoices((prev) => {
            if (prev.some((i) => i.quoteId === id && i.status !== 'krediterad')) return prev
            const q = quotes.find((x) => x.id === id)
            const amount = q
              ? q.lines.reduce((s, l) => s + (l.unitPrice ?? 0) * l.qty, 0) + (q.freight ?? 0)
              : 0
            const due = new Date(now)
            due.setDate(due.getDate() + 30)
            return [
              {
                id: `F-2026-${200 + prev.length}`,
                quoteId: id,
                status: 'skickad',
                issuedAt: now.toISOString().slice(0, 10),
                dueAt: due.toISOString().slice(0, 10),
                amount,
                customer: q?.org ?? 'Kund',
              },
              ...prev,
            ]
          })
        }
        if (status === 'betald') {
          setInvoices((prev) =>
            prev.map((i) =>
              i.quoteId === id && i.status !== 'krediterad'
                ? { ...i, status: 'betald', paidAt: now.toISOString().slice(0, 10) }
                : i,
            ),
          )
        }
      },
      fillExamplePrices: (id) => {
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === id
              ? {
                  ...q,
                  freight: q.freight ?? 5400,
                  lines: q.lines.map((l) => ({
                    ...l,
                    unitPrice: l.unitPrice ?? 15000,
                  })),
                  events: [
                    ...q.events,
                    {
                      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
                      actor: 'Koncept',
                      text: 'Exempelpriser ifyllda. Inte en live-prislista.',
                    },
                  ],
                }
              : q,
          ),
        )
      },
      reset: () => {
        localStorage.removeItem(STORAGE_KEY)
        setQuotes(seedQuotes)
        setInvoices(seedInvoices)
      },
    }),
    [quotes, invoices],
  )

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}

export function useCommerce() {
  const ctx = useContext(CommerceContext)
  if (!ctx) throw new Error('CommerceProvider missing')
  return ctx
}

export function useKpis() {
  const { quotes, invoices } = useCommerce()
  return computeKpis(quotes, invoices)
}
