# Web Worker AI Consolidation

## Decision

The first consolidated runtime slice lands as `libs/ai` with import path `@m3kit/ai` and Nx project name `m3kit-ai`.

This is a m3kit-native, Angular 19 / Nx 20 re-authoring of the useful browser-worker AI runtime concepts from the public `web-worker-ai` reference. It is not a direct source merge from the Angular 21 / Nx 23 reference app.

## What Shipped

- Generic task protocol: request/result/error/progress/main-thread/worker messages.
- `M3kAiRuntimeAdapter` seam plus `defineM3kAiAdapter` helper.
- `M3kAiFakeAdapter` for deterministic tests and demos without network/model work.
- Worker harness for init, task, cancel, result, stream chunk, and error flows.
- Warmup skip heuristics for explicit disable, unsupported Worker, save-data, slow connection, and low storage.
- Small validators for bounded strings, sentence counts, and JSON-object outputs.
- Privacy-safe telemetry defaults: no-op sink plus allow-list redaction.
- `warmupM3kAiRuntime` helper combining heuristics, adapter init, and telemetry.

## Guardrails

- No model downloads in CI.
- No provider SDK dependencies.
- No hosted endpoint or API-key storage by default.
- No UI assistant/tournament flow in this slice.
- No personal/private planning references imported from the reference repo.

## Future Gates

Provider adapters, app-side demo integration, and AI assistant UI exploration require separate specs and review gates. Any provider adapter must make runtime downloads, endpoint selection, credentials, and telemetry policy explicit before implementation.
