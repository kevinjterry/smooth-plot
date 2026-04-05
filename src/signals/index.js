import {
  steadyClimb, sharpSteps, outlierSpikes, noisySine,
  randomWalk, chirp, decayBump, plateauDrop,
} from './curves'
import { generateGaussianNoise } from './noise'

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

// Pre-generate base curves and noise arrays (once, on load)
const signalCache = new Map()

for (const entry of signalRegistry) {
  const base = entry.curve(entry.points)
  const noise = generateGaussianNoise(entry.points, entry.seed)
  signalCache.set(entry.key, { base, noise })
}

export function generateSignal(signalKey, noiseLevel) {
  const { base, noise } = signalCache.get(signalKey)
  return base.map((value, i) => value + noiseLevel * noise[i])
}
