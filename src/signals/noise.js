/**
 * Seeded PRNG (mulberry32) + Box-Muller Gaussian noise.
 * Each dataset gets a fixed seed so noise is deterministic.
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

export function generateGaussianNoise(length, seed) {
  const rng = mulberry32(seed)
  const noise = new Array(length)
  for (let i = 0; i < length; i += 2) {
    const u1 = rng()
    const u2 = rng()
    const r = Math.sqrt(-2 * Math.log(u1 || 1e-10))
    noise[i] = r * Math.cos(2 * Math.PI * u2)
    if (i + 1 < length) {
      noise[i + 1] = r * Math.sin(2 * Math.PI * u2)
    }
  }
  return noise
}
