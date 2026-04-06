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

### Noise type selector

A dropdown (or small chip group) next to the noise slider selects the noise
distribution. This is critical for exposing filter differences — fixed
Gaussian noise is SMA's best case and makes every filter look roughly equal.

| Noise type          | Description                                        | What it exposes                                      |
|---------------------|----------------------------------------------------|------------------------------------------------------|
| **Gaussian**        | Standard normal, fixed amplitude. The default.     | Baseline. SMA does well here — fair comparison.      |
| **Heavy-tailed**    | Cauchy or Laplace distribution. Frequent outliers.  | SMA averages outliers in; median rejects them cleanly. Kalman depends on R. Dramatic difference. |
| **Bursty**          | Intermittent — quiet periods with sudden noisy bursts. | Fixed-window filters over-smooth quiet sections OR under-smooth bursts. Kalman adapts. |
| **Heteroscedastic** | Amplitude ramps up over time (or oscillates).      | Any fixed-parameter filter is tuned wrong for half the signal. Motivates adaptive/Kalman approaches. |

The noise type affects how `noise[i]` is generated but the amplitude slider
still scales it uniformly. Seeding behavior stays the same — each
(dataset, noiseType) pair has a deterministic realization.

### Dataset selector UX

Datasets are selected via a **horizontal tab/chip bar below the chart**, not
in the sidebar. This keeps the sidebar focused on filter tuning and makes
switching datasets feel lightweight — like flipping channels.

```
┌─────────────────────────────────────────────────┐
│                   Chart                         │
├─────────────────────────────────────────────────┤
│ [Steady climb] [Sharp steps] [Outlier spikes]  │
│ [Noisy sine] [Random walk] [Chirp] ...         │
│                                                 │
│ Noise: [Gaussian ▾]            Level [━━━━━━]  │
└─────────────────────────────────────────────────┘
```

The noise type dropdown and amplitude slider sit below the dataset chips,
since they're properties of the data — not the filters.

---

## 2. Filters

Each filter exposes 1–3 tunable parameters presented as labeled sliders with
sensible defaults and min/max bounds.

| Filter                        | Causal? | Parameters                                         |
|-------------------------------|---------|-----------------------------------------------------|
| **Simple Moving Average**     | ✅ Yes  | `windowSize` (3 – 101, odd)                        |
| **Exponential Moving Average**| ✅ Yes  | `alpha` (0.01 – 1.0)                               |
| **Double Exp. (Holt)**        | ✅ Yes  | `alpha` (0.01 – 1.0), `beta` (0.01 – 1.0)        |
| **Gaussian Window**           | ❌ No   | `windowSize` (3 – 101), `sigma` (0.5 – 20)        |
| **Savitzky–Golay**            | ❌ No   | `windowSize` (5 – 51, odd), `polyOrder` (1 – 5)   |
| **1-D Kalman**                | ✅ Yes  | `processNoise Q` (0.001 – 10), `measureNoise R` (0.001 – 10) |
| **Median Filter**             | ❌ No   | `windowSize` (3 – 51, odd)                         |
| ~~Butterworth (lowpass)~~     | —       | _Deferred to v2 — needs IIR coeff math or DSP lib_ |

**Double Exponential (Holt)** is EMA's trend-aware sibling. EMA tracks
the *level* of the signal; Holt adds a second smoothing pass that also
tracks the *slope* (trend). Two parameters:

- `alpha` — level smoothing (same role as in EMA)
- `beta` — trend smoothing (0 = ignore trend, 1 = track instantly)

This makes it dramatically better than EMA on trending data (steady climb,
plateau & drop) because it anticipates where the signal is *going*, not
just where it's been. On flat/oscillating data it behaves like EMA.
The direct A/B comparison between EMA and Holt on the same dataset is
one of the clearest "why this filter exists" moments in the app.

### Causal mode toggle

