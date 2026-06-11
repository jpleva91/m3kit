# Theming Guide — bring your own brand

How to retheme the reporting UI kit: what the token contract is, what components
are allowed to consume, and a complete worked example of adding a new brand.

## Philosophy: components consume the contract, never raw values

The kit is themed through exactly two token surfaces:

1. **Material 3 system tokens** (`--mat-sys-*`), emitted by Angular Material's
   `mat.theme` mixin from brand-supplied palettes, typography, and density.
2. **A small app-token contract** (`--app-*`), defined and documented in
   `libs/reporting/theme/src/m3kit-theme/_contract.scss`, for the few
   domain-specific decisions M3 has no token for (status badge colors, shape
   radii, an optional data-cell font stack).

Component stylesheets in `libs/reporting/*` consume these tokens via `var()`
and **never hardcode brand values** (no raw hex, no per-brand selectors in
components). A brand is therefore nothing but a token emission: switching
brands or modes re-emits tokens under a class scope on the root element, and
every component restyles itself with **zero duplicated component CSS**.

The theming machinery lives in its own library, `libs/reporting/theme`
(`@m3kit/theme`), so it travels with the rest of the copy-in deliverable:

```
libs/reporting/theme/
├── project.json                 # lint-only project (no build/test targets)
├── README.md                    # contract + wiring summary
└── src/m3kit-theme/
    ├── _index.scss              # entry: @use 'm3kit-theme'
    ├── _contract.scss           # custom-prop API + brand mixin contract + emit helpers
    └── themes/instruments/      # "Instruments", the default brand
        ├── _index.scss          # entry: @use 'm3kit-theme/themes/instruments'
        ├── _brand.scss          # brand-light() / brand-dark()
        └── _colors.scss         # generated M3 palettes
```

SCSS cannot read TypeScript path aliases, so resolution is wired through the
builder via `stylePreprocessorOptions`:

```jsonc
"stylePreprocessorOptions": { "includePaths": ["libs/reporting/theme/src"] }
```

This block is set on the `build` target of `apps/demo-reporting/project.json`
(the dev server inherits it via `buildTarget`) and on the `storybook` /
`build-storybook` targets of `libs/reporting/material/project.json`. With it
in place, any stylesheet in the workspace can write:

```scss
@use 'm3kit-theme' as contract;          // the contract + emit helpers
@use 'm3kit-theme/themes/instruments';   // the default brand
```

## The custom-prop API (`--app-*`)

Everything below is the **entire** app-token contract. If a styling decision
is not representable as one of these tokens or an M3 system token, it does not
belong in a theme (see "Out of token scope").

### Status badge tokens

Container / on-container color pairs, one per status kind. The kind list is
closed: `draft`, `sent`, `paid`, `overdue`, `void` (the `$status-kinds` list
in `_contract.scss`). The `status-tokens()` helper errors at compile time if a
brand omits any kind, so a partial badge palette cannot ship.

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-status-draft-bg` / `--app-status-draft-fg` | `libs/reporting/material/src/lib/report-table.component.scss` (status badge cells) | Brands provide separate light and dark maps; `brand-dark()` re-emits all ten pairs. |
| `--app-status-sent-bg` / `--app-status-sent-fg` | same | same |
| `--app-status-paid-bg` / `--app-status-paid-fg` | same | same |
| `--app-status-overdue-bg` / `--app-status-overdue-fg` | same | same |
| `--app-status-void-bg` / `--app-status-void-fg` | same | same |

Pick badge pairs the way M3 picks container/on-container roles: a muted
container background with a high-contrast foreground from the same hue family,
flipped in tone for dark mode (see the `$_status-light` / `$_status-dark` maps
in any brand module for worked values).

### Shape tokens

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-radius-badge` | `libs/reporting/material/src/lib/report-table.component.scss` and `libs/reporting/material/src/lib/report-toolbar.component.scss` (chip/badge silhouettes; `999px` = pill) | Emitted in `brand-light()` only; dark inherits (radius never changes with mode). |
| `--app-radius-card` | Reserved for the component layer (cards and panels); emitted by every brand so components can adopt it without a theme change. | same |
| `--app-radius-control` | Reserved for the component layer (inputs, buttons, chips). | same |

