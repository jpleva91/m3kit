# Feature Spec: Worker AI Consolidation

**Feature Branch**: `wt/m3kit-ai-port`  
**Created**: 2026-07-06  
**Status**: First runtime slice implemented  
**Input**: Kanban task `t_5057bd9c`; public reference clone `/tmp/web-worker-ai-inspect` at `83a59cb`; m3kit constitution.

## Scope

Create a source-internalizable `@m3kit/ai` library that captures the useful worker-runtime concepts from the public `web-worker-ai` experiment in Angular 19 / Nx 20 native form.

## Goals

- Provide a generic AI task protocol for browser workers: task requests, results, progress, errors, stream chunks, and cancel messages.
- Provide a `M3kAiRuntimeAdapter` seam so consumers can plug in browser-native APIs, WebLLM, Transformers.js, or a private service outside this reference repo.
- Ship a deterministic fake adapter for demos, tests, and CI without downloading models.
- Ship worker harness, warmup skip heuristics, validators, and privacy-safe telemetry helpers.
- Keep `@m3kit/ai` optional and dependency-free inside the m3kit graph.

## Non-Goals

- No model downloads in CI.
- No hosted endpoint, API-key flow, browser credential storage, or provider SDK dependency.
- No UI tournament or app-facing assistant UX in this feature.
- No copying Angular 21 / Nx 23 source wholesale; implementation is re-authored for this repo.

## User Stories & Tests

### US1 — Consumer wires a local worker adapter (P1)

As a consumer developer, I can create a worker with `createM3kAiWorker({ adapter })` and exchange init/task/result/error messages without depending on any hosted service.

**Acceptance**:
- Worker emits `ready` after adapter init.
- Worker emits `result` with request id, task type, adapter id, optional correlation key, and duration.
- Cancelled request ids do not emit results.

### US2 — Consumer tests AI flows without AI infrastructure (P1)

As a consuming app, I can use `M3kAiFakeAdapter` to exercise summarize/classify/extract/rewrite paths deterministically.

**Acceptance**:
- Fake adapter does not perform network calls or model downloads.
- Fake streaming emits chunks and resolves final output.

### US3 — Consumer protects user/device privacy by default (P1)

As a product team, I can warm up or skip AI runtimes based on browser/device conditions and report operational telemetry without leaking prompts or outputs.

**Acceptance**:
- Skip reasons include disabled, worker unsupported, save-data, slow connection, and low storage.
- Telemetry redaction permits only operational keys (`adapterId`, `taskType`, `durationMs`, `errorClass`, `retryable`, `skipReason`, `state`).
- No default telemetry contains input, prompt, output, or raw error payloads.

## Requirements

- FR-001: Add `@m3kit/ai` TS alias and `m3kit-ai` Nx library under `libs/ai`.
- FR-002: Library MUST have no runtime dependencies beyond the repo's existing Angular/Nx/TypeScript stack.
- FR-003: Library MUST export protocol, adapter seam, fake adapter, worker harness, heuristics, validators, telemetry helpers, and warmup helper.
- FR-004: Library MUST include Vitest specs for fake adapter, heuristics, telemetry, worker harness, validators, and warmup.
- FR-005: App dep constraints MAY allow apps to depend on `scope:m3kit-ai`; `scope:m3kit-ai` MUST depend on no internal libs.
- FR-006: Docs MUST state that provider adapters and model downloads are consumer-owned and not enabled by default.

## Clean-Room / Boundary Gates

- Public reference consulted: `/tmp/web-worker-ai-inspect` from `https://github.com/jpleva91/web-worker-ai` at `83a59cb`.
- Source use: informed-by/re-authored only; no verbatim source copy intended.
- Boundary log entry required in `docs/BOUNDARY_LOG.md`.
- Secrets scan required for `specs` and `docs`.

## Success Criteria

- `pnpm exec nx run m3kit-ai:test --skip-nx-cache` passes.
- `pnpm exec nx run m3kit-ai:lint --skip-nx-cache` passes.
- Required whole-workspace gate is attempted and either passes or exact blockers are documented.
- `gitleaks detect --no-git --source specs docs --redact=20 --verbose` passes.
