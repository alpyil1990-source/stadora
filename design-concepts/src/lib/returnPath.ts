/** Only same-origin relative paths, so login cannot bounce to an external URL. */
export function safeReturnPath(raw: string | null | undefined, fallback = '/konto') {
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  if (raw.includes('://')) return fallback
  return raw
}

export function withNextQuery(path: string, next: string | null | undefined) {
  const safe = safeReturnPath(next, '')
  if (!safe) return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}next=${encodeURIComponent(safe)}`
}
