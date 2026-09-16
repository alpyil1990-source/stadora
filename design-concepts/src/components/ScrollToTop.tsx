import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** SPA-navigering behåller scrollY. Vid klick: toppen av nya sidan. Vid tillbaka: densamma platsen. */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ''))
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView()
      } else {
        window.scrollTo(0, 0)
      }
    } else if (navigationType === 'POP' && positions.current.has(pathname)) {
      window.scrollTo(0, positions.current.get(pathname) ?? 0)
    } else {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    return () => {
      positions.current.set(pathname, window.scrollY)
    }
  }, [pathname, hash, navigationType])

  return null
}
