export const meta = {
  name: '1-D Kalman',
  key: 'kalman',
  causal: true,
  complexity: {
    rating: 2,
    bigO: 'O(n)',
    tooltip: '~5 multiplies + 1 divide per sample, 3 stored values. The divide hurts \u2014 50\u2013100 cycles on MCUs without hardware divider. Still feasible at 64MHz.',
  },
  params: [
    { key: 'processNoise', label: 'Process Noise (Q)', min: 0.001, max: 10, step: 0.001, default: 0.1 },
    { key: 'measureNoise', label: 'Measurement Noise (R)', min: 0.001, max: 10, step: 0.001, default: 1 },
  ],
}

export function apply(data, { processNoise, measureNoise }) {
  const r = Math.max(measureNoise, 1e-10)
  const result = new Array(data.length)

  let estimatedValue = data[0]
  let estimationErrorCovariance = r
  result[0] = estimatedValue

  for (let i = 1; i < data.length; i++) {
    // Prediction update
    estimationErrorCovariance += processNoise

    // Measurement update
    const kalmanGain = estimationErrorCovariance / (estimationErrorCovariance + r)
    estimatedValue += kalmanGain * (data[i] - estimatedValue)
    estimationErrorCovariance = (1 - kalmanGain) * estimationErrorCovariance

    result[i] = estimatedValue
  }

  return result
}
