/**
 * All metrics compare filtered output against the clean base signal (ground truth).
 */

function variance(arr) {
  const n = arr.length
  if (n === 0) return 0
  let sum = 0
  for (let i = 0; i < n; i++) sum += arr[i]
  const mean = sum / n
  let sumSq = 0
  for (let i = 0; i < n; i++) sumSq += (arr[i] - mean) ** 2
  return sumSq / n
}

function diff(arr) {
  const result = new Array(arr.length - 1)
  for (let i = 0; i < result.length; i++) {
    result[i] = arr[i + 1] - arr[i]
  }
  return result
}

/** Root mean squared error vs. clean base */
function rmse(clean, filtered) {
  const n = clean.length
  let sumSq = 0
  for (let i = 0; i < n; i++) {
    sumSq += (filtered[i] - clean[i]) ** 2
  }
  return Math.sqrt(sumSq / n)
}

/** Mean absolute error vs. clean base */
function mae(clean, filtered) {
  const n = clean.length
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.abs(filtered[i] - clean[i])
  }
  return sum / n
}

/**
 * Phase lag via cross-correlation.
 * Returns the sample offset that maximizes correlation between clean and filtered.
 */
function phaseLag(clean, filtered) {
  const n = clean.length
  const maxLag = Math.min(50, Math.floor(n / 4))
  let bestLag = 0
  let bestCorr = -Infinity

  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let sum = 0
    let count = 0
    for (let i = 0; i < n; i++) {
      const j = i + lag
      if (j >= 0 && j < n) {
        sum += clean[i] * filtered[j]
        count++
      }
    }
    const corr = count > 0 ? sum / count : 0
    if (corr > bestCorr) {
      bestCorr = corr
      bestLag = lag
    }
  }

  return bestLag
}

/**
 * Smoothness: inverse variance of first derivative, normalized 0–1.
 * Higher = smoother output.
 */
function smoothness(filtered) {
  const d = diff(filtered)
  const v = variance(d)
  return 1 / (1 + v)
}

/**
 * SNR improvement in dB.
 * SNR = 10·log10(Var(signal) / Var(noise))
 * Returns SNR_after - SNR_before.
 */
function snrImprovement(clean, raw, filtered) {
  const n = clean.length
  const signalVar = variance(clean)
  if (signalVar === 0) return 0

  const noiseBefore = new Array(n)
  const noiseAfter = new Array(n)
  for (let i = 0; i < n; i++) {
    noiseBefore[i] = raw[i] - clean[i]
    noiseAfter[i] = filtered[i] - clean[i]
  }

  const noiseVarBefore = variance(noiseBefore)
  const noiseVarAfter = variance(noiseAfter)

  const snrBefore = noiseVarBefore > 0 ? 10 * Math.log10(signalVar / noiseVarBefore) : 100
  const snrAfter = noiseVarAfter > 0 ? 10 * Math.log10(signalVar / noiseVarAfter) : 100

  return snrAfter - snrBefore
}

/**
 * Peak preservation: percentage of local extrema in the clean signal
 * that have a corresponding extremum (same type, within tolerance) in
 * the filtered output.
 */
function peakPreservation(clean, filtered) {
  const n = clean.length
  const range = Math.max(...clean) - Math.min(...clean)
  const tolerance = range * 0.15

  // Find significant extrema in the clean signal (skip tiny noise-scale wiggles)
  const minProminence = range * 0.02
  const peaks = []
  for (let i = 1; i < n - 1; i++) {
    const isMax = clean[i] > clean[i - 1] && clean[i] > clean[i + 1]
    const isMin = clean[i] < clean[i - 1] && clean[i] < clean[i + 1]
    if (!isMax && !isMin) continue
    // Check prominence: difference from neighbors must be meaningful
    const prominence = Math.min(
      Math.abs(clean[i] - clean[i - 1]),
      Math.abs(clean[i] - clean[i + 1]),
    )
    if (prominence >= minProminence) {
      peaks.push({ idx: i, isMax })
    }
  }

  if (peaks.length === 0) return 1

  const searchRadius = Math.max(10, Math.floor(n / 20))
  let preserved = 0

  for (const peak of peaks) {
    const start = Math.max(1, peak.idx - searchRadius)
    const end = Math.min(n - 2, peak.idx + searchRadius)
    let found = false

    for (let j = start; j <= end; j++) {
      // Check that filtered has an extremum of the same type here
      const filtIsMax = filtered[j] > filtered[j - 1] && filtered[j] > filtered[j + 1]
      const filtIsMin = filtered[j] < filtered[j - 1] && filtered[j] < filtered[j + 1]
      const sameType = peak.isMax ? filtIsMax : filtIsMin

      if (sameType && Math.abs(filtered[j] - clean[peak.idx]) < tolerance) {
        found = true
        break
      }
    }

    if (found) preserved++
  }

  return preserved / peaks.length
}

export function computeAllStats(clean, raw, filtered) {
  return {
    rmse: rmse(clean, filtered),
    mae: mae(clean, filtered),
    lag: phaseLag(clean, filtered),
    smoothness: smoothness(filtered),
    snr: snrImprovement(clean, raw, filtered),
    peaks: peakPreservation(clean, filtered),
  }
}
