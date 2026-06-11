---
status: exemplar
description: "Worked spec-kit template: adding a custom brand to the m3kit token contract"
---

# Feature Specification: Add a Custom Brand ("Midnight")

> **EXEMPLAR — NOT PENDING WORK.** This spec is a complete worked example of
> the spec-kit flow for the most common consumer task: adding a brand. It
> mirrors the walkthrough in `docs/THEMING.md` ("Midnight") and is meant to be
> copied and adapted, not implemented in this repository. The four shipped
> brands (Instruments, Terminal, Ledger, Field Guide) are the kit's proof;
> Midnight stays on paper.

**Feature Branch**: `002-exemplar-add-brand`

**Created**: 2026-06-11

**Status**: Exemplar (template — not scheduled, not implemented)

**Input**: User description: "Add a 'Midnight' brand — a deep-indigo
nocturnal theme (Space Grotesk throughout) — as a fifth runtime-switchable
brand, light and dark, implemented purely as a token re-emission against the
`m3kit-theme` contract. No component changes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Midnight renders every component in both modes (Priority: P1)

As a demo user, I can pick "Midnight" from the app's brand switcher and the
Storybook brand toolbar, toggle light/dark, and see every exported component
fully restyled in the new brand — with zero changes to any component file.

**Why this priority**: The whole value of a brand is the full-matrix reskin.
If any component needs a code change to look right in Midnight, the token
contract is broken and the brand cannot ship.

**Independent Test**: Serve the app and Storybook, select Midnight, walk
every page/story in light and in dark, and confirm the brand applies with no
component diffs in `libs/reporting/*`.

**Acceptance Scenarios**:

1. **Given** the served demo app, **When** the user selects Midnight in the
   brand switcher, **Then** `<html>` carries `theme-midnight`, all pages
   (dashboard, invoices, customers) restyle to the Midnight palette, and the
   choice persists across reloads.
2. **Given** Midnight is active, **When** the user toggles dark mode,
   **Then** the `dark` class is added, M3 color and status tokens re-emit in
   their dark values, typography/density/radius cascade unchanged from light,
   and native UI follows via `color-scheme: dark`.
3. **Given** the running Storybook, **When** the user selects Midnight in the
   brand toolbar, **Then** every story renders in Midnight in both modes (the
   brand × mode matrix renders clean: no unstyled regions, no Instruments
   colors bleeding through, no console errors).
4. **Given** the full change set, **When** it is diffed, **Then** no file
   under `libs/reporting/*` is modified except (if taken as a lib brand)
   additive theme files — component `.ts`/`.html`/`.scss` are untouched.

---

### User Story 2 - The brand emits the complete token contract (Priority: P2)

As a kit maintainer, I can verify the Midnight brand module emits every token
the contract requires — full M3 system tokens plus all `--app-*` families —
so no component can encounter a missing token in either mode.

**Why this priority**: A partially emitted brand fails silently (components
fall back to inherited or default values). The contract's compile-time
helpers exist precisely to make partial brands unshippable.

**Independent Test**: Compile the styles and inspect the emitted custom
properties under `html.theme-midnight` and `html.theme-midnight.dark`;
deliberately remove one status kind and one chart slot and confirm the build
fails.

**Acceptance Scenarios**:

1. **Given** the compiled stylesheet, **When** `html.theme-midnight` is
   inspected, **Then** it contains `mat.theme` output (color + typography +
   density), all ten `--app-status-*-bg/fg` pairs, all three
   `--app-radius-*` tokens, all six `--app-chart-1..6` tokens, and
   `color-scheme: light`.
2. **Given** the compiled stylesheet, **When** `html.theme-midnight.dark` is
   inspected, **Then** it re-emits only dark M3 color tokens, the ten dark
   status pairs, the six dark chart tokens, and `color-scheme: dark` —
   typography, density, and radius are not re-emitted.
3. **Given** the brand module, **When** a status kind is omitted from the
   status map or `chart-tokens()` is called with other than six colors,
   **Then** the SCSS build fails at compile time (`status-tokens()` /
   `chart-tokens()` contract checks).
4. **Given** the six chart colors per mode, **When** they are reviewed,
   **Then** each is distinguishable from its neighbors and reads clearly
   against Midnight's surface color in that mode.

---

### User Story 3 - Brand fonts load everywhere the brand renders (Priority: P3)

As a demo user, I see Midnight's typeface (Space Grotesk) actually rendered —
not a fallback — in both the demo app and Storybook, which are separate
documents with separate font loading.

**Why this priority**: A brand whose fonts silently fall back looks broken
even when every token is correct; Storybook is the component review surface,
so it must be typographically truthful too.

**Independent Test**: Load the app and Storybook with Midnight active and
confirm via devtools (rendered fonts) that Space Grotesk is downloaded and
applied.

**Acceptance Scenarios**:

1. **Given** the served app with Midnight active, **When** rendered fonts are
   inspected, **Then** Space Grotesk is loaded from the Google Fonts `<link>`
   in `apps/demo-reporting/src/index.html` and applied through the M3
   typography tokens.
2. **Given** the running Storybook with Midnight selected, **When** rendered
   fonts are inspected, **Then** the same families load via
   `libs/reporting/material/.storybook/preview-head.html`.
3. **Given** the font additions, **When** licensing is audited, **Then** all
   added families are OFL-licensed (the repo's Apache-2.0-compatible policy,
   ADR-012).

---

### Edge Cases

- What happens when Midnight is selected but the `dark` class is also present
  on first load (persisted preference)? `html.theme-midnight` still matches,
  so light-emitted typography/density/radius cascade correctly under the dark
  color re-emission — this is the contract's intended layering.
- What happens if a component "needs" a Midnight-specific tweak? That is a
  contract gap, not a brand problem: forbidden to add
  `html.theme-midnight .component` CSS; either a new token is proposed as a
  documented decision or the tweak is dropped.
- What happens when the brand string is missing from `ThemeBrand` /
  `THEME_BRANDS` but the SCSS is registered? The service never applies the
  class, so the brand is unreachable — both registration points are required.
- What happens to users with a persisted brand choice that no longer exists
  (e.g. the exemplar is copied then renamed)? `ThemeService` validates
  persisted values against `THEME_BRANDS` and falls back to the default.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The brand MUST be implemented entirely as a token emission: one
  SCSS module exposing zero-argument `brand-light()` and `brand-dark()`
  mixins per the contract in
  `libs/reporting/theme/src/m3kit-theme/_contract.scss`, plus a generated
  palettes partial. No component file may change.
- **FR-002**: `brand-light()` MUST emit `mat.theme` (light color, typography,
  density), `status-tokens($light)` covering all five kinds,
  `radius-tokens(...)`, `chart-tokens(...)` with exactly six colors, and
  `color-scheme: light`.
- **FR-003**: `brand-dark()` MUST re-emit only what changes in dark mode:
  `mat.theme` dark color, the dark status map, the dark chart list, and
  `color-scheme: dark`.
- **FR-004**: M3 palettes MUST be generated from the brand seeds with the
  `@angular/material:theme-color` schematic, not hand-authored.
- **FR-005**: The brand MUST be registered in the app aggregator
  (`apps/demo-reporting/src/styles/_theme.scss`: `html.theme-midnight` →
  `brand-light()`, `html.theme-midnight.dark` → `brand-dark()`) and in the
  theme service (`ThemeBrand` union + `THEME_BRANDS` in
  `apps/demo-reporting/src/app/core/theme.service.ts`).
- **FR-006**: The brand MUST appear in the Storybook brand toolbar
  (`BRANDS` array + toolbar items in
  `libs/reporting/material/.storybook/preview.ts`).
- **FR-007**: Brand fonts MUST be added to both font-loading documents:
  `apps/demo-reporting/src/index.html` and
  `libs/reporting/material/.storybook/preview-head.html`; all families MUST
  be OFL-licensed.
- **FR-008**: Layout MUST NOT change: no new layout preset is required (the
  brand uses an existing preset by default), and no per-brand component CSS
  may be introduced anywhere.
- **FR-009**: The change MUST be purely additive to app-side styles and
  registration points; reverting it MUST leave the four shipped brands
  untouched.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: 100% of Storybook stories render in Midnight in both light and
  dark with zero console errors and zero visually unstyled regions (full
  brand × mode matrix walk).
- **SC-002**: The compiled CSS under `html.theme-midnight` and
  `html.theme-midnight.dark` contains 100% of the contract tokens for the
  respective mode (10 status pairs, 3 radii, 6 chart slots light; 10 + 6
  dark), verified by inspection or a token audit.
- **SC-003**: Deliberately omitting one status kind or one chart color fails
  the build at compile time in 100% of attempts.
- **SC-004**: The diff touches zero files under `libs/reporting/*/src/lib`;
  the workspace gate (`npx nx run-many -t lint test build`) and
  `npx nx run reporting-material:build-storybook` pass unchanged.
- **SC-005**: Rendered-font inspection shows the brand families (not
  fallbacks) in both the app and Storybook on first load.

## Out of Scope

- A new layout preset (Midnight wears an existing shell preset; layout
  signatures are out of token scope by binding decision — see DESIGN.md).
- New `--app-*` tokens or contract changes of any kind.
- Changes to existing brands, components, or the theme lib's contract.
- Shipping Midnight in this repository (this spec is a template).

## Assumptions

- The consumer has internalized the kit per `docs/ADOPTION_GUIDE.md` or is
  working in this repo's layout; paths are this repo's (rename per your
  workspace).
- The brand lives app-side as a consumer brand (like Terminal/Ledger/Field
  Guide), not inside `libs/reporting/theme`.
- `docs/THEMING.md` is the authoritative narrative walkthrough this spec
  formalizes; on any conflict, THEMING.md and `_contract.scss` win.
