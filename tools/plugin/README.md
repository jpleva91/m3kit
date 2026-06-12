# @m3kit/plugin

Nx plugin with the m3kit generators: source-internalize the libs into a
consumer workspace (`lift`), and scaffold on-contract artifacts
(`component`, `brand`, `report-page`, `dashboard-page`).

m3kit is a reference to be read and copied, not a dependency to be
installed — `lift` is the automated form of `docs/ADOPTION_GUIDE.md`.

## Distribution status

**The plugin is not published to npm** (ADR-015 in `docs/DECISIONS.md`):
`package.json` is kept publish-ready (`bin`, `files`, `repository`,
`license`) but deliberately `private: true` until a publishing decision is
made. Until then, `npx m3kit` / `m3kit add` does not work anywhere — the
commands below show what works today:

- **From this repo:** `npx nx g @m3kit/plugin:...` works directly
  (`@m3kit/plugin` resolves via the `tsconfig.base.json` path).
- **From a consumer workspace:** build the plugin here
  (`npx nx build m3kit-plugin` → `dist/tools/plugin`), then
  `pnpm add -D @m3kit/plugin@file:<m3kit>/dist/tools/plugin` (or
  `npm/pnpm link`, or vendor the directory) and run the same
  `npx nx g @m3kit/plugin:...` commands from your workspace root.

## Generators

### `lift` — internalize m3kit libs

Downloads the repo tarball degit-style
(`https://codeload.github.com/<repo>/tar.gz/<ref>`, no git or extra deps),
copies the requested `libs/*` plus their dependency closure into the
consumer workspace, and rewires them:

- **Closure** — `table`/`dashboard`/`charts`/`forms`/`shell`/`testing`
  pull in `core` + `theme`; `state` pulls in `core`.
- **Aliases** — `tsconfig.base.json` gains `@<scope>/<lib>` paths and all
  `@m3kit/*` imports inside the lifted source are rewritten to `@<scope>/*`
  (`theme` stays SCSS-only, no alias).
- **Projects** — `project.json` names/tags become `<scope>-<lib>` /
  `scope:<scope>-<lib>`; demo-only Storybook/Cypress targets are stripped.
- **Theme includePath** — `stylePreprocessorOptions.includePaths:
  ['libs/theme/src']` is applied to detectable Angular application build
  targets; otherwise printed as guidance.
- **ESLint boundaries** — never rewritten; the generator prints the
  `depConstraints` to add (re-prove with a deliberate violation).
- **Idempotent** — already-lifted libs are owned and never overwritten;
  re-runs only re-apply rewiring.

```sh
npx nx g @m3kit/plugin:lift --libs=table,dashboard --scope=acme [--ref=main] [--repo=jpleva91/m3kit]
```

| Option | Default | Meaning |
|---|---|---|
| `libs` | (required) | Libs to lift; closure added automatically. |
| `scope` | `ui` | Consumer alias prefix (`@<scope>/<lib>`). |
| `ref` | `main` | Git ref (branch/tag/SHA) to lift from. |
| `repo` | `jpleva91/m3kit` | GitHub `<owner>/<repo>` source. |
| `sourceDir` | — | Internal/testing: pre-extracted workspace dir (skips download). |

### `component` — on-contract component scaffold

Standalone + signal inputs + OnPush, `m3k-` selector, token-only SCSS
(`--mat-sys-*` + `--app-*` only), plus the full coverage bar (`.spec.ts`,
`.stories.ts`, `.cy.ts`) and a barrel export.

```sh
npx nx g @m3kit/plugin:component status-pill --project=m3kit-dashboard
```

### `brand` — brand module pair

Generates `_<name>.scss` (the `brand-light()`/`brand-dark()` two-mixin
contract, templated from the shipped brands) and `_<name>-colors.scss`
(Instruments palettes as compile-clean placeholders, with the real seeds
documented for `npx nx g @angular/material:theme-color`). Inside m3kit it
registers the brand in `apps/demo-reporting/src/styles/_theme.scss`;
elsewhere it prints the registration steps (see `docs/THEMING.md`).

```sh
npx nx g @m3kit/plugin:brand midnight --primary='#2A2D6E' --tertiary='#B08D57' --neutral='#5C5F6E'
```

### `report-page` / `dashboard-page` — app-side page scaffolds

Compose m3kit components wired to stubs you replace with real data:

- `report-page`: `m3k-page-header` + `m3k-filter-form` + `m3k-data-table`
  over a `TableDefinition` and an `InMemoryTableDataSource` stub.
