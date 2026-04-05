export function computeStats(raw, filtered) {
  const n = raw.length
  let sumSqErr = 0
  let sumAbsErr = 0
  let maxDev = 0

  for (let i = 0; i < n; i++) {
    const diff = filtered[i] - raw[i]
    sumSqErr += diff * diff
    sumAbsErr += Math.abs(diff)
    if (Math.abs(diff) > maxDev) maxDev = Math.abs(diff)
  }

  return {
    mse: sumSqErr / n,
    mae: sumAbsErr / n,
    maxDev,
  }
}
