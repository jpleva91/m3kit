# Design System — "Instruments" (m3kit libs / demo-reporting)

## Product Context
- **What this is:** m3kit, a clean-room rethemable Material 3 UI component library for Angular — data tables, dashboard cards, charts, typed forms, app-shell presets — built for source internalization; demonstrated by a synthetic-data reporting demo app.
- **Who it's for:** Senior frontend engineers evaluating and adopting the code into enterprise workspaces.
- **Demo domain:** Enterprise reporting / operational dashboards (the demo app only; the libraries are domain-neutral).
- **Project type:** Component library + demo web app + Storybook showcase.

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
- **Chart series palette (added 2026-06-11):** each brand emits a closed categorical series palette, `--app-chart-1..6` (the `chart-tokens()` contract helper) — six distinct, accessible hues per brand, with separate light and dark lists (dark tones lifted/desaturated for dark surfaces). Chart consumers cycle through the tokens in order and never pick colors themselves. Instruments runs a cobalt-led cool analytical set (cobalt, sienna, teal, violet, forest, raspberry); alternates carry their own identities (Terminal: console channels; Ledger: editorial inks; Field Guide: specimen-plate naturals).
- **Deltas (clarified 2026-06-11):** positive deltas use the tertiary role (the brand's warm accent — sienna in Instruments), negative deltas use the error role. "Sienna on deltas" in the Color approach means the tertiary role, not a literal color.
- **Dark mode:** First-class. Re-emit color tokens with `theme-type: dark`; saturation softens via M3 tonal mapping; all status badges invert through their container pairs.
- **Hard rule:** No hardcoded colors in components — `var(--mat-sys-*)` or status-palette tokens only.

## Spacing
- **Base unit:** 8px.
- **Density (M3 density scale):** data tables `-2` (compact, analytical — 12+ rows per viewport); forms/filter panels `-1` (roomier than tables, deliberately); cards/navigation `0` (landmarks breathe).
- **Scale:** 2xs(2) xs(4) sm(8) ms(12) md(16) lg(24) xl(32) 2xl(48). (12 added 2026-06-11: it was already the de facto step for intra-card rhythm across components; spec now matches code.)

## Layout
- **Approach:** Grid-disciplined; strong horizontal structure — the dashboard reads like a briefing document, not card soup.
- **Navigation:** Per-brand shell presets (2026-06-11): the demo app maps each brand to a layout preset — Instruments → responsive sidenav, Terminal → top command bar with status footline, Ledger → editorial contents rail, Field Guide → centered pill tabs. Presets are brand-agnostic compositions in the app layer (`core/layout-presets.ts`); libs stay layout-neutral.
- **Max content width:** none for app surfaces (data wants width); docs/preview pages 1080px.
- **Border radius:** sm 6px (controls), md 8–10px (cards), full 999px (badges only).
- **Elevation:** Minimal. Tables are not elevated; reserve shadow for overlays/drawers.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out).
- **Duration:** micro(50–100ms) short(150–250ms); nothing longer without a reason.

