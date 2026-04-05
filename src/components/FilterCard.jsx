import { ChevronDownIcon, XIcon } from 'lucide-react'
import { filterRegistry } from '../filters'
import { FILTER_COLORS } from './Chart'
import { Slider } from './ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select'

export default function FilterCard({
  filter,
  colorIndex,
  isExpanded,
  onToggle,
  onRemove,
  onTypeChange,
  onParamChange,
}) {
  const color = FILTER_COLORS[colorIndex % FILTER_COLORS.length]
  const filterMeta = filterRegistry.find((f) => f.meta.key === filter.type)?.meta

  return (
    <div
      className="rounded-lg border border-border overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="flex-1 text-left">{filterMeta?.name ?? 'Select filter'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="text-muted-foreground hover:text-foreground p-0.5 rounded"
        >
          <XIcon className="size-3.5" />
        </button>
        <ChevronDownIcon
          className={`size-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <Select value={filter.type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose filter…" />
            </SelectTrigger>
            <SelectContent>
              {filterRegistry.map((f) => (
                <SelectItem key={f.meta.key} value={f.meta.key}>
                  {f.meta.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filterMeta?.params.map((param) => {
            const dynamicMax = param.maxFn ? param.maxFn(filter.params) : param.max
            const currentValue = Math.min(filter.params[param.key] ?? param.default, dynamicMax)
            return (
              <div key={param.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">{param.label}</label>
                  <span className="font-mono text-xs text-muted-foreground">{currentValue}</span>
                </div>
                <Slider
                  min={param.min}
                  max={dynamicMax}
                  step={param.step}
                  value={[currentValue]}
                  onValueChange={([v]) => onParamChange(param.key, v)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
