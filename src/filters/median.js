export const meta = {
  name: 'Median Filter',
  key: 'median',
  causal: false,
  complexity: {
    rating: 3,
    bigO: 'O(n\u00b7w log w)',
    tooltip: 'Sort per window, or O(n\u00b7log w) with running median heaps. Heap operations involve branching and pointer chasing \u2014 poor on simple pipelines. Impractical above ~1kHz with large windows on low-end MCUs.',
  },
  params: [
    { key: 'windowSize', label: 'Window Size', min: 3, max: 51, step: 2, default: 11 },
  ],
}

export function apply(data, { windowSize }, { causalMode } = {}) {
  const result = new Array(data.length)

  for (let i = 0; i < data.length; i++) {
    let start, end
    if (causalMode) {
      start = Math.max(0, i - windowSize + 1)
      end = i
    } else {
      const halfWindow = Math.floor(windowSize / 2)
      start = Math.max(0, i - halfWindow)
      end = Math.min(data.length - 1, i + halfWindow)
    }

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
