# Plan 004: Emit consumer boundary guidance for generated porting libs

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report; do not improvise. When done, update the status row for this plan in `plans/README.md` unless a reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**: `git diff --stat 3d6b2e4..HEAD -- tools/plugin/src/generators/port-page tools/plugin/src/generators/lift eslint.config.mjs libs/customers m3kit-porting/customers/customers-report docs/APP_PORTING.md skills/m3kit-app-port/SKILL.md`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against live code before proceeding; on mismatch, STOP and ask for a refreshed plan.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/001-harden-app-port-runbooks.md`
- **Category**: DX/tooling
- **Planned at**: commit `3d6b2e4`, 2026-07-07
- **Suggested executor lane**: `codex` — bounded generator/docs/test work with clear string-output assertions.

## Why this matters

The port-page generator creates Nx-shaped feature/data-access/ui libraries with tags, but the generated packet does not tell consumers how to enforce the intended boundaries. m3kit's own library graph is machine-enforced, and `lift` deliberately prints boundary guidance rather than rewriting eslint. App-porting should follow the same honest pattern: generate or document consumer depConstraints so lower agents do not wire UI/data/feature layers in the wrong direction.

## Current state

Relevant files and roles:

- `tools/plugin/src/generators/port-page/generator.ts` — writes project tags and packet files.
- `tools/plugin/src/generators/port-page/generator.spec.ts` — tests generated project metadata and packet output.
- `tools/plugin/src/generators/lift/generator.ts` — existing precedent for printing/guiding ESLint depConstraints; inspect before implementing.
- `eslint.config.mjs` — m3kit repo's enforced graph.
- `libs/customers/**/project.json` — current dogfood generated project tags.
- `m3kit-porting/customers/customers-report/runbook.md` and related packet docs — current generated runbook lacks boundary guidance.
- `docs/APP_PORTING.md` / `skills/m3kit-app-port/SKILL.md` — docs should explain the boundary guidance.

Current excerpts:

- Root graph: `eslint.config.mjs:30-118` defines constraints for `scope:m3kit-core`, `scope:m3kit-table`, other m3kit libs, `scope:m3kit-state`, and `type:app`.
- Generated projects have tags: `libs/customers/feature-customers-report/project.json:6-9` (`scope:customers`, `type:feature`), `libs/customers/data-access/project.json:6-9` (`scope:customers`, `type:data-access`), `libs/customers/ui/project.json:6-9` (`scope:customers`, `type:ui`).
- Generated project metadata is built in `tools/plugin/src/generators/port-page/generator.ts:132-156`.
- Generated packet files are listed in `generator.ts:116-129`; currently there is no boundaries/checklist file.
- `tools/plugin/README.md:43-47` says `lift` never rewrites ESLint boundaries and prints depConstraints guidance.
- `tools/plugin/README.md:103-111` says `port-page` creates feature/data-access/ui libraries and manual runbook snippets.
- Product spec wants Nx best-practice layers and imports respecting boundaries: `specs/007-app-porting-skill-generators/spec.md:52-62`.

Intended boundary model for generated app-port libs:

- `type:feature` can depend on same-domain `type:data-access` and `type:ui`, plus lifted m3kit UI/core libs needed by the page.
- `type:ui` can depend on reusable m3kit UI/core libs but not generated feature/data-access.
- `type:data-access` should not depend on generated feature/ui; if it needs m3kit at all, it should normally be `core`/`state` only.
- Existing consumer eslint setups vary; generator should provide copy/paste guidance rather than silently rewriting unknown configs unless the repo has an explicit safe helper.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Drift check | `git diff --stat 3d6b2e4..HEAD -- tools/plugin/src/generators/port-page tools/plugin/src/generators/lift eslint.config.mjs libs/customers m3kit-porting/customers/customers-report docs/APP_PORTING.md skills/m3kit-app-port/SKILL.md` | Either no output or changes reviewed against this plan |
| Unit tests | `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` | exit 0; port-page generator tests pass |
| Lint | `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` | exit 0 |
| Build | `NX_DAEMON=false npx nx build m3kit-plugin --skip-nx-cache` | exit 0 |
| Scope check | `git status --short` | only in-scope files modified |

## Scope

**In scope**:

- `tools/plugin/src/generators/port-page/generator.ts`
- `tools/plugin/src/generators/port-page/generator.spec.ts`
- Optional shared helper under `tools/plugin/src/generators/utils/` if useful and covered by tests
- `docs/APP_PORTING.md`
- `skills/m3kit-app-port/SKILL.md`
- Optional dogfood packet refresh: `m3kit-porting/customers/customers-report/runbook.md`, `governance.yaml`, `checklists/requirements.md`, or a new packet file like `boundary-guidance.md`
- `plans/README.md` status row

**Out of scope**:

- Do not edit root `eslint.config.mjs` for consumer domains as part of generator output. The m3kit repo can keep its own graph; this plan is about generated guidance.
- Do not modify generated customer library imports unless tests prove an actual boundary violation.
- Do not implement full auto-patching of arbitrary consumer ESLint configs.
- Do not change `lift` behavior except to reuse/read its helper pattern if already present.

## Git workflow

- Branch: continue from `chore/dogfood-app-port` unless operator directs otherwise.
- Commit style, if asked later: conventional commits.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Inspect lift's existing boundary guidance pattern

Open `tools/plugin/src/generators/lift/generator.ts` and locate how it prints or writes depConstraints guidance. Reuse the tone/format where appropriate.

**Verify**: record the relevant helper/function name in your working notes or PR summary. Do not change code in this step.

### Step 2: Add failing tests for boundary guidance output

In `tools/plugin/src/generators/port-page/generator.spec.ts`, extend or add a test around packet completeness.

Expected generated output should include one of these shapes:

- Preferred: new packet file `m3kit-porting/<domain>/<page>/boundary-guidance.md`, plus `runbook.md` links to it.
- Acceptable: a dedicated `## Boundary guidance` section inside `runbook.md`.