A global toggle in the app header (or top of the sidebar) switches between
**"Full window"** (default) and **"Causal / real-time"** mode.

- **Full window** (default): non-causal filters use centered windows —
  they peek ahead. This is the standard offline/batch behavior.
- **Causal mode**: all filters are forced to use trailing-only windows.
  Non-causal filters shift to using only past samples. The user *sees*
  lag appear on S-G, Gaussian, and median — same params, visibly worse
  tracking. This is the "aha" moment: the cost of real-time constraints.

Causal filters (SMA, EMA, Kalman) behave identically in both modes.

**Info tooltip (ⓘ)**: a small info icon beside the toggle opens a tooltip
or popover explaining the concept:

> **Causal vs. Non-causal filters**
>
> A *causal* filter only uses the current and past data points — it can
> run in real time on streaming data. SMA, EMA, and Kalman are naturally
> causal.
>
> A *non-causal* filter also looks at future data points (centered
> window). Savitzky-Golay, Gaussian, and Median are non-causal by
> default — they produce better results but require the full dataset
> upfront.
>
> Toggle "Causal mode" to force all filters into real-time behavior and
> see the tradeoff.

### Filter meta — causality flag

Each filter's `meta` descriptor includes a `causal` boolean:

```js
export const meta = {
  name: "Savitzky-Golay",
  key: "savitzkyGolay",
  causal: false,  // ← has both causal and non-causal implementations
  params: [ ... ]
}
```

The `apply` function receives the causal mode flag:

```js
export function apply(data, params, { causalMode }) {
  if (causalMode) {
    // trailing-only window implementation
  } else {
    // centered window implementation
  }
}
```

Filters where `causal: true` can ignore the flag — their behavior doesn't
change. The filter card displays a small badge: "Causal" (green) or
"Non-causal" (muted). When causal mode is on, non-causal filters show
"Forced causal" (amber) to make the override visible.

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
5. The **comparison table** below the chart shows metrics for all active
   filters simultaneously (see Section 3a).
6. Max 4 filters. The "+ Add Filter" button disables at the cap.

### Color palette

A fixed 4-color palette (e.g. blue, orange, green, violet) assigned in
order of creation. The raw signal is always a translucent gray.

### UI Layout

```
┌──────────────────────────────────────────────────────┐
│  Signal Filter Visualizer            [Causal ⓘ 🔘]  │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│ ┌────────┐ │         Recharts LineChart              │
│ │●SMA  ✕ │ │                                         │
│ │ window │ │   — raw (translucent gray)             │
│ │ [====] │ │   — filter 1 (blue, bold)              │
│ └────────┘ │   — filter 2 (orange)                  │
│ ┌────────┐ │   — filter 3 (green)                   │
│ │●EMA  ✕ │ │                                         │
│ └────────┘ │                                         │
│            │─────────────────────────────────────────│
│ [+ Add   ] │ [Steady climb] [Sharp steps] [Spikes]  │
│            │ [Noisy sine] [Random walk] [Chirp] ...  │
│            │ Noise: [Gaussian ▾]    Level [━━━━━━]   │
├────────────┴─────────────────────────────────────────┤
│  Filter Comparison                                          │
│ ┌──────┬───────┬──────┬───────┬────────┬─────┬─────┬───────┐│
│ │      │ RMSE  │ MAE  │ Lag   │ Smooth │ SNR │ Peak│ Cost  ││
│ │● SMA │ 0.42  │ 0.31 │ ★ 0   │ 0.78   │★4.2 │ 72% │ ●●○○○││
│ │● EMA │★0.38  │★0.27 │   2   │★0.91   │ 3.9 │★88% │★●○○○○││
│ └──────┴───────┴──────┴───────┴────────┴─────┴─────┴───────┘│
│  ★ = best in column                                          │
└──────────────────────────────────────────────────────┘
```

- Left panel: filter card stack only (~280 px)
- Main area: chart (flex-grow) with dataset chips + noise controls below
- Bottom panel: full-width comparison table spanning both columns