## Multi-brand themes
**Instruments** (this document) is the default brand. Eleven alternate brand themes are selectable at runtime — a brand-switcher in the app toolbar and a Storybook toolbar apply a `theme-<brand>` class (plus `dark`) to the root element, and each brand re-emits the full token set (`--mat-sys-*`, `--app-status-*`, `--app-radius-*`, `--app-font-data`, `--app-chart-*`) from its own module — Instruments ships in `libs/theme` (the rethemable kit's contract + default brand), the eleven alternates live in `apps/demo-reporting/src/styles/themes/` as example consumers. Every brand ships light and dark. Layout signatures are NOT token-expressible; they are delivered as shell/page presets in the demo app (see Layout), selected per brand by default while remaining freely recombinable — any brand can wear any preset.

- **Terminal** — operations-console energy: phosphor green on charcoal, dark-first, utilitarian and dense; the dashboard should read like a monitoring console that happens to have a light mode.
- **Ledger** — bookkeeper's heirloom: oxblood and gold on warm paper, serif-led and unhurried; financial gravitas without nostalgia kitsch.
- **Field Guide** — naturalist's notebook: kelly green and coral on warm white, rounded and approachable; the friendliest voice the data can wear without losing rigor.
- **Carbon** — enterprise workbench: IBM blue on cool gray chrome, Plex everywhere, squared 2px silhouettes; the register of serious internal tooling.
- **Brutalist** — raw concrete: ink on pure paper with signal red, Archivo 900 poster headings, zero curvature anywhere; hard contrast is the brand.
- **Meadow** — soft pastel: lavender and mint over warm white, deeply rounded, Nunito; the gentlest the kit gets without losing alignment.
- **Beacon** — accessibility-first: deep blue and burnt orange in AAA-leaning pairings, Atkinson Hyperlegible throughout; legibility is the aesthetic.
- **Noir** — dark-first luxury: champagne gold on warm near-black, Cormorant Garamond display; light mode is an ivory + ink + gold-rule register.
- **Pop** — candy-bright: magenta and cyan on bright white, pill silhouettes, chunky Baloo 2 display; maximum saturation under the same density rules.
- **Gazette** — newspaper: ink on paper, rules not boxes (all radii 0), Playfair Display masthead headlines, link-blue the only saturated accent.
- **Synth** — synthwave instrument panel: neon teal and pink on blue-charcoal, dark-first, Chakra Petch; a documented doctrine deviation (neon-coded status/chart palettes).

| Brand | Primary seed | Accent seed | Surface character | Heading / body+data fonts |
|---|---|---|---|---|
| Instruments (default) | `#1B4FD8` cobalt | `#C45F1A` burnt sienna | cool slate, technical paper | DM Serif Display / Instrument Sans + JetBrains Mono |
| Terminal | `#2FD584` phosphor green | `#F59E0B` amber signal | charcoal console, dark-first | Archivo / IBM Plex Mono |
| Ledger | `#6B1F2A` oxblood | `#B08D3E` gold leaf | warm paper | Fraunces / Source Sans 3 |
| Field Guide | `#1E9E5A` kelly | `#E8604C` soft coral | warm white, rounded | Outfit / DM Mono |
| Carbon | `#0F62FE` IBM blue | `#6F6F6F` steel | cool gray workbench, squared 2px | IBM Plex Sans / IBM Plex Mono |
| Brutalist | `#111111` ink black | `#E11900` signal red | pure paper ↔ near-black, zero curvature | Archivo 900 / Archivo 500 + IBM Plex Mono |
| Meadow | `#8B7EC8` soft lavender | `#6FBF8F` mint | warm white pastel, deeply rounded | Nunito / DM Mono |
| Beacon | `#0050B3` deep accessible blue | `#B34700` burnt orange | near-neutral, AAA-leaning | Atkinson Hyperlegible / Source Sans 3 |
| Noir | `#C9A961` champagne gold | `#8C6D4F` bronze | warm near-black, dark-first luxe | Cormorant Garamond / Jost + JetBrains Mono |
| Pop | `#D6006C` magenta | `#00B8D9` cyan | bright white candy, pill silhouettes | Baloo 2 / Fredoka + DM Mono |
| Gazette | `#1A1A1A` ink | `#1D4ED8` link-blue | paper white, rules not boxes | Playfair Display / Libre Franklin + PT Mono |
| Synth | `#00D4AA` neon teal | `#FF3D8A` neon pink | blue-charcoal neon panel, dark-first | Chakra Petch / JetBrains Mono |

Brand modules implement the mixin contract documented in `@m3kit/theme` (`libs/theme/src/m3kit-theme/_contract.scss`, resolved via the `libs/theme/src` style includePath as `@use 'm3kit-theme'`): `brand-light()` emits `mat.theme` color+typography+density plus status, radius, font-data, and chart tokens; `brand-dark()` re-emits color, status, and chart tokens only.

## Material as the engine
The kit's public API is the `m3k-*` component set plus the token contract (`--mat-sys-*` system tokens + the `--app-*` custom-prop API). Angular Material is the **internal implementation** — an engine, not a surface adopters or brands style against. Three consequences (binding):

- **Wrap, don't leak.** Demo and adopter code composes `m3k-*` components; raw Material usage inside `libs/*` is an implementation detail that may be restyled or replaced without notice. Retheming happens through tokens, never by targeting Material internals from app code.
- **Brands may push beyond the Material look.** Where M3 system tokens cannot carry a brand's register, brand modules may override Material tokens directly inside `brand-light()` / `brand-dark()`: system-level `mat.theme-overrides(...)` (Brutalist's pure-paper / near-black surfaces) and per-component `mat.<component>-overrides(...)` mixins. This is still pure token emission under the brand's root scope — the no-per-brand-component-CSS rule stands, and kit-specific gaps (no Material token exists) still extend the `--app-*` contract instead.
- **The parity gallery is the brand-range regression surface.** `libs/table/.storybook/parity/` (the "Material Parity" Storybook section, 33 stories) renders every Angular Material surface under the brand × mode toolbar. Any contract change, brand addition, or Material token override must keep all 12 brands × 2 modes presentable there — the gallery is where "does the engine still disappear behind the brand?" gets answered.

