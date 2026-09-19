import type { Product, ProductImage } from './content'

export const EXAMPLE_IMAGE_NOTE = 'Bilden visar ett exempelutförande.'

export type ColorChoice = { name: string; hex?: string; swatch?: string }

const PREFERRED_COLOR_ORDER = [
  'Orange + turkos',
  'Brun + gulgrön',
  'Antracit + gul',
  'Antracit + röd',
  'Grön + vit',
]

/** Fold supplier colour labels to one key so “Brown + Yellow” matches “Brun + gulgrön”. */
const COLOR_CANON: Record<string, string> = {
  'orange + turkos': 'Orange + turkos',
  'orange + turquoise': 'Orange + turkos',
  'turquoise + orange': 'Orange + turkos',
  'turkos + orange': 'Orange + turkos',
  'brun + gulgron': 'Brun + gulgrön',
  'brun + gulgrön': 'Brun + gulgrön',
  'brown + yellow': 'Brun + gulgrön',
  'brown + yellow green': 'Brun + gulgrön',
  'yellow green + brown': 'Brun + gulgrön',
  'gulgron + brun': 'Brun + gulgrön',
  'gulgrön + brun': 'Brun + gulgrön',
  'antracit + gul': 'Antracit + gul',
  'anthracite + yellow': 'Antracit + gul',
  'yellow + anthracite': 'Antracit + gul',
  'gul + antracit': 'Antracit + gul',
  'antracit + rod': 'Antracit + röd',
  'antracit + röd': 'Antracit + röd',
  'anthracite + red': 'Antracit + röd',
  'red + anthracite': 'Antracit + röd',
  'rod + antracit': 'Antracit + röd',
  'röd + antracit': 'Antracit + röd',
  'green + white': 'Grön + vit',
  'gron + vit': 'Grön + vit',
  'grön + vit': 'Grön + vit',
  'white + green': 'Grön + vit',
  'vit + gron': 'Grön + vit',
  orange: 'Orange',
  brown: 'Brun',
  brun: 'Brun',
  anthracite: 'Antracit',
  antracit: 'Antracit',
}

const COLOR_HEX: Record<string, string> = {
  '#ce5c27': 'Orange + turkos',
  '#3d898b': 'Orange + turkos',
  '#6c4c2c': 'Brun + gulgrön',
  '#abc251': 'Brun + gulgrön',
  '#f7b500': 'Antracit + gul',
  '#bb1e10': 'Antracit + röd',
  '#68a640': 'Grön + vit',
}

function foldColor(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/yellow-green/g, 'yellow green')
    .replace(/\s+/g, ' ')
    .trim()
}

export function canonicalColorName(name?: string, hex?: string): string {
  if (hex) {
    const byHex = COLOR_HEX[hex.trim().toLowerCase()]
    if (byHex) return byHex
  }
  if (!name) return ''
  return COLOR_CANON[foldColor(name)] ?? name.trim()
}

export function colorsMatch(a?: string, b?: string, aHex?: string, bHex?: string): boolean {
  if (!a && !b && !aHex && !bHex) return false
  if (a && b && a === b) return true
  const ca = canonicalColorName(a, aHex)
  const cb = canonicalColorName(b, bHex)
  return Boolean(ca) && Boolean(cb) && ca === cb
}

export function uniqueImages(images: ProductImage[]): ProductImage[] {
  const seen = new Set<string>()
  const out: ProductImage[] = []
  for (const img of images) {
    if (seen.has(img.src)) continue
    seen.add(img.src)
    out.push(img)
  }
  return out
}

function colorRank(name?: string): number {
  if (!name) return 80
  const c = canonicalColorName(name) || name
  const i = PREFERRED_COLOR_ORDER.indexOf(c)
  return i === -1 ? 50 : i
}

