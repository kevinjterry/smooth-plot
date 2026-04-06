export const meta = {
  name: 'Exponential Moving Average',
  key: 'ema',
  causal: true,
  params: [
    { key: 'alpha', label: 'Alpha (smoothing)', min: 0.01, max: 1, step: 0.01, default: 0.1 },
  ],
}

export function apply(data, { alpha }) {
  const result = new Array(data.length)
  result[0] = data[0]
  for (let i = 1; i < data.length; i++) {
    result[i] = alpha * data[i] + (1 - alpha) * result[i - 1]
  }
  return result
}