---

## 3a. Analytics — Comparison Table

Replaces the single-line stats bar. A full-width table below the chart
shows all active filters side by side with seven metrics (six computed,
one static reference).

### Metrics

| Metric               | Column label | How it's computed                                                                 | What it reveals                                           |
|----------------------|--------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------|
| **RMSE**             | RMSE         | Root mean squared error between filtered output and the clean base signal (no noise). | Overall accuracy. The universal "how close is the fit?"   |
| **MAE**              | MAE          | Mean absolute error vs. clean base signal.                                        | Less sensitive to outliers than RMSE — useful contrast.   |
| **Phase Lag**        | Lag          | Cross-correlation offset between clean base and filtered output that maximizes correlation. Measured in samples. | The core causal-mode metric. Shows the cost of real-time. |
| **Smoothness**       | Smooth       | `1 / variance(diff(filtered))` — inverse variance of the first derivative, normalized 0–1. | How aggressively noise was removed. Pairs with lag for tradeoff analysis. |
| **SNR Improvement**  | SNR (dB)     | `SNR_after - SNR_before` where `SNR = 10·log10(Var(signal) / Var(noise))`. Uses clean base as ground truth. | "Did the filter actually help?" — the single most intuitive metric. |
| **Peak Preservation**| Peaks        | Percentage of local maxima/minima in the clean base signal that still appear (within tolerance) in the filtered output. | Shows S-G's advantage over SMA — preserving features vs. flattening them. |
| **Complexity**       | Cost         | Static per-filter — not measured. See table below.                                | Real-world feasibility. Irrelevant at 500 pts, critical on embedded hardware. |

### Computational complexity

The "Cost" column is a **static reference value** pulled from the filter's
`meta` descriptor — it's not benchmarked at runtime (these sizes are too
small for meaningful measurement). It uses a simple rating system for quick
scanning, with full details in a tooltip.

| Filter   | Rating | Big-O           | Per-sample cost (32-bit MCU @ 64MHz, no FPU)                |
|----------|--------|-----------------|-------------------------------------------------------------|
| **EMA**  | ●○○○○  | O(n)            | 1 multiply + 1 add, 1 stored value. Runs in an ISR at any sample rate. The cheapest real filter. |
| **Holt** | ●○○○○  | O(n)            | 2 multiplies + 2 adds per sample, 2 stored values (level + trend). Barely more than EMA — same ISR-safe profile. |
| **SMA**  | ●●○○○  | O(n) amortized  | Running-sum trick: 1 add + 1 subtract per sample. But requires a w-sample circular buffer in RAM (w=101 → 400 bytes of float32). |
| **Kalman** | ●●○○○ | O(n)           | ~5 multiplies + 1 divide per sample, 3 stored values. The divide hurts — 50–100 cycles on MCUs without hardware divider. Still very feasible at 64MHz. |
| **Median** | ●●●○○ | O(n·w log w)   | Sort per window, or O(n·log w) with running median using two heaps. Heap operations involve branching and pointer chasing — poor on simple pipelines. Impractical above ~1kHz with large windows on low-end MCUs. |
| **Gaussian** | ●●●○○ | O(n·w)       | Convolution with precomputed kernel. w multiplies + w adds per sample. Moderate — feasible at audio rates, tight at ultrasonic. |
| **S-G**  | ●●●●○  | O(n·w·p²)      | Textbook: least-squares fit per window position. Practically, precompute convolution coefficients → becomes O(n·w) FIR, but the coefficients change if window/order change at runtime. Heaviest of the group. |

The **filled-circle rating** (●○○○○ to ●●●●●) gives a quick visual scan
in the table column. The ⓘ tooltip on "Cost" reveals the full context:

> **Computational Cost**
>
> At 500 data points in a browser, all filters are effectively instant.
> This rating reflects real-world cost on resource-constrained systems —
> e.g. a 32-bit microcontroller at 64MHz with no floating-point unit,
> running a filter in a real-time sample loop.
>
> ●○○○○ = trivial (ISR-safe at any rate)
> ●●●●● = heavy (may need offline/batch processing)

### Table behavior

- **One row per active filter**, colored with the filter's swatch.
- **Best value per column**: bold text + small ★ icon.
- **Worst value per column**: muted/dimmed text (no icon — keep it positive).
- All metrics recompute live as sliders move (same perf story — trivial cost).
- When **causal mode** is toggled, the table updates instantly — the user
  can watch lag values jump for non-causal filters while RMSE may worsen.
  This is the "aha" moment.

### Implementation note

All metrics compare the filtered output against the **clean base signal**
(noise-free), not against the raw noisy signal. This is possible because
we generate the base deterministically and add noise separately. This gives
us ground-truth accuracy that wouldn't be available with real data — one
of the advantages of a synthetic visualization tool.

### ⓘ Metric tooltips

Each column header has a small info icon. Hovering shows a one-line
explanation of what the metric measures and why it matters.

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
        Comparison table recomputes all 6 metrics per filter
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
    CausalToggle.jsx      # causal mode switch + ⓘ info tooltip
    ComparisonTable.jsx   # full-width metrics table (replaces stats bar)
  signals/
    index.js              # registry + generateSignal()
    curves.js             # individual base-curve functions
    noise.js              # seeded noise generator (Gaussian, Cauchy, bursty, heteroscedastic)
  filters/
    index.js              # registry + applyFilter()
    sma.js
    ema.js
    holt.js               # Double Exponential (Holt) — trend-aware EMA
    gaussian.js
    savitzkyGolay.js
    kalman.js
    median.js
    # butterworth.js      # v2 — requires DSP lib
  utils/
    stats.js              # RMSE, MAE, phase lag, smoothness, SNR, peak preservation
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
  causal: true,       // naturally causal — unaffected by causal mode toggle
  complexity: {
    rating: 2,        // 1–5 filled circles (●●○○○)
    bigO: "O(n)",
    tooltip: "Running-sum trick: 1 add + 1 subtract per sample. Requires a w-sample circular buffer in RAM."
  },
  params: [
    { key: "windowSize", label: "Window Size", min: 3, max: 101, step: 2, default: 21 }
  ]
}
export function apply(data, { windowSize }, { causalMode }) {
  /* ... returns number[] */
}
```

- `meta` drives the UI — `FilterCard` reads `meta.params` and renders a
  slider for each entry. No filter-specific UI code anywhere.
- `meta.causal` indicates native causality. Used for badge display and
  to determine whether causal mode changes the filter's behavior.
- `meta.complexity` drives the "Cost" column in the comparison table.
  `rating` renders as filled circles, `tooltip` provides embedded context.
- `apply` signature is always
  `(number[], Record<string, number>, { causalMode: boolean }) → number[]`.
- `filters/index.js` collects all modules into a `filterRegistry` array.
- **Adding a new filter = one new file + one import line.** Zero UI changes.

For inter-param constraints (e.g. Savitzky-Golay `polyOrder < windowSize`),
the param descriptor can specify `max` as a function of other param values.
The UI dynamically clamps — no error states, just smooth guardrails.

### Noise & seeding

- Each **(dataset, noiseType)** pair has a **fixed, hardcoded seed**. It never changes.
- The noise array is generated once per combination on load.
- The noise slider **scales amplitude only** (`base[i] + level * noise[i]`).
- This means dragging the slider smoothly grows/shrinks the same bumps.
- Switching datasets or noise types produces a different noise pattern (different seed).
- **Four noise distributions**: Gaussian, heavy-tailed (Cauchy/Laplace),
  bursty (intermittent), and heteroscedastic (time-varying amplitude).
  Selected via a dropdown in the dataset bar below the chart.

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
