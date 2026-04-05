import { signalRegistry } from '../signals'
import { Slider } from './ui/slider'

export default function DatasetBar({ activeSignal, onSignalChange, noiseLevel, onNoiseChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3">
      <div className="flex flex-wrap gap-1.5">
        {signalRegistry.map((signal) => (
          <button
            key={signal.key}
            onClick={() => onSignalChange(signal.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeSignal === signal.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {signal.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Noise</span>
        <Slider
          className="w-32"
          min={0}
          max={100}
          step={1}
          value={[noiseLevel * 100]}
          onValueChange={([v]) => onNoiseChange(v / 100)}
        />
        <span className="w-8 text-right font-mono text-xs text-muted-foreground">
          {noiseLevel.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
