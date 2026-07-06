# m3kit UI Component Model×Driver Tournament v2

Date: 2026-07-06
Mission Commander owner: `missioncommander`
Output directory: `docs/readiness/m3kit-ui-tournament/2026-07-06/`

## Executive result

Winner: OpenCode / `opencode/deepseek-v4-flash-free` with Candidate D, `m3k-column-manager`.

Runner-up: Antigravity/agy / `Gemini 3.5 Flash (Medium)`, also with Candidate D.

Honorable mention: Codex / `gpt-5.5` with Candidate A, `m3k-saved-view-menu`.

Additional in-process entry: Hermes/openai-codex `gpt-5.5` proposed a reusable Data State primitive. It is salvageable as a feedback/state-pattern idea, but scored lower because the API sketch used an off-contract `m3-data-state` selector instead of `m3k-*` and overlaps existing feedback components.

Recommended next Spec Kit feature pack: implement the Data Table Column Manager first, then follow with Saved View Manager integration. Column Manager wins because the repo already has headless `ColumnViewState` and `resolveColumns`; the UI closes an enterprise table parity gap without new dependencies, endpoints, storage, model downloads, or boundary changes.

## Mission Engine route record

Tier: T2 full spec-kit quality tournament, proposal-only.

Model-router decision:
- Preferred engine: Claude Code / Fable via `claudecodeconductor`, because the Mission Commander route policy prefers Claude/Fable for build-quality reasoning.
- Fallback ladder: Claude/Fable → Antigravity/agy → Codex → OpenCode/free models → local/degraded synthesis.
- Budget/rate-limit trigger: any lane that hangs, lacks credentials, or cannot produce an evidence-backed packet inside the bounded run is marked DNF/degraded rather than silently retried.
- Evidence gate: score only packets with concrete repo/doc evidence; reject unsupported claims, generic aesthetics, inaccessible interaction models, dependency additions, hosted endpoints, credentials, model downloads, or token/theming violations.

Downgrades logged:
- Claude Code Fable was attempted and hung with no stdout; the tournament continued through Codex, agy, and OpenCode instead of silently treating Claude as successful.
- Several available agy/OpenCode model variants were enumerated but recorded as DNF/degraded to avoid unbounded spend/runtime after representative lanes completed.

## Runtime roster

| Lane | Driver | Model | Status | Entry file |
|---|---|---:|---|---|
| codex-gpt-5-5 | Codex | gpt-5.5 | completed | `contestant-entry-codex-gpt-5-5.md` |
| hermes-openai-codex-gpt-5-5 | Hermes current lane | openai-codex/gpt-5.5 | completed/in-process | `contestant-entry-hermes-openai-codex-gpt-5-5.md` |
| claude-code-fable | Claude Code | fable | DNF/hung | `contestant-entry-claude-code-fable.md` |
| claude-code-sonnet | Claude Code | sonnet | degraded/not executed | `contestant-entry-claude-code-sonnet.md` |
| claude-code-opus | Claude Code | opus | degraded/not executed | `contestant-entry-claude-code-opus.md` |
| agy-gemini-3-5-flash-medium | Antigravity/agy | Gemini 3.5 Flash (Medium) | completed | `contestant-entry-agy-gemini-3-5-flash-medium.md` |
| agy-gemini-3-5-flash-high | Antigravity/agy | Gemini 3.5 Flash (High) | degraded/not executed | `contestant-entry-agy-gemini-3-5-flash-high.md` |
| agy-gemini-3-5-flash-low | Antigravity/agy | Gemini 3.5 Flash (Low) | degraded/not executed | `contestant-entry-agy-gemini-3-5-flash-low.md` |
| agy-gemini-3-1-pro-low | Antigravity/agy | Gemini 3.1 Pro (Low) | DNF | `contestant-entry-agy-gemini-3-1-pro-low.md` |
| agy-gemini-3-1-pro-high | Antigravity/agy | Gemini 3.1 Pro (High) | DNF | `contestant-entry-agy-gemini-3-1-pro-high.md` |
| agy-claude-sonnet-4-6-thinking | Antigravity/agy | Claude Sonnet 4.6 (Thinking) | DNF | `contestant-entry-agy-claude-sonnet-4-6-thinking.md` |
| agy-claude-opus-4-6-thinking | Antigravity/agy | Claude Opus 4.6 (Thinking) | DNF | `contestant-entry-agy-claude-opus-4-6-thinking.md` |
| agy-gpt-oss-120b-medium | Antigravity/agy | GPT-OSS 120B (Medium) | DNF | `contestant-entry-agy-gpt-oss-120b-medium.md` |
| opencode-deepseek-v4-flash-free | OpenCode | opencode/deepseek-v4-flash-free | completed | `contestant-entry-opencode-deepseek-v4-flash-free.md` |
| opencode-big-pickle | OpenCode | opencode/big-pickle | degraded/not executed | `contestant-entry-opencode-big-pickle.md` |
| opencode-mimo-v2-5-free | OpenCode | opencode/mimo-v2.5-free | degraded/not executed | `contestant-entry-opencode-mimo-v2-5-free.md` |
| opencode-nemotron-3-ultra-free | OpenCode | opencode/nemotron-3-ultra-free | degraded/not executed | `contestant-entry-opencode-nemotron-3-ultra-free.md` |
| opencode-north-mini-code-free | OpenCode | opencode/north-mini-code-free | degraded/not executed | `contestant-entry-opencode-north-mini-code-free.md` |