- `dashboard-page`: `m3k-page-header` + `m3k-dashboard-grid` of
  `m3k-kpi-card`s and `m3k-chart-card`s (line + bar) over series stubs.

The `@<scope>/*` import prefix is auto-detected from `tsconfig.base.json`
(override with `--scope`). A lazy-route snippet is printed.

```sh
npx nx g @m3kit/plugin:report-page open-invoices --project=demo-reporting
npx nx g @m3kit/plugin:dashboard-page revenue-overview --project=demo-reporting
```

## CLI shim

`bin/m3kit.ts` (built to `dist/tools/plugin/bin/m3kit.js`, package `bin`
entry `m3kit`) maps `m3kit add <libs...>` onto the lift generator. The
`npx m3kit ...` / `m3kit add ...` form only becomes available **once the
package is published to npm** (it is not — see Distribution status). What
works today, from an Nx workspace with `@m3kit/plugin` resolvable:

```sh
node <m3kit>/dist/tools/plugin/bin/m3kit.js add table dashboard --scope=acme --ref=main
# or, if the built plugin is installed in the workspace: pnpm exec m3kit add ...
# → npx nx generate @m3kit/plugin:lift --libs=table,dashboard --scope=acme --ref=main
```

## Verify

```sh
npx nx run m3kit-plugin:lint
npx nx run m3kit-plugin:test    # @nx/devkit generator unit tests (createTreeWithEmptyWorkspace)
npx nx run m3kit-plugin:build   # dist/tools/plugin
```

The lift flow is documented as a spec-kit exemplar in
`specs/004-exemplar-lift/`.

### Verified: lift end-to-end against a scratch workspace (2026-06-11)

Proven against a fresh Nx 20 workspace, lifting `core + theme + table`
in local fixture mode (`--sourceDir` pointed at this repo's working
tree, so no network/tarball was involved — the same code path as the
tarball flow from `copyDirIntoTree` onward):

```sh
# 1. scratch workspace (Nx v20.8.4, pnpm)
cd /tmp && npx -y create-nx-workspace@20 lift-e2e \
  --preset=apps --pm=pnpm --nxCloud=skip --no-interactive

# 2. build + vendor the plugin (nothing is on npm)
npx nx build m3kit-plugin                  # → dist/tools/plugin
cd /tmp/lift-e2e
pnpm add -D @m3kit/plugin@file:<m3kit>/dist/tools/plugin

# 3. lift in local fixture mode
npx nx g @m3kit/plugin:lift --libs=core,theme,table --scope=acme \
  --sourceDir=<m3kit>   # repo checkout root

# 4. consumer-side reconciliation (per the generator's printed guidance
#    and docs/ADOPTION_GUIDE.md): peer deps + base compiler options +
#    eslint depConstraints
pnpm add -D @angular/{core,common,platform-browser,forms}@~19.2.0 \
  @angular/{cdk,material}@~19.2.19 rxjs@~7.8.0 tslib zone.js typescript@~5.7.2
# merge m3kit's tsconfig.base.json compilerOptions (module/target/lib/...)
# create root eslint.config.mjs with the printed acme-* depConstraints
pnpm add -D @nx/eslint{,-plugin}@20.8.4 eslint @eslint/js typescript-eslint \
  angular-eslint jsonc-eslint-parser eslint-config-prettier
```

Results (outputs tail):

```text
$ npx nx g @m3kit/plugin:lift --libs=core,theme,table --scope=acme --sourceDir=…
CREATE libs/core/…  CREATE libs/theme/…  CREATE libs/table/…  (all three libs)
CREATE tsconfig.base.json        # paths: @acme/core, @acme/table
# project.json → name acme-table, tags scope:acme-*, demo-only targets stripped
# sources rewritten: `from '@acme/core'` (no `@m3kit/` left in libs/)

$ npx tsc -p libs/core/tsconfig.lib.json --noEmit   # exit 0
$ npx tsc -p libs/table/tsconfig.lib.json --noEmit  # exit 0

$ npx nx run-many -t lint -p acme-core,acme-table
✔ All files pass linting
NX  Successfully ran target lint for 2 projects

# boundary re-proof: appending `import '@acme/table'` to libs/core/src/index.ts
$ npx nx lint acme-core
✖ 1 problem — A project tagged with "scope:acme-core" cannot depend on any
  libs with tags  @nx/enforce-module-boundaries
# reverted → lint green again
```
