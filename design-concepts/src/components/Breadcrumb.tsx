import { Link } from 'react-router-dom'

export function Breadcrumb({
  items,
}: {
  items: { label: string; to?: string }[]
}) {
  return (
    <nav aria-label="Du är här" className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-ink hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
