# Reporting Robustness: charts, maps, accessibility, and adapter seams

m3kit keeps the baseline runnable without API keys, chart engines, map SDKs, or export SDKs. Durable semantics live in `@m3kit/core`, dependency-free rendering lives in UI libraries, and vendor integrations belong in optional adapters or consumer apps.

## Chart baseline

`@m3kit/charts` remains hand-written SVG by default:

| Surface | Baseline status | Adapter escape hatch |
|---|---|---|
| Line | `m3k-line-chart` with numeric/string/date x values, multi-series, single-point markers, generated `<title>/<desc>` | D3 primitives only if scale/path math becomes the bottleneck |
| Area | `m3k-line-chart` with `area=true`; same data contract as line | ECharts only for linked brushing, zoom/pan, annotations, or very high data volumes |
| Bar | `m3k-bar-chart` grouped vertical/horizontal, negative values in grouped mode | Full engines only for advanced stacked interactions or very large categorical sets |
| Stacked bar | `m3k-bar-chart` with `mode='stacked'`; non-negative baseline by policy | Same as bar; negative stacked semantics require a new contract decision |
| Donut | `m3k-donut-chart` with closed token palette and generated text equivalent | Highcharts/AG Charts are not baseline due to license/dependency weight |
| Sparkline | Use `m3k-line-chart` with `showAxes=false`, `showGrid=false`, short `height`, and `area` optional | Dedicated sparkline component only if repeated app usage needs a smaller API |

Shared chart helpers:

- `chart-a11y.ts` generates prose summaries and table rows for line, bar, and donut data.
- `chart-export.ts` exports normalized SVG markup/data URIs only. Browser downloads, PNG/PDF rasterization, XLSX, and server export jobs are adapter/app responsibilities.
- SVG components include generated `<title>` and `<desc>` by default and accept `ariaDescription` overrides for domain-specific copy.

## Text equivalents and export contract

Every meaningful chart should have a text equivalent. Use one or more of:

1. The SVG `ariaLabel` for the short name.
2. The generated or supplied SVG `<desc>` for the summary.
3. `chartRowsToText(...)` / `summary.rows` to render an adjacent table when the chart carries decision-making data.
4. Core export snapshots (`@m3kit/core` export contracts) for CSV/JSON; do not couple chart SVG export to tabular data export.

The baseline SVG export line is deliberately narrow: m3kit can produce safe SVG markup and data URIs, but it does not click anchors, create Blob URLs, rasterize canvas, or add PDF/Excel dependencies.

## Map baseline

`@m3kit/core` defines provider-neutral map contracts:

- `GeoPoint`, `GeoBounds`
- `GeoFeature<TPayload>`
- `MapLayerDefinition<TPayload>`
- `MapViewport`, `MapViewportPatch`
- `MapSelection<TPayload>`
- pure helpers: point validation, bounds normalization/membership, bounds-from-points, viewport patching

The Storybook surface `Pages/Reporting/Static Map Adapter Seam` demonstrates a no-key static SVG map with an accessible marker list. It uses only synthetic fixture data from `@m3kit/testing` and proves that the baseline can render geospatial reporting without any map SDK.

## Optional map adapters

Adapters translate provider-neutral contracts into vendor APIs and back. They are not baseline dependencies.

| Provider | When justified | Boundary rules |
|---|---|---|
| Google Maps | Consumer already uses Google billing/key governance and needs Google tiles, Places, or Maps JS features | Optional lazy adapter only; no `google.maps.*` in `core`, `testing`, or existing UI libs; no API key in source |
| MapLibre GL JS | Offline/internal vector tiles, OSS-friendly map stack, self-hosted styles | Separate adapter; document tile/style hosting and worker/CSP implications |
| OpenLayers | GIS-heavy enterprise layers/projections | Separate adapter; projection translation must not leak into `GeoPoint` contracts |
| deck.gl | Large WebGL overlays or advanced geospatial visualization | Separate adapter; document data-volume thresholds and accessibility/list fallback |

Places, geocoding, routes, and billing-sensitive APIs should be backend-mediated ports, not direct baseline UI calls.

## Boundary proof checklist

Before claiming a chart/map robustness change is done:

- `libs/core` has no Angular, Material/CDK, map SDK, chart SDK, browser download, or telemetry SDK imports.
- `libs/charts` has no ECharts, D3, Chart.js, Highcharts, AG Charts, map SDK, PDF, Excel, or telemetry SDK dependencies.
- Map demos use synthetic data and require no API key or network tile calls.
- Storybook includes text/list alternatives for visual-only surfaces.
- `docs/DECISIONS.md` records any dependency or adapter policy change before the dependency lands.

## Current verification targets

```bash
npx nx test m3kit-core
npx nx test m3kit-charts
npx nx test m3kit-testing
npx nx lint m3kit-core
npx nx lint m3kit-charts
npx nx lint m3kit-testing
npx nx run m3kit-table:build-storybook
```