/** One photo per kulör (and size, when tagged). Extra angles of the same finish stay out. */
export function uniqueImagesByColor(images: ProductImage[]): ProductImage[] {
  const unique = uniqueImages(images)
    .map((img) => {
      const color = img.color ? canonicalColorName(img.color) || img.color : img.color
      return { ...img, color, caption: color ?? img.caption }
    })
    .sort((a, b) => colorRank(a.color) - colorRank(b.color) || a.src.localeCompare(b.src))
  const seenColor = new Set<string>()
  const out: ProductImage[] = []
  for (const img of unique) {
    const colorKey = img.color ? canonicalColorName(img.color) || img.color : ''
    const key = colorKey ? `${colorKey}|${img.size ?? ''}` : ''
    if (key) {
      if (seenColor.has(key)) continue
      seenColor.add(key)
    }
    out.push(img)
  }
  return out
}

function alignNameToImages(name: string, imageColors: string[]): string {
  const canon = canonicalColorName(name) || name
  const exact = imageColors.find((ic) => colorsMatch(ic, canon) || ic === canon)
  if (exact) return canonicalColorName(exact) || exact
  const prefix = imageColors.filter((ic) => {
    const folded = foldColor(canonicalColorName(ic) || ic)
    const needle = foldColor(canon)
    return folded.startsWith(`${needle} +`) || folded.startsWith(`${needle}+`)
  })
  if (prefix.length === 1) return canonicalColorName(prefix[0]) || prefix[0]
  return canon
}

export function normalizeCatalogImages(images: ProductImage[]): ProductImage[] {
  return uniqueImagesByColor(images)
}

export function normalizeCatalogColors(
  options: ColorChoice[],
  images: ProductImage[],
): ColorChoice[] {
  const imageColors = normalizeCatalogImages(images)
    .map((img) => img.color)
    .filter((name): name is string => Boolean(name))
  const mapped = options.map((opt) => {
    const name = alignNameToImages(canonicalColorName(opt.name, opt.hex) || opt.name, imageColors)
    return { ...opt, name }
  })
  const seen = new Set<string>()
  const out: ColorChoice[] = []
  for (const opt of [...mapped].sort((a, b) => colorRank(a.name) - colorRank(b.name))) {
    const key = canonicalColorName(opt.name, opt.hex) || opt.name
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...opt, name: key })
  }
  return out
}

export function colorChoices(product: Product): ColorChoice[] {
  return (product.colors ?? []).map((c) => (typeof c === 'string' ? { name: c } : c))
}

export function imagesForVariant(
  images: ProductImage[],
  sel: { color?: string; size?: string },
): { shown: ProductImage[]; colorMatched: boolean; sizeMatched: boolean } {
  const { color, size } = sel
  const unique = uniqueImagesByColor(images)
  const tagged = unique.filter((i) => Boolean(i.color))
  const filters: Array<(img: ProductImage) => boolean> = []
  if (color && size) {
    filters.push((i) => colorsMatch(i.color, color) && i.size === size)
  }
  if (color) {
    filters.push((i) => colorsMatch(i.color, color) && !i.size)
    filters.push((i) => colorsMatch(i.color, color))
  }
  if (size) {
    filters.push((i) => i.size === size && !i.color)
    filters.push((i) => i.size === size)
  }
  filters.push((i) => !i.color && !i.size)

  for (const pass of filters) {
    const hit = unique.filter(pass)
    if (hit.length > 0) {
      return {
        shown: hit,
        colorMatched: color ? hit.some((i) => colorsMatch(i.color, color)) : true,
        sizeMatched: size ? hit.some((i) => i.size === size) : true,
      }
    }
  }

  // Colour-tagged products: never dump every finish into the gallery.
  if (color && tagged.length > 0) {
    const preferred = tagged.filter((i) => canonicalColorName(i.color) === 'Orange + turkos')
    return {
      shown: preferred.length ? preferred : [tagged[0]],
      colorMatched: false,
      sizeMatched: size ? tagged.some((i) => i.size === size) : true,
    }
  }

  return {
    shown: unique,
    colorMatched: !color,
    sizeMatched: !size,
  }
}

export function hasColorTaggedImages(images: ProductImage[]) {
  return images.some((i) => Boolean(i.color))
}

export function hasSizeTaggedImages(images: ProductImage[]) {
  return images.some((i) => Boolean(i.size))
}

export function shownLabel(images: ProductImage[]) {
  const color = images.find((i) => i.color)?.color
  const size = images.find((i) => i.size)?.size
  if (color && size) return `${size} · ${color}`
  return color ?? size ?? 'exempelutförande'
}
