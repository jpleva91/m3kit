---
status: exemplar
description: "Worked spec-kit template: implementation plan for adding the Midnight brand"
---

# Implementation Plan: Add a Custom Brand ("Midnight")

> **EXEMPLAR — NOT PENDING WORK.** Copyable documentation of how a brand
> addition is planned against the m3kit token contract. See spec.md for the
> matching specification and `docs/THEMING.md` for the narrative walkthrough.

**Branch**: `002-exemplar-add-brand` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-exemplar-add-brand/spec.md`

## Summary

Add "Midnight" — deep indigo nocturne, Space Grotesk throughout — as a fifth
runtime-switchable brand, light + dark, implemented purely as a token
re-emission: generate M3 palettes from seeds with the `theme-color`
schematic, implement the two-mixin brand module against the `m3kit-theme`
contract, register the root class in the app aggregator and `ThemeService`,
load the fonts in both documents, and add the brand to the Storybook toolbar.
Zero component changes; exit criterion is a clean brand × mode matrix in app
and Storybook with the workspace gate green.

## Technical Context

**Language/Version**: SCSS (dart-sass via the Angular esbuild builder) +
TypeScript 5.7.x for the two registration points; Angular 19.2.x, Angular
Material 19.2.x (pinned stack — no version changes)

**Primary Dependencies**: `@angular/material` (the `mat.theme` mixin and the
`@angular/material:theme-color` schematic), the `m3kit-theme` SCSS contract
(`libs/reporting/theme`, resolved via the `stylePreprocessorOptions`
includePath). **No new packages.**

**Storage**: N/A (brand preference persistence already exists in
`ThemeService` localStorage handling — no changes)

**Testing**: Compile-time contract checks (`status-tokens()` /
`chart-tokens()` SCSS errors), the standard workspace gate
(`npx nx run-many -t lint test build`), `build-storybook` compiling clean,
and a manual brand × mode matrix walk in Storybook and the served app. No new
unit tests: the brand contains no logic, and the contract helpers are already
covered by the theme lib.

**Target Platform**: Modern evergreen browsers (same as the kit)

**Project Type**: Additive theming change in an Nx monorepo — app-side styles
plus two registration points; no lib code

**Performance Goals**: No measurable build- or runtime-size impact beyond one
additional brand emission (~the size of one existing consumer brand)

**Constraints**: Token-only styling (the closed `--app-*` contract + M3
system tokens); no per-brand component CSS; DESIGN.md anti-patterns binding;
OFL-licensed fonts only (ADR-012); layout out of token scope

**Scale/Scope**: 2 new SCSS partials, 5 small edits (aggregator, theme
service, two font documents, Storybook preview), 0 component changes

## Constitution Check

*GATE: Must pass before implementation.*

| Principle | Gate | Status |
|---|---|---|
| I. Clean-Room Integrity | Only public sources (material.angular.dev theming docs, Google Fonts); consultations logged in `docs/BOUNDARY_LOG.md`; seeds and palette values authored for this brand. | PASS |
| II. Source-Internalization First | Consumer-brand pattern: plain SCSS partials app-side, no abstraction, exactly mirrors how an adopter adds brands after copy-in. | PASS |
| III. Pinned-Stack Discipline | No dependency or version changes; uses the in-repo Material schematic. | PASS |
| IV. Phasing and Review Gates | Feature-phase work; lands behind the standard gate. | PASS |
| V. Synthetic Data Only | No data involved; demo copy unchanged. | PASS |
| VI. Boundary-Log Duties | Schematic/docs consultations logged at the time they happen. | PASS |
| VII. Simplicity Bias | Two mixins and five registrations; no new tokens, no contract changes, no speculative theming machinery. | PASS |

No violations; the Complexity Tracking section is empty.

## Design Inputs

**Seeds** (the brand's only hand-picked color decisions; everything M3 is
derived):

| Role | Seed | Intent |
|---|---|---|
| Primary | `#3F51B5` | deep indigo — the nocturnal anchor |
| Tertiary | `#8E7CC3` | dusty violet accent |
| Neutral | `#5C5F6E` | slate-blue greys, never pure black |

**Typography**: Space Grotesk for both `plain-family` and `brand-family`
(single-family brand voice), `bold-weight: 600`.

**Hand-authored token values** (outside M3 derivation, per contract):

- Status pairs — ten container/on-container pairs (five kinds × light/dark),
  picked the M3 way: muted container bg + high-contrast fg from the same hue
  family, tones flipped for dark (worked values in `docs/THEMING.md`).
