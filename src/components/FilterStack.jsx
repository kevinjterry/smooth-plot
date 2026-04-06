import { PlusIcon } from 'lucide-react'
import { Button } from './ui/button'
import FilterCard from './FilterCard'
import { MAX_FILTERS } from '../App'

export default function FilterStack({
  filters,
  expandedIndex,
  causalMode,
  onToggleExpand,
  onRemove,
  onTypeChange,
  onParamChange,
  onAdd,
}) {
  return (
    <div className="flex flex-col gap-2">
      {filters.map((filter, i) => (
        <FilterCard
          key={filter.id}
          filter={filter}
          colorIndex={i}
          isExpanded={expandedIndex === i}
          causalMode={causalMode}
          onToggle={() => onToggleExpand(i)}
          onRemove={() => onRemove(i)}
          onTypeChange={(type) => onTypeChange(i, type)}
          onParamChange={(key, value) => onParamChange(i, key, value)}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={filters.length >= MAX_FILTERS}
        className="w-full"
      >
        <PlusIcon data-icon="inline-start" className="size-3.5" />
        Add Filter
      </Button>
    </div>
  )
}
