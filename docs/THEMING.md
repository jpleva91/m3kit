# Theming Guide — bring your own brand

How to retheme the m3kit UI library: what the token contract is, what components
are allowed to consume, and a complete worked example of adding a new brand.

## Philosophy: components consume the contract, never raw values

The kit is themed through exactly two token surfaces:

1. **Material 3 system tokens** (`--mat-sys-*`), emitted by Angular Material's
   `mat.theme` mixin from brand-supplied palettes, typography, and density.
2. **A small app-token contract** (`--app-*`), defined and documented in
   `libs/theme/src/m3kit-theme/_contract.scss`, for the few
   kit-specific decisions M3 has no token for (status badge colors, shape
   radii, chart series colors, an optional data-cell font stack).

Component stylesheets in `libs/*` consume these tokens via `var()`
and **never hardcode brand values** (no raw hex, no per-brand selectors in
components). A brand is therefore nothing but a token emission: switching
brands or modes re-emits tokens under a class scope on the root element, and
every component restyles itself with **zero duplicated component CSS**.

The theming machinery lives in its own library, `libs/theme`
(`@m3kit/theme`), so it travels with the rest of the copy-in deliverable:

```
libs/theme/
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
"stylePreprocessorOptions": { "includePaths": ["libs/theme/src"] }
```

This block is set on the `build` target of `apps/demo-reporting/project.json`
(the dev server inherits it via `buildTarget`) and on the `storybook` /
`build-storybook` targets of `libs/table/project.json`. With it
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
| `--app-status-draft-bg` / `--app-status-draft-fg` | `libs/table/src/lib/data-table.component.scss` (status badge cells) | Brands provide separate light and dark maps; `brand-dark()` re-emits all ten pairs. |
| `--app-status-sent-bg` / `--app-status-sent-fg` | same | same |
| `--app-status-paid-bg` / `--app-status-paid-fg` | same | same |
| `--app-status-overdue-bg` / `--app-status-overdue-fg` | same | same |
| `--app-status-void-bg` / `--app-status-void-fg` | same | same |

Pick badge pairs the way M3 picks container/on-container roles: a muted
container background with a high-contrast foreground from the same hue family,
flipped in tone for dark mode (see the `$_status-light` / `$_status-dark` maps
in any brand module for worked values).

### Severity feedback tokens

Container / on-container color pairs for feedback surfaces (banners, inline
alerts), one per severity. The kind list is closed: `info`, `success`,
`warning`, `error` (the `$severity-kinds` list in `_contract.scss`). The
`severity-tokens()` helper errors at compile time if a brand omits any kind,
so a partial feedback palette cannot ship.

**Per-brand adoption is optional polish.** Feedback components consume these
tokens through chained `var()` fallbacks onto M3 system container pairs, so a
brand that never calls `severity-tokens()` still renders correct feedback
surfaces from its `mat.theme` emission. One rule keeps that true: a brand
that does **not** adopt the mixin must call `severity-tokens-reset()` from
both `brand-light()` and `brand-dark()`. The default brand emits its severity
pairs at bare `html` / `html.dark`, so without the reset those pairs would
cascade into every `html.theme-<brand>` scope and shadow the fallbacks
(`initial` on a custom property restores its guaranteed-invalid initial
value, which is what lets the chained `var()` fallbacks engage). The
fallback mapping is fixed:

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-severity-info-bg` / `--app-severity-info-fg` | `libs/feedback/src/lib/banner.component.scss` and `libs/feedback/src/lib/snackbar.styles.scss` (severity surfaces), falling back to `--mat-sys-primary-container` / `--mat-sys-on-primary-container` | Brands that adopt the mixin provide separate light and dark maps; `brand-dark()` re-emits all four pairs. |
| `--app-severity-success-bg` / `--app-severity-success-fg` | same, falling back to `--app-status-paid-bg` / `--app-status-paid-fg`, then `--mat-sys-primary-container` / `--mat-sys-on-primary-container` | same |
| `--app-severity-warning-bg` / `--app-severity-warning-fg` | same, falling back to `--mat-sys-tertiary-container` / `--mat-sys-on-tertiary-container` | same |
| `--app-severity-error-bg` / `--app-severity-error-fg` | same, falling back to `--mat-sys-error-container` / `--mat-sys-on-error-container` | same |

Pick severity pairs the way you pick status pairs — muted container,
high-contrast foreground from the same hue family, flipped in tone for dark
mode. The Instruments worked values (`$_severity-light` / `$_severity-dark`
in the default brand module) derive from its status palette discipline: info
shares the primary family, success the paid family, error the overdue family,
and warning the tertiary family (DESIGN.md: "warning = tertiary family").

### Delta sentiment tokens

Optional overrides for the stat-delta sentiment roles. Consumers fall back
onto the DESIGN.md sentiment mapping (positive → tertiary, negative →
error), so a brand emits these via `delta-tokens()` only when those roles
collide with its palette — a red-family tertiary would make positive deltas
read as losses (Field Guide's soft coral and Brutalist's signal red are the
two shipped cases; both remap positive → `var(--mat-sys-primary)`).

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-delta-positive` | `libs/dashboard/src/lib/stat-list.component.scss` (upward deltas), falling back to `--mat-sys-tertiary` | Brands emit `var(--mat-sys-*)` references, which resolve at the consuming element — a single light emission tracks the dark re-emission. |
| `--app-delta-negative` | same, falling back to `--mat-sys-error` | same |

