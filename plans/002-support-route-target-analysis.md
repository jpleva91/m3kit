# Plan 002: Support route/page targets in `port-analyze`

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3d6b2e4..HEAD -- tools/plugin/src/generators/port-analyze tools/plugin/src/generators/port-page specs/007-app-porting-skill-generators docs/APP_PORTING.md skills/m3kit-app-port/SKILL.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against live code before proceeding; on mismatch, STOP and ask for a refreshed plan.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/001-harden-app-port-runbooks.md`
- **Category**: correctness/DX
- **Planned at**: commit `3d6b2e4`, 2026-07-07
- **Suggested executor lane**: `codex` — focused generator parsing/resolution work with strong unit-test coverage.

## Why this matters

The app-porting spec says users can start from a component path, route path, or project+page name. The implementation currently requires a workspace-relative file path that exists before any route discovery happens. That makes the analyzer less useful for the exact use case it is supposed to solve: an app owner knows the route/page to port, not necessarily the underlying component file.

## Current state

Relevant files and roles:

- `tools/plugin/src/generators/port-analyze/generator.ts` — target normalization, project resolution, sibling source discovery, route snippet discovery, inferred library and packet writing.
- `tools/plugin/src/generators/port-analyze/generator.spec.ts` — current analyzer tests.
- `tools/plugin/src/generators/port-analyze/schema.json` / `schema.d.ts` — CLI options. Prefer not to change schema unless necessary; existing `target`, `project`, `domain`, `page`, and `outputDir` can express this plan.
- `tools/plugin/src/generators/port-page/generator.ts` — calls `analyzePortTarget(..., { target, domain, page, write: false })` when no analysis file is supplied (`generator.ts:45-57`).
- `docs/APP_PORTING.md` and `skills/m3kit-app-port/SKILL.md` — command examples and target semantics.

Current excerpts:

- Product spec accepts route paths: `specs/007-app-porting-skill-generators/spec.md:42` says `@m3kit/plugin:port-analyze` identifies source files and route context given a target component path, route path, or project+page name.
- Product spec says unsupported/ambiguous targets fail actionably: `specs/007-app-porting-skill-generators/spec.md:43`.
- Implementation requires `tree.exists(target)` immediately: `tools/plugin/src/generators/port-analyze/generator.ts:32-35`.
- Project resolution assumes a file target under one project root/sourceRoot: `generator.ts:84-103`.
- Route scanning exists but only after a target file is known: `generator.ts:135-162`.
- Current tests cover exact component path, inferred libs/data seams/route context, no source mutation, and ambiguous missing target error: `generator.spec.ts:69-154`.
- Schema prompt only says target component/page/route path but requires `target`: `tools/plugin/src/generators/port-analyze/schema.json:7-12`, `:40`.

Implementation convention:

- Keep analyzer read-only except writing the packet under `outputDir` when `write !== false`.
- Keep errors actionable and test exact behavior with fixture trees.
- Do not introduce new dependencies.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Drift check | `git diff --stat 3d6b2e4..HEAD -- tools/plugin/src/generators/port-analyze tools/plugin/src/generators/port-page specs/007-app-porting-skill-generators docs/APP_PORTING.md skills/m3kit-app-port/SKILL.md` | Either no output or changes reviewed against this plan |
| Unit tests | `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` | exit 0; analyzer and port-page generator tests pass |
| Lint | `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` | exit 0 |
| Build | `NX_DAEMON=false npx nx build m3kit-plugin --skip-nx-cache` | exit 0 |
| Scope check | `git status --short` | only in-scope files modified |

## Scope

**In scope**:

- `tools/plugin/src/generators/port-analyze/generator.ts`
- `tools/plugin/src/generators/port-analyze/generator.spec.ts`
- `tools/plugin/src/generators/port-analyze/schema.json` and `schema.d.ts` only if needed to clarify descriptions, not to add a new mandatory option
- `tools/plugin/src/generators/port-page/generator.spec.ts` only if port-page inline target behavior needs coverage
- `docs/APP_PORTING.md`
- `skills/m3kit-app-port/SKILL.md`
- `plans/README.md` status row

**Out of scope**:

- Do not change generated scaffolds or runbook content beyond docs references; Plan 001 owns that.
- Do not add AST parsers or dependencies.
- Do not support non-Angular routing frameworks.
- Do not implement automatic route replacement.
- Do not mutate source app files in analyzer tests or implementation.

## Git workflow

- Branch: continue from current branch `chore/dogfood-app-port` unless operator directs otherwise.
- Commit style, if asked later: conventional commits.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Add failing tests for route-string and project+page targets

In `tools/plugin/src/generators/port-analyze/generator.spec.ts`, extend the fixture in `seedWorkspace()` or add a second fixture route as needed.

Add tests for:

1. **Route path target**:
   - Call `portAnalyzeGenerator(tree, { target: '/orders', domain: 'orders', page: 'orders-list', outputDir: 'm3kit-porting/orders/orders-list' })` or `target: 'orders'`.
   - Expected: analyzer resolves `apps/demo/src/app/orders/orders-page.component.ts`, includes `apps/demo/src/app/orders/orders.service.ts`, includes the route snippet containing `path: 'orders'`, and writes the normal analysis packet.
2. **Project + page target**:
   - Call `portAnalyzeGenerator(tree, { target: 'orders-list', project: 'demo', domain: 'orders', page: 'orders-list', outputDir: ... })` or another deterministic page name that maps through route config.
   - Expected: same source resolution.
3. **Ambiguous route target**:
   - Add two routes with the same path stem or no matching component under two projects; expected error names the target and tells user to pass `--project` or exact component path.
4. **No source mutation**:
   - Reuse the before/after route/source checks from existing `generator.spec.ts:121-145` for route-target mode.

Keep the existing exact component path tests passing.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> fails on the new route/project target expectations before implementation.

### Step 2: Introduce a resolved target model

In `generator.ts`, add an internal helper, for example:

- `resolvePortTarget(tree, options): { target: string; projectName: string; routeSnippets: string[] }`

Resolution order should be deterministic:

1. If normalized `options.target` exists, treat it as the component/page file path and preserve current behavior.
2. Else, if `options.project` is provided, search that project's route files for a route whose path, loadComponent/import path, or component stem matches `options.target` or `options.page`.
3. Else, search all projects' route files for exactly one match.
4. If exactly one route match is found, resolve its component file to a workspace-relative `.ts` path.
5. If no route match, optionally search project source files for a component/page filename or class name matching target/page. This is fallback only; route match should win.
6. If zero or multiple matches, throw an actionable error that includes the original target and suggests `--project` or exact component path.

Preserve existing `normalizePath()` behavior for slashes.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> route-target tests should now pass or fail only on route parsing details.

### Step 3: Parse route snippets conservatively

Current `findRouteSnippets()` uses regex over route object blocks (`generator.ts:151-157`). Keep it simple but make route matching reusable:

- Reuse route file candidates from `findRouteSnippets()`: `<sourceRoot>/app/app.routes.ts`, `<sourceRoot>/app/routes.ts`.
- Extract snippets with the existing regex first.
- For `loadComponent: () => import('./orders/orders-page.component').then((m) => m.OrdersPageComponent)`, resolve relative import paths from the route file directory.
- Support both `./orders/orders-page.component` and `@scope/...` imports only if they resolve through `tsconfig.base.json` paths already in the tree; if alias resolution is non-trivial, leave alias route targets as a clear STOP/error with exact route snippet and request exact component path.
- Normalize leading slash in route path targets (`/orders` -> `orders`).

Do not attempt a full TypeScript AST router parser in this plan. The acceptance target is common Angular route arrays with static `path` and `loadComponent`.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> exact path and route path tests pass.

### Step 4: Preserve data seam and UI inference after route resolution

Once the target resolves to a component file, call existing logic:

- `findSiblingSources(tree, target, source)` (`generator.ts:119-133`)
- `inferM3kitLibs(...)` (`generator.ts:165-174`)
- `inferUiComponents(...)` (`generator.ts:176-188`)
- `buildManualReviewItems(...)` (`generator.ts:196-208`)

Ensure `analysis.target` is the resolved component file path, not the route string. If useful, add a `manualReviewItems` entry like `Resolved route target '<input>' to '<file>'` only if tests expect it; avoid schema changes unless necessary.

**Verify**: Existing exact component-path expectations in `generator.spec.ts:80-118` remain unchanged.

### Step 5: Update docs/skill descriptions

Update `docs/APP_PORTING.md` and `skills/m3kit-app-port/SKILL.md` to clarify valid target forms:

- exact workspace-relative component/page path (most precise)
- route path like `/orders` or `orders` when route config is static and unambiguous
- project+page/route target when route path is ambiguous

Include the fallback instruction: if analyzer says ambiguous or cannot resolve alias route imports, rerun with exact component path and `--project`.

**Verify**: `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` -> exit 0.

### Step 6: Optionally cover inline `port-page --target`

Because `port-page` calls `analyzePortTarget()` when `--analysis` is omitted (`tools/plugin/src/generators/port-page/generator.ts:45-57`), add one port-page spec only if route-target behavior has a risk of regressing through `port-page`:

- Seed a route fixture and call `portPageGenerator(tree, { target: 'orders', project: 'demo' if schema/types allow, domain: 'orders', page: 'orders-list', apply: false })`.
- If `PortPageGeneratorSchema` lacks `project`, do not add schema complexity here. Document in docs that route-target inline generation should use `port-analyze` first when `--project` is required.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> exit 0.

## Test plan

- New analyzer unit tests in `tools/plugin/src/generators/port-analyze/generator.spec.ts`:
  - exact path still passes
  - route path resolves to component file and route snippet
  - project+page/route resolves when provided
  - ambiguous route fails actionably with no output
  - no source mutation in route-target mode
- Existing generator tests should continue to pass.
- No Cypress/component tests needed; this is devkit generator logic.

## Done criteria

All must hold:

- [ ] `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` exits 0, or accepted equivalent is recorded.
- [ ] `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` exits 0.
- [ ] `NX_DAEMON=false npx nx build m3kit-plugin --skip-nx-cache` exits 0.
- [ ] `port-analyze --target=orders --project=<project>` can resolve a static Angular route fixture to its component in unit tests.
- [ ] Ambiguous route/page target error tells user how to proceed.
- [ ] Analyzer remains non-mutating for source files and app route files.
- [ ] Docs/skill mention route target support and ambiguity fallback.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- The live route configs use dynamic/computed path generation that cannot be parsed conservatively without a TypeScript AST parser.
- Resolving route targets requires adding a dependency.
- `PortAnalyzeGeneratorSchema` shape has changed and this plan's target semantics no longer map cleanly.
- Supporting aliases would require broad tsconfig/path resolver implementation; defer alias route support to a separate plan and keep exact-path fallback.
- Tests require mutating source route files during analysis.

## Maintenance notes

- Keep route-target support conservative and well-documented. It is better to fail with an exact next command than to resolve the wrong page.
- Plan 001 should land first so route-target users get better generated runbooks once analysis succeeds.
- Future extension: AST-backed Angular route parsing can be a separate plan if static regex support proves insufficient.
