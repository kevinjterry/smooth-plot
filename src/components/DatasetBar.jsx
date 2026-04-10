import { signalRegistry, noiseTypes } from '../signals'
import { Slider } from './ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select'

export default function DatasetBar({
  activeSignal, onSignalChange,
  noiseLevel, onNoiseChange,
  noiseType, onNoiseTypeChange,
  noiseSpeed, onNoiseSpeedChange,
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex flex-wrap gap-2">
        {signalRegistry.map((signal) => (
          <button
            key={signal.key}
            onClick={() => onSignalChange(signal.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeSignal === signal.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {signal.label}
          </button>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Noise</span>
          <Select value={noiseType} onValueChange={onNoiseTypeChange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noiseTypes.map((nt) => (
                <SelectItem key={nt.key} value={nt.key}>
                  {nt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-medium text-muted-foreground">Level</span>
          <Slider
            className="flex-1 max-w-[200px]"
            min={0}
            max={100}
            step={1}
            value={[noiseLevel * 100]}
            onValueChange={([v]) => onNoiseChange(v / 100)}
          />
          <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {noiseLevel.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-medium text-muted-foreground">Speed</span>
          <Slider
            className="flex-1 max-w-[200px]"
            min={0}
            max={100}
            step={1}
            value={[noiseSpeed * 100]}
            onValueChange={([v]) => onNoiseSpeedChange(v / 100)}
          />
          <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
            {noiseSpeed.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
