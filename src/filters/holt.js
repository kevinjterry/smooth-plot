export const meta = {
  name: 'Double Exp. (Holt)',
  key: 'holt',
  causal: true,
  complexity: {
    rating: 1,
    bigO: 'O(n)',
    tooltip: '2 multiplies + 2 adds per sample, 2 stored values (level + trend). Barely more than EMA \u2014 ISR-safe at any rate.',
  },
  params: [
    { key: 'alpha', label: 'Alpha (level)', min: 0.01, max: 1, step: 0.01, default: 0.3 },
    { key: 'beta', label: 'Beta (trend)', min: 0.01, max: 1, step: 0.01, default: 0.1 },
  ],
}

export function apply(data, { alpha, beta }) {
  const result = new Array(data.length)

  let level = data[0]
  let trend = data.length > 1 ? data[1] - data[0] : 0
  result[0] = level

  for (let i = 1; i < data.length; i++) {
    const prevLevel = level
    level = alpha * data[i] + (1 - alpha) * (prevLevel + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    result[i] = level + trend
  }

  return result
}
