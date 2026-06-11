# angular-reporting-reference

A clean-room Angular/Nx reference implementation of generic enterprise reporting
patterns — report definitions, tabular display, filtering, sorting, and pagination —
demonstrated with synthetic data in a small Angular Material demo app.

This is a **reference to be read and copied, not a dependency to be installed**.
The intended adoption model is source internalization: evaluate the repository,
import the `libs/reporting/*` source into your own workspace (or fork it
internally), and own it outright. Nothing here is published to npm, and there is
no semver contract across versions.

## Why

Enterprise Angular teams repeatedly rebuild the same reporting plumbing. This
repository provides an independently authored, conventionally structured starting
point on a pinned, mutually-compatible stack, with library boundaries enforced by
tooling rather than convention. All example content uses synthetic domains only
(customers, orders, invoices, support tickets, products); see `docs/CLEAN_ROOM.md`
for the provenance policy.

**Status:** scaffold phase complete and verified — initial commit landed and
the fresh-clone check passed (lockfile-driven install, then lint/test/build
green for all four projects; see `docs/DECISIONS.md`). Workspace, libraries,
enforced boundaries, and a placeholder Material shell are in place. Reporting
features land in later phases, behind the clean-room review gate.

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
npx nx run-many -t lint test build # verify all four projects
```

For a reproducible install from a fresh clone, use
`pnpm install --frozen-lockfile`.

## Repository map

| Path | What it is |
|---|---|
| `apps/demo-reporting` | Angular 19 standalone demo app: Material toolbar + sidenav shell, lazy `/reports` placeholder route. Disposable during adoption. |
| `libs/reporting/core` (`@reporting/core`) | Reporting contracts. No Material/CDK, no internal dependencies. |
| `libs/reporting/material` (`@reporting/material`) | Material/CDK UI layer. May depend on core only. |
| `libs/reporting/testing` (`@reporting/testing`) | Test harnesses and synthetic data factories. May depend on core only. |
| `docs/` | Governance and adoption docs: `CLEAN_ROOM.md`, `BOUNDARY_LOG.md`, `ADOPTION_GUIDE.md`, `INTERNALIZATION_GUIDE.md`, `DECISIONS.md`. |
| `LICENSE` | Apache License 2.0 full text. |

Library dependency rules (core depends on nothing internal; material → core;
testing → core; the app may use all three) are machine-enforced via
`@nx/enforce-module-boundaries` in `eslint.config.mjs`.

## Adopting this reference

Start with `docs/ADOPTION_GUIDE.md` (how to evaluate and copy the libraries into
your workspace) and `docs/INTERNALIZATION_GUIDE.md` (the ownership-transfer
playbook: copy-in steps, dependency reconciliation, renaming the `@reporting/*`
path prefix). `docs/DECISIONS.md` explains why the repository is shaped the way
it is, so you can revisit those decisions deliberately in your own context.

## License

Copyright 2026 the angular-reporting-reference authors.

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

The canonical repository URL will be added here when the public remote is
created (the `repository` field in `package.json` will be set in the same
commit). Adopters following the attribution instructions in
`docs/INTERNALIZATION_GUIDE.md` should use that URL once it exists.
