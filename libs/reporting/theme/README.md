# @m3kit/theme

SCSS-only theming contract + default brand for the reporting UI kit.
No build target — the source partials *are* the artifact; adopters copy
`libs/reporting/*` and wire an includePath.

## Contents

- `src/m3kit-theme/_contract.scss` — the component-facing custom-prop
  API (`--app-status-{paid,sent,overdue,draft,void}-{bg,fg}`,
  `--app-radius-{card,control,badge}`, `--app-font-data`), the
  `brand-light()` / `brand-dark()` brand-mixin contract, and emit helpers
  (`status-tokens()`, `radius-tokens()`, `font-data()`).
- `src/m3kit-theme/themes/instruments/` — "Instruments", the default
  brand (`_brand.scss` + generated M3 palettes in `_colors.scss`).

## Wiring (Nx-style includePaths)

SCSS can't use TypeScript path aliases, so resolution goes through the
builder, conventionally via `stylePreprocessorOptions`:

```jsonc
// app build target (and Storybook storybook/build-storybook targets)
"stylePreprocessorOptions": { "includePaths": ["libs/reporting/theme/src"] }
```

Then any stylesheet can:

```scss
@use 'm3kit-theme' as contract;            // the contract + helpers
@use 'm3kit-theme/themes/instruments';     // the default brand
```

Brand modules implement the contract by exposing `brand-light()` /
`brand-dark()`; see the demo app's Terminal / Ledger / Field Guide modules
(`apps/demo-reporting/src/styles/themes/`) for example consumers.
