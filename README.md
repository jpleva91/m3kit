# m3kit

A **rethemable Material 3 UI component library** for Angular/Nx — data
tables, dashboard primitives, hand-built SVG charts, typed forms, app-shell
presets, and an SCSS theming SDK, all clean-room authored. Components consume
design tokens only; brands are token re-emissions, so the entire kit reskins
(four demo brands, each light + dark) without touching component code. The
library is demonstrated by a small synthetic-data reporting demo app
(`apps/demo-reporting`).

This is a **reference to be read and copied, not a dependency to be installed**.
The intended adoption model is source internalization: evaluate the repository,
import the `libs/*` source into your own workspace (or fork it
internally), and own it outright. Nothing here is published to npm, and there is
no semver contract across versions.

## Why

Enterprise Angular teams repeatedly rebuild the same UI plumbing — data
tables, dashboards, charts, filter forms, app chrome, theming. This
repository provides an independently authored, conventionally structured starting
point on a pinned, mutually-compatible stack, with library boundaries enforced by
tooling rather than convention. All example content uses synthetic domains only
(customers, orders, invoices, support tickets, products); see `docs/CLEAN_ROOM.md`
for the provenance policy.

**Status:** feature phase — scaffold verified (see `docs/DECISIONS.md`), then
the component set landed behind the clean-room review gate: core contracts and
query engine, the Material data-table/filter/toolbar suite, dashboard
primitives, hand-built SVG charts, definition-driven filter forms, app-shell
presets, the theming SDK, synthetic data factories, and a Storybook covering
every component. Unit tests run on Vitest; component tests on Cypress.

## Pinned stack

Versions are pinned deliberately; "latest" is not a goal. Resolved versions in
this workspace:

| Package | Version |
|---|---|
| Angular (`@angular/*`) | 19.2.25 (`~19.2.0` line) |
| Angular Material | 19.2.19 |
| Angular CDK | 19.2.19 (peer-locked to Material) |
| `@ngrx/signals` | 19.2.1 |
| Nx | 20.8.4 |
| TypeScript | 5.7.3 (supported range `>=5.5 <5.9`) |
| Node | v24.16.0 used here; 20/22 LTS recommended for adopters |
| Package manager | pnpm 10 (`pnpm-lock.yaml` committed) |

Rationale for the pins and other choices is recorded in `docs/DECISIONS.md`.

## Quickstart

```sh
pnpm install
npx nx serve demo-reporting        # http://localhost:4200
npx nx run-many -t lint test build # verify every project
```

For a reproducible install from a fresh clone, use
`pnpm install --frozen-lockfile`.

## Repository map

| Path | What it is |
|---|---|
| `apps/demo-reporting` | Angular 19 standalone demo app: Material shell with dashboard, invoices, and customers pages, plus the brand/mode switcher. Disposable during adoption. |
| `libs/core` (`@m3kit/core`) | UI-free contracts: table/column definitions, query/filter/sort/pagination models, datasource interfaces. No Material/CDK, no internal dependencies. |
| `libs/table` (`@m3kit/table`) | Material/CDK table layer: `m3k-data-table`, `m3k-table-filter-bar`, `m3k-page-toolbar`. May depend on core only. |
| `libs/testing` (`@m3kit/testing`) | Test harnesses and synthetic data factories. May depend on core only. |
| `libs/dashboard` (`@m3kit/dashboard`) | Dashboard primitives: KPI cards, detail cards, grid. May depend on core only. |
| `libs/charts` (`@m3kit/charts`) | Hand-built SVG charts: line, bar, donut, legend, chart card. May depend on core only. |
| `libs/forms` (`@m3kit/forms`) | Typed form components and definition-driven filter forms. May depend on core only. |
| `libs/shell` (`@m3kit/shell`) | App shell presets and page chrome: `m3k-app-shell` (four chrome presets), page header, breadcrumbs, content layout. May depend on core only. |
| `libs/theme` (`@m3kit/theme`) | SCSS-only theming SDK: the `--app-*` token contract, the `brand-light()`/`brand-dark()` brand mixin contract, and the default "Instruments" brand. Resolved via a `stylePreprocessorOptions` includePath; no build/test targets. |
| `docs/` | Governance and adoption docs: `CLEAN_ROOM.md`, `BOUNDARY_LOG.md`, `ADOPTION_GUIDE.md`, `INTERNALIZATION_GUIDE.md`, `THEMING.md`, `DECISIONS.md`. |
| `LICENSE` | Apache License 2.0 full text. |

Library dependency rules (core depends on nothing internal; table, testing,
dashboard, charts, forms, and shell each depend on core only; the app may use
all of them) are
machine-enforced via `@nx/enforce-module-boundaries` in `eslint.config.mjs`.
The SCSS-only theme lib sits outside the TypeScript import graph; its consumers
resolve it through a `stylePreprocessorOptions` includePath instead (see
`docs/THEMING.md`).

## Theming

The component libraries are styled exclusively through tokens: Material 3
system tokens (`--mat-sys-*`) plus a small `--app-*` contract defined in
`libs/theme`. A brand implements two mixins (`brand-light()` /
`brand-dark()`) and is registered under a root class; the demo app ships four
runtime-switchable brands as proof. To bring your own brand — generated M3
palettes, status badge colors, shape radii, fonts, Storybook toolbar — follow
`docs/THEMING.md`. The visual system itself (the binding design spec for the
demo brands) is in `DESIGN.md`.

## Adopting this reference

Start with `docs/ADOPTION_GUIDE.md` (how to evaluate and copy the libraries into
your workspace) and `docs/INTERNALIZATION_GUIDE.md` (the ownership-transfer
playbook: copy-in steps, dependency reconciliation, renaming the `@m3kit/*`
path prefix). `docs/DECISIONS.md` explains why the repository is shaped the way
it is, so you can revisit those decisions deliberately in your own context.

## License

Copyright 2026 the m3kit authors.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use
the files in this repository except in compliance with the License. You may
obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the [LICENSE](LICENSE)
file for the full license text.

This repository intentionally carries no per-file license headers; the root
`LICENSE` file and this notice cover the entire tree (see `docs/DECISIONS.md`,
ADR-008).

Canonical repository: https://github.com/jpleva91/m3kit — use this URL for
the attribution instructions in `docs/INTERNALIZATION_GUIDE.md`.
