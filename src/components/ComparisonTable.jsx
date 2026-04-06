import { useMemo } from 'react'
import { InfoIcon } from 'lucide-react'
import { computeAllStats } from '../utils/stats'
import { FILTER_COLORS } from './Chart'
import {
  Popover, PopoverContent, PopoverTrigger,
} from './ui/popover'

const COLUMNS = [
  {
    key: 'rmse',
    label: 'RMSE',
    tooltip: 'Root mean squared error vs. clean signal. Lower = more accurate overall.',
    format: (v) => v.toFixed(3),
    lowerIsBetter: true,
  },
  {
    key: 'mae',
    label: 'MAE',
    tooltip: 'Mean absolute error vs. clean signal. Less sensitive to outliers than RMSE.',
    format: (v) => v.toFixed(3),
    lowerIsBetter: true,
  },
  {
    key: 'lag',
    label: 'Lag',
    tooltip: 'Phase lag in samples. Shows the cost of causal/real-time filtering.',
    format: (v) => Math.abs(v).toString(),
    lowerIsBetter: true,
  },
  {
    key: 'smoothness',
    label: 'Smooth',
    tooltip: 'How aggressively noise was removed (0\u20131). Higher = smoother output.',
    format: (v) => v.toFixed(3),
    lowerIsBetter: false,
  },
  {
    key: 'snr',
    label: 'SNR (dB)',
    tooltip: 'Signal-to-noise improvement in dB. Positive = filter helped. Higher = better.',
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(1),
    lowerIsBetter: false,
  },
  {
    key: 'peaks',
    label: 'Peaks',
    tooltip: 'Percentage of clean-signal peaks preserved after filtering. Higher = better shape fidelity.',
    format: (v) => Math.round(v * 100) + '%',
    lowerIsBetter: false,
  },
]

function InfoTooltip({ text }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-1">
          <InfoIcon className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 text-xs">
        <p>{text}</p>
      </PopoverContent>
    </Popover>
  )
}

export default function ComparisonTable({ baseSignal, rawData, filteredSeries }) {
  const rows = useMemo(() => {
    return filteredSeries.map((series) => ({
      ...series,
      stats: computeAllStats(baseSignal, rawData, series.data),
    }))
  }, [baseSignal, rawData, filteredSeries])

  // Find best/worst per column
  const bestWorst = useMemo(() => {
    const result = {}
    for (const col of COLUMNS) {
      let bestIdx = 0
      let worstIdx = 0
      for (let i = 1; i < rows.length; i++) {
        const current = col.key === 'lag' ? Math.abs(rows[i].stats[col.key]) : rows[i].stats[col.key]
        const best = col.key === 'lag' ? Math.abs(rows[bestIdx].stats[col.key]) : rows[bestIdx].stats[col.key]
        const worst = col.key === 'lag' ? Math.abs(rows[worstIdx].stats[col.key]) : rows[worstIdx].stats[col.key]

        if (col.lowerIsBetter ? current < best : current > best) bestIdx = i
        if (col.lowerIsBetter ? current > worst : current < worst) worstIdx = i
      }
      result[col.key] = { bestIdx, worstIdx }
    }
    return result
  }, [rows])

  if (rows.length === 0) {
    return (
      <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
        No filters active
      </div>
    )
  }

  return (
    <div className="border-t border-border px-5 py-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pr-4 pb-1.5">Filter</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="text-right font-medium px-3 pb-1.5 whitespace-nowrap">
                {col.label}
                <InfoTooltip text={col.tooltip} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.key}>
              <td className="pr-4 py-1">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: FILTER_COLORS[rowIdx % FILTER_COLORS.length] }}
                  />
                  <span className="font-medium text-foreground truncate">{row.name}</span>
                </div>
              </td>
              {COLUMNS.map((col) => {
                const isBest = rows.length > 1 && bestWorst[col.key].bestIdx === rowIdx
                const isWorst = rows.length > 1 && bestWorst[col.key].worstIdx === rowIdx
                return (
                  <td
                    key={col.key}
                    className={`text-right font-mono px-3 py-1 whitespace-nowrap ${
                      isBest ? 'text-foreground font-semibold' : isWorst ? 'text-muted-foreground/50' : 'text-muted-foreground'
                    }`}
                  >
                    {col.format(row.stats[col.key])}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
