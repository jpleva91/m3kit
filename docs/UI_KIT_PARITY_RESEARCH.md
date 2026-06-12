# UI Kit and Reporting Library Parity Research

This document captures the parity bar for `m3kit`: the Angular reporting/reference kit should feel credible next to leading UI kits, grid libraries, charting engines, map platforms, and dashboard products while preserving the repository’s clean-room/source-internalization constraints.

## Executive recommendation

`m3kit` should **not** try to become AG Grid + Kendo + Grafana + Google Maps in one dependency-free repo. The winning position is narrower and sharper:

> **A source-owned Angular Material 3 reporting kit with enterprise-grade tables, filters, dashboard primitives, accessible SVG charts, saved/report views, exports, and optional adapter seams for maps/advanced engines.**

Parity means:

1. **Match top UI kits on app-building polish**: theming, accessibility, slots/composition, docs, variants, dark mode, responsive density.
2. **Match grid/reporting products on core user workflows**: sorting, filtering, pagination, virtualization, query state, saved views, export, server-side data contracts.
3. **Expose escape hatches where specialized products are too deep**: AG Grid-level pivoting, Highcharts/ECharts-level chart breadth, Google/Mapbox/deck.gl-level geospatial rendering, Grafana-level datasource/alerting ecosystems.
4. **Document the scope honestly**: this is a reporting kit and internalization reference, not a spreadsheet engine, BI platform, or proprietary enterprise suite replacement.

## Primary parity targets

### Angular-first UI kits

| Library | What users will compare | m3kit parity target | Baseline decision |
|---|---|---|---|
| Angular Material/CDK | Accessibility, forms, overlays, tables, theming, CDK primitives | Meet/exceed on Material-native integration, M3 tokens, a11y, CDK testing patterns | Baseline dependency; continue using |
| PrimeNG | Broad component suite, rich table, filters, chart wrapper, tokens | Match breadth for reporting pages: table/filter/form/card/chart states | No dependency; benchmark features |
| Kendo UI for Angular | Enterprise grid, charts, exports, globalization, support | Benchmark for enterprise depth: grid, export, i18n, dashboard layout | No dependency; commercial benchmark |
| Syncfusion EJ2 Angular | Grid, PivotView, charts, maps, dashboard layout, export | Benchmark for “all-in reporting suite” expectations | No dependency; commercial benchmark |
| NG-ZORRO | Ant-style admin UI: table, forms, layouts, i18n | Match admin-dashboard polish and docs/examples | No dependency |
| Clarity | Enterprise design system and datagrid | Match a11y/design-system clarity, not full reporting depth | No dependency |
| Taiga UI | Modern Angular forms, tokens, charts addon | Match Angular-native ergonomics and tokenized theming | No dependency |
| Carbon Angular | Enterprise DS/tokens/accessibility | Match design-token/a11y seriousness | No dependency |
| Spartan/shadcn Angular | Headless/copy-in composition | Match source-owned/copy-in ergonomics and composability | Strong conceptual influence |

### Cross-framework UI/design-system expectations

| Library/system | Signal | m3kit implication |
|---|---|---|
| shadcn/ui | Source-owned copy-in components via registry/CLI | Make internalization feel modern: clear file ownership, copy/delete docs, eventual generator/registry-style ergonomics |
| Radix UI | Accessible, unstyled, composable primitives | Use Angular templates/directives/slots; document keyboard/ARIA contracts |
| MUI X | Paid-grade Data Grid, Charts, Date Pickers | Match core workflows; document escape hatches for paid-grade edge cases |
| Ant Design | Admin app completeness | Provide realistic page compositions, not just isolated components |
| Chakra/Mantine | Tokens, theme object, composable components | Keep token contract closed, documented, and ergonomic |
| Tailwind UI/Tremor | Dashboard blocks and chart/card examples | Provide full reporting page examples and dashboards |
| Fluent/Carbon | Enterprise accessibility/design-system process | Add explicit a11y and design-token docs per component |
| TanStack Table | Headless table state model | Separate table state/query/controller logic from Material rendering where possible |

### Specialized reporting/data-viz competitors