Test contents must include:

- tags for generated projects: `scope:orders`, `type:feature`, `type:data-access`, `type:ui`
- copy/paste `depConstraints` examples or a JSON/JS snippet
- statement that generator does not rewrite eslint config automatically
- instruction to prove boundaries with a deliberate violation after adding constraints
- at least one allowed direction and one forbidden direction in prose, e.g. feature may import data-access/ui; ui must not import feature/data-access

Do not assert exact full multiline formatting unless necessary; use `toContain` on key phrases and tags to keep tests maintainable.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> fails on missing boundary guidance before implementation.

### Step 3: Generate boundary guidance

In `tools/plugin/src/generators/port-page/generator.ts`, add a helper such as `boundaryGuidanceMd(analysis, scope)` and include it in `packetFiles()`.

Recommended file: `boundary-guidance.md`.

Content shape:

```md
# Boundary Guidance

Generated projects:
- `<domain>-feature-<page>`: `scope:<domain>`, `type:feature`
- `<domain>-data-access`: `scope:<domain>`, `type:data-access`
- `<domain>-ui`: `scope:<domain>`, `type:ui`

The generator does not rewrite your `eslint.config.*`. Add/merge constraints equivalent to:

```js
{
  sourceTag: 'type:feature',
  onlyDependOnLibsWithTags: ['type:data-access', 'type:ui', 'scope:<domain>', 'scope:<scope>-core', ...]
}
...
```

Then prove the boundary by temporarily importing the generated feature lib from generated UI and confirming lint fails; revert the violation.
```

Be careful with tags:

- Generated app libs use `scope:<domain>` and `type:*` tags.
- Lifted m3kit libs in a consumer workspace may use a consumer scope such as `scope:acme-core` per `lift`, not `scope:m3kit-core`. Use the `scope` option in generated examples where possible.
- If exact tags vary by consumer, phrase as "adapt to your lifted-lib tags" rather than overclaiming.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> boundary guidance assertions pass.

### Step 4: Link boundary guidance from runbook/governance/checklist

Update generated packet text so the guidance is hard to miss:

- `runbook.md`: add a section before manual wiring: read/apply `boundary-guidance.md` before importing generated libs into app routes.
- `governance.yaml`: add an item under `verification_required` such as `- eslint boundary constraints reviewed or documented as not applicable`.
- `checklists/requirements.md`: add checklist items for boundary guidance reviewed and deliberate violation reverted.

Keep this compatible with Plan 001 if it has already landed. If Plan 001 changed runbook structure, insert the boundary section into its new preflight/verification flow.

**Verify**: `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` -> all packet assertions pass.

### Step 5: Update docs and skill

Update `docs/APP_PORTING.md` and `skills/m3kit-app-port/SKILL.md`:

- Mention that `port-page` emits boundary guidance for generated feature/data-access/ui libraries.
- State the generator does not automatically rewrite unknown consumer eslint configs.
- Add verification: after adding constraints, run lint and prove with a deliberate violation, then revert.

**Verify**: `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` -> exit 0.

### Step 6: Refresh dogfood packet only if required

If the checked-in customers dogfood packet is intended to mirror current generator output, add `m3kit-porting/customers/customers-report/boundary-guidance.md` and update related markdown/yaml checklist files. Do not change customer source libraries unless implementation actually regenerated them and reviewer agrees.

**Verify**: `git diff -- m3kit-porting/customers/customers-report` -> only packet guidance/checklist files changed.

## Test plan

- Extend `port-page` generator tests to assert boundary guidance file or section exists and contains key tags/directions.
- Verify `packetFiles()` includes the new file if using `boundary-guidance.md`.
- Existing tests for generated project tags (`generator.spec.ts:72-86`) should remain unchanged and serve as source-of-truth for the tags used in guidance.

## Done criteria

All must hold:

- [ ] `port-page` output includes boundary guidance for generated feature/data-access/ui libs.
- [ ] Guidance clearly says eslint config is not automatically rewritten.
- [ ] Guidance includes generated project tags and at least one allowed/forbidden import direction.
- [ ] Runbook or checklist links/requires boundary guidance review before manual wiring.
- [ ] `NX_DAEMON=false npx nx test m3kit-plugin --skip-nx-cache --runInBand` exits 0.
- [ ] `NX_DAEMON=false npx nx lint m3kit-plugin --skip-nx-cache` exits 0.
- [ ] `NX_DAEMON=false npx nx build m3kit-plugin --skip-nx-cache` exits 0.
- [ ] No root `eslint.config.mjs` consumer-domain changes were made unless separately approved.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report if:

- The generator already gained automatic eslint rewriting after this plan was written; this plan's guidance-only approach may be stale.
- You cannot identify lifted-lib tags reliably enough for snippets; emit consumer-adaptable guidance and stop before adding misleading exact constraints.
- Tests require modifying root m3kit `eslint.config.mjs` for generated `customers` tags. That is a product decision outside this plan.
- Boundary guidance conflicts with consumer's existing monorepo tag taxonomy.

## Maintenance notes

- This plan intentionally mirrors `lift`'s philosophy: print/emit constraints, do not silently rewrite unknown eslint config.
- Reviewers should check that examples do not overfit m3kit's own `scope:m3kit-*` tags when the consumer may use `@acme/*` / `scope:acme-*`.
- If Plan 001 already changed runbook structure, place boundary guidance in that new flow rather than adding a duplicate section.
