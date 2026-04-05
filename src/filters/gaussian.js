export const meta = {
  name: 'Gaussian Window',
  key: 'gaussian',
  params: [
    { key: 'windowSize', label: 'Window Size', min: 3, max: 101, step: 2, default: 21 },
    { key: 'sigma', label: 'Sigma', min: 0.5, max: 20, step: 0.5, default: 5 },
  ],
}

export function apply(data, { windowSize, sigma }) {
  const halfWindow = Math.floor(windowSize / 2)
  const kernel = new Array(windowSize)
  let kernelSum = 0
  for (let j = 0; j < windowSize; j++) {
    const x = j - halfWindow
    kernel[j] = Math.exp(-(x * x) / (2 * sigma * sigma))
    kernelSum += kernel[j]
  }
  for (let j = 0; j < windowSize; j++) {
    kernel[j] /= kernelSum
  }

  const result = new Array(data.length)
  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let weightSum = 0
    for (let j = 0; j < windowSize; j++) {
      const idx = i + j - halfWindow
      if (idx >= 0 && idx < data.length) {
        sum += data[idx] * kernel[j]
        weightSum += kernel[j]
      }
    }
    result[i] = sum / weightSum
  }
  return result
}
