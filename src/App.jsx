import { useState, useMemo, useCallback } from 'react'
import { generateSignal, getBaseSignal } from './signals'
import { applyFilter, filterRegistry } from './filters'
import Chart from './components/Chart'
import DatasetBar from './components/DatasetBar'
import FilterStack from './components/FilterStack'
import CausalToggle from './components/CausalToggle'
import ComparisonTable from './components/ComparisonTable'

let nextFilterId = 1

function makeDefaultFilter() {
  const defaultType = filterRegistry[0].meta.key
  const defaultParams = {}
  for (const p of filterRegistry[0].meta.params) {
    defaultParams[p.key] = p.default
  }
  return { id: nextFilterId++, type: defaultType, params: defaultParams }
}

export default function App() {
  const [activeSignal, setActiveSignal] = useState('steady-climb')
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  const [noiseType, setNoiseType] = useState('gaussian')
  const [causalMode, setCausalMode] = useState(false)
  const [filters, setFilters] = useState(() => [makeDefaultFilter()])
  const [expandedIndex, setExpandedIndex] = useState(0)

  const baseSignal = useMemo(() => getBaseSignal(activeSignal), [activeSignal])

  const rawData = useMemo(
    () => generateSignal(activeSignal, noiseLevel, noiseType),
    [activeSignal, noiseLevel, noiseType],
  )

  const filteredSeries = useMemo(
    () =>
      filters.map((f) => {
        const meta = filterRegistry.find((r) => r.meta.key === f.type)?.meta
        return {
          key: `filter-${f.id}`,
          name: meta?.name ?? f.type,
          complexity: meta?.complexity,
          data: applyFilter(f.type, rawData, f.params, { causalMode }),
        }
      }),
    [filters, rawData, causalMode],
  )

  const handleAddFilter = useCallback(() => {
    setFilters((prev) => {
      if (prev.length >= 4) return prev
      return [...prev, makeDefaultFilter()]
    })
    setExpandedIndex((prev) => filters.length)
  }, [filters.length])

  const handleRemoveFilter = useCallback((index) => {
    setFilters((prev) => prev.filter((_, i) => i !== index))
    setExpandedIndex((prev) => {
      if (prev === index) return prev > 0 ? prev - 1 : 0
      if (prev > index) return prev - 1
      return prev
    })
  }, [])

  const handleTypeChange = useCallback((index, type) => {
    setFilters((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const meta = filterRegistry.find((r) => r.meta.key === type)?.meta
        const params = {}
        if (meta) {
          for (const p of meta.params) {
            params[p.key] = p.default
          }
        }
        return { ...f, type, params }
      }),
    )
  }, [])

  const handleParamChange = useCallback((index, key, value) => {
    setFilters((prev) =>
      prev.map((f, i) =>
        i !== index ? f : { ...f, params: { ...f.params, [key]: value } },
      ),
    )
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold tracking-tight">Signal Filter Visualizer</h1>
        <CausalToggle causalMode={causalMode} onToggle={setCausalMode} />
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[280px] shrink-0 border-r border-border p-3 overflow-y-auto">
          <FilterStack
            filters={filters}
            expandedIndex={expandedIndex}
            causalMode={causalMode}
            onToggleExpand={(i) => setExpandedIndex(i === expandedIndex ? -1 : i)}
            onRemove={handleRemoveFilter}
            onTypeChange={handleTypeChange}
            onParamChange={handleParamChange}
            onAdd={handleAddFilter}
          />
        </aside>

        {/* Main area */}
        <main className="flex flex-1 flex-col min-h-0 min-w-0">
          <Chart rawData={rawData} filteredSeries={filteredSeries} />
          <DatasetBar
            activeSignal={activeSignal}
            onSignalChange={setActiveSignal}
            noiseLevel={noiseLevel}
            onNoiseChange={setNoiseLevel}
            noiseType={noiseType}
            onNoiseTypeChange={setNoiseType}
          />
        </main>
      </div>

      <ComparisonTable
        baseSignal={baseSignal}
        rawData={rawData}
        filteredSeries={filteredSeries}
      />
    </div>
  )
}
