export const meta = {
  name: 'Median Filter',
  key: 'median',
  params: [
    { key: 'windowSize', label: 'Window Size', min: 3, max: 51, step: 2, default: 11 },
  ],
}

export function apply(data, { windowSize }) {
  const halfWindow = Math.floor(windowSize / 2)
  const result = new Array(data.length)

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - halfWindow)
    const end = Math.min(data.length - 1, i + halfWindow)
    const window = []
    for (let j = start; j <= end; j++) {
      window.push(data[j])
    }
    window.sort((a, b) => a - b)
    const mid = Math.floor(window.length / 2)
    result[i] = window.length % 2 === 0
      ? (window[mid - 1] + window[mid]) / 2
      : window[mid]
  }

  return result
}
