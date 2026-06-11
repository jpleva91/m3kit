# @m3kit/charts

Dependency-free, token-themed SVG charts for the m3kit reporting kit.
No chart libraries: every chart is hand-built SVG, viewBox-responsive
(`width: 100%`, `preserveAspectRatio="none"` where shapes may stretch),
and styled exclusively through the theme contract — series colors cycle
the closed `--app-chart-1..6` palette, grids use
`--mat-sys-outline-variant`, numerals use `--app-font-data`.

## Components

| Selector           | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `rpt-line-chart`   | Multi-series line/area chart with nice ticks and grid       |
| `rpt-bar-chart`    | Grouped or stacked bars, vertical or horizontal             |
| `rpt-donut-chart`  | Donut with optional display-face center value/label         |
| `rpt-chart-legend` | Wrapping swatch + label legend                              |
| `rpt-chart-card`   | mat-card frame with title, legend slot, loading/empty state |

Shared math (linear scales, nice ticks, path/arc builders) lives in
`src/lib/internal/scale.ts` and is unit-tested with exact expectations.

## Running unit tests

Run `nx test reporting-charts` to execute the unit tests.

## Running component tests

Run `ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox nx run reporting-charts:component-test`.
