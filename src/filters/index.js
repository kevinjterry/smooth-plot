import * as sma from './sma'
import * as ema from './ema'
import * as gaussian from './gaussian'
import * as savitzkyGolay from './savitzkyGolay'
import * as median from './median'

export const filterRegistry = [sma, ema, gaussian, savitzkyGolay, median]

export function applyFilter(filterKey, data, params) {
  const filterModule = filterRegistry.find((f) => f.meta.key === filterKey)
  if (!filterModule) throw new Error(`Unknown filter: ${filterKey}`)
  return filterModule.apply(data, params)
}
