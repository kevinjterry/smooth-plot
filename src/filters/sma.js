export const meta = {
  name: 'Simple Moving Average',
  key: 'sma',
  params: [
    { key: 'windowSize', label: 'Window Size', min: 3, max: 101, step: 2, default: 21 },
  ],
}

export function apply(data, { windowSize }) {
  const result = new Array(data.length)
  const halfWindow = Math.floor(windowSize / 2)

  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let count = 0
    const start = Math.max(0, i - halfWindow)
    const end = Math.min(data.length - 1, i + halfWindow)
    for (let j = start; j <= end; j++) {
      sum += data[j]
      count++
    }
    result[i] = sum / count
  }
  return result
}