### Shape tokens

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-radius-badge` | `libs/table/src/lib/data-table.component.scss` and `libs/table/src/lib/page-toolbar.component.scss` (chip/badge silhouettes; `999px` = pill) | Emitted in `brand-light()` only; dark inherits (radius never changes with mode). |
| `--app-radius-card` | Reserved for the component layer (cards and panels); emitted by every brand so components can adopt it without a theme change. | same |
| `--app-radius-control` | Reserved for the component layer (inputs, buttons, chips). | same |

### Typography token

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-font-data` | Data-table cells, kpi-strip and stat-list values, timeline metadata, and chart axis numerals (all with a `'JetBrains Mono'` fallback). The data-cell (tabular figures / mono) stack, emitted via the `font-data()` helper. | Light-only emission; dark inherits. |

### Chart series tokens

The categorical data-series palette. The slot count is closed: exactly six
(`$chart-series-count` in `_contract.scss`); the `chart-tokens()` helper
errors at compile time on any other count, so a partial series palette
cannot ship.

| Token | Consumed by | Light/dark notes |
|---|---|---|
| `--app-chart-1` … `--app-chart-6` | The chart component layer (series fills/strokes). Consumers cycle through the tokens in order — series *n* takes `--app-chart-((n − 1) mod 6 + 1)` — and never pick colors themselves. | Brands provide separate light and dark lists; `brand-dark()` re-emits all six with tones lifted/desaturated for dark surfaces. |

Pick six **distinct, accessible** hues that carry the brand's identity (see
the `$_chart-light` / `$_chart-dark` lists in any brand module for worked
values): each color should be distinguishable from its neighbors and read
clearly against the brand's surface color in that mode.

## The brand mixin contract

A brand is one SCSS module exposing two **zero-argument** mixins:

- **`brand-light()`** — emits the full theme: `mat.theme` with `color`
  (light), `typography`, and `density`; `contract.status-tokens($light-map)`;
  a severity emission (`contract.severity-tokens($light-map)` or
  `contract.severity-tokens-reset()`); `contract.radius-tokens(...)`;
  `contract.material-shape-bridge()`; `contract.font-data(...)`;
  `contract.chart-tokens($light-list...)`; and `color-scheme: light`.
- **`brand-dark()`** — re-emits **only what changes in dark mode**: `mat.theme`
  with dark `color` only; `contract.status-tokens($dark-map)`; the severity
  emission (the default brand emits dark severity at bare `html.dark`, so
  non-adopting brands reset here too); `contract.chart-tokens($dark-list...)`;
  and `color-scheme: dark`. Typography, density, and radius are *not*
  re-emitted — the brand's light selector always also matches in dark mode,
  so those tokens cascade through (see "Light/dark wiring").

The contract's emit helpers enforce the token names so brands cannot drift:

- `status-tokens($map)` — `$map` is `(kind: (bg: <color>, fg: <color>))`
  covering every `$status-kinds` entry; missing kinds are a compile error.
- `severity-tokens($map)` — `$map` is `(kind: (bg: <color>, fg: <color>))`
  covering every `$severity-kinds` entry; missing kinds are a compile error.
  Optional polish (see "Severity feedback tokens" above): components fall
  back to M3 system pairs when a brand does not emit these.
- `severity-tokens-reset()` — resets every `--app-severity-*` pair to
  `initial` so the fallbacks engage; the required counterpart to *not*
  calling `severity-tokens()` (call it from both mixins).
