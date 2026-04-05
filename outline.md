# Signal Filter Visualizer — Project Outline

## Concept

A single-page React app for exploring how different smoothing/filtering
algorithms transform noisy data. The user picks a base signal, dials up noise,
selects one or more filters (up to 4), tweaks their parameters with sliders,
and watches the filtered curves update live on the same chart as the raw signal.

---

## Stack

- **React** (Vite scaffold)
- **Recharts** for plotting
- **shadcn/ui** (New York variant) for components
- **Tailwind CSS** for layout and custom styling

---

## 1. Signal Generator

Default **500 data points**. Each dataset can define its own natural length
(300–800) where appropriate — e.g. a spike train may be shorter so spikes
aren't lost in whitespace, a random walk benefits from more length.

Each signal is a deterministic base curve plus additive Gaussian noise whose
amplitude is controlled by a "Noise" slider (0 → clean, 1 → heavy).

### Base curves — designed to expose filter tradeoffs

The datasets are chosen so that each one makes at least one filter look great
and at least one filter struggle. This is the pedagogical core of the app.

| # | Curve              | Points | Description                                      | What it teaches                                         |
|---|---------------------|--------|--------------------------------------------------|---------------------------------------------------------|
| 1 | **Steady climb**    | 500    | Gentle linear upward trend                       | Baseline — most filters handle this well. Good for first impressions. |
| 2 | **Sharp steps**     | 400    | Piecewise-constant with 4–5 abrupt regime shifts | Median preserves edges; SMA/EMA smear them into ramps. Kalman depends on Q. |
| 3 | **Outlier spikes**  | 500    | Smooth slow sine with ~8 sharp transient spikes  | Median eats spikes cleanly; SMA/Gaussian just attenuate. Very dramatic. |
| 4 | **Noisy sine**      | 600    | Clean sine wave buried in noise                  | Classic denoising. Comparing SMA vs. Gaussian vs. S-G lag and shape fidelity. |
| 5 | **Random walk**     | 500    | Cumulative sum of noise (stock-price-ish)        | Nothing *should* be filtered — shows how aggressive smoothing distorts structure. Cautionary. |
| 6 | **Chirp**           | 800    | Sine with increasing frequency over time         | Fixed-window filters work on one end and fail on the other. Motivates adaptive methods. |
| 7 | **Decay + bump**    | 500    | Exponential decay with a Gaussian bump mid-way   | Tests whether filters preserve a transient feature vs. smoothing it away. S-G shines. |
| 8 | **Plateau & drop**  | 400    | Flat → gradual decline → flat                    | Tests edge preservation and lag. Kalman and median do well; SMA lags visibly. |

### Noise control

- Slider: `noiseLevel` 0.0 – 1.0
- Implementation: `signal[i] = base[i] + noiseLevel * noise[i]`
- **Fixed seed per dataset** — each dataset has a hardcoded seed that never
  changes. The noise array is generated once per dataset. The slider only
  scales the amplitude, so dragging it smoothly grows/shrinks the same bumps
  rather than jumping to a new random realization.

### Dataset selector UX

Datasets are selected via a **horizontal tab/chip bar below the chart**, not
in the sidebar. This keeps the sidebar focused on filter tuning and makes
switching datasets feel lightweight — like flipping channels.

```
┌─────────────────────────────────────────────────┐
│                   Chart                         │
├─────────────────────────────────────────────────┤
│ [Steady climb] [Sharp steps] [Outlier spikes]  │
│ [Noisy sine] [Random walk] [Chirp]             │
│ [Decay+bump] [Plateau & drop]                  │
│                                        Noise ━━│
└─────────────────────────────────────────────────┘
```

The noise slider also moves below the chart, next to the dataset chips,
since it's a property of the data — not the filters.

---

## 2. Filters

Each filter exposes 1–3 tunable parameters presented as labeled sliders with
sensible defaults and min/max bounds.

| Filter                        | Parameters                                         |
|-------------------------------|----------------------------------------------------|
| **Simple Moving Average**     | `windowSize` (3 – 101, odd)                        |
| **Exponential Moving Average**| `alpha` (0.01 – 1.0)                               |
| **Gaussian Window**           | `windowSize` (3 – 101), `sigma` (0.5 – 20)        |
| **Savitzky–Golay**            | `windowSize` (5 – 51, odd), `polyOrder` (1 – 5)   |
| **1-D Kalman**                | `processNoise Q` (0.001 – 10), `measureNoise R` (0.001 – 10) |
| **Median Filter**             | `windowSize` (3 – 51, odd)                         |
| ~~Butterworth (lowpass)~~     | _Deferred to v2 — needs IIR coeff math or DSP lib_ |

