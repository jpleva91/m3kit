# Implementation Plan: Worker AI Consolidation

## Technical Context

- Repo stack: Angular 19.2.x, Nx 20.8.4, pnpm, TypeScript 5.7, Vitest.
- Target library: `libs/ai`, import path `@m3kit/ai`, Nx project `m3kit-ai`.
- Internal dependencies: none.
- Runtime/provider dependencies: none.
- Reference source: public `web-worker-ai` clone, used only for concept inventory.

## Constitution Check

- Clean-room integrity: PASS with boundary log row; public reference only; no private planning refs imported.
- Source-internalization first: PASS; plain Nx library layout, no publishing pipeline.
- Pinned-stack discipline: PASS; no package upgrades or new dependencies.
- Synthetic data only: PASS; tests use deterministic strings/objects, no real data.
- Boundary-log duties: PASS when `docs/BOUNDARY_LOG.md` includes the public reference consultation.
- Simplicity bias: PASS; first slice avoids provider SDKs and UI.

## Library Boundary

`scope:m3kit-ai` is headless and dependency-free. Apps may import it; other libraries do not need it for this slice. Future UI assistants should remain app-side or receive a separate spec.

## Implementation Shape

1. `protocol.ts`: generic task/message/result/progress/error/telemetry types.
2. `runtime-adapter.ts`: `defineM3kAiAdapter` wrapper for plain functions.
3. `fake-adapter.ts`: deterministic adapter for CI/demos.
4. `worker-harness.ts`: worker-global harness for init/task/cancel/result/error/chunk flow.
5. `heuristics.ts`: skip reasons from explicit disable, Worker support, save-data, slow connection, and low storage.
6. `validators.ts`: small reusable output guards.
7. `telemetry.ts`: no-op default and allow-list redaction.
8. `warmup.ts`: warmup helper combining skip heuristics, adapter init, and telemetry.

## Acceptance Gates

- Unit tests cover each exported behavior class.
- Lint enforces `scope:m3kit-ai` has no internal dependency edges.
- Docs clarify no model downloads, provider SDKs, hosted endpoints, or credentials ship by default.
- Whole workspace gate and secrets scan evidence recorded in the Kanban handoff.

## Future Work (Out of Scope)

- Provider-specific adapters.
- Angular signal service around Worker lifecycle.
- Demo-reporting page integration.
- UI tournament / design shotgun for AI assistant experiences.
