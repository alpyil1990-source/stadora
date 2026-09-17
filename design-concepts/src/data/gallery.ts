import type { Product, ProductImage } from './content'

export type ColorChoice = { name: string; hex?: string; swatch?: string }

export function colorChoices(product: Product): ColorChoice[] {
  return (product.colors ?? []).map((c) => (typeof c === 'string' ? { name: c } : c))
}

export function imagesForVariant(
  images: ProductImage[],
  sel: { color?: string; size?: string },
): { shown: ProductImage[]; colorMatched: boolean; sizeMatched: boolean } {
  const { color, size } = sel
  const filters: Array<(img: ProductImage) => boolean> = []
  if (color && size) filters.push((i) => i.color === color && i.size === size)
  if (color) {
    filters.push((i) => i.color === color && !i.size)
    filters.push((i) => i.color === color)
  }
  if (size) {
    filters.push((i) => i.size === size && !i.color)
    filters.push((i) => i.size === size)
  }
  filters.push((i) => !i.color && !i.size)

  for (const pass of filters) {
    const hit = images.filter(pass)
    if (hit.length > 0) {
      return {
        shown: hit,
        colorMatched: color ? hit.some((i) => i.color === color) : true,
        sizeMatched: size ? hit.some((i) => i.size === size) : true,
      }
    }
  }

  return {
    shown: images,
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
