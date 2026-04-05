export const meta = {
  name: 'Savitzky–Golay',
  key: 'savitzky-golay',
  params: [
    { key: 'windowSize', label: 'Window Size', min: 5, max: 51, step: 2, default: 11 },
    { key: 'polyOrder', label: 'Polynomial Order', min: 1, max: 5, step: 1, default: 3,
      maxFn: (params) => params.windowSize - 1,
    },
  ],
}

/**
 * Compute S-G convolution coefficients via least-squares polynomial fitting.
 * Solves (A^T A) c = A^T e_0 where A is the Vandermonde matrix for the window
 * and e_0 picks the smoothed value at the center point.
 */
function computeCoefficients(windowSize, polyOrder) {
  const halfWindow = Math.floor(windowSize / 2)
  const order = Math.min(polyOrder, windowSize - 1)

  // Build Vandermonde matrix A (windowSize x (order+1))
  const rows = windowSize
  const cols = order + 1
  const A = []
  for (let i = 0; i < rows; i++) {
    const x = i - halfWindow
    const row = new Array(cols)
    row[0] = 1
    for (let j = 1; j < cols; j++) {
      row[j] = row[j - 1] * x
    }
    A.push(row)
  }

  // Compute A^T A
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

  // Compute A^T e (where e is each row's identity — we want the 0th polynomial coeff)
  // A^T's first column dotted with identity = A^T column for each data point
  // Actually we need (A^T A)^-1 A^T, and we only need row 0 of that result.
  // Solve (A^T A) x = A^T[:, k] for each k, take x[0] as the coefficient.

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

  // Extract inverse
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

export function apply(data, { windowSize, polyOrder }) {
  const clampedOrder = Math.min(polyOrder, windowSize - 1)
  const coeffs = computeCoefficients(windowSize, clampedOrder)
  const halfWindow = Math.floor(windowSize / 2)
  const result = new Array(data.length)

  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let weightSum = 0
    for (let j = 0; j < windowSize; j++) {
      const idx = i + j - halfWindow
      if (idx >= 0 && idx < data.length) {
        sum += coeffs[j] * data[idx]
        weightSum += coeffs[j]
      }
    }
    result[i] = sum / weightSum
  }

  return result
}
