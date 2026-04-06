import { computeStats } from '../utils/stats'

export default function StatsBar({ rawData, filteredData, filterName }) {
  if (!filteredData) {
    return (
      <div className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
        No filter selected
      </div>
    )
  }

  const stats = computeStats(rawData, filteredData)

  return (
    <div className="border-t border-border px-5 py-3">
      <div className="flex items-baseline gap-6 text-sm">
        <span className="font-medium text-foreground">{filterName}</span>
        <div className="flex items-baseline gap-5 text-muted-foreground">
          <span>MSE <span className="ml-1 font-mono text-foreground">{stats.mse.toFixed(3)}</span></span>
          <span>MAE <span className="ml-1 font-mono text-foreground">{stats.mae.toFixed(3)}</span></span>
          <span>Max Dev <span className="ml-1 font-mono text-foreground">{stats.maxDev.toFixed(3)}</span></span>
        </div>
      </div>
    </div>
  )
}