- `delta-tokens($positive, $negative)` — emits the optional `--app-delta-*`
  sentiment overrides; only for brands whose tertiary collides with the
  error family (see "Delta sentiment tokens" above).
- `radius-tokens($card: 10px, $control: 6px, $badge: 999px)` — defaults are
  the Instruments values; override per brand.
- `material-shape-bridge()` — bridges `--app-radius-control` onto the
  Material button shape tokens (M3 defaults buttons to full pills); call it
  from `brand-light()` alongside `radius-tokens()`. The `var()` resolves per
  scope, so pill-control brands keep their pills.
- `font-data($family)` — emits `--app-font-data`, the data-cell stack (see
  table above).
- `chart-tokens($colors...)` — emits `--app-chart-1..6` from exactly six
  series colors, in order; any other count is a compile error.

### When system tokens are not enough: Material override mixins

M3 system tokens cover most of a brand's range, but some registers need more
(hard-contrast pure-white/near-black surfaces, a squared component silhouette
Material's shape tokens don't reach). The sanctioned escape hatch is **Material
token overrides emitted inside the brand mixins**:

- `mat.theme-overrides((...))` — override M3 *system* tokens after
  `mat.theme` (see Brutalist's surface overrides in
  `apps/demo-reporting/src/styles/themes/_brutalist.scss`).
- `mat.<component>-overrides((...))` — Angular Material's per-component
  override mixins (e.g. `mat.card-overrides`, `mat.button-overrides`), for
  pushing one Material surface beyond what system tokens express.

Both are still pure token emission under the brand's root class — the
per-brand-component-CSS ban stands. And the hatch is for *Material* tokens
only: if the gap is kit-specific (no Material token exists for it), **extend
the `--app-*` contract** with a new documented token rather than hardcoding.
After any override, re-check the brand across the Material Parity Storybook
gallery (`libs/table/.storybook/parity/`) — that gallery is the regression
surface for the full brand range.

### Reference implementations

- `libs/theme/src/m3kit-theme/themes/instruments/_brand.scss` —
  the default brand, shipped inside the lib.
- `apps/demo-reporting/src/styles/themes/_*.scss` — eleven example
  *consumer* brands living app-side, exactly where your own brands will
  live.

The full roster (seeds and fonts per module; voice descriptions in
`DESIGN.md › Multi-brand themes`):

| Brand | Module | Primary / accent seeds | Fonts (heading / body + data) |
|---|---|---|---|
| Instruments (default) | `libs/theme` `themes/instruments` | `#1B4FD8` cobalt / `#C45F1A` burnt sienna | DM Serif Display / Instrument Sans + JetBrains Mono |
| Terminal | `_terminal.scss` | `#2FD584` phosphor green / `#F59E0B` amber | Archivo / IBM Plex Mono |
| Ledger | `_ledger.scss` | `#6B1F2A` oxblood / `#B08D3E` gold leaf | Fraunces / Source Sans 3 |
| Field Guide | `_field-guide.scss` | `#1E9E5A` kelly / `#E8604C` soft coral | Outfit / DM Mono |
| Carbon | `_carbon.scss` | `#0F62FE` IBM blue / `#6F6F6F` steel | IBM Plex Sans / IBM Plex Mono |
| Brutalist | `_brutalist.scss` | `#111111` ink / `#E11900` signal red | Archivo 900 / Archivo 500 + IBM Plex Mono |
| Meadow | `_meadow.scss` | `#8B7EC8` lavender / `#6FBF8F` mint | Nunito / DM Mono |
| Beacon | `_beacon.scss` | `#0050B3` accessible blue / `#B34700` burnt orange | Atkinson Hyperlegible / Source Sans 3 |
| Noir | `_noir.scss` | `#C9A961` champagne gold / `#8C6D4F` bronze | Cormorant Garamond / Jost + JetBrains Mono |
| Pop | `_pop.scss` | `#D6006C` magenta / `#00B8D9` cyan | Baloo 2 / Fredoka + DM Mono |
| Gazette | `_gazette.scss` | `#1A1A1A` ink / `#1D4ED8` link-blue | Playfair Display / Libre Franklin + PT Mono |
| Synth | `_synth.scss` | `#00D4AA` neon teal / `#FF3D8A` neon pink | Chakra Petch / JetBrains Mono |

### Theme matrix

