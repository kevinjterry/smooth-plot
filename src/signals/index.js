import {
  steadyClimb, sharpSteps, outlierSpikes, noisySine,
  randomWalk, chirp, decayBump, plateauDrop,
} from './curves'
import { generateNoise, noiseTypes } from './noise'

export { noiseTypes }

export const signalRegistry = [
  { key: 'steady-climb',    label: 'Steady climb',    points: 500, seed: 42,   curve: steadyClimb },
  { key: 'sharp-steps',     label: 'Sharp steps',     points: 400, seed: 137,  curve: sharpSteps },
  { key: 'outlier-spikes',  label: 'Outlier spikes',  points: 500, seed: 256,  curve: outlierSpikes },
  { key: 'noisy-sine',      label: 'Noisy sine',      points: 600, seed: 789,  curve: noisySine },
  { key: 'random-walk',     label: 'Random walk',     points: 500, seed: 1024, curve: randomWalk },
  { key: 'chirp',           label: 'Chirp',           points: 800, seed: 555,  curve: chirp },
  { key: 'decay-bump',      label: 'Decay + bump',    points: 500, seed: 333,  curve: decayBump },
  { key: 'plateau-drop',    label: 'Plateau & drop',  points: 400, seed: 901,  curve: plateauDrop },
]

// Pre-generate base curves (once, on load)
const baseCache = new Map()
for (const entry of signalRegistry) {
  baseCache.set(entry.key, entry.curve(entry.points))
}

// Lazily cache noise arrays per (dataset, noiseType) pair
const noiseCache = new Map()

function getNoise(signalKey, noiseType) {
  const cacheKey = `${signalKey}:${noiseType}`
  if (!noiseCache.has(cacheKey)) {
    const entry = signalRegistry.find((s) => s.key === signalKey)
    noiseCache.set(cacheKey, generateNoise(entry.points, entry.seed, noiseType))
  }
  return noiseCache.get(cacheKey)
}

export function generateSignal(signalKey, noiseLevel, noiseType = 'gaussian') {
  const base = baseCache.get(signalKey)
  const noise = getNoise(signalKey, noiseType)
  return base.map((value, i) => value + noiseLevel * noise[i])
}
