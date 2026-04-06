import { useState, useMemo, useCallback, useRef } from 'react'
import { generateSignal, getBaseSignal } from './signals'
import { applyFilter, filterRegistry } from './filters'
import Chart from './components/Chart'
import DatasetBar from './components/DatasetBar'
import FilterStack from './components/FilterStack'
import CausalToggle from './components/CausalToggle'
import ComparisonTable from './components/ComparisonTable'

export const MAX_FILTERS = 4

export default function App() {
  const nextFilterId = useRef(1)

  function makeDefaultFilter() {
    const defaultType = filterRegistry[0].meta.key
    const defaultParams = {}
    for (const p of filterRegistry[0].meta.params) {
      defaultParams[p.key] = p.default
    }
    return { id: nextFilterId.current++, type: defaultType, params: defaultParams }
  }
  const [activeSignal, setActiveSignal] = useState('steady-climb')
  const [noiseLevel, setNoiseLevel] = useState(0.3)
  const [noiseType, setNoiseType] = useState('gaussian')
  const [causalMode, setCausalMode] = useState(true)
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
      if (prev.length >= MAX_FILTERS) return prev
      const next = [...prev, makeDefaultFilter()]
      setExpandedIndex(next.length - 1)
      return next
    })
  }, [])

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
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[280px] shrink-0 border-r border-border p-3 overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Signal Filter Visualizer
            </h1>
            <div className="mt-2.5">
              <CausalToggle causalMode={causalMode} onToggle={setCausalMode} />
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            Filters
          </span>
          <div className="mt-2">
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
          </div>
        </aside>

        {/* Main area */}
        <main className="flex flex-1 flex-col min-h-0 min-w-0 p-3">
          <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden">
            <Chart rawData={rawData} filteredSeries={filteredSeries} />
          </div>
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
