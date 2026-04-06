import { InfoIcon } from 'lucide-react'
import { Switch } from './ui/switch'
import {
  Popover, PopoverContent, PopoverHeader, PopoverTitle,
  PopoverDescription, PopoverTrigger,
} from './ui/popover'

export default function CausalToggle({ causalMode, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        size="sm"
        checked={causalMode}
        onCheckedChange={onToggle}
      />
      <span className="text-xs font-medium text-muted-foreground">
        Causal only
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <InfoIcon className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-80">
          <PopoverHeader>
            <PopoverTitle>Causal vs. Non-causal filters</PopoverTitle>
          </PopoverHeader>
          <PopoverDescription>
            A <strong>causal</strong> filter only uses current and past data points
            — it can run in real time. SMA, EMA, and Kalman are naturally causal.
          </PopoverDescription>
          <PopoverDescription>
            A <strong>non-causal</strong> filter also looks at future data points
            (centered window). Savitzky-Golay, Gaussian, and Median are non-causal
            by default — better results, but requires the full dataset upfront.
          </PopoverDescription>
          <PopoverDescription>
            Toggle <strong>"Causal mode"</strong> to force all filters into real-time
            behavior and see the tradeoff.
          </PopoverDescription>
        </PopoverContent>
      </Popover>
    </div>
  )
}