---

## 3. Multi-Filter Compare UX

Users can add up to **4 filters** simultaneously, each rendered as its own
colored line on the chart alongside the raw signal.

### Interaction model

1. App starts with one default filter (e.g. SMA).
2. **"+ Add Filter"** button appends a new filter card to the sidebar.
   - User picks the filter type from a dropdown in the new card.
3. Each filter is a **collapsible card** in the sidebar:
   - **Header row**: color swatch · filter name · ✕ remove button
   - **Body** (when expanded): type selector + parameter sliders
   - Clicking a card header expands it and collapses the others.
4. **All filters compute at all times** — curves never vanish/reappear.
   With ≤1000 points and ≤4 filters the computation is sub-millisecond.
5. The **stats bar** shows metrics for whichever filter card is currently
   expanded (the "focused" filter). A small label indicates which one.
6. Max 4 filters. The "+ Add Filter" button disables at the cap.

### Color palette

A fixed 4-color palette (e.g. blue, orange, green, violet) assigned in
order of creation. The raw signal is always a translucent gray.

### UI Layout

```
┌──────────────────────────────────────────────────────┐
│  Signal Filter Visualizer                            │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│ ┌────────┐ │         Recharts LineChart              │
│ │ SMA  ✕ │ │                                         │
│ │ window │ │   — raw (translucent gray)             │
│ │ [====] │ │   — filter 1 (blue, bold)              │
│ └────────┘ │   — filter 2 (orange)                  │
│ ┌────────┐ │   — filter 3 (green)                   │
│ │ EMA  ✕ │ │                                         │
│ └────────┘ │                                         │
│            │─────────────────────────────────────────│
│ [+ Add   ] │ [Steady climb] [Sharp steps] [Spikes]  │
│            │ [Noisy sine] [Random walk] [Chirp]      │
│            │ [Decay+bump] [Plateau]    Noise [━━━━]  │
├────────────┴─────────────────────────────────────────┤
│  Stats (SMA): MSE 0.42 | MAE 0.31 | Max 1.8 | Lag 5│
└──────────────────────────────────────────────────────┘
```

- Left panel: filter card stack only (~280 px)
- Main area: chart (flex-grow) with dataset chips + noise slider below
- Bottom bar: error metrics for the currently focused filter

---

## 4. Data Flow

```
signalType + noiseLevel
        │
        ▼
  generateSignal()  →  rawData[]
        │
        ├──────────────────────────────────┐
        ▼                                  ▼
  filters[0].type + params          filters[1].type + params   ...
        │                                  │
        ▼                                  ▼
  applyFilter() → filtered[0][]    applyFilter() → filtered[1][]
        │                                  │
        └──────────┬───────────────────────┘
                   ▼
        Recharts renders raw + all filtered series
        Stats bar shows metrics for the focused filter
```

All computation is synchronous and in the main thread — with ≤1000 points
and ≤4 filters the total work is well under a millisecond.

---

## 5. File Structure (proposed)

```
src/
  App.jsx                 # layout shell
  components/
    Chart.jsx             # Recharts wrapper, renders raw + N filter lines
    DatasetBar.jsx        # horizontal chip selector + noise slider (below chart)
    FilterCard.jsx        # single collapsible filter: type picker + param sliders
    FilterStack.jsx       # manages list of FilterCards + "Add Filter" button
    StatsBar.jsx          # error metrics for the focused filter
  signals/
    index.js              # registry + generateSignal()
    curves.js             # individual base-curve functions
    noise.js              # seeded Gaussian noise util
  filters/
    index.js              # registry + applyFilter()
    sma.js
    ema.js
    gaussian.js
    savitzkyGolay.js
    kalman.js
    median.js
    # butterworth.js      # v2 — requires DSP lib
  utils/
    stats.js              # MSE, MAE, max-dev, lag
```

---

## 6. Design Decisions (locked in)

These are finalized and should not be revisited during construction.

### Filter registry pattern

