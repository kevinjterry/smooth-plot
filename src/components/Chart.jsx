import { useState, useCallback, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
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
  const [zoomArea, setZoomArea] = useState({ x1: null, x2: null })
  const [zoomDomain, setZoomDomain] = useState(null)
  const isDragging = useRef(false)
  const zoomAreaRef = useRef(zoomArea)
  zoomAreaRef.current = zoomArea

  const chartData = rawData.map((value, i) => {
    const point = { index: i, raw: value }
    filteredSeries.forEach((series) => {
      point[series.key] = series.data[i]
    })
    return point
  })

  const chartKey = filteredSeries.map((s) => s.key).join(',')

  const handleMouseDown = useCallback((e) => {
    if (!e?.activeLabel && e?.activeLabel !== 0) return
    isDragging.current = true
    setZoomArea({ x1: e.activeLabel, x2: null })
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || (!e?.activeLabel && e?.activeLabel !== 0)) return
    setZoomArea((prev) => ({ ...prev, x2: e.activeLabel }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    const { x1, x2 } = zoomAreaRef.current
    if (x1 !== null && x2 !== null && x1 !== x2) {
      const left = Math.min(x1, x2)
      const right = Math.max(x1, x2)
      if (right - left >= 5) {
        setZoomDomain([left, right])
      }
    }
    setZoomArea({ x1: null, x2: null })
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoomDomain(null)
  }, [])

  const xDomain = zoomDomain || [0, rawData.length - 1]
  const isZoomed = zoomDomain !== null

  return (
    <div className="relative h-full w-full">
      {isZoomed && (
        <button
          onClick={handleResetZoom}
          className="absolute top-2 right-6 z-10 rounded px-2 py-0.5 text-[10px] font-medium bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Reset zoom
        </button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          key={chartKey}
          data={chartData}
          margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="index"
            type="number"
            domain={xDomain}
            allowDataOverflow
            tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(0,0%,50%)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            position={{ x: 60, y: 8 }}
            wrapperStyle={{ pointerEvents: 'none' }}
          />
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
          {zoomArea.x1 !== null && zoomArea.x2 !== null && (
            <ReferenceArea
              x1={zoomArea.x1}
              x2={zoomArea.x2}
              strokeOpacity={0.3}
              fill="hsl(210, 80%, 60%)"
              fillOpacity={0.15}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { FILTER_COLORS }
