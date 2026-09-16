export function BrandMark({
  className = 'h-10 w-auto',
}: {
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 120 132"
      className={className}
      role="img"
      aria-label="STADORA symbol"
    >
      <path d="M8 130V69l50 61H8Z" fill="currentColor" />
      <path d="M20 54 62 5h50L70 54H20Z" fill="var(--logo-sage)" />
      <path d="m20 54 31-36 54 65c7 9 7 21 0 30l-15 17L20 54Z" fill="currentColor" />
    </svg>
  )
}

export function BrandLockup({
  layout = 'header',
}: {
  layout?: 'header' | 'stack'
}) {
  if (layout === 'stack') {
    return (
      <>
        <BrandMark className="h-20 w-auto" />
        <span className="brand-name mt-3 text-[1.7rem] leading-none">STADORA</span>
        <span className="brand-tagline mt-2 text-[0.54rem]">PROFESSIONELLA MILJÖER</span>
      </>
    )
  }

  return (
    <>
      <BrandMark className="h-10 w-auto shrink-0 md:h-12" />
      <span className="hidden min-w-0 sm:block">
        <span className="brand-name block text-[1.35rem] leading-none md:text-[1.55rem]">STADORA</span>
        <span className="brand-tagline mt-1.5 block text-[0.42rem] md:text-[0.48rem]">
          PROFESSIONELLA MILJÖER
        </span>
      </span>
    </>
  )
}
