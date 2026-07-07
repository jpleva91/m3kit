# Plan 001: Harden app-port runbooks for low-agent-safe execution

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3d6b2e4..HEAD -- tools/plugin/src/generators/port-page/generator.ts tools/plugin/src/generators/port-page/generator.spec.ts docs/APP_PORTING.md skills/m3kit-app-port/SKILL.md m3kit-porting/customers/customers-report`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against live code before proceeding; on mismatch, STOP and ask for a refreshed plan.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: DX/docs
- **Planned at**: commit `3d6b2e4`, 2026-07-07
- **Suggested executor lane**: `codex` — bounded TypeScript string-template/test update with clear expected outputs.

## Why this matters

The app-porting generators are intentionally non-destructive, but the generated packet is currently too terse for lower-level agents. The docs promise manual wiring, tests, comparison, and rollback, while the generated runbook/quickstart/prompt omit route-match verification, expected command results, daemon/cache policy, and a step-by-step side-by-side comparison loop. Hardening the generated packet first reduces churn before more app-port plans or route-target analysis depend on it.

## Current state

Relevant files and roles:

- `tools/plugin/src/generators/port-page/generator.ts` — owns generated Spec Kit packet strings, runbook, quickstart, safe AI prompt, and scaffold files.
- `tools/plugin/src/generators/port-page/generator.spec.ts` — generator unit tests proving generated paths, route safety, packet completeness, conflicts, and quickstart commands.
- `docs/APP_PORTING.md` — human-facing workflow docs.
- `skills/m3kit-app-port/SKILL.md` — agent-facing workflow docs.
- `m3kit-porting/customers/customers-report/*` — current generated dogfood packet on this branch; use as concrete output shape, but prefer regenerating through tests rather than hand-editing it unless the branch explicitly expects dogfood fixture updates.

Current excerpts:

- `docs/APP_PORTING.md:52-64` says users should add the route side-by-side, run tests, compare old/new behavior, and only then choose replacement. It also lists verification commands: `npx nx run m3kit-plugin:test`, `lint`, `build`, and `git diff --check`.
- `tools/plugin/src/generators/port-page/generator.ts:306-308` emits `quickstart.md` with only three `npx nx test ...` commands and "Use the runbook for manual wiring."
- `tools/plugin/src/generators/port-page/generator.ts:314-318` emits `runbook.md` with analysis review, lift command, route snippet, "Do not delete", and rollback only.
- `tools/plugin/src/generators/port-page/generator.ts:320-322` emits a one-paragraph `ai-wiring-prompt.md`.
- `m3kit-porting/customers/customers-report/runbook.md:3-22` shows the current concrete dogfood output: no expected command results, no route-match check, no side-by-side comparison checklist, no `NX_DAEMON=false` guidance.
- `m3kit-porting/customers/customers-report/quickstart.md:3-9` contains tests only, with no expected success criteria or preflight commands.
- `tools/plugin/src/generators/port-page/generator.spec.ts:130-145` currently asserts route table is untouched and runbook contains lift command, route snippet, and rollback.
- `tools/plugin/src/generators/port-page/generator.spec.ts:89-109` asserts quickstart includes generated Nx test targets.

Repo conventions to match:

- Generators are tested with `@nx/devkit/testing` in `tools/plugin/src/generators/*/*.spec.ts`.
- App-porting posture is non-destructive: `specs/007-app-porting-skill-generators/spec.md:21-30`, `:62`, and `:104-107`.
- Commands should be explicit and low-agent-safe. Prefer `NX_DAEMON=false npx nx ...` in generated runbooks/quickstarts when the command is intended for reproducible agent execution.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Drift check | `git diff --stat 3d6b2e4..HEAD -- tools/plugin/src/generators/port-page/generator.ts tools/plugin/src/generators/port-page/generator.spec.ts docs/APP_PORTING.md skills/m3kit-app-port/SKILL.md m3kit-porting/customers/customers-report` | Either no output or changes reviewed against this plan |
| Unit tests | `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` | exit 0; port-page generator tests pass |
| Lint | `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` | exit 0 |
| Build | `NX_DAEMON=false npx nx build m3kit-plugin --skip-nx-cache` | exit 0; `dist/tools/plugin` builds |
| Whitespace | `git diff --check` | exit 0 |
| Scope check | `git status --short` | only in-scope files modified |

If `--runInBand` is unsupported by the Nx/Vitest target, rerun without it and record the exact accepted command in `plans/README.md` when updating status.

## Scope

**In scope** (the only files you should modify):

- `tools/plugin/src/generators/port-page/generator.ts`
- `tools/plugin/src/generators/port-page/generator.spec.ts`
- `docs/APP_PORTING.md`
- `skills/m3kit-app-port/SKILL.md`
- Optional dogfood fixture refresh if tests or reviewer require it: `m3kit-porting/customers/customers-report/{runbook.md,quickstart.md,ai-wiring-prompt.md,checklists/requirements.md}`
- `plans/README.md` status row

**Out of scope**:

- Do not change source app route tables.
- Do not change generated customer library source under `libs/customers/**` unless a test fixture regeneration requirement proves unavoidable; if unavoidable, STOP first because this plan is for packet/runbook hardening.
- Do not alter generator schemas or target resolution; that belongs to Plan 002.
- Do not publish the plugin, commit, push, or modify package metadata.

## Git workflow

- Branch: continue from current branch `chore/dogfood-app-port` unless the operator creates a dedicated branch.
- Commit style, if later asked to commit: conventional commits, e.g. recent `test: dogfood safe app porting workflow`.
- Do not push or open a PR unless the operator explicitly instructs it.

## Steps

### Step 1: Strengthen the failing tests first

In `tools/plugin/src/generators/port-page/generator.spec.ts`, extend existing tests before changing output:

- In the quickstart test (`generator.spec.ts:89-109`), assert the generated `quickstart.md` includes:
  - `NX_DAEMON=false npx nx test orders-data-access`
  - `NX_DAEMON=false npx nx test orders-ui`
  - `NX_DAEMON=false npx nx test orders-feature-orders-list`
  - a success expectation phrase such as `Expected: exit 0`
  - a scope check command `git status --short`
- In the runbook test (`generator.spec.ts:130-145`), assert `runbook.md` includes:
  - route preflight guidance: inspect current route table and confirm the target route/path before editing
  - generated route snippet already present in the current assertion
  - side-by-side comparison checklist
  - rollback guidance already present in the current assertion
  - explicit `Do not delete` / original route preservation wording
- In the packet completeness test (`generator.spec.ts:147-172`), assert `ai-wiring-prompt.md` includes a compact execution contract with scope, allowed edits, verification commands, STOP conditions, and human-review-before-replacement.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> fails on the new expectations before implementation. If the command itself fails for an unrelated runner flag, retry without `--runInBand` and continue only if failures are assertion failures for the new expectations.

### Step 2: Expand generated quickstart

In `tools/plugin/src/generators/port-page/generator.ts`, update `quickstartMd()` (`generator.ts:306-308`) to emit a structured quickstart with:

- `NX_DAEMON=false` on each generated `npx nx test` command.
- Expected result after each command: exit 0 and generated specs pass.
- `git status --short` scope check, expected no unexpected source-route changes.
- A note that build/lint commands for the host workspace may vary; the generated project test targets are the minimum.
- A pointer to `runbook.md` for manual route wiring after tests pass.

Keep it generic from `analysis.domain` and `analysis.page`; do not hardcode `orders` or `customers`.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> quickstart assertions pass or remaining failures are from runbook/prompt expectations not implemented yet.

### Step 3: Expand generated runbook

Update `runbookMd()` (`generator.ts:314-318`) to emit sections in this order:

1. `## Preflight` — review `analysis.json`, `data-access-map.md`, source behavior contract; run `git status --short`; identify the app route table before editing.
2. `## Lift m3kit libs` — current lift command, using the inferred library list.
3. `## Verify generated libs` — include `NX_DAEMON=false npx nx test <domain>-data-access`, `<domain>-ui`, and `<domain>-feature-<page>` with expected exit 0.
4. `## Manual side-by-side route wiring` — current route snippet. Add explicit instruction to add a new route only; never replace/delete the original route in the same change.
5. `## Compare behavior` — checklist: load old route, load new route, compare key UI states, compare data/service seams listed in `analysis.manualReviewItems`, verify no source files moved/deleted.
6. `## STOP conditions` — target route not found, route table already diverged, generated tests fail twice, replacing old route seems necessary, real/secrets data appears in fixtures/docs.
7. `## Rollback` — current rollback text plus `git diff -- <route-file>` review.

Avoid promising automatic route replacement. Route wiring remains manual.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> runbook assertions pass or remaining failures are from prompt expectations.

### Step 4: Expand safe AI wiring prompt

Update `aiPromptMd()` (`generator.ts:320-322`) to be a paste-ready lower-agent prompt with:

- Mission: wire generated side-by-side port for `<domain>/<page>`.
- Authority: local-write only, route-snippet addition only, no delete/move/rewrite of original files.
- In-scope files: generated packet and manually chosen route table file; source files from `analysis.sourceFiles` are read-only.
- Steps: read packet, run generated tests, inspect route table, add side-by-side route, compare, report.
- Verification commands: generated tests with `NX_DAEMON=false`, app-specific route smoke if available, `git status --short`.
- STOP conditions mirroring the runbook.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> all updated generator tests pass.

### Step 5: Align docs and skill with generated contract

Update `docs/APP_PORTING.md` and `skills/m3kit-app-port/SKILL.md` to mention:

- Generated commands use `NX_DAEMON=false` for low-agent/reproducible execution.
- The runbook includes preflight, route matching, generated-lib tests, side-by-side comparison, STOP conditions, and rollback.
- The safe AI prompt is a scoped execution packet, not approval for automatic replacement.

Keep docs concise; do not duplicate the full generated templates.

**Verify**: `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` -> exit 0.

### Step 6: Refresh dogfood packet only if required

If reviewer or tests expect the checked-in `m3kit-porting/customers/customers-report` dogfood packet to demonstrate current generator output, refresh only the generated markdown packet files listed in Scope. Do not edit `analysis.json` unless the generator changes analysis content; this plan should not.

If refreshing manually, use the new template output as the source of truth and keep customer-specific values already present:

- domain/page: `customers/customers-report`
- tests: `customers-data-access`, `customers-ui`, `customers-feature-customers-report`
- route snippet: existing `@m3kit/customers/feature-customers-report` import from `runbook.md:15-17`

**Verify**: `git diff -- m3kit-porting/customers/customers-report` -> only intended markdown packet files changed; no source app route or generated library source changed.

## Test plan

- Add/extend unit tests in `tools/plugin/src/generators/port-page/generator.spec.ts` for quickstart, runbook, and AI prompt output.
- Existing pattern to follow: `generator.spec.ts:89-109` for quickstart command assertions; `:130-145` for runbook route safety; `:147-172` for packet completeness.
- Verification: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> all generator tests pass.

## Done criteria

All must hold:

- [ ] `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` exits 0, or accepted equivalent is recorded.
- [ ] `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` exits 0.
- [ ] `NX_DAEMON=false npx nx build m3kit-plugin --skip-nx-cache` exits 0.
- [ ] Generated quickstart includes `NX_DAEMON=false`, expected results, and `git status --short` scope check.
- [ ] Generated runbook includes preflight, route-match, test, side-by-side comparison, STOP conditions, and rollback sections.
- [ ] Generated AI prompt is scoped and does not authorize replacement/deletion.
- [ ] No source app route files are modified.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- Live code no longer contains `quickstartMd`, `runbookMd`, or `aiPromptMd` in `tools/plugin/src/generators/port-page/generator.ts`.
- Implementing this requires changing generator schemas or target resolution.
- Tests show generated source libraries are structurally broken; create/follow a separate implementation card instead of expanding this docs/runbook plan.
- The desired workflow would require automatic route replacement or deleting old source files.
- Any generated text would need to include real data or secret values.

## Maintenance notes

- This plan intentionally improves executor safety without changing analyzer semantics. Route-target support comes next in Plan 002.
- Reviewers should scrutinize generated prompt wording: it must be clear enough for a smaller agent but must not grant broad rewrite authority.
- If dogfood packet files are refreshed, mention whether they are generated-output examples or hand-maintained examples in the PR/body.
