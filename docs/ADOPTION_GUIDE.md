# Adoption Guide

How a consuming team evaluates and adopts this reference implementation.

## The adoption model: source import, not npm dependency

This repository is **not** an npm package and never will be one. There is no published
artifact, no semver contract, and no API stability guarantee across versions of this
repo. The intended adoption path is:

1. **Evaluate** — clone the repo, run it, read the libraries.
2. **Source import / internal fork** — copy the `libs/reporting/*` source into your
   own workspace (monorepo or otherwise).
3. **Internal ownership transfer** — from that point on, the code is *yours*. You
   version it, test it, evolve it, and own it. See
   [INTERNALIZATION_GUIDE.md](./INTERNALIZATION_GUIDE.md) for the step-by-step
   ownership-transfer playbook.

Why this model? Reporting plumbing is the kind of code enterprise teams inevitably need
to bend to their own design system, datasource conventions, and review processes. A
dependency you cannot change is a liability; readable source you fully own is an asset.
The code here is deliberately plain, conventional, and minimally abstracted to make the
copy-in cheap.

## Prerequisites for evaluation

| Tool | This repo uses | Notes |
|---|---|---|
| Node.js | v24.16.0 (verified) | Node 20/22 LTS was the initial target; the workspace was built and verified on Node 24.16.0. Any Node version supported by Nx 20 should work. |
| pnpm | 10.x | The committed lockfile is `pnpm-lock.yaml`. Use `pnpm install --frozen-lockfile` for a reproducible install. |

Quickstart:

```bash
git clone <this-repo> && cd m3kit
pnpm install --frozen-lockfile
npx nx run-many -t lint test build   # every project must be green
npx nx serve demo-reporting          # dashboard + reports demo, brand/mode switcher
```

## What to copy, what to delete

| Path | Action | Why |
|---|---|---|
| `libs/reporting/core` | **Copy** | The reporting contracts (report/column definitions, query/filter/sort/pagination models, datasource interfaces). UI-free; the most durable asset. |
| `libs/reporting/material` | **Copy** (optional) | Material/CDK presentation layer. Skip or replace it if you use a different design system or grid — it depends only on `core`. |
| `libs/reporting/testing` | **Copy** (recommended) | Synthetic data factories/fixtures and test harnesses. Depends only on `core`. Useful even if you replace the UI layer. |
| `libs/reporting/dashboard` | **Copy** (optional) | Dashboard primitives (KPI cards, detail cards, grid). Depends only on `core`; consumes the theme token contract. |
| `libs/reporting/forms` | **Copy** (optional) | Typed form components and definition-driven filter forms. Depends only on `core`; consumes the theme token contract. |
| `libs/reporting/shell` | **Copy** (optional) | App chrome: the four-preset `rpt-app-shell` plus page header, breadcrumbs, and content layout. Depends only on `core`; consumes the theme token contract. Brand→preset mapping stays app policy — bring your own. |
| `libs/reporting/theme` | **Copy** (if you take `material`) | The SCSS-only theming SDK: the component-facing token contract (`_contract.scss`), the brand mixin contract, and the default "Instruments" brand. The `material` components consume its `--app-*` tokens; see [THEMING.md](./THEMING.md). |
| `apps/demo-reporting` | **Delete / do not copy** | Demo-only. It exists as living documentation of how the libs wire together. Everything reusable lives in the libs; the app is disposable by design. |
| `docs/` | Do not copy (read it) | Governance/provenance docs for *this* repo. Keep the license attribution (see below), not the docs themselves. |
| Root config (`nx.json`, `eslint.config.mjs`, `tsconfig.base.json`, …) | Do not copy wholesale | Your workspace already has its own. Merge the two relevant pieces: the tsconfig path aliases and the boundary `depConstraints` (both covered below). |

What you must carry along regardless of which libs you take: the **Apache-2.0 license
obligations** — see "License obligations" in the
[INTERNALIZATION_GUIDE.md](./INTERNALIZATION_GUIDE.md). This repo deliberately uses no
per-file license headers; attribution lives in the root `LICENSE` and the NOTICE-style
statement in the `README.md`.

## Mapping the Nx tags into your workspace

This repo's projects are tagged:

| Project | Tags |
|---|---|
| `apps/demo-reporting` | `type:app`, `scope:demo` |
| `libs/reporting/core` | `type:lib`, `scope:reporting-core` |
| `libs/reporting/material` | `type:lib`, `scope:reporting-material` |
| `libs/reporting/testing` | `type:lib`, `scope:reporting-testing` |
| `libs/reporting/dashboard` | `type:lib`, `scope:reporting-dashboard` |
| `libs/reporting/forms` | `type:lib`, `scope:reporting-forms` |
| `libs/reporting/theme` | `type:lib`, `scope:reporting-theme` |

and `@nx/enforce-module-boundaries` (in the root `eslint.config.mjs`) enforces:

- `core` → depends on **no** internal project
- `material` → may depend only on `core`
- `testing` → may depend only on `core`
- `dashboard` → may depend on `core` only
- `forms` → may depend on `core` only
- the app → may depend on all libs

**The dependency semantics are the contract; the tag names are not.** When you import
the libs, rename the tags to fit your existing taxonomy and re-express the same
rules in your scheme. Examples:

- If your workspace uses `scope:<domain>` + `type:<layer>` (e.g. `type:util`,
  `type:feature`, `type:ui`), tag core as your contracts/util layer type, material as
  your ui layer type, testing as your test-util type, all under a single
  `scope:reporting` — then write `depConstraints` that preserve: contracts depend on
  nothing, ui → contracts, test-utils → contracts.
