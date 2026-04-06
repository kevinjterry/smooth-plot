import * as sma from './sma'
import * as ema from './ema'
import * as holt from './holt'
import * as gaussian from './gaussian'
import * as savitzkyGolay from './savitzkyGolay'
import * as median from './median'
import * as kalman from './kalman'

export const filterRegistry = [sma, ema, holt, gaussian, savitzkyGolay, median, kalman]

export function applyFilter(filterKey, data, params, { causalMode = false } = {}) {
  const filterModule = filterRegistry.find((f) => f.meta.key === filterKey)
  if (!filterModule) throw new Error(`Unknown filter: ${filterKey}`)
  return filterModule.apply(data, params, { causalMode })
}