## Score table

Scoring dimensions: contract fit, launch impact, UX/API, accessibility/state coverage, test/evidence, feasibility. Max 30.

| Rank | Lane | Feature | Contract | Impact | UX/API | A11y/state | Test/evidence | Feasible | Total | Verdict |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | opencode-deepseek-v4-flash-free | Data Table Column Manager | 5 | 5 | 5 | 5 | 5 | 5 | 30 | Winner |
| 2 | agy-gemini-3-5-flash-medium | Data Table Column Manager | 5 | 5 | 4 | 5 | 4 | 5 | 28 | Runner-up |
| 3 | codex-gpt-5-5 | Saved View Menu | 5 | 5 | 4 | 4 | 2 | 4 | 24 | Honorable mention; weaker evidence because its sandbox could not read files |
| 4 | hermes-openai-codex-gpt-5-5 | Data State primitive | 3 | 4 | 3 | 4 | 3 | 4 | 21 | Salvageable, but selector/API need contract correction and overlap review |
| DNF | all degraded/unexecuted lanes | none | 0 | 0 | 0 | 0 | 0 | 0 | 0 | Not scored |

## Why Column Manager won

OpenCode grounded the proposal in concrete existing seams: `m3k-data-table` already accepts `columnState`, and `libs/core` already owns `ColumnViewState` / `resolveColumns`. That means the implementation can live in `libs/table`, emit intent-only state, and compose later with saved views without solving persistence first. Its proposal avoided drag-only UX and required keyboard move controls, visible locked/required states, non-color-only pin/hidden states, and complete spec/story/Cypress coverage.

## Salvageable ideas

- Codex's `m3k-saved-view-menu` should become the second feature after Column Manager, because it captures the emitted `ColumnViewState[]` plus serialized query state.
- Hermes/openai-codex's Data State primitive can be mined for a future `m3k-report-state` / feedback-state consolidation, but only after checking overlap with `m3k-empty-state`, `m3k-error-state`, `m3k-skeleton`, `m3k-banner`, and `m3k-chart-card` states.
- Chart State Frame remains a strong follow-up for accessibility/readiness, especially if the next pack includes docs parity.
- The AI Runtime Demo Assistant Shell should stay deferred until provider-adapter policy is explicit; the parent gate intentionally kept assistant UI out of `@m3kit/ai`.

## Recommended next Spec Kit feature pack

Feature pack: `specs/007-table-column-manager-and-saved-view-seam/`.

Scope:
1. `m3k-column-manager` in `libs/table`.
2. Storybook parity stories: default, hidden columns, pinned columns, locked columns, many columns, narrow viewport.
3. Unit tests for output state generation and edge cases.
4. Cypress keyboard/focus tests.
5. Demo wiring that feeds emitted `ColumnViewState[]` into `m3k-data-table`, without persistence.
6. ADR note that Saved View Manager is follow-up and consumes this state.

Estimated effort: 1.5–2.5 focused engineering days for the first slice; +1–2 days for saved-view UI follow-up.

## Evidence commands/results

- `hermes profile list`: enumerated profiles including `claudecodeconductor`, `antigravityclipilot`, `codexoperator`, `gatewarden`, etc.
- `command -v codex/claude/opencode/agy`: all four CLIs present under `/home/red/.local/bin`.
- `claude auth status --text` with real HOME: login present via Claude Max account.
- `codex doctor` with real HOME: auth configured, model `gpt-5.5`, websocket reachable; install/update path warning only.
- `agy models`: listed Gemini 3.5 Flash Low/Medium/High, Gemini 3.1 Pro Low/High, Claude Sonnet 4.6 Thinking, Claude Opus 4.6 Thinking, GPT-OSS 120B Medium.
- `opencode auth list`: 0 credentials; `opencode models`: free roster listed.
- Repo reads: `package.json`, `DESIGN.md`, `docs/FEATURE_ARCHITECTURE_ROADMAP.md`, `docs/UI_KIT_PARITY_RESEARCH.md`, `docs/WEB_WORKER_AI_CONSOLIDATION.md`, `libs/ai` protocol/adapter files, `m3k-data-table`, `m3k-chart-card`, `m3k-form-field`, `m3k-banner`.
- Contestant raw outputs are preserved under `raw/`.
