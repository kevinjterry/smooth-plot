/**
 * Seeded PRNG (mulberry32) + multiple noise distributions.
 * Each (dataset, noiseType) pair gets a fixed seed so noise is deterministic.
 */

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Box-Muller: returns a standard normal sample */
function gaussianSample(rng) {
  const u1 = rng() || 1e-10
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Gaussian — standard normal, the default baseline.
 */
function generateGaussian(length, rng) {
  const noise = new Array(length)
  for (let i = 0; i < length; i++) {
    noise[i] = gaussianSample(rng)
  }
  return noise
}

/**
 * Heavy-tailed — Cauchy distribution via ratio of two normals.
 * Produces frequent large outliers that punish mean-based filters.
 */
function generateHeavyTailed(length, rng) {
  const noise = new Array(length)
  for (let i = 0; i < length; i++) {
    const x = gaussianSample(rng)
    const y = gaussianSample(rng)
    // Cauchy = N(0,1) / N(0,1), clamp to avoid extreme chart-breaking values
    const raw = x / (Math.abs(y) + 0.01)
    noise[i] = Math.max(-8, Math.min(8, raw))
  }
  return noise
}

/**
 * Bursty — quiet periods interrupted by sudden noisy bursts.
 * Gaussian noise with amplitude that alternates between low and high.
 */
function generateBursty(length, rng) {
  const noise = new Array(length)
  const burstProbability = 0.15
  let inBurst = false
  let burstCountdown = 0

  for (let i = 0; i < length; i++) {
    if (burstCountdown <= 0) {
      inBurst = rng() < burstProbability
      burstCountdown = inBurst
        ? Math.floor(rng() * 30) + 10   // burst lasts 10–40 points
        : Math.floor(rng() * 60) + 20   // quiet lasts 20–80 points
    }
    burstCountdown--

    const amplitude = inBurst ? 3.0 : 0.15
    noise[i] = gaussianSample(rng) * amplitude
  }
  return noise
}

/**
 * Heteroscedastic — amplitude ramps up over time.
 * Any fixed-parameter filter is tuned wrong for half the signal.
 */
function generateHeteroscedastic(length, rng) {
  const noise = new Array(length)
  for (let i = 0; i < length; i++) {
    const t = i / length
    const amplitude = 0.2 + 2.5 * t
    noise[i] = gaussianSample(rng) * amplitude
  }
  return noise
}

export const noiseTypes = [
  { key: 'gaussian',        label: 'Gaussian' },
  { key: 'heavy-tailed',    label: 'Heavy-tailed' },
  { key: 'bursty',          label: 'Bursty' },
  { key: 'heteroscedastic', label: 'Heteroscedastic' },
]

const generators = {
  'gaussian': generateGaussian,
  'heavy-tailed': generateHeavyTailed,
  'bursty': generateBursty,
  'heteroscedastic': generateHeteroscedastic,
}

/**
 * Generate a noise array for a given length, seed, and noise type.
 * The seed is further offset by noise type to ensure different realizations.
 */
export function generateNoise(length, seed, noiseType = 'gaussian') {
  const typeOffset = { 'gaussian': 0, 'heavy-tailed': 7919, 'bursty': 15373, 'heteroscedastic': 23197 }
  const rng = mulberry32(seed + (typeOffset[noiseType] ?? 0))
  return generators[noiseType](length, rng)
}

/**
 * Smooth a noise array with a 1D Gaussian kernel to control bandwidth.
 * sigma controls smoothing strength: 0 = no change, 15 = heavy smoothing.
 * Returns a new array — never mutates the input.
 */
export function smoothNoise(noise, sigma) {
  if (sigma < 0.5) return noise

  const radius = Math.ceil(3 * sigma)
  const kernelSize = 2 * radius + 1
  const kernel = new Array(kernelSize)
  let kernelSum = 0
  for (let j = 0; j < kernelSize; j++) {
    const x = j - radius
    kernel[j] = Math.exp(-(x * x) / (2 * sigma * sigma))
    kernelSum += kernel[j]
  }
  for (let j = 0; j < kernelSize; j++) {
    kernel[j] /= kernelSum
  }

  const result = new Array(noise.length)
  for (let i = 0; i < noise.length; i++) {
    let sum = 0
    for (let j = 0; j < kernelSize; j++) {
      const idx = Math.max(0, Math.min(noise.length - 1, i + j - radius))
      sum += noise[idx] * kernel[j]
    }
    result[i] = sum
  }
  return result
}
