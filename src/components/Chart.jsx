import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const FILTER_COLORS = [
  'hsl(210, 90%, 60%)',
  'hsl(30, 90%, 60%)',
  'hsl(150, 70%, 50%)',
  'hsl(270, 70%, 65%)',
]

const RAW_COLOR = 'rgba(160, 160, 170, 0.35)'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 text-muted-foreground">Index: {label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(3)}
        </p>
      ))}
    </div>
  )
}

export default function Chart({ rawData, filteredSeries }) {
  const chartData = rawData.map((value, i) => {
    const point = { index: i, raw: value }
    filteredSeries.forEach((series) => {
      point[series.key] = series.data[i]
    })
    return point
  })

  // Recharts doesn't reliably render dynamically added <Line> children.
  // Keying the chart on the series keys forces a remount when lines are added/removed.
  const chartKey = filteredSeries.map((s) => s.key).join(',')

  return (
    <div className="flex-1 min-h-0" style={{ backgroundColor: 'hsl(220, 15%, 12%)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart key={chartKey} data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="index"
            tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="raw"
            name="Raw"
            stroke={RAW_COLOR}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          {filteredSeries.map((series, i) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.name}
              stroke={FILTER_COLORS[i % FILTER_COLORS.length]}
              strokeWidth={i === 0 ? 2 : 1.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { FILTER_COLORS }
