# UI Refinement Spec

Concrete changes to tighten and modernize the interface. Each section
maps to a specific component with before/after guidance.

---

## 1. Remove Header — Merge into Sidebar Top

**Files**: `App.jsx`, `CausalToggle.jsx`

**Current**: A thin `<header>` bar spans the full width with the title on
the left and a small causal toggle on the right. It takes ~40px of vertical
space and doesn't pull its weight visually.

**Change**: Delete the `<header>` element entirely. Add a branded section
to the top of the sidebar (`<aside>`) above the FilterStack:

```jsx
{/* Top of sidebar, above FilterStack */}
<div className="mb-4">
  <h1 className="text-sm font-semibold tracking-tight text-foreground">
    Signal Filter Visualizer
  </h1>
  <div className="mt-2.5">
    <CausalToggle causalMode={causalMode} onToggle={setCausalMode} />
  </div>
</div>
```

- Title sits at the top of the sidebar as a small brand mark.
- CausalToggle lives directly below it — feels like a primary mode control
  rather than something tucked into a corner.
- The chart now extends to the full top of the viewport (aside from the
  inset border — see #2).
- Remove the `border-b border-border` from the old header.

**Sidebar section label**: Add a subtle "Filters" label above the
FilterStack to distinguish the title/toggle area from the filter cards:

```jsx
<span className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
  Filters
</span>
```

---

## 2. Chart — Inset with Border

**File**: `Chart.jsx`, `App.jsx`

**Current**: Chart div uses `style={{ backgroundColor: 'var(--background)' }}`
which is identical to the app background. No visual boundary.

**Change**: Wrap the chart in a container with a subtle inset border and
slight rounding. Apply this in the `<main>` area of App.jsx:

```jsx
<main className="flex flex-1 flex-col min-h-0 min-w-0 p-3">
  <div className="flex-1 min-h-0 rounded-lg border border-border overflow-hidden">
    <Chart rawData={rawData} filteredSeries={filteredSeries} />
  </div>
  <DatasetBar ... />
</main>
```

- `p-3` on main creates a gutter around the chart (matches sidebar padding).
- `rounded-lg border border-border` gives the inset frame.
- `overflow-hidden` clips the Recharts SVG to the rounded corners.
- Remove the inline `style={{ backgroundColor: 'var(--background)' }}`
  from Chart's outer div — the border is doing the separation work now.

---

## 3. DatasetBar — Two Rows, Larger Chips

**File**: `DatasetBar.jsx`

**Current**: Signal chips are `text-xs px-3 py-1` — small and tight.
Noise controls are crammed on one line with inline labels.

**Change**:

### Signal chips (top row)
- Bump to `text-sm px-3.5 py-1.5` for a more comfortable click target.
- Keep `rounded-full` and the active/inactive color logic.
- Add `gap-2` instead of `gap-1.5` for breathing room.

### Noise controls (bottom row)
- Separate visually from the chips with a subtle top border or increased gap.
- Give the row a light label section feel:

```jsx
<div className="mt-3 pt-3 border-t border-border flex items-center gap-4">
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium text-muted-foreground">Noise</span>
    <Select ...> {/* noise type */} </Select>
  </div>
  <div className="flex items-center gap-2 flex-1">
    <span className="text-xs font-medium text-muted-foreground">Level</span>
    <Slider className="flex-1 max-w-[200px]" ... />
    <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">
      {noiseLevel.toFixed(2)}
    </span>
  </div>
</div>
```

- Two labeled groups: "Noise [dropdown]" and "Level [slider] [value]".
- `border-t` creates a clean visual separation from the chips.
- Slider gets `flex-1 max-w-[200px]` so it stretches a bit but doesn't
  run away on wide screens.
- `tabular-nums` on the value display prevents the number from jiggling
  as digits change width.

### Outer container
- Increase padding slightly: `px-4 py-3` → `px-4 py-4` (or match the
  main area's `p-3` gutter).

---

## 4. ComparisonTable — Zebra Striping + Star Icons

**File**: `ComparisonTable.jsx`

**Current**: Flat table with font-weight-only differentiation for
best/worst values. No row shading. No star icon.

### Zebra striping
Add alternating row backgrounds to the `<tr>`:

```jsx
<tr
  key={row.key}
  className={rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-muted/30'}
>
```

`bg-muted/30` is subtle enough to create visual lanes without competing
with the data. Adjust opacity if needed — test at `/20` and `/40` too.

### Star icon for best values
Add a small ★ next to the best value in each column. Use a text character
rather than an SVG icon — it's simpler and scales with the font:

```jsx
<td className={`text-right font-mono px-3 py-1.5 whitespace-nowrap ${
  isBest
    ? 'text-foreground font-semibold'
    : isWorst
    ? 'text-muted-foreground/40'
    : 'text-muted-foreground'
}`}>
  {isBest && <span className="text-amber-400 mr-1">★</span>}
  {col.format(row.stats[col.key])}
</td>
```

- `text-amber-400` gives the star a warm accent that pops on dark bg.
- `mr-1` spacing keeps it from crowding the number.
- Only best gets the star. Worst gets more aggressively muted (`/40`
  instead of `/50`).

### Row padding
Increase cell vertical padding from `py-1` to `py-1.5` for a slightly
more comfortable row height.

### Table header
Add a bottom border to the header row for cleaner separation:

```jsx
<thead>
  <tr className="text-muted-foreground border-b border-border">
```

---

## 5. Minor Polish

### FilterCard — expanded state padding
The expanded body (`px-3 pb-3 space-y-3`) feels slightly tight when
multiple sliders are shown. Consider `space-y-4` and `pb-4` for the
expanded state to let each param breathe.

### FilterCard — remove nested button
Currently there's a `<button>` (remove) nested inside a `<button>`
(toggle) which is invalid HTML and can cause event propagation issues.
Refactor the header to use a `<div>` as the outer element with
`onClick` and `role="button"` / `tabIndex={0}`, or restructure so
the remove button is outside the toggle click area.

### Sidebar scrollbar
Add a custom scrollbar style to the sidebar to avoid the default
chunky OS scrollbar on the filter stack:

```css
/* In index.css */
aside::-webkit-scrollbar {
  width: 4px;
}
aside::-webkit-scrollbar-thumb {
  background: oklch(1 0 0 / 10%);
  border-radius: 2px;
}
aside::-webkit-scrollbar-track {
  background: transparent;
}
```

### Font — numeric values
Add `tabular-nums` to all monospace numeric displays (slider values,
table cells, noise level) so numbers don't shift laterally as values
change. This is the single cheapest thing that makes an app feel
more polished.

### Tooltip position
The chart tooltip is fixed at `position={{ x: 60, y: 8 }}` — consider
switching to a floating position that follows the cursor's Y coordinate,
or anchoring to the top-left corner with a slight inset. The fixed
position can feel disconnected on wide screens.

---

## Summary of Visual Impact

| Change                       | Effort | Impact |
|------------------------------|--------|--------|
| Remove header → sidebar top  | Small  | High — reclaims space, feels more like a pro tool |
| Chart inset border           | Small  | Medium — defines the canvas as a distinct zone |
| DatasetBar breathing room    | Small  | Medium — larger hit targets, cleaner grouping |
| Table zebra + stars          | Small  | Medium — much easier to scan across rows |
| tabular-nums everywhere      | Tiny   | Medium — removes jitter on all numeric displays |
| Sidebar scrollbar            | Tiny   | Small — subtle polish detail |
| FilterCard nested button fix | Small  | Small — correctness fix, prevents edge-case bugs |