Each filter is a self-contained module exporting two things:

```js
// filters/sma.js
export const meta = {
  name: "Simple Moving Average",
  key: "sma",
  params: [
    { key: "windowSize", label: "Window Size", min: 3, max: 101, step: 2, default: 21 }
  ]
}
export function apply(data, { windowSize }) { /* ... returns number[] */ }
```

- `meta` drives the UI — `FilterCard` reads `meta.params` and renders a
  slider for each entry. No filter-specific UI code anywhere.
- `apply` signature is always `(number[], Record<string, number>) → number[]`.
- `filters/index.js` collects all modules into a `filterRegistry` array.
- **Adding a new filter = one new file + one import line.** Zero UI changes.

For inter-param constraints (e.g. Savitzky-Golay `polyOrder < windowSize`),
the param descriptor can specify `max` as a function of other param values.
The UI dynamically clamps — no error states, just smooth guardrails.

### Noise & seeding

- Each dataset has a **fixed, hardcoded seed**. It never changes.
- The noise array is generated once per dataset on load.
- The noise slider **scales amplitude only** (`base[i] + level * noise[i]`).
- This means dragging the slider smoothly grows/shrinks the same bumps.
- Switching datasets produces a different noise pattern (different seed).

### Chart behavior

- **Shared crosshair tooltip** — hover anywhere on the chart to see all
  values (raw + each active filter) at that x position.
- Raw signal rendered as **translucent gray**.
- Filter lines use a fixed 4-color palette: blue, orange, green, violet.
- **All filters compute at all times** — no lazy/deferred computation.
  Curves are always visible; collapsing a filter card doesn't hide its line.

### UI & Theming

**Stack**: shadcn/ui (New York variant) + Tailwind CSS.

**Theme**: Dark only (v1). No light mode toggle.

- **Chrome** (sidebar, stats bar, header): shadcn's default dark zinc/slate
  tones. Neutral and recessive — all visual weight goes to the chart.
- **Chart background**: slightly lighter than the sidebar to feel like the
  "stage." Approximately `hsl(220, 15%, 12%)` — barely cool-tinted, not
  pure gray.
- **Raw signal**: translucent gray (`rgba(160, 160, 170, 0.35)`), reads as
  "ground truth backdrop" without competing with filter lines.
- **Filter color palette** (4 colors, ~90° hue spacing for max distinction):
  1. Blue: `hsl(210, 90%, 60%)`
  2. Orange: `hsl(30, 90%, 60%)`
  3. Teal-green: `hsl(150, 70%, 50%)`
  4. Violet: `hsl(270, 70%, 65%)`
- **Accent**: use shadcn's default primary for interactive elements
  (+ Add Filter button, active dataset chip, focused slider thumb).

**Filter cards**: minimal / flat style. Subtle border (`border-border`),
no shadows. Cards feel like sections of the sidebar, not floating objects.
Each card gets a **left border** in its assigned filter color to visually
link it to its chart line. Collapsed cards show just the colored header bar;
expanded card shows the type selector and parameter sliders.

**Dataset chips**: pill-shaped, muted when inactive, filled with primary
accent when active. Sit in a horizontal wrap row below the chart.

**Slider styling**: use shadcn `Slider` component. The slider track/thumb
should be subtle (zinc tones) — the value is what matters, not the widget.
Current value displayed as a small monospace label beside the slider.

### Scope boundaries (v1)

- **Desktop only** — no responsive/mobile layout.
- **No Butterworth** — deferred until a DSP lib is introduced in v2.
- **No Web Workers** — data sizes are small enough for synchronous main-thread computation.
- **shadcn/ui (New York) + Tailwind** for all styling.

---

## 7. Open Questions / Future Ideas

- ~~**Compare mode**: overlay two different filters at once?~~ ✅ Built in (up to 4)
- **Frequency domain**: show a small FFT magnitude plot beside the main chart?
- **Export**: let the user download the filtered data as CSV?
- **Animation**: animate the filter "sweeping" across the signal point by point?
- **Presets**: save/load param snapshots for quick A/B comparison?

---

## 8. Next Steps

1. Scaffold the Vite + React project
2. Implement signal generation + noise
3. Build the first two filters (SMA, EMA) end-to-end with the chart
4. Add remaining filters one at a time
5. Polish UI, add stats bar, responsive layout
