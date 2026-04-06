export const meta = {
  name: 'Exponential Moving Average',
  key: 'ema',
  causal: true,
  complexity: {
    rating: 1,
    bigO: 'O(n)',
    tooltip: '1 multiply + 1 add, 1 stored value. Runs in an ISR at any sample rate. The cheapest real filter.',
  },
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
