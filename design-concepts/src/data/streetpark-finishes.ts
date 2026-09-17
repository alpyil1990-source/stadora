/** Approximate hex for STREETPARK swatches only. Labels stay as imported. */

const SWATCH_HEX: Record<string, string> = {
  'RAL 9006': '#A5A8A6',
  'RAL 9007': '#8A8580',
  'RAL 7016': '#383E42',
  'RAL 9005': '#0A0A0A',
  'RAL 9003': '#ECECE7',
  'RAL 1001': '#CDBA88',
  'RAL 7006': '#6F6A5D',
  'RAL 1021': '#F3D03E',
  'RAL 1033': '#F7A11F',
  'RAL 2008': '#F0752F',
  'RAL 3003': '#9B1B30',
  'RAL 5024': '#5A8FA8',
  'RAL 6034': '#7FB0B2',
  'RAL 6021': '#87A87A',
  'RAL 6010': '#3E6F3A',
  'Shade of Corten': '#A65B32',
  'Corten-nyans': '#A65B32',
  'Hot-dip zinc': '#C5CBC8',
  'Varmförzinkad': '#C5CBC8',
  'Stainless steel': '#D5D7D9',
  'Rostfritt stål': '#D5D7D9',
  'Aluminum alloy': '#C4C8CC',
  'Aluminiumlegering': '#C4C8CC',
  'Smooth natural': '#D6CBB8',
  'Natur': '#D6CBB8',
  'Smooth anthracite': '#3A3F41',
  'Antracit': '#3A3F41',
  Gray: '#9A9A9A',
  Grå: '#9A9A9A',
  'Sandy light': '#D8C7A1',
  'Ljus sand': '#D8C7A1',
  Ek: '#8B5A2B',
  Oak: '#8B5A2B',
  'Tropiskt trä': '#6B3A1F',
  'Tropical wood': '#6B3A1F',
  'Tropical w.': '#6B3A1F',
  Akacia: '#C19A6B',
  Acacia: '#C19A6B',
  'Pine TW': '#5C4033',
  Furu: '#D2B48C',
  Pine: '#D2B48C',
  Lärk: '#C4A574',
  Douglastall: '#A67B5B',
  'Douglas fir': '#A67B5B',
  Spruce: '#C8B48A',
  Gran: '#C8B48A',
  Garapa: '#B87333',
}

export function finishSwatchHex(name: string): string | undefined {
  const trimmed = name.trim()
  if (SWATCH_HEX[trimmed]) return SWATCH_HEX[trimmed]
  const ral = trimmed.match(/^RAL\s+(\d{4})$/i)
  if (ral) return SWATCH_HEX[`RAL ${ral[1]}`]
  return undefined
}

export function isStreetparkProduct(product: { manufacturer?: string }): boolean {
  return product.manufacturer === 'STREETPARK'
}
