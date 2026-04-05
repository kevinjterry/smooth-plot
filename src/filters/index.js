import * as sma from './sma'
import * as ema from './ema'

export const filterRegistry = [sma, ema]

export function applyFilter(filterKey, data, params) {
  const filterModule = filterRegistry.find((f) => f.meta.key === filterKey)
  if (!filterModule) throw new Error(`Unknown filter: ${filterKey}`)
  return filterModule.apply(data, params)
}
