# Tasks: Application Porting Skill + Safe Nx Generators

## Phase 0 - Spec and Governance

- [ ] T001 Confirm spec pack is present: `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, `governance.yaml`, `contracts/*`, `checklists/requirements.md`.
- [ ] T002 Add `docs/APP_PORTING.md` documenting the safe app-porting workflow.
- [ ] T003 Add `skills/m3kit-app-port/SKILL.md` with agent/user workflow and side-effect boundaries.

## Phase 1 - Analyzer Generator TDD

- [ ] T004 Add `tools/plugin/src/generators/port-analyze/schema.json` and `schema.d.ts`.
- [ ] T005 Write failing tests for target-path resolution in fixture Nx workspace.
- [ ] T006 Implement minimal target-path/project resolution.
- [ ] T007 Write failing tests for inferred m3kit library needs from sample table/form/dashboard/shell markup/imports.
- [ ] T008 Implement heuristic library inference with conservative `manual-review` output for unknowns.
- [ ] T009 Write failing tests that analyzer writes `porting-plan.md`, `component-inventory.md`, `data-access-map.md`, `test-plan.md`, and `analysis.json`.
- [ ] T010 Implement analysis packet writer.
- [ ] T011 Write failing no-mutation test proving source files unchanged in analysis mode.
- [ ] T012 Pass analyzer tests.

## Phase 2 - Port Page Generator TDD

- [ ] T013 Add `tools/plugin/src/generators/port-page/schema.json` and `schema.d.ts`.
- [ ] T014 Write failing tests for generated `libs/<domain>/feature-<page>`, `data-access`, and `ui` folders.
- [ ] T015 Implement minimal side-by-side scaffold generation.
- [ ] T016 Write failing tests for Nx tags/project naming/import boundaries.
- [ ] T017 Implement project metadata/tags and path aliases.
- [ ] T018 Write failing conflict tests: existing destination refuses overwrite unless `--force`.
- [ ] T019 Implement conflict detection and conflict report.
- [ ] T020 Write failing tests for m3kit lift command output / inferred library closure.
- [ ] T021 Implement lift guidance/integration.

## Phase 3 - Spec Kit, Tests, Runbook Generation

- [ ] T022 Write failing tests for generated Spec Kit artifact completeness.
- [ ] T023 Generate `spec.md`, `plan.md`, `tasks.md`, `quickstart.md`, `contracts/*`, `checklists/requirements.md`, and `governance.yaml` for each porting packet.
- [ ] T024 Write failing tests for generated component/service specs and pending behavior tests.
- [ ] T025 Generate colocated `.spec.ts` files for feature/data-access/ui scaffolds.
- [ ] T026 Generate Storybook/Cypress scaffolds where target conventions support them.
- [ ] T027 Generate `runbook.md` with manual route wiring, test commands, comparison checklist, and rollback steps.
- [ ] T028 Generate `ai-wiring-prompt.md` with safe side-effect boundaries.

## Phase 4 - Docs, Skill, and Validation

- [ ] T029 Update `tools/plugin/README.md` with `port-analyze` and `port-page` commands.
- [ ] T030 Add/validate skill command references match generator schemas.
- [ ] T031 Run `npx nx run m3kit-plugin:test`.
- [ ] T032 Run `npx nx run m3kit-plugin:lint`.
- [ ] T033 Run `npx nx run m3kit-plugin:build`.
- [ ] T034 Run `gitleaks` on specs/docs.
- [ ] T035 Create PR with exact verification evidence and no destructive external writes beyond branch/PR.