- If your workspace has no tags yet, this is a good first boundary scheme: copy the
  `depConstraints` block from this repo's `eslint.config.mjs`, adjust the tag strings,
  and keep it.

Whatever scheme you choose, **re-prove the boundaries after import**: introduce a
deliberate violation (e.g. import something from your material-equivalent inside your
core-equivalent), confirm lint fails, and revert. This repo ran exactly that proof
during scaffolding; your workspace should too. The step-by-step is in the
internalization guide.

## Renaming the import paths

The libs are addressed via tsconfig path aliases in `tsconfig.base.json`:

```jsonc
"paths": {
  "@m3kit/core":     ["libs/reporting/core/src/index.ts"],
  "@m3kit/material": ["libs/reporting/material/src/index.ts"],
  "@m3kit/testing":  ["libs/reporting/testing/src/index.ts"],
  "@m3kit/dashboard": ["libs/reporting/dashboard/src/index.ts"],
  "@m3kit/forms":     ["libs/reporting/forms/src/index.ts"]
}
```

These aliases are **the one rename adopters are expected to perform**. To move to your
own scope (say `@acme`):

1. Copy the lib folders to your preferred location, e.g.
   `libs/shared/reporting/{core,material,testing,dashboard,forms,theme}`.
2. Add the aliases to *your* `tsconfig.base.json`:
   `"@acme/reporting-core": ["libs/shared/reporting/core/src/index.ts"]`, etc.
3. Workspace-wide find-and-replace the import specifiers:
   `@m3kit/core` → `@acme/reporting-core`,
   `@m3kit/material` → `@acme/reporting-material`,
   `@m3kit/testing` → `@acme/reporting-testing`,
   `@m3kit/dashboard` → `@acme/reporting-dashboard`,
   `@m3kit/forms` → `@acme/reporting-forms`.
   The only cross-lib TypeScript imports are `material → core`, `testing → core`,
   `dashboard → core`, and `forms → core`, so the surface is small and entirely
   via the `index.ts` barrels. (`theme` is SCSS-only and has no tsconfig alias;
   see "Bringing the theming layer across" below.)
4. Update each copied lib's `project.json` (project names, tags) and per-lib
   `eslint.config.mjs` / `vite.config.mts` paths to match your workspace conventions.
5. Run your lint/test/build to confirm nothing still references `@m3kit/*`.

There is no other magic: no custom executors, no generators, no path resolution outside
the standard Nx/tsconfig mechanism.

## Bringing the theming layer across

`libs/reporting/theme` is SCSS-only, so it sits outside the tsconfig alias mechanism.
Its resolution goes through the builder instead — after copying the folder, wire an
includePath on your app's build target (and on Storybook targets, if you take the
Storybook):

```jsonc
"stylePreprocessorOptions": { "includePaths": ["libs/reporting/theme/src"] }
```

That makes `@use 'm3kit-theme'` (the token/brand-mixin contract) and
`@use 'm3kit-theme/themes/instruments'` (the default brand) resolve from any
stylesheet. Then bring your brand modules across — or author new ones for your own
design system. Brand modules are small app-side SCSS partials that
`@use 'm3kit-theme' as contract` and implement the two-mixin contract
(`brand-light()` / `brand-dark()`); the demo app's
`apps/demo-reporting/src/styles/themes/` modules are the worked examples. The full
"bring your own brand" walkthrough — token API table, palette generation, root-class
registration, fonts, Storybook toolbar — is in [THEMING.md](./THEMING.md).

One wiring detail worth keeping: the demo app and the `reporting-material` Storybook
declare `implicitDependencies: ["reporting-theme"]` in their `project.json` so the Nx
cache invalidates when theme SCSS changes (the project graph cannot see SCSS imports);
re-create the equivalent in your workspace if you cache builds.

## Dependency reconciliation

The libs are built against this pinned stack:

| Package | This repo (resolved) | Reconciliation rule |
|---|---|---|
| Angular (`@angular/*`) | 19.2.25 (`~19.2.0`) | **Match your workspace's Angular major.** The libs use standalone components and signals — Angular 19+ idioms. If your workspace is on a later major, copy the source in and let your normal `ng update` migrations apply to it like any other first-party code. |
| Angular Material | 19.2.19 | Major must match your `@angular/*` major. Only needed if you take `libs/reporting/material`. |
| Angular CDK | 19.2.19 (peer-locked to Material) | Must match `@angular/material` exactly (Material peer-locks CDK). |
| `@ngrx/signals` | 19.2.1 | NgRx majors track Angular majors; match accordingly. |
| Nx | 20.8.4 | You do **not** need Nx 20 — any Nx that supports your Angular major works, since the libs use stock targets only. Non-Nx workspaces can adopt too; only the boundary-lint setup is Nx-specific. |
| TypeScript | 5.7.3 (in `>=5.5 <5.9`) | Use whatever your Angular version supports. |

The key principle: **after the copy, the consumer workspace's versions win.** Do not try
to hold the imported code at this repo's pins. The pins exist so the *reference* is
reproducible; once internalized, the code rides your upgrade train. The dependency
surface is intentionally tiny (Angular, Material/CDK, `@ngrx/signals` — nothing else),
so reconciliation is usually a no-op if your majors match.

## After adoption

Once you have copied the source in, follow the
[INTERNALIZATION_GUIDE.md](./INTERNALIZATION_GUIDE.md) to complete the ownership
transfer: remove any upstream remote, take over versioning and CI, re-run the
boundary-violation proof, and satisfy the Apache-2.0 attribution obligations. After
that point, this repository is reference-only for you — there is no sync-back channel
and no expectation of tracking upstream changes.
