import type { Product } from '../data/content'

const MATERIAL_SPEC_RE =
  /portlandcement|hållfasthetsklass|tvättad ballast|sorterad sand|flerkomponents|cementtyp|\bcm\s*ii\b|pn-en\s*206|betong minst\s*c\s*\d|stommaterial\s*:|träslag\s*:|lackade tre gånger|ståldelar är|trälister\s+\d+\s*cm/i

const PRODUCT_OPENER =
  /^(bänk|parkbänk|papperskorg|askkopp|bord|picknick|cykelställ|pollare|vilstol|solstol|akutvagn|skåp|kärl|sittmodul)\b/i

const STOP_WORDS = new Set([
  'med',
  'och',
  'eller',
  'samt',
  'för',
  'från',
  'som',
  'den',
  'det',
  'en',
  'ett',
  'av',
  'i',
  'på',
  'till',
  'är',
  'har',
])

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim()
}

function tidy(text: string): string {
  return text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s+\./g, '.')
    .trim()
}

function knownMaterialBlob(product: Product): string {
  return [product.material, product.cement, product.wood].filter(Boolean).join(' ')
}

function containedIn(needle: string, haystack: string): boolean {
  const n = normalize(needle).replace(/[.,;:]+$/g, '')
  const h = normalize(haystack)
  if (!n) return true
  return h.includes(n)
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(/[^a-zåäö0-9]+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
}

function materialOverlap(sentence: string, product: Product): number {
  const materialTokens = tokens(knownMaterialBlob(product))
  const sentenceTokens = tokens(sentence)
  if (!materialTokens.length || !sentenceTokens.length) return 0
  const hits = sentenceTokens.filter((word) =>
    materialTokens.some(
      (material) => material === word || material.startsWith(word.slice(0, 5)) || word.startsWith(material.slice(0, 5)),
    ),
  ).length
  return hits / sentenceTokens.length
}

function hasMeasure(sentence: string): boolean {
  return /\d[\d,]*(?:\s*(?:cm|mm|m|kg|l)\b)/i.test(sentence)
}

export function isMaterialSpecSentence(sentence: string, product: Product): boolean {
  const n = normalize(sentence)
  if (/^tillverkas i\b/.test(n)) return true
  if (MATERIAL_SPEC_RE.test(sentence)) return true
  if (product.cement && (containedIn(product.cement, sentence) || containedIn(sentence, product.cement))) {
    return true
  }
  if (product.wood && (containedIn(product.wood, sentence) || containedIn(sentence, product.wood))) {
    return true
  }
  const blob = knownMaterialBlob(product)
  if (blob && containedIn(sentence, blob)) return true
  if (materialOverlap(sentence, product) >= 0.5 && !PRODUCT_OPENER.test(sentence) && !hasMeasure(sentence)) {
    return true
  }
  return false
}

/** Short product copy for the hero. Technical material specs stay in Material och ytbehandling. */
export function productIngress(product: Product): string {
  const source = (product.description || product.summary || '').trim()
  let text = source
  if (product.cement) text = text.split(product.cement).join(' ')
  if (product.wood) text = text.split(product.wood).join(' ')

  const kept = splitSentences(tidy(text)).filter((sentence) => {
    if (isMaterialSpecSentence(sentence, product)) return false
    if (/live-sajten/i.test(sentence)) return false
    if (/^anger\b/i.test(sentence)) return false
    const bare = normalize(sentence).replace(/[.,;:]+$/g, '')
    if (bare && bare === normalize(product.name)) return false
    return true
  })

  return tidy(kept.join(' ')) || (product.summary || '').trim()
}

/** Material-spec sentences from description that are not already a dedicated field. */
export function extraMaterialDetails(product: Product): string[] {
  const blob = knownMaterialBlob(product)
  const seen = new Set<string>()
  const extras: string[] = []

  for (const sentence of splitSentences(product.description || '')) {
    if (!isMaterialSpecSentence(sentence, product)) continue
    if (/^tillverkas i\b/i.test(sentence)) continue
    if (blob && (containedIn(sentence, blob) || containedIn(blob, sentence) || materialOverlap(sentence, product) >= 0.5)) {
      continue
    }
    const key = normalize(sentence)
    if (seen.has(key)) continue
    seen.add(key)
    extras.push(sentence)
  }

  return extras
}

export function keyFactDimension(
  dimensions: { label: string; value: string }[] | undefined,
  label: string,
) {
  if (!dimensions?.length) return undefined
  const want = normalize(label)
  return dimensions.find((row) => normalize(row.label) === want)
}
