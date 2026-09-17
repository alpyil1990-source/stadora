import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Maximize, Minimize, X, ZoomIn } from 'lucide-react'

export type LightboxImage = {
  src: string
  alt: string
}

export function ProductImageZoom({
  images,
  currentSrc,
  alt,
  imgClassName,
  imgKey,
  onIndexChange,
  compact = false,
}: {
  images: LightboxImage[]
  currentSrc: string
  alt: string
  imgClassName?: string
  imgKey?: string
  onIndexChange?: (index: number) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const sources = images.length > 0 ? images : [{ src: currentSrc, alt }]
  const startIndex = Math.max(
    0,
    sources.findIndex((img) => img.src === currentSrc),
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Förstora bild: ${alt}`}
        className="relative block h-full w-full cursor-zoom-in"
      >
        <img key={imgKey} src={currentSrc} alt={alt} className={imgClassName} />
        {!compact && (
          <span
            aria-hidden
            className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center bg-ink text-sheet"
          >
            <ZoomIn className="h-4 w-4" />
          </span>
        )}
      </button>
      {open && (
        <LightboxDialog
          images={sources}
          initialIndex={startIndex}
          fallbackAlt={alt}
          onClose={() => setOpen(false)}
          onIndexChange={onIndexChange}
        />
      )}
    </>
  )
}

function LightboxDialog({
  images,
  initialIndex,
  fallbackAlt,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[]
  initialIndex: number
  fallbackAlt: string
  onClose: () => void
  onIndexChange?: (index: number) => void
}) {
  const labelId = useId()
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchX = useRef<number | null>(null)
  const [index, setIndex] = useState(initialIndex)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const current = images[index] ?? images[0]
  const alt = current?.alt || fallbackAlt
  const many = images.length > 1

  const prev = useCallback(() => {
    setIndex((i) => {
      const nextIndex = (i - 1 + images.length) % images.length
      onIndexChange?.(nextIndex)
      return nextIndex
    })
  }, [images.length, onIndexChange])

  const next = useCallback(() => {
    setIndex((i) => {
      const nextIndex = (i + 1) % images.length
      onIndexChange?.(nextIndex)
      return nextIndex
    })
  }, [images.length, onIndexChange])

  useEffect(() => {
    setNatural(null)
  }, [current?.src])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (many && event.key === 'ArrowLeft') prev()
      if (many && event.key === 'ArrowRight') next()
      if (event.key !== 'Tab' || !overlayRef.current) return
      const focusable = [...overlayRef.current.querySelectorAll<HTMLElement>('button')]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    function onFullscreen() {
      setFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreen)
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined)
      }
    }
  }, [many, next, onClose, prev])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined)
      return
    }
    overlayRef.current?.requestFullscreen?.().catch(() => undefined)
  }

  if (!current) return null

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className="lightbox-in fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-ink/80 p-3 md:p-8"
      onClick={onClose}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        if (!many || touchX.current === null) return
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchX.current
        touchX.current = null
        if (Math.abs(delta) > 40) {
          if (delta > 0) prev()
          else next()
        }
      }}
    >
      <p id={labelId} className="sr-only">
        Förstorad bild: {alt}
      </p>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {many && (
          <span className="border border-line bg-sheet px-3 py-1.5 font-ui text-xs tabular-nums text-ink">
            {index + 1} / {images.length}
          </span>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            toggleFullscreen()
          }}
          aria-label={fullscreen ? 'Lämna helskärm' : 'Visa i helskärm'}
          className="flex h-10 w-10 items-center justify-center border border-line bg-sheet text-ink outline-none hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Stäng förstorad bild"
          className="flex h-10 w-10 items-center justify-center border border-line bg-sheet text-ink outline-none hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {many && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              prev()
            }}
            aria-label="Föregående bild"
            className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-line bg-sheet text-ink outline-none hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage md:left-4"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              next()
            }}
            aria-label="Nästa bild"
            className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-line bg-sheet text-ink outline-none hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage md:right-4"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="flex max-h-full max-w-full cursor-default items-center justify-center bg-paper p-2 md:p-4"
          onClick={(event) => event.stopPropagation()}
        >
          <img
            src={current.src}
            alt={alt}
            onLoad={(event) => {
              const img = event.currentTarget
              setNatural({ w: img.naturalWidth, h: img.naturalHeight })
            }}
            className="max-h-[calc(100dvh-6rem)] max-w-full object-contain md:max-h-[calc(100dvh-8rem)]"
            style={
              natural
                ? {
                    maxWidth: `min(100%, ${natural.w}px)`,
                    maxHeight: `min(calc(100dvh - 6rem), ${natural.h}px)`,
                  }
                : undefined
            }
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
