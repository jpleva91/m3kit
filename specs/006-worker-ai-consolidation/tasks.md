# Tasks: Worker AI Consolidation

## Phase 1 — Spec and Boundary Setup

- [x] T001 Create `specs/006-worker-ai-consolidation/spec.md` with goals, non-goals, requirements, and gates.
- [x] T002 Create `plan.md` with constitution check and implementation shape.
- [x] T003 Add boundary log entry for the public `web-worker-ai` reference consultation.

## Phase 2 — Nx Library Skeleton

- [x] T004 Add `libs/ai/project.json`, tsconfig files, vite config, eslint config, and test setup.
- [x] T005 Add `@m3kit/ai` path alias.
- [x] T006 Add `scope:m3kit-ai` boundary rule with no internal dependencies and app allowance.

## Phase 3 — Runtime Slice

- [x] T007 Implement generic protocol types.
- [x] T008 Implement adapter definition seam.
- [x] T009 Implement deterministic fake adapter.
- [x] T010 Implement worker harness for init/task/cancel/result/error/chunk messages.
- [x] T011 Implement warmup skip heuristics.
- [x] T012 Implement validators.
- [x] T013 Implement privacy-safe telemetry redaction and no-op defaults.
- [x] T014 Implement warmup helper.

## Phase 4 — Tests and Docs

- [x] T015 Add Vitest coverage for fake adapter, heuristics, telemetry, worker harness, validators, and warmup.
- [x] T016 Add `libs/ai/README.md`.
- [x] T017 Add or update `docs/WEB_WORKER_AI_CONSOLIDATION.md` with final package/path choice.

## Phase 5 — Verification

- [x] T018 Run `pnpm exec nx run m3kit-ai:test --skip-nx-cache`.
- [x] T019 Run `pnpm exec nx run m3kit-ai:lint --skip-nx-cache`.
- [x] T020 Run `pnpm exec nx run-many -t lint,test,build --all --skip-nx-cache` or document exact blocker.
- [x] T021 Run `gitleaks detect --no-git --source specs docs --redact=20 --verbose`.
- [x] T022 Leave review-required Kanban handoff with changed files and evidence.
