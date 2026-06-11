# Boundary Log

Append-only audit trail of every external source consulted while designing or
implementing anything in this repository. This log is the evidence backing the
clean-room policy in [`CLEAN_ROOM.md`](./CLEAN_ROOM.md).

**Usage rules**

- Add an entry **at the time of consultation**, never retroactively.
- One row per source-and-purpose. If the same source is consulted later for a
  different purpose, add a new row.
- Only public, citable sources are permissible (CLEAN_ROOM.md §2). Logging a
  source here is what authorizes its use beyond the four named doc sites.
- Record the license/attribution status of anything *adapted* (not merely
  informed by): Angular doc content is CC-BY-4.0, Angular Material example
  code is MIT.
- Also record judgment calls here ("considered X, here is why it is generic /
  here is the public source").
- Never edit or delete existing rows; corrections are appended as new rows
  referencing the original date.
- The purpose of each consultation ("why consulted") is captured in the
  **Source consulted** and **Decision** columns rather than a separate
  column; together they record what was looked at and why it was needed.

| Date | Source consulted | What was taken | License / attribution | Decision |
|---|---|---|---|---|
| 2026-06-11 | Nx 20 documentation — https://nx.dev (Angular monorepo tutorial, `@nx/angular` plugin docs, `@nx/enforce-module-boundaries` rule reference, Angular↔Nx version matrix) | Workspace generator defaults: `apps/` + `libs/` layout, project generation commands, `project.json` tags, tag-based `depConstraints` pattern in flat ESLint config, Jest defaults | Public docs; informed-by only, no example code copied; attribution not required but logged | Used as the sole basis for workspace layout, the four-project structure, and module-boundary enforcement |
| 2026-06-11 | Angular Material 19 documentation — https://material.angular.io / https://v19.material.angular.io (`ng add @angular/material` schematic guide, theming guide, toolbar/sidenav component docs) | `ng add` setup steps, choice of the `azure-blue` prebuilt theme, `mat-toolbar` + `mat-sidenav-container` shell usage | Public docs; Material example code is MIT but setup was informed-by only, no example code adapted verbatim; attribution not required but logged | Used for Material installation and the demo app's shell; stock prebuilt theme only, no custom palette |
| 2026-06-11 | Apache License page — https://www.apache.org/licenses/LICENSE-2.0 | Verbatim Apache-2.0 license text for the repo `LICENSE` file | Apache-2.0 license text; verbatim reproduction is the required and intended use | Adopted as the repository license; `package.json` license field set to `Apache-2.0`; no per-file headers (see DECISIONS.md) |
| 2026-06-11 | Angular 19 documentation — https://angular.dev / https://v19.angular.dev (standalone components, `bootstrapApplication`, router guide for lazy routes, animations setup) | Standalone bootstrap pattern, `loadComponent` lazy-route pattern for the `/reports` placeholder route, `provideAnimationsAsync` usage | Public docs; Angular doc content is CC-BY-4.0 but patterns were informed-by only, no doc prose or example code adapted verbatim; attribution not required but logged | Used for the demo app's standalone bootstrap, route configuration, and animations provider |
| 2026-06-11 | **Correction** (appended per the correction rule, referencing the 2026-06-11 entries above) — deliberate boundary-violation lint proof; an internal verification record, not an external source | An import of `@reporting/material` was introduced into `libs/reporting/core` source; `npx nx run reporting-core:lint --skip-nx-cache` failed with `@nx/enforce-module-boundaries` ("A project tagged with scope:reporting-core cannot depend on any libs with tags"); the violation was reverted and lint ran green | n/a — nothing external consulted or taken | Records the boundary-enforcement proof claimed in ADR-002 and `ADOPTION_GUIDE.md`; this row was omitted at the time the proof ran and is appended as a dated correction |
| 2026-06-11 | **Correction** (appended per the correction rule, referencing the 2026-06-11 entries above) — NgRx documentation, https://ngrx.io, consulted for `@ngrx/signals` 19.x compatibility with Angular 19 | Confirmation that NgRx majors track Angular majors and that the `@ngrx/signals` 19.x line is the Angular-19-compatible release line | Public docs; informed-by only, no example code adapted; attribution not required but logged | Backs the `@ngrx/signals` 19.2.1 pin in ADR-001; row omitted at consultation time and appended as a dated correction |
| 2026-06-11 | **Correction** (appended per the correction rule, referencing the 2026-06-11 entries above) — public npm registry, https://www.npmjs.com, consulted for version resolution of the pinned stack | Resolved versions: Angular 19.2.25, Angular Material 19.2.19 with peer-locked CDK 19.2.19, Nx 20.8.4 | Public registry metadata; attribution not required but logged | Backs the resolved-version claims in ADR-001, the README pinned-stack table, and the ADOPTION_GUIDE reconciliation table; row omitted at consultation time and appended as a dated correction |
| 2026-06-11 | **Correction** (appended per the correction rule, referencing the 2026-06-11 entries above) — Node.js release documentation, https://nodejs.org, consulted for release-schedule / LTS status | LTS status of the Node 20/22 lines and current status of Node 24, backing the README and ADR-007 Node-version statements | Public docs; informed-by only; attribution not required but logged | Backs the Node LTS-status claims in ADR-007 and the README; row omitted at consultation time and appended as a dated correction |
