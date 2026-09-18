import { Link } from 'react-router-dom'
import type { ProductDocument } from '../data/content'
import { withNextQuery } from '../lib/returnPath'

export function CadLoginPanel({
  files,
  backdrop,
  next,
  heading,
  unverified,
}: {
  files: ProductDocument[]
  backdrop?: { src: string; alt: string }
  next: string
  heading: string
  unverified?: boolean
}) {
  const login = withNextQuery('/konto/logga-in', next)
  const register = withNextQuery('/konto/skapa', next)
  return (
    <div className="relative overflow-hidden border border-ink bg-ink text-sheet">
      {backdrop && (
        <img
          src={backdrop.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale"
        />
      )}
      <div className="relative bg-ink/55 px-5 py-6 sm:px-7 sm:py-8">
        <p className="font-medium">{heading}</p>
        <ul className="mt-4 space-y-1 text-sm text-sheet/90">
          {files.map((file) => (
            <li key={`${file.title}-${file.format}-${file.variant ?? 'all'}`}>{file.title}</li>
          ))}
        </ul>
        <p className="mt-5 text-sm font-medium">
          {unverified
            ? 'Bekräfta e-postadressen för att ladda ner filerna.'
            : 'Du behöver logga in för att ladda ner filerna.'}
        </p>
        {unverified ? (
          <p className="mt-3 text-sm text-sheet/80">Länken ligger i den interna testbrevlådan.</p>
        ) : (
          <div className="mt-5 flex max-w-[16rem] flex-col gap-2">
            <Link
              to={login}
              className="bg-sheet px-4 py-3 text-center font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink"
            >
              Logga in
            </Link>
            <Link
              to={register}
              className="border border-sheet/40 px-4 py-3 text-center font-ui text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-sheet"
            >
              Skapa konto
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
