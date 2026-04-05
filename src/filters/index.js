import * as sma from './sma'

export const filterRegistry = [sma]

export function applyFilter(filterKey, data, params) {
  const filterModule = filterRegistry.find((f) => f.meta.key === filterKey)
  if (!filterModule) throw new Error(`Unknown filter: ${filterKey}`)
  return filterModule.apply(data, params)
}
