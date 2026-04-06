export const meta = {
  name: '1-D Kalman',
  key: 'kalman',
  causal: true,
  params: [
    { key: 'processNoise', label: 'Process Noise (Q)', min: 0.001, max: 10, step: 0.001, default: 0.1 },
    { key: 'measureNoise', label: 'Measurement Noise (R)', min: 0.001, max: 10, step: 0.001, default: 1 },
  ],
}

export function apply(data, { processNoise, measureNoise }) {
  const result = new Array(data.length)

  let estimatedValue = data[0]
  let estimationErrorCovariance = measureNoise
  result[0] = estimatedValue

  for (let i = 1; i < data.length; i++) {
    // Prediction update
    estimationErrorCovariance += processNoise

    // Measurement update
    const kalmanGain = estimationErrorCovariance / (estimationErrorCovariance + measureNoise)
    estimatedValue += kalmanGain * (data[i] - estimatedValue)
    estimationErrorCovariance = (1 - kalmanGain) * estimationErrorCovariance

    result[i] = estimatedValue
  }

  return result
}
