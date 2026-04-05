export function steadyClimb(n = 500) {
  const data = new Array(n)
  for (let i = 0; i < n; i++) {
    data[i] = i / n * 10
  }
  return data
}

export function sharpSteps(n = 400) {
  const data = new Array(n)
  const levels = [2, 7, 3, 9, 5]
  const segmentLength = Math.floor(n / levels.length)
  for (let i = 0; i < n; i++) {
    const segment = Math.min(Math.floor(i / segmentLength), levels.length - 1)
    data[i] = levels[segment]
  }
  return data
}

export function outlierSpikes(n = 500) {
  const data = new Array(n)
  const spikePositions = [62, 125, 188, 250, 312, 375, 438, 470]
  for (let i = 0; i < n; i++) {
    data[i] = 3 * Math.sin(2 * Math.PI * i / n * 2)
    if (spikePositions.includes(i)) {
      data[i] += (i % 2 === 0 ? 1 : -1) * 8
    }
  }
  return data
}

export function noisySine(n = 600) {
  const data = new Array(n)
  for (let i = 0; i < n; i++) {
    data[i] = 5 * Math.sin(2 * Math.PI * i / n * 3)
  }
  return data
}

export function randomWalk(n = 500) {
  // Use a simple deterministic walk based on a sin-hash
  const data = new Array(n)
  data[0] = 0
  for (let i = 1; i < n; i++) {
    const step = Math.sin(i * 12.9898) * 43758.5453
    data[i] = data[i - 1] + (step - Math.floor(step)) - 0.5
  }
  return data
}

export function chirp(n = 800) {
  const data = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const frequency = 1 + 15 * t
    data[i] = 5 * Math.sin(2 * Math.PI * frequency * t)
  }
  return data
}

export function decayBump(n = 500) {
  const data = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const decay = 8 * Math.exp(-3 * t)
    const bump = 4 * Math.exp(-((t - 0.5) ** 2) / 0.005)
    data[i] = decay + bump
  }
  return data
}

export function plateauDrop(n = 400) {
  const data = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    if (t < 0.3) {
      data[i] = 8
    } else if (t < 0.7) {
      data[i] = 8 - 6 * ((t - 0.3) / 0.4)
    } else {
      data[i] = 2
    }
  }
  return data
}
