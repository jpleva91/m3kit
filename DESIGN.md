# Design System — "Instruments" (demo-reporting / reporting libs)

## Product Context
- **What this is:** Clean-room Angular Material 3 reporting reference — report tables, dashboard cards, typed filter forms — built for source internalization.
- **Who it's for:** Senior frontend engineers evaluating and adopting the code into enterprise workspaces.
- **Space/industry:** Enterprise reporting / operational dashboards.
- **Project type:** Web app (demo) + component library showcase (Storybook).

## Aesthetic Direction
- **Direction:** Industrial-editorial "instrument panel" — precision-tool energy, paper-grade clarity.
- **Decoration level:** Minimal — typography and density do all the work.
- **Mood:** Serious production software. The first-glance reaction should be "someone made real decisions here."
- **The memorable thing:** It reads as production software, not tutorial-ware.

## Typography
All fonts are OFL-licensed and served from Google Fonts (license-compatible with Apache-2.0).
- **Display/Hero:** DM Serif Display — page titles and large KPI values only. A serif number reads like a financial prospectus; this is the system's signature move.
- **Body/UI/Labels:** Instrument Sans — neutral, geometric, holds up at negative density.
- **Data/Tables:** JetBrains Mono with `font-variant-numeric: tabular-nums` — invoice numbers, currency, dates. Every numeric column aligns on the decimal.
- **Code:** JetBrains Mono.
- **M3 token mapping:** DM Serif Display → `display-*`/`headline-large` (titles, KPI values via component-level treatment); Instrument Sans → `body-*`, `title-*`, `label-*`; JetBrains Mono applied as a component-level override on data cells (not a global token).
- **Scale:** M3 default type scale; KPI value ≈ 27–32px serif; table cell 12.5–13.5px.

## Color
- **Approach:** Restrained — cobalt is the only brand color in quantity; sienna appears only on deltas, active filters, and selected states.
- **Primary seed:** `#1B4FD8` (cobalt) — precision, cool; inverts to electric periwinkle in dark mode.
- **Tertiary seed:** `#C45F1A` (burnt sienna) — the single warm accent.
- **Neutral seed:** `#79808F` (cool slate) — surfaces lean technical-paper, never pure white; dark mode is deep charcoal, never black.
- **Status palettes** (M3 custom palettes; components consume container/on-container pairs, never raw hex):
  | Status | Seed | Intent |
  |---|---|---|
  | draft | `#7B7B8F` | neutral, uncommitted |
  | sent | `#1B4FD8` | in motion (primary family) |
  | paid | `#1A6B3A` | settled (forest) |
  | overdue | `#B91C1C` | error state, no hedging (crimson) |
  | void | `#3D1A5C` | cancelled, ghosted (deep violet) |
- **Semantic:** success = paid family, error = overdue family, info = primary family, warning = tertiary family.
- **Dark mode:** First-class. Re-emit color tokens with `theme-type: dark`; saturation softens via M3 tonal mapping; all status badges invert through their container pairs.
- **Hard rule:** No hardcoded colors in components — `var(--mat-sys-*)` or status-palette tokens only.

## Spacing
- **Base unit:** 8px.
- **Density (M3 density scale):** data tables `-2` (compact, analytical — 12+ rows per viewport); forms/filter panels `-1` (roomier than tables, deliberately); cards/navigation `0` (landmarks breathe).
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48).

## Layout
- **Approach:** Grid-disciplined; strong horizontal structure — the dashboard reads like a briefing document, not card soup.
- **Navigation:** Sidenav (current). A top-rail variant is a recorded future risk, not current scope.
- **Max content width:** none for app surfaces (data wants width); docs/preview pages 1080px.
- **Border radius:** sm 6px (controls), md 8–10px (cards), full 999px (badges only).
- **Elevation:** Minimal. Tables are not elevated; reserve shadow for overlays/drawers.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out).
- **Duration:** micro(50–100ms) short(150–250ms); nothing longer without a reason.

## Multi-brand themes
**Instruments** (this document) is the default brand. Three alternate brand themes are selectable at runtime — a brand-switcher in the app toolbar and a Storybook toolbar apply a `theme-<brand>` class (plus `dark`) to the root element, and each brand re-emits the full token set (`--mat-sys-*`, `--app-status-*`, `--app-radius-*`) from its own module — Instruments ships in `libs/reporting/theme` (the rethemable kit's contract + default brand), the three alternates live in `apps/demo-reporting/src/styles/themes/` as example consumers. Every brand ships light and dark. Layout signatures (navigation shape, page composition) are out of token scope — brands differ in tokens only.

- **Terminal** — operations-console energy: phosphor green on charcoal, dark-first, utilitarian and dense; the dashboard should read like a monitoring console that happens to have a light mode.
- **Ledger** — bookkeeper's heirloom: oxblood and gold on warm paper, serif-led and unhurried; financial gravitas without nostalgia kitsch.
- **Field Guide** — naturalist's notebook: kelly green and coral on warm white, rounded and approachable; the friendliest voice the data can wear without losing rigor.

| Brand | Primary seed | Accent seed | Surface character | Heading / body+data fonts |
|---|---|---|---|---|
| Instruments (default) | `#1B4FD8` cobalt | `#C45F1A` burnt sienna | cool slate, technical paper | DM Serif Display / Instrument Sans + JetBrains Mono |
| Terminal | phosphor green | — | charcoal console | Archivo / IBM Plex Mono |
| Ledger | `#6B1F2A` oxblood | `#B08D3E` gold | warm paper | Fraunces / Source Sans 3 |
| Field Guide | `#1E9E5A` kelly | `#E8604C` coral | warm white | Outfit / DM Mono |

Brand modules implement the mixin contract documented in `@m3kit/theme` (`libs/reporting/theme/src/m3kit-theme/_contract.scss`, resolved via the `libs/reporting/theme/src` style includePath as `@use 'm3kit-theme'`): `brand-light()` emits `mat.theme` color+typography+density plus status and radius tokens; `brand-dark()` re-emits color and status tokens only.

## Anti-patterns (binding)
No gradients as brand. No glassmorphism. No purple bias. No shadow-on-everything. No rainbow status pills. No skeleton-shimmer theater in stories. No oversized icons (Material Symbols, small optical sizes, light weights). No hero/landing composition in the demo app.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-11 | Initial "Instruments" system | Three-voice design consultation (two independent model proposals + research synthesis); unanimous on density split, mono numerics, cool neutrals; serif KPI numerals and cobalt+sienna chosen as deliberate risks; validated in a rendered light/dark preview before adoption. |
| 2026-06-11 | Commercial font substitution | An outside proposal suggested Söhne; rejected (commercial license). Instrument Sans substituted — OFL, Google Fonts. |
| 2026-06-11 | Multi-brand architecture | Owner decision after design exploration: four runtime-switchable brands (Instruments default + Terminal, Ledger, Field Guide), each light+dark, as token-only re-emissions behind `theme-<brand>`/`dark` classes; layout signatures stay out of token scope. |
| 2026-06-11 | Token contract extracted to `libs/reporting/theme` | The `--app-*` custom-prop API, the `brand-light()`/`brand-dark()` mixin contract, and the default Instruments brand now live in the copy-in deliverable (`libs/reporting/theme/src/m3kit-theme/_contract.scss`) rather than app styles, so adopters get the theming machinery with the components. Terminal/Ledger/Field Guide stay app-side as example consumer brands. Adopter walkthrough: `docs/THEMING.md`. |
