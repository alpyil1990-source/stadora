import type { ReactNode } from 'react'
import { useProductCatalog } from '../context/ProductCatalogContext'

export function CatalogLoading({
  title = 'Laddar produkter…',
  detail = 'Hämtar katalogdata. Det tar bara ett ögonblick.',
}: {
  title?: string
  detail?: string
}) {
  return (
    <div className="border border-dashed border-line p-6" role="status" aria-live="polite">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  )
}

export function CatalogError({
  message,
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="border border-dashed border-line p-6" role="alert">
      <p className="font-medium">Kunde inte läsa katalogen</p>
      <p className="mt-2 text-sm text-muted">
        {message ?? 'Kontrollera anslutningen och försök igen. Produkterna laddas separat från sidans skal.'}
      </p>
      {onRetry ? (
        <button type="button" className="mt-4 text-sm underline" onClick={onRetry}>
          Försök igen
        </button>
      ) : null}
    </div>
  )
}

export function CatalogGate({
  children,
  pending = false,
}: {
  children: ReactNode
  pending?: boolean
}) {
  const { status, error, reload } = useProductCatalog()
  if (status === 'loading' || pending) return <CatalogLoading />
  if (status === 'error') return <CatalogError message={error} onRetry={reload} />
  return children
}
