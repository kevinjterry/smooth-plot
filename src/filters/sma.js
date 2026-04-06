export const meta = {
  name: 'Simple Moving Average',
  key: 'sma',
  causal: true,
  complexity: {
    rating: 2,
    bigO: 'O(n)',
    tooltip: 'Running-sum trick: 1 add + 1 subtract per sample. Requires a w-sample circular buffer in RAM (w=101 \u2192 400 bytes of float32).',
  },
  params: [
    { key: 'windowSize', label: 'Window Size', min: 3, max: 101, step: 2, default: 21 },
  ],
}

export function apply(data, { windowSize }) {
  const result = new Array(data.length)

  for (let i = 0; i < data.length; i++) {
    let sum = 0
    const start = Math.max(0, i - windowSize + 1)
    for (let j = start; j <= i; j++) {
      sum += data[j]
    }
    result[i] = sum / (i - start + 1)
  }
  return result
}
