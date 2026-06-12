---
status: exemplar
description: "Worked spec-kit template: implementation plan for adopting m3kit via the lift generator"
---

# Implementation Plan: Lift m3kit Libs into a Consumer Workspace

> **EXEMPLAR — NOT PENDING WORK.** Copyable documentation of how an
> adoption is planned around `@m3kit/plugin:lift`. The generator is real
> (`tools/plugin`, unit-tested); the Acme workspace is the template part.
> See spec.md for the matching specification, `docs/ADOPTION_GUIDE.md` /
> `docs/INTERNALIZATION_GUIDE.md` for the manual narrative.

**Branch**: `004-exemplar-lift` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-exemplar-lift/spec.md`

## Summary

Adopt the m3kit `table` + `dashboard` suites (closure: `core`, `theme`)
into Acme's Nx 20 / Angular 19 workspace via `@m3kit/plugin:lift
--scope=acme`: degit-style tarball fetch, source copy, alias/tag/name
rewiring, theme includePath patch, printed boundary guidance — then
re-prove the boundaries, reconcile dependencies, and scaffold the first
report page. Exit criterion: consumer gate green, `@m3kit/*` absent,
deliberate boundary violation failing lint.

## Technical Context

**Language/Version**: TypeScript 5.7.x / Angular 19.2.x / Nx 20.8.x in the
consumer workspace (m3kit's pinned stack — the lift does not paper over
version skew; reconcile per `docs/ADOPTION_GUIDE.md` first)

**Primary Dependencies**: `@m3kit/plugin` (vendored or linked from
`dist/tools/plugin` — nothing is on npm), system `tar`, Node ≥ 18
(`fetch`). The lifted libs themselves need Angular + Material/CDK +
`@ngrx/signals` present in the consumer workspace. **No other new
packages.**

**Storage**: N/A

**Testing**: The plugin's own devkit unit tests
(`npx nx test m3kit-plugin`, `createTreeWithEmptyWorkspace`, fixture-dir
injection for the tarball step) prove the generator; the consumer proves
the adoption with their own gate (`npx nx run-many -t lint test build`)
plus the deliberate-violation lint check.

**Target Platform**: Consumer Nx monorepo (Linux/macOS dev machines; tar
required on PATH)

**Project Type**: Tooling-driven source internalization — additive in the
consumer workspace, zero changes in this repository

**Constitution Check**: PASS — reference-not-dependency is the point of
the lift; clean-room obligations transfer with the source
(`docs/INTERNALIZATION_GUIDE.md`); no new runtime dependencies; boundaries
are re-created consumer-side rather than silently dropped; token-only
contract preserved because component sources are copied byte-for-byte
(modulo alias rewrites).

## Project Structure (consumer workspace, after lift)

```
libs/
  core/        # @acme/core  — tag scope:acme-core
  theme/       # SCSS-only   — no alias; includePath libs/theme/src
  table/       # @acme/table — tag scope:acme-table
  dashboard/   # @acme/dashboard — tag scope:acme-dashboard
apps/acme-app/src/app/open-invoices/   # scaffolded report page (US3)
tsconfig.base.json                     # + @acme/* paths
eslint.config.mjs                      # + scope:acme-* depConstraints (manual)
```

## Phases

- **Phase 0 — Preflight**: version/dependency reconciliation; vendor or
  link `@m3kit/plugin`; pick scope (`acme`) and ref (a tag, not `main`,
  for reproducibility).
- **Phase 1 — Lift**: `m3kit add table dashboard --scope=acme --ref=<tag>`;
  review the diff like a code review (this is now owned code).
- **Phase 2 — Rewire the manual remainder**: eslint depConstraints from
  the printed guidance; Storybook/vitest hosts for the lifted libs;
  re-prove boundaries with a deliberate violation.
- **Phase 3 — First page + gate**: `report-page` scaffold, route, real
  datasource swap; full consumer gate green.

## Risks

- Version skew (Angular/Material/Nx majors) — mitigate via preflight pin
  alignment; the lift copies source, it does not transpile.
- `tar` portability — GNU/bsdtar both handle `-xzf --strip-components=1`
  on a full extract (no wildcard member selection is used).
- Consumers expecting updates — set expectations: lift is a one-way
  ownership transfer; re-lifting never overwrites local changes.