What each shipped brand actually emits, side by side — scan this to pick the
starting brand closest to your register, then read its module for the worked
values. Every brand emits all five status pairs, a severity emission, the
three radius tokens, `--app-font-data`, and all six chart slots (the closed
lists are compile-enforced); the columns call out the *character* of each
emission plus the brand's severity decision. "Fallback" in the severity
column means the brand calls `severity-tokens-reset()` in both mixins and
feedback surfaces render from the contract's fixed fallback chain (info →
primary-container, success → status-paid → primary-container, warning →
tertiary-container, error → error-container).

| Brand | `mat.theme` seeds | Status tokens | Severity tokens | Radius (card/control/badge) / font signature |
|---|---|---|---|---|
| Instruments | Cobalt `#1B4FD8` primary, burnt sienna `#C45F1A` tertiary, cool-slate neutrals | M3 container pastels: cobalt sent, forest paid, crimson overdue | **Adopted** — status-palette discipline: info cobalt, success forest, warning sienna (tertiary family), error crimson | 10 / 6 / 999 (pill badges) · DM Serif Display / Instrument Sans + JetBrains Mono |
| Terminal | Phosphor green `#2FD584`, amber `#F59E0B`, charcoal neutral; dark-first | Console channels: cyan sent, phosphor paid, signal-red overdue | Fallback — deliberately kept: it lands on the brand's own console channels (info → phosphor primary container, warning → amber tertiary container) | 4 / 3 / 3, no pills · Archivo + IBM Plex Mono data |
| Ledger | Oxblood `#6B1F2A`, gold leaf `#B08D3E`, warm-stone neutral | Heirloom inks: gold sent, ink-green paid, oxblood overdue | **Adopted** — the info fallback (oxblood primary container) is a red-family surface, visually adjacent to error in a red/gold brand, so info takes the ink-navy register instead; success ink green, warning gold leaf, error oxblood | 2 / 2 / 0 square print · Fraunces / Source Sans 3 |
| Field Guide | Kelly `#1E9E5A`, soft coral `#E8604C`, warm gray (ink-navy dark neutrals) | Specimen pastels: sand draft, sky sent, kelly paid, coral overdue | Fallback — lands on-brand (warning → coral tertiary, success → kelly paid). Overrides delta sentiment: positive → primary (the coral tertiary would read as a loss) | 16 / 12 / 999 rounded notebook · Outfit + DM Mono |
| Carbon | IBM blue `#0F62FE`, steel `#6F6F6F`, cool gray | Enterprise pairs: IBM blue sent, IBM green paid, IBM red overdue, purple void | Fallback — info lands in the IBM-blue primary container, the correct family; warning falls to the quiet steel tertiary (see nuances below) | 2 / 2 / 2 squared · IBM Plex Sans + IBM Plex Mono |
| Brutalist | Ink `#111111`, signal red `#E11900`, concrete gray; pure white/black surface overrides via `mat.theme-overrides` | Stark stamps, not pastels: black/white inversion sent, acid-green paid, solid-red overdue | **Adopted** — the warning fallback (signal-red tertiary container) would be indistinguishable from error, so warning is the ink/paper inversion stamp; info quiet concrete, success acid green, error solid red. Also overrides delta sentiment: positive → primary | 0 / 0 / 0 hard corners · Archivo 900/500 + IBM Plex Mono |
| Meadow | Lavender `#8B7EC8`, mint `#6FBF8F`, gray-lilac neutral | Gentle pastels: sage paid, sky sent, blush overdue | Fallback — info → lavender, warning → mint | 20 / 14 / 999 soft · Nunito + DM Mono |
| Beacon | Accessible blue `#0050B3`, burnt orange `#B34700`, neutral `#444444`; AAA-leaning pairings | High-contrast pairs past 7:1 in both modes | Fallback — info → deep blue, warning → burnt orange | 6 / 4 / 6 modest, no pills · Atkinson Hyperlegible + Source Sans 3 data |
| Noir | Champagne gold `#C9A961`, bronze `#8C6D4F`, warm charcoal; dark-first | Candlelit inks: gold sent, deep-green paid, oxblood overdue | Fallback — info → gold, warning → bronze | 2 / 2 / 2 knife-edge · Cormorant Garamond / Jost + JetBrains Mono |
| Pop | Magenta `#D6006C`, cyan `#00B8D9`, violet-cast gray | Candy containers: blue-raspberry sent, lime paid, strawberry overdue | Fallback — info → magenta, warning → cyan | 24 / 999 / 999 gumdrop (pill buttons preserved by the shape bridge) · Baloo 2 / Fredoka + DM Mono |
| Gazette | Ink `#1A1A1A`, link-blue `#1D4ED8`, newsprint gray | Ink-on-paper: link-blue sent, ink-green paid, ink-red overdue | Fallback — info → ink-gray, warning → link-blue tertiary | 0 / 0 / 0 rules-not-boxes · Playfair Display / Libre Franklin + PT Mono |
| Synth | Neon teal `#00D4AA`, neon pink `#FF3D8A`, blue-charcoal; dark-first neon (documented doctrine deviation in the module) | Neon-coded: cyan sent, teal paid, pink overdue | Fallback — info → teal, warning → pink | 4 / 4 / 4 uniform chamfer · Chakra Petch + JetBrains Mono |