### Typography token

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-font-data` | **Optional / not yet consumed.** The data-cell (tabular figures / mono) stack. The component layer currently hardcodes its mono stack in `report-table.component.scss`; brands emit this token only once that hook exists. The `font-data()` helper is ready in the contract. | Light-only emission; dark inherits. |

## The brand mixin contract

A brand is one SCSS module exposing two **zero-argument** mixins:

- **`brand-light()`** — emits the full theme: `mat.theme` with `color`
  (light), `typography`, and `density`; `contract.status-tokens($light-map)`;
  `contract.radius-tokens(...)`; and `color-scheme: light`.
- **`brand-dark()`** — re-emits **only what changes in dark mode**: `mat.theme`
  with dark `color` only; `contract.status-tokens($dark-map)`; and
  `color-scheme: dark`. Typography, density, and radius are *not* re-emitted —
  the brand's light selector always also matches in dark mode, so those tokens
  cascade through (see "Light/dark wiring").

The contract's emit helpers enforce the token names so brands cannot drift:

- `status-tokens($map)` — `$map` is `(kind: (bg: <color>, fg: <color>))`
  covering every `$status-kinds` entry; missing kinds are a compile error.
- `radius-tokens($card: 10px, $control: 6px, $badge: 999px)` — defaults are
  the Instruments values; override per brand.
- `font-data($family)` — emits `--app-font-data` (hold off until the
  component hook exists; see table above).

Reference implementations:

- `libs/reporting/theme/src/m3kit-theme/themes/instruments/_brand.scss` —
  the default brand, shipped inside the lib.
- `apps/demo-reporting/src/styles/themes/_terminal.scss`, `_ledger.scss`,
  `_field-guide.scss` — example *consumer* brands living app-side, exactly
  where your own brands will live.

## Worked example: adding a "Midnight" brand

Suppose you want a deep-indigo nocturnal brand. Five steps, all additive.

### 1. Generate M3 palettes from your seed colors

Angular Material ships a schematic that turns seed colors into full M3 tonal
palettes:

```sh
npx nx g @angular/material:theme-color
```

Answer the prompts with your seeds (for Midnight, say primary `#3F51B5`,
tertiary `#8E7CC3`, neutral `#5C5F6E`) and direct the output to
`apps/demo-reporting/src/styles/themes/_midnight-colors.scss`. The generated
file defines `$primary-palette` / `$tertiary-palette` maps — same shape as
`_terminal-colors.scss` and the lib's `themes/instruments/_colors.scss`.

### 2. Implement the brand module

Create `apps/demo-reporting/src/styles/themes/_midnight.scss`:

```scss
@use '@angular/material' as mat;
@use 'm3kit-theme' as contract;
@use './midnight-colors' as palettes;

/// "Midnight" — deep indigo nocturne. Space Grotesk throughout.

$_typography: (
  plain-family: 'Space Grotesk',
  brand-family: 'Space Grotesk',
  bold-weight: 600,
);

// Container / on-container pairs for every status kind (all five are
// required — status-tokens() errors on a missing kind).
$_status-light: (
  draft:   (bg: #e1e0f0, fg: #2e2f3d),
  sent:    (bg: #dde1ff, fg: #111c55),
  paid:    (bg: #c2ecc9, fg: #04210e),
  overdue: (bg: #ffdad6, fg: #410002),
  void:    (bg: #e9ddff, fg: #251936),
);

$_status-dark: (
  draft:   (bg: #444553, fg: #e1e0f0),
  sent:    (bg: #2c3a8f, fg: #dde1ff),
  paid:    (bg: #0d5226, fg: #c2ecc9),
  overdue: (bg: #93000a, fg: #ffdad6),
  void:    (bg: #4b3a6b, fg: #e9ddff),
);

/// Full light theme: color + typography + density + status + radius.
@mixin brand-light() {
  @include mat.theme((
    color: (
      theme-type: light,
      primary: palettes.$primary-palette,
      tertiary: palettes.$tertiary-palette,
    ),
    typography: $_typography,
    density: 0,
  ));
  @include contract.status-tokens($_status-light);
  @include contract.radius-tokens($card: 14px, $control: 8px, $badge: 999px);
  color-scheme: light;
}

/// Dark re-emits color + status only; the rest cascades from light.
@mixin brand-dark() {
  @include mat.theme((
    color: (
      theme-type: dark,
      primary: palettes.$primary-palette,
      tertiary: palettes.$tertiary-palette,
    ),
  ));
  @include contract.status-tokens($_status-dark);
  color-scheme: dark;
}
```