| Product | User expectation | m3kit stance |
|---|---|---|
| AG Grid | Deep enterprise grid: server-side row model, grouping, pivot, Excel, master/detail, virtualization | Match reporting-table essentials; expose clear adapter/escape hatch for AG Grid-level needs |
| TanStack Table | Headless table state and framework integration | Borrow architecture ideas: headless query/table state, Angular rendering outside core |
| Handsontable | Spreadsheet editing, formulas, copy/paste | Out of scope unless explicitly building spreadsheet/data-entry mode |
| Tabulator | MIT grid with lots of table features | Useful open benchmark for grid features/export/accessibility |
| Apache ECharts | Full chart engine breadth, interactions, SSR, ARIA, large data | Best future full-engine fallback if hand-built SVG hits limits |
| Highcharts | Enterprise charts, exporting, accessibility, boost | Commercial benchmark only; not baseline |
| Vega/Observable Plot | Declarative/spec-driven visualization | Future option if user-authored chart specs become a requirement |
| Google Maps Platform | Commercial maps/search/routes/geocoding | Optional adapter only; no baseline API key/network requirement |
| MapLibre/deck.gl | Open/WebGL geospatial rendering | Best optional path for self-hosted/offline/internal geospatial adapters |
| Grafana | Dashboard variables, saved views, URL state, links, transformations, annotations | Strong UX benchmark for reporting/dashboard state patterns |

## Parity capability matrix

Legend: **Baseline** = should be in m3kit core/UI libs. **Adapter** = optional adapter/demo. **Docs** = document integration/replacement path. **Out** = intentionally out of scope.

| Capability | Angular Material | PrimeNG | Kendo/Syncfusion | AG Grid/TanStack | Grafana | m3kit target |
|---|---|---|---|---|---|---|
| M3/themed components | Strong | Strong custom themes | Strong themes | N/A | N/A | **Baseline** |
| Source-owned/copy-in model | Weak | Weak | Weak | TanStack partial | N/A | **Baseline differentiator** |
| Table sorting/filtering/paging | Medium | Strong | Strong | Strong | Panels only | **Baseline** |
| Server-side query contract | Manual | Patterns | Strong | Strong | Strong | **Baseline** |
| Column resize/reorder/pinning | Weak/manual | Medium/strong | Strong | Strong | N/A | **Baseline/high** |
| Virtualization | CDK primitive | Available | Strong | Strong | N/A | **Baseline/high** |
| Grouping/aggregation | Weak | Medium | Strong | Strong | Transform-like | **High**, but avoid pivot scope creep |
| Pivot/spreadsheet | None | Limited | Strong | AG Enterprise/Handsontable | N/A | **Docs/escape hatch** |
| CSV export | Manual | Available | Strong | Available | Available | **Baseline** |
| Excel/PDF export | Manual | Often available | Strong | Commercial/varies | Available-ish | **Adapter/docs** |
| Saved views | App responsibility | App responsibility | Often app-level | App-level | Strong | **Baseline differentiator** |
| URL-shareable state | App responsibility | App responsibility | App-level | App-level | Strong | **Baseline** |
| Dashboard variables/global filters | App responsibility | Some controls | App-level | N/A | Strong | **Baseline** |
| Charts | None | Chart.js wrapper | Strong | N/A | Strong panels | **Baseline SVG**, engine adapter later |
| Chart interactions/tooltips/legend | N/A | Medium | Strong | N/A | Strong | **Baseline/high** |
| Chart export | N/A | Chart.js path | Strong | N/A | Strong | **SVG export baseline; PNG/PDF adapter** |
| Maps | None | Some ecosystem | Syncfusion has maps | N/A | Plugins | **Optional adapter** |
| Geocoding/routes/places | None | None | Varies | N/A | Plugins | **Optional backend-mediated ports** |
| Accessibility docs | Strong | Documented | Strong | Strong | Mixed | **Baseline contract** |
| i18n/timezone | Angular primitives | Config | Strong | Manual | Strong | **Baseline** |
| Observability/events | Manual | Manual | Manual | Manual | Strong | **Baseline contracts + adapter** |
| Docs/examples | Strong | Strong | Strong | Strong | Strong | **Baseline, page-level examples** |

## Must-have baseline parity backlog

### 1. Table/report grid

m3kit should cover:

- Column definitions with type/format metadata.
- Sorting, pagination, global search, per-column filtering.
- Column visibility, resize, reorder, sticky/pinning.
- Row selection and bulk-action slots.
- Expandable/detail rows for drill-down reports.
- Stable row identity.
- CDK virtual-scroll variant.
- Server-side query contract and examples.
- Loading, empty, error, refreshing, stale states.
- CSV export and export request snapshots.
- Keyboard navigation/focus management/ARIA labels.

Explicitly not baseline initially:

