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

const COST_TOOLTIP = 'At 500 points in a browser, all filters are instant. This rating reflects real-world cost on resource-constrained systems \u2014 e.g. a 32-bit MCU at 64MHz with no FPU, running a filter in a real-time sample loop.'

function costDots(rating) {
  const filled = Math.min(rating, 5)
  const empty = 5 - filled
  return '\u25CF'.repeat(filled) + '\u25CB'.repeat(empty)
}

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

function CostCell({ complexity }) {
  if (!complexity) return <td className="text-right px-3 py-1 text-muted-foreground/50">&mdash;</td>

  return (
    <td className="text-right px-3 py-1 whitespace-nowrap">
      <Popover>
        <PopoverTrigger asChild>
          <button className="font-mono text-muted-foreground tracking-wider hover:text-foreground transition-colors cursor-help">
            {costDots(complexity.rating)}
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-72 text-xs space-y-1.5">
          <p className="font-medium text-foreground">{complexity.bigO}</p>
          <p className="text-muted-foreground">{complexity.tooltip}</p>
        </PopoverContent>
      </Popover>
    </td>
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
          <tr className="text-muted-foreground border-b border-border">
            <th className="text-left font-medium pr-4 pb-2">Filter</th>
            {COLUMNS.map((col) => (
              <th key={col.key} className="text-right font-medium px-3 pb-2 whitespace-nowrap">
                {col.label}
                <InfoTooltip text={col.tooltip} />
              </th>
            ))}
            <th className="text-right font-medium px-3 pb-2 whitespace-nowrap">
              Cost
              <InfoTooltip text={COST_TOOLTIP} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.key} className={rowIdx % 2 === 1 ? 'bg-muted/30' : ''}>
              <td className="pr-4 py-1.5">
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
                    className={`text-right font-mono tabular-nums px-3 py-1.5 whitespace-nowrap ${
                      isBest ? 'text-foreground font-semibold' : isWorst ? 'text-muted-foreground/40' : 'text-muted-foreground'
                    }`}
                  >
                    {isBest && <span className="text-amber-400 mr-1">&#9733;</span>}
                    {col.format(row.stats[col.key])}
                  </td>
                )
              })}
              <CostCell complexity={row.complexity} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