### 3. Register the root class in the aggregator

Add Midnight to `apps/demo-reporting/src/styles/_theme.scss`:

```scss
@use './themes/midnight';

// inside @mixin app-theme():
html.theme-midnight {
  @include midnight.brand-light();
}

html.theme-midnight.dark {
  @include midnight.brand-dark();
}
```

Then make the brand selectable: add `'midnight'` to the `ThemeBrand` union and
`THEME_BRANDS` list in `apps/demo-reporting/src/app/core/theme.service.ts`.
The service handles the rest — it toggles `theme-midnight` on `<html>` and
persists the choice.

### 4. Add the fonts

Brand fonts load in two places (app and Storybook previews are separate
documents):

- `apps/demo-reporting/src/index.html` — extend the Google Fonts `<link>`
  with your families (e.g. `&family=Space+Grotesk:wght@400;500;600`).
- `libs/reporting/material/.storybook/preview-head.html` — same addition.

### 5. Add the brand to the Storybook toolbar

In `libs/reporting/material/.storybook/preview.ts`, extend the `BRANDS` array
and the `brand` toolbar items:

```ts
const BRANDS = ['instruments', 'terminal', 'ledger', 'field-guide', 'midnight'] as const;
// ...
items: [
  // ...existing brands...
  { value: 'midnight', title: 'Midnight' },
],
```

Run `npx nx serve demo-reporting` and `npx nx run reporting-material:storybook`
— Midnight appears in both pickers, light and dark, with no component changes.

## Light/dark wiring

The class scheme on the root element (managed by
`apps/demo-reporting/src/app/core/theme.service.ts`):

- **No brand class** (or `theme-instruments`) → Instruments, the default.
- **`theme-<brand>`** → an alternate brand.
- **`dark`** → dark mode for whichever brand is active.

The aggregator (`apps/demo-reporting/src/styles/_theme.scss`) maps these to
emissions: `html.theme-x` gets `brand-light()`, `html.theme-x.dark` gets
`brand-dark()`. Because `html.theme-x` still matches when `dark` is present,
the light emission's typography, density, and radius tokens remain in effect
and only the color-bearing tokens (M3 color + status) are overridden. This is
why `brand-dark()` is deliberately partial — re-emitting everything would be
harmless but redundant.

`color-scheme: light|dark` is emitted alongside the tokens so native UI
(scrollbars, form controls) follows the active mode.

## Storybook toolbar pattern

Storybook shares the app's single token source rather than maintaining its
own: `libs/reporting/material/.storybook/storybook-theme.scss` `@use`s the
demo app aggregator and calls `app-theme()`. The includePath on the
`storybook` / `build-storybook` targets makes `m3kit-theme` resolve there
too.

`libs/reporting/material/.storybook/preview.ts` defines two `globalTypes`
toolbars — `brand` and `mode` — and a decorator that toggles the same
`theme-<brand>` / `dark` classes on the preview's root element that
`ThemeService` toggles in the app. Every story is therefore viewable in every
brand × mode combination with no per-story setup.

## Out of token scope

The token contract covers **color, type, density, and shape radii — nothing
else**. Deliberately excluded:

- **Layout and composition** — page structure, grid placement, component
  geometry, spacing scales, and density *splits* (which surfaces are dense vs.
  airy) are design decisions fixed in components and DESIGN.md, not per-brand
  variables. A brand may not move things around.
- **Per-brand component CSS** — no `html.theme-x .some-component` selectors
  anywhere. If a brand seems to need one, the contract needs a new token (a
  documented decision), not an escape hatch.
- **Motion** — durations and easing follow DESIGN.md globally.

This is recorded as a binding decision in `DESIGN.md` (Decisions Log,
"Multi-brand architecture": *layout signatures stay out of token scope*).

## Bringing this into your own workspace

`libs/reporting/theme` is part of the copy-in deliverable (see
`docs/ADOPTION_GUIDE.md`). After copying, re-create the
`stylePreprocessorOptions.includePaths` entry on your app's build target (and
Storybook targets, if you take the Storybook), pointing at wherever you placed
`libs/reporting/theme/src`. Your own brand modules follow the consumer-brand
pattern above: live app-side, `@use 'm3kit-theme' as contract`, implement
`brand-light()` / `brand-dark()`.
