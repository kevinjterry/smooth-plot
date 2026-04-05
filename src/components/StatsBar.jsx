import { computeStats } from '../utils/stats'

export default function StatsBar({ rawData, filteredData, filterName }) {
  if (!filteredData) {
    return (
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        No filter selected
      </div>
    )
  }

  const stats = computeStats(rawData, filteredData)

  return (
    <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex items-center gap-4">
      <span className="font-medium text-foreground">Stats ({filterName})</span>
      <span>MSE <span className="font-mono">{stats.mse.toFixed(3)}</span></span>
      <span>MAE <span className="font-mono">{stats.mae.toFixed(3)}</span></span>
      <span>Max <span className="font-mono">{stats.maxDev.toFixed(3)}</span></span>
    </div>
  )
}
