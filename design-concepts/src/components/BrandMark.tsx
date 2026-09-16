export function BrandMark({
  className = 'h-9 w-auto',
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 120 132"
      className={className}
      role="img"
      aria-label="STADORA"
    >
      <path d="M8 130V69l50 61H8Z" fill="currentColor" />
      <path d="M20 54 62 5h50L70 54H20Z" fill="var(--color-logo-sage)" />
      <path d="m20 54 31-36 54 65c7 9 7 21 0 30l-15 17L20 54Z" fill="currentColor" />
    </svg>
  )
}