- Spreadsheet editing/formulas.
- Full pivot table engine.
- AG Grid Enterprise-style Excel export depth.

### 2. Filters/forms/date handling

m3kit should cover:

- Text/number/date/currency/status filter controls.
- Date range with timezone policy.
- Relative date filters: last 7 days, this month, custom range.
- Select/multiselect/chips/autocomplete patterns.
- Query patch emission, debouncing, reset/apply modes.
- Validation/error summary.
- Locale/RTL-ready labels.

### 3. Dashboard/page primitives

m3kit should cover:

- KPI cards, detail cards, chart cards, dashboard grid.
- Page header/actions/breadcrumbs/global filters.
- Saved-view picker/manager.
- Export menu/action slots.
- Refresh/stale indicator.
- Drill links/data links.
- Responsive density/layout presets.

### 4. Charts

m3kit should cover:

- Line, area, bar, stacked bar, donut/pie, KPI sparkline, legend, chart card.
- Axis formatting, date/time/currency labels.
- Tooltip and selection model if keyboard-accessible.
- Empty/error/loading states.
- Textual/chart-summary fallback.
- SVG export helper.
- Decimation/downsampling for large line data.
- Token-only colors and high-contrast checks.

Defer/adapter:

- Pan/zoom/brush annotations.
- Heatmaps/scatter/mixed complex chart families.
- PNG/PDF export.
- ECharts/Vega-style arbitrary chart spec runtime.

### 5. Maps/geospatial

m3kit should cover in core:

- `GeoPoint`, `GeoBounds`, `GeoMarker`, `GeoRegion`, `MapLayerDefinition`.
- Viewport query patch/event contracts.
- Marker/region selection events.
- Accessible list/table alternative patterns.

Baseline demo should cover:

- No-secret synthetic static map/list shell.
- Map unavailable/error fallback.

Optional adapters may cover:

- Google Maps via `@angular/google-maps`.
- MapLibre/OpenLayers for internal/offline GIS.
- deck.gl for WebGL-heavy layers.
- Places/Geocoding/Routes as backend-mediated ports.

### 6. Theming/design tokens

m3kit should cover:

- M3 color tokens and app-specific tokens.
- Typography, data font, chart palette, status colors.
- Density scale.
- Radius/elevation/focus-ring tokens.
- Dark mode and high contrast.
- Storybook brand/mode switcher.
- Token validation docs.

### 7. Documentation/examples

Parity requires docs to be treated as product:

- API tables for every component.
- Usage examples with code snippets.
- Accessibility notes and keyboard tables.
- Theming notes and token references.
- Server-side data examples.
- Full-page dashboard/report examples.
- Internalization/copy-delete guidance.
- “When to use adapter X instead” decision trees.

## Strategic positioning

`m3kit` can win on:

- Angular-native source ownership.
- Clean boundaries and copy-in governance.
- Material 3 rethemability.
- Deterministic SVG charts.
- Adapter seams instead of dependency lock-in.
- Enterprise reporting workflows built from first principles: query state, saved views, exports, accessibility, observability.

`m3kit` should not pretend to beat specialized products at their deepest niches:

- AG Grid for pivot/spreadsheet-like grid depth.
- Highcharts/ECharts for every chart type and advanced interaction.
- Google Maps/Mapbox/deck.gl for full geospatial rendering.
- Grafana for datasource ecosystem/alerting.

Instead, document those as **approved replacement/adapter paths** after internalization.

## Recommended implementation impact

Add a **UI-kit parity track** to the existing robustness plan:

1. Create a component inventory checklist against Angular Material, PrimeNG, Kendo, Syncfusion, NG-ZORRO, Taiga, Carbon, Spartan/shadcn.
2. Add grid parity stories: resize, reorder, visibility, selection, expandable rows, virtual scroll, server mode, export.
3. Add docs parity requirements: API tables, keyboard behavior, accessibility notes, full-page examples.
4. Add command palette and date range picker as modern app-kit expectations.
5. Add explicit “escape hatch” docs for AG Grid, ECharts, Google Maps, MapLibre, and Grafana-like dashboard platforms.
6. Add a parity dashboard in Storybook: “m3kit vs enterprise expectations,” with status badges for baseline/adapter/docs/out-of-scope.

## Sources consulted

Sources were public official docs and public npm/package/license metadata. They are summarized in `docs/BOUNDARY_LOG.md` under the 2026-06-11 UI kit parity research entries.