## Anti-patterns (binding)
No gradients as brand. No glassmorphism. No purple bias. No shadow-on-everything. No rainbow status pills. No skeleton-shimmer theater in stories. No oversized icons (Material Symbols, small optical sizes, light weights). No hero/landing composition in the demo app.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-11 | Initial "Instruments" system | Three-voice design consultation (two independent model proposals + research synthesis); unanimous on density split, mono numerics, cool neutrals; serif KPI numerals and cobalt+sienna chosen as deliberate risks; validated in a rendered light/dark preview before adoption. |
| 2026-06-11 | Commercial font substitution | An outside proposal suggested Söhne; rejected (commercial license). Instrument Sans substituted — OFL, Google Fonts. |
| 2026-06-11 | Brand layout presets | Owner direction after comparing the live app to the approved design-exploration mocks: each brand's mock composition (command bar / editorial rail / pill tabs) is implemented as a reusable layout preset; brands select a default preset at the app layer; tokens and layout remain decoupled. |
| 2026-06-11 | Multi-brand architecture | Owner decision after design exploration: four runtime-switchable brands (Instruments default + Terminal, Ledger, Field Guide), each light+dark, as token-only re-emissions behind `theme-<brand>`/`dark` classes; layout signatures stay out of token scope. |
| 2026-06-11 | Chart series token family (`--app-chart-1..6`) | Charts need a categorical series palette that rethemes with the brand; ad-hoc per-chart colors would break the token-only rule. Added `chart-tokens()` to the contract (closed set of six, compile-time count check, light+dark lists per brand); all four brands emit identity-fitting series sets. |
| 2026-06-11 | Material as the engine (wrap-Material doctrine) | The public API is the `m3k-*` component set + the token contract; Angular Material is internal implementation. Brands may exceed the stock Material look via Material token overrides (`mat.theme-overrides` / per-component `mat.<component>-overrides` mixins) emitted inside brand modules — token emission only, no per-brand component CSS; kit-specific gaps extend the `--app-*` contract. The Material Parity Storybook gallery (`libs/table/.storybook/parity/`) is the brand-range regression surface across all 12 brands × 2 modes. |
| 2026-06-11 | Token contract extracted to `libs/theme` | The `--app-*` custom-prop API, the `brand-light()`/`brand-dark()` mixin contract, and the default Instruments brand now live in the copy-in deliverable (`libs/theme/src/m3kit-theme/_contract.scss`) rather than app styles, so adopters get the theming machinery with the components. Terminal/Ledger/Field Guide stay app-side as example consumer brands. Adopter walkthrough: `docs/THEMING.md`. |
