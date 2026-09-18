import type { Product } from '../data/content'

const MATERIAL_SPEC_RE =
  /portlandcement|hållfasthetsklass|tvättad ballast|sorterad sand|flerkomponents|cementtyp|\bcm\s*ii\b|pn-en\s*206|betong minst\s*c\s*\d|stommaterial\s*:|träslag\s*:|lackade tre gånger|ståldelar är|trälister\s+\d+\s*cm/i

const PRODUCT_OPENER =
  /^(bänk|parkbänk|papperskorg|askkopp|bord|picknick|cykelställ|pollare|vilstol|solstol|akutvagn|skåp|kärl|sittmodul|fällstol|fällbänk|v-care)\b/i

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

/** Structured rows for Material och ytbehandling. Presentation only — does not mutate product fields. */
export type MaterialSectionRow = { label: string; value: string }

function capitalizePhrase(text: string): string {
  const trimmed = tidy(text)
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function joinSwedishList(parts: string[]): string {
  const clean = parts.map((part) => tidy(part)).filter(Boolean)
  if (clean.length <= 1) return clean[0] ?? ''
  if (clean.length === 2) return `${clean[0]} och ${clean[1]}`
  return `${clean.slice(0, -1).join(', ')} och ${clean[clean.length - 1]}`
}

function mergeUniquePhrases(parts: string[]): string[] {
  const merged: string[] = []
  for (const part of parts) {
    const value = tidy(part)
    if (!value) continue
    if (merged.some((existing) => containedIn(value, existing))) continue
    for (let i = merged.length - 1; i >= 0; i--) {
      if (containedIn(merged[i], value)) merged.splice(i, 1)
    }
    merged.push(value)
  }
  return merged
}

function joinClauses(parts: string[]): string {
  const merged = mergeUniquePhrases(parts).map((part, index) =>
    index === 0 ? capitalizePhrase(part) : part,
  )
  if (!merged.length) return ''
  return merged
    .map((part, index) => {
      if (index === merged.length - 1) return part.replace(/\.+$/, '')
      return /[.!?]$/.test(part) ? part : `${part}.`
    })
    .join(' ')
}

function stripPrefixLabel(text: string): string {
  return tidy(text.replace(/^(stommaterial|träslag|stomme|sits)\s*:\s*/i, ''))
}

export function productHasBackrest(product: Product, selectedSummary?: string): boolean {
  const selected = (selectedSummary ?? '').toLowerCase()
  if (/utan rygg/.test(selected)) return false
  if (/ryggstöd|\bmed rygg\b/.test(selected)) return true

  const text = `${product.summary} ${product.description} ${product.name}`.toLowerCase()
  if (/utan ryggstöd|utan rygg/.test(text)) return false
  if (/med ryggstöd|ryggstöd/.test(text)) return true
  if (product.dimensions?.some((row) => /ryggstöd/i.test(row.label))) return true
  if (/vilstol|solstol|solbänk|liggstol|fällstol|fällbänk/i.test(`${product.name} ${product.subcategory}`)) return true
  if (/sits och rygg/.test(text)) return true
  return false
}

function isSeatChunk(chunk: string): boolean {
  return /trälister|^\s*trä\s*$|sits och rygg/i.test(chunk) && !/stomme|stål|betong/i.test(chunk)
}

function splitCompositeMaterial(material: string): { frame?: string; seat?: string } {
  const text = tidy(material)
  if (!text) return {}

  const withSeat = text.match(/^(.*?)\s+med\s+(trälister|trä)\.?$/i)
  if (withSeat) {
    return { frame: capitalizePhrase(withSeat[1]), seat: capitalizePhrase(withSeat[2]) }
  }

  const andSeat = text.match(/^(.*?)\s+och\s+(trälister|trä)\.?$/i)
  if (andSeat) {
    return { frame: capitalizePhrase(andSeat[1]), seat: capitalizePhrase(andSeat[2]) }
  }

  const sentences = splitSentences(text)
  if (sentences.length >= 2) {
    const seatSentences = sentences.filter(isSeatChunk)
    const frameSentences = sentences.filter((sentence) => !isSeatChunk(sentence))
    if (seatSentences.length && frameSentences.length) {
      return {
        frame: capitalizePhrase(frameSentences.join(' ')),
        seat: capitalizePhrase(seatSentences.join(' ')),
      }
    }
  }

  if (/trälister/i.test(text) && /,\s*| och /i.test(text)) {
    const chunks = text
      .split(/,(?!\s*\d)|\s+och\s+/i)
      .map((chunk) => tidy(chunk.replace(/\.+$/, '')))
      .filter(Boolean)
    const seatChunks = chunks.filter(isSeatChunk)
    const frameChunks = chunks.filter((chunk) => !isSeatChunk(chunk))
    if (seatChunks.length && frameChunks.length) {
      return {
        frame: capitalizePhrase(joinSwedishList(frameChunks)),
        seat: capitalizePhrase(joinSwedishList(seatChunks)),
      }
    }
  }

  return { frame: capitalizePhrase(text) }
}

function classifyMaterialSentence(sentence: string): 'frame' | 'seat' | 'concrete' {
  if (/portlandcement|hållfasthetsklass|tvättad ballast|sorterad sand|betong minst|pn-en\s*206/i.test(sentence)) {
    return 'concrete'
  }
  if (/träslag\s*:|trälister|sits och rygg/i.test(sentence) && !/stommaterial/i.test(sentence)) {
    return 'seat'
  }
  return 'frame'
}

export function materialSectionRows(
  product: Product,
  options: {
    materialLabel?: string
    extras?: string[]
    selectedSummary?: string
    selectedSeat?: string
  } = {},
): MaterialSectionRow[] {
  const extras = options.extras ?? extraMaterialDetails(product)
  const source = options.materialLabel ?? product.material ?? ''
  const split = splitCompositeMaterial(source)
  const frameParts: string[] = []
  const seatParts: string[] = []
  const concreteParts: string[] = []

  if (split.frame) frameParts.push(split.frame)
  if (product.wood) {
    seatParts.push(product.wood)
  } else if (split.seat) {
    seatParts.push(split.seat)
  }
  if (options.selectedSeat) {
    seatParts.length = 0
    seatParts.push(options.selectedSeat)
  }
  if (product.cement) concreteParts.push(product.cement)

  for (const extra of extras) {
    const value = stripPrefixLabel(extra)
    const kind = classifyMaterialSentence(extra)
    if (kind === 'seat') seatParts.push(value)
    else if (kind === 'concrete') concreteParts.push(value)
    else frameParts.push(value)
  }

  const frame = joinClauses(frameParts)
  const seat = joinClauses(seatParts)
  const concrete = joinClauses(concreteParts)
  const rows: MaterialSectionRow[] = []
  if (frame) rows.push({ label: 'Stomme', value: frame })
  if (seat) {
    const label = productHasBackrest(product, options.selectedSummary) ? 'Sits och ryggstöd' : 'Sits'
    rows.push({ label, value: seat })
  }
  if (concrete) rows.push({ label: 'Betongspecifikation', value: concrete })
  return rows
}

export function keyFactDimension(
  dimensions: { label: string; value: string }[] | undefined,
  label: string,
) {
  if (!dimensions?.length) return undefined
  const want = normalize(label)
  return dimensions.find((row) => normalize(row.label) === want)
}