#### Known register nuances

Documented decisions, not defects — kept as-is deliberately:

- **Carbon's warning is quiet.** The warning fallback lands in the steel-gray
  tertiary container — semantically muted but on-register for the enterprise
  chrome. Revisit with a tuned `severity-tokens()` map only if a
  warning-severity story ships.
- **Six fallback brands are correct-by-construction but not yet
  pixel-checked.** Meadow, Beacon, Noir, Pop, Gazette, and Synth render
  severity from the contract's fallback chain; their banner and timeline
  surfaces deserve a visual spot-check in both modes before leaning on them
  for severity-heavy screens. (Terminal, Field Guide, and Carbon fallbacks
  have been verified in both modes.)
- **Gazette's warning reads as link ink.** Its tertiary *is* the link-blue
  accent, so the warning fallback is a blue container — attention as ink, not
  amber. On-register for a newspaper; adopt a tuned map if warnings need
  conventional caution colors.
- **Beacon's type scale stays global.** A slightly larger body size would
  suit the brand, but the `mat.theme` typography shorthand (and the `--app-*`
  contract) carries families/weights only — type scale is not a per-brand
  variable (noted in `_beacon.scss`).

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
  // Not adopting severity pairs (the fallbacks are fine for indigo):
  // reset so the default brand's bare-`html` emission never shadows them.
  @include contract.severity-tokens-reset();
  @include contract.radius-tokens($card: 14px, $control: 8px, $badge: 999px);
  @include contract.material-shape-bridge();
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
  // The default brand also emits dark severity at bare `html.dark`.
  @include contract.severity-tokens-reset();
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
- `libs/table/.storybook/preview-head.html` — same addition.

Runtime loading from the Google Fonts CDN is this reference's accepted
approach (see ADR-012 in [DECISIONS.md](./DECISIONS.md)); all families used
are OFL-licensed (Material Icons is Apache-2.0). Adopters with offline,
privacy, or supply-chain requirements can self-host instead: download the
same families, serve them from your own infrastructure, and replace the
`<link>` tags with `@font-face` rules in your global styles.

### 5. Add the brand to the Storybook toolbar

In `libs/table/.storybook/preview.ts`, extend the `BRANDS` array
and the `brand` toolbar items:

```ts
const BRANDS = [
  'instruments', 'terminal', 'ledger', 'field-guide', 'carbon', 'brutalist',
  'meadow', 'beacon', 'noir', 'pop', 'gazette', 'synth', 'midnight',
] as const;
// ...
items: [
  // ...existing brands...
  { value: 'midnight', title: 'Midnight' },
],
```

Run `npx nx serve demo-reporting` and `npx nx run m3kit-table:storybook`
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
own: `libs/table/.storybook/storybook-theme.scss` `@use`s the
demo app aggregator and calls `app-theme()`. The includePath on the
`storybook` / `build-storybook` targets makes `m3kit-theme` resolve there
too.

`libs/table/.storybook/preview.ts` defines two `globalTypes`
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
  anywhere. If a brand seems to need one, the answer is token emission: a
  Material token override inside the brand mixins (see "When system tokens
  are not enough" above) for Material-expressible needs, or a new `--app-*`
  contract token (a documented decision) for kit-specific ones.
- **Motion** — durations and easing follow DESIGN.md globally.

This is recorded as a binding decision in `DESIGN.md` (Decisions Log,
"Multi-brand architecture": *layout signatures stay out of token scope*).

## Bringing this into your own workspace

`libs/theme` is part of the copy-in deliverable (see
`docs/ADOPTION_GUIDE.md`). After copying, re-create the
`stylePreprocessorOptions.includePaths` entry on your app's build target (and
Storybook targets, if you take the Storybook), pointing at wherever you placed
`libs/theme/src`. Your own brand modules follow the consumer-brand
pattern above: live app-side, `@use 'm3kit-theme' as contract`, implement
`brand-light()` / `brand-dark()`.
