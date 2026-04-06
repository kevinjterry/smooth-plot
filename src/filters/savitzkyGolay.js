export const meta = {
  name: 'Savitzky\u2013Golay',
  key: 'savitzky-golay',
  causal: false,
  params: [
    { key: 'windowSize', label: 'Window Size', min: 5, max: 51, step: 2, default: 11 },
    { key: 'polyOrder', label: 'Polynomial Order', min: 1, max: 5, step: 1, default: 3,
      maxFn: (params) => params.windowSize - 1,
    },
  ],
}

/**
 * Compute S-G convolution coefficients via least-squares polynomial fitting.
 * When causal=true, the evaluation point is the last sample in the window (trailing).
 * When causal=false, the evaluation point is the center of the window (centered).
 */
function computeCoefficients(windowSize, polyOrder, causal) {
  const order = Math.min(polyOrder, windowSize - 1)
  // evalIndex: which position in the window we evaluate the polynomial at
  const evalIndex = causal ? windowSize - 1 : Math.floor(windowSize / 2)

  const rows = windowSize
  const cols = order + 1
  const A = []
  for (let i = 0; i < rows; i++) {
    const x = i - evalIndex
    const row = new Array(cols)
    row[0] = 1
    for (let j = 1; j < cols; j++) {
      row[j] = row[j - 1] * x
    }
    A.push(row)
  }

  // A^T A
  const ATA = Array.from({ length: cols }, () => new Array(cols).fill(0))
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0
      for (let k = 0; k < rows; k++) {
        sum += A[k][i] * A[k][j]
      }
      ATA[i][j] = sum
    }
  }

  // Gaussian elimination to invert ATA
  const augmented = ATA.map((row, i) => {
    const extra = new Array(cols).fill(0)
    extra[i] = 1
    return [...row, ...extra]
  })

  for (let col = 0; col < cols; col++) {
    let maxRow = col
    for (let row = col + 1; row < cols; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]]

    const pivot = augmented[col][col]
    if (Math.abs(pivot) < 1e-12) continue
    for (let j = col; j < 2 * cols; j++) {
      augmented[col][j] /= pivot
    }
    for (let row = 0; row < cols; row++) {
      if (row === col) continue
      const factor = augmented[row][col]
      for (let j = col; j < 2 * cols; j++) {
        augmented[row][j] -= factor * augmented[col][j]
      }
    }
  }

  const ATAinv = augmented.map((row) => row.slice(cols))

  // Coefficients = row 0 of (A^T A)^-1 A^T
  const coeffs = new Array(rows)
  for (let k = 0; k < rows; k++) {
    let sum = 0
    for (let j = 0; j < cols; j++) {
      sum += ATAinv[0][j] * A[k][j]
    }
    coeffs[k] = sum
  }

  return coeffs
}

export function apply(data, { windowSize, polyOrder }, { causalMode } = {}) {
  const clampedOrder = Math.min(polyOrder, windowSize - 1)
  const coeffs = computeCoefficients(windowSize, clampedOrder, causalMode)
  // offset: how far back the window starts relative to the current point
  const offset = causalMode ? windowSize - 1 : Math.floor(windowSize / 2)
  const result = new Array(data.length)

  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let weightSum = 0
    for (let j = 0; j < windowSize; j++) {
      const idx = i + j - offset
      if (idx >= 0 && idx < data.length) {
        sum += coeffs[j] * data[idx]
        weightSum += coeffs[j]
      }
    }
    result[i] = sum / weightSum
  }

  return result
}
