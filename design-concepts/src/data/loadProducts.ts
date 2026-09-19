import type { Product } from './content'
import { buildBinsigniaRestProducts } from './binsignia-rest'
import { buildInoplexCatalog, type InoplexGap } from './inoplex'
import { buildInvestimProducts } from './investim'
import { buildKuschProducts } from './kusch-vcare-fold'
import { buildNovumCatalog, type NovumGap } from './novum'
import { buildStreetparkProducts } from './streetpark'
import { buildVvzPlayCatalog, type VvzPlayGap } from './vvz-play'
import {
  buildZanoCatalog,
  ZANO_REMOVED_PRODUCT_REDIRECTS,
  type ZanoGap,
  type ZanoQc,
} from './zano'

import avfallUrl from './generated/avfall-series.json?url'
import inoplexUrl from './generated/inoplex-series.json?url'
import investimUrl from './generated/investim-series.json?url'
import kuschUrl from './generated/kusch-vcare-fold.json?url'
import novumUrl from './generated/novum-series.json?url'
import streetparkUrl from './generated/streetpark-series.json?url'
import vvzUrl from './generated/vvz-play-series.json?url'
import zanoUrl from './generated/zano-series.json?url'

export type LoadedSeriesCatalog = {
  products: Record<string, Product>
  inoplexGaps: InoplexGap[]
  zanoGaps: ZanoGap[]
  zanoQc: ZanoQc
  zanoRemovedRedirects: Record<string, string>
  vvzPlayGaps: VvzPlayGap[]
  novumGaps: NovumGap[]
}

type SeriesFile = { series?: unknown[]; qc?: ZanoQc }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Kunde inte hämta katalogfil (${res.status}).`)
  }
  return (await res.json()) as T
}

async function doLoad(): Promise<LoadedSeriesCatalog> {
  const [avfall, inoplex, investim, kusch, novum, streetpark, vvz, zano] = await Promise.all([
    fetchJson<SeriesFile>(avfallUrl),
    fetchJson<SeriesFile>(inoplexUrl),
    fetchJson<SeriesFile>(investimUrl),
    fetchJson<SeriesFile>(kuschUrl),
    fetchJson<SeriesFile>(novumUrl),
    fetchJson<SeriesFile>(streetparkUrl),
    fetchJson<SeriesFile>(vvzUrl),
    fetchJson<SeriesFile>(zanoUrl),
  ])

  const inoplexBuilt = buildInoplexCatalog(inoplex)
  const zanoBuilt = buildZanoCatalog(zano)
  const vvzBuilt = buildVvzPlayCatalog(vvz)
  const novumBuilt = buildNovumCatalog(novum)

  return {
    products: {
      ...buildBinsigniaRestProducts(avfall),
      ...buildInvestimProducts(investim),
      ...buildStreetparkProducts(streetpark),
      ...inoplexBuilt.products,
      ...zanoBuilt.products,
      ...novumBuilt.products,
      ...buildKuschProducts(kusch),
      ...vvzBuilt.products,
    },
    inoplexGaps: inoplexBuilt.gaps,
    zanoGaps: zanoBuilt.gaps,
    zanoQc: zanoBuilt.qc,
    zanoRemovedRedirects: zanoBuilt.removedRedirects,
    vvzPlayGaps: vvzBuilt.gaps,
    novumGaps: novumBuilt.gaps,
  }
}

let inflight: Promise<LoadedSeriesCatalog> | undefined

export function loadSeriesCatalog(reload = false) {
  if (!reload && inflight) return inflight
  const request = doLoad().catch((err) => {
    if (inflight === request) inflight = undefined
    throw err
  })
  inflight = request
  return request
}

export const emptySeriesMeta = {
  inoplexGaps: [] as InoplexGap[],
  zanoGaps: [] as ZanoGap[],
  zanoQc: {} as ZanoQc,
  zanoRemovedRedirects: { ...ZANO_REMOVED_PRODUCT_REDIRECTS } as Record<string, string>,
  vvzPlayGaps: [] as VvzPlayGap[],
  novumGaps: [] as NovumGap[],
}