- Radii — `radius-tokens($card: 14px, $control: 8px, $badge: 999px)`
  (rounder than Instruments; badge stays pill).
- Chart series — six distinct hues per mode carrying the indigo-nocturne
  identity; dark list lifted/desaturated for dark surfaces. Exactly six
  (`chart-tokens()` enforces the count).

## Project Structure

### Documentation (this feature)

```text
specs/002-exemplar-add-brand/
├── spec.md              # Feature specification
├── plan.md              # This file
└── tasks.md             # Task breakdown
```

### Source Code (repository root)

```text
apps/demo-reporting/src/
├── styles/
│   ├── _theme.scss                      # EDIT: register html.theme-midnight{,.dark}
│   └── themes/
│       ├── _midnight-colors.scss        # NEW: schematic output (M3 palettes)
│       └── _midnight.scss               # NEW: brand-light()/brand-dark() module
├── app/core/theme.service.ts            # EDIT: ThemeBrand union + THEME_BRANDS
└── index.html                           # EDIT: Google Fonts link += Space Grotesk

libs/reporting/material/.storybook/
├── preview.ts                           # EDIT: BRANDS array + toolbar items
└── preview-head.html                    # EDIT: fonts link += Space Grotesk
```

**Structure Decision**: Midnight is a *consumer brand* — it lives app-side
beside `_terminal.scss` / `_ledger.scss` / `_field-guide.scss`, exactly where
an adopter's own brands go. Only the default brand (Instruments) ships inside
`libs/reporting/theme`. Nothing under `libs/reporting/*` changes.

### Registration points (the complete wiring surface)

| # | File | Change |
|---|---|---|
| 1 | `apps/demo-reporting/src/styles/themes/_midnight-colors.scss` | Output of `npx nx g @angular/material:theme-color` for the three seeds |
| 2 | `apps/demo-reporting/src/styles/themes/_midnight.scss` | `@use 'm3kit-theme' as contract;` implement `brand-light()` (mat.theme color+typography+density, status-tokens light, radius-tokens, chart-tokens light, `color-scheme: light`) and `brand-dark()` (mat.theme dark color, status-tokens dark, chart-tokens dark, `color-scheme: dark`) |
| 3 | `apps/demo-reporting/src/styles/_theme.scss` | `@use './themes/midnight';` + `html.theme-midnight { @include midnight.brand-light(); }` + `html.theme-midnight.dark { @include midnight.brand-dark(); }` |
| 4 | `apps/demo-reporting/src/app/core/theme.service.ts` | Add `'midnight'` to the `ThemeBrand` union and `THEME_BRANDS`; the service handles class toggling and persistence |
| 5 | `apps/demo-reporting/src/index.html` | Append `&family=Space+Grotesk:wght@400;500;600` to the Google Fonts `<link>` |
| 6 | `libs/reporting/material/.storybook/preview-head.html` | Same font addition (Storybook is a separate document) |
| 7 | `libs/reporting/material/.storybook/preview.ts` | Add `'midnight'` to `BRANDS` and `{ value: 'midnight', title: 'Midnight' }` to the brand toolbar items |

### Light/dark layering (why `brand-dark()` is partial)

`html.theme-midnight` still matches when `dark` is present, so the light
emission's typography, density, and radius tokens cascade into dark mode;
`brand-dark()` re-emits only the color-bearing tokens (M3 color, status,
chart) plus `color-scheme`. Re-emitting everything would be harmless but
redundant — the kit's brands all follow this shape.

### Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Partial token emission (missing status kind / wrong chart count) renders silently broken badges or charts. | The contract helpers are compile-time gates: `status-tokens()` errors on a missing kind, `chart-tokens()` on any count ≠ 6. Trip both deliberately once (T010) to prove the gate. |
| Fonts load in the app but not Storybook (or vice versa) — the two documents have independent `<link>`s. | Registration points 5 and 6 are separate tasks with separate done-criteria; matrix walk checks rendered fonts in both. |
| The brand is registered in SCSS but unreachable (or vice versa) because `ThemeService` and the aggregator drift. | Points 3 and 4 are one task (T005) verified together by switching to Midnight in the served app. |
| Chart hues illegible on Midnight's dark surfaces. | Separate dark list with lifted/desaturated tones (contract requires per-mode lists); checked against dark surface in the matrix walk. |
| Temptation to "fix" a component for Midnight. | Forbidden by FR-008/the contract; any need for per-brand CSS is escalated as a token-contract proposal instead. |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations — nothing to track.
