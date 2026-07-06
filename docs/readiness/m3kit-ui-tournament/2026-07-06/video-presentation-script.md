# m3kit UI Tournament v2 — Video Presentation Script

## Opening
This tournament asked the available agent drivers to choose the next proposal-only UI component feature for m3kit after the @m3kit/ai port gate was approved.

## Context
m3kit is a clean-room Angular 19 / Nx 20 Material 3 reporting kit. The hard constraints are token-only styling, no new chart/UI libraries, synthetic data only, strict library boundaries, and complete component coverage.

## Source packet
The contestants all received the same source packet: current exported components, DESIGN.md doctrine, feature roadmap gaps, UI parity research, and the approved @m3kit/ai slice. The AI port matters as context, but its gate explicitly deferred assistant UI and provider adapters.

## Candidate list
The curated list included Saved View Manager, Report Action Bar, Chart State Frame, Data Table Column Manager, Relative Date Filter, Storybook Parity Dashboard, No-Secret Map Shell, and a defer-biased AI Runtime Demo Assistant Shell.

## Roster and degraded lanes
Runtime discovery found Codex, Claude Code, Antigravity/agy, and OpenCode. Codex, agy Gemini Flash Medium, and OpenCode DeepSeek free produced usable packets. Claude Fable hung with no output, and the remaining model variants were explicitly marked DNF or degraded rather than silently treated as successful.

## Scoring
The scoring rubric prioritized contract fit, launch impact, UX/API quality, accessibility and states, test/evidence quality, and implementation feasibility.

## Winner
The winner is OpenCode with the Data Table Column Manager. It identified that the table already accepts `columnState` and core already has headless column resolution. The missing piece is a UI that lets users toggle, reorder, and pin columns while emitting state that later saved views can capture.

## Recommendation
The next Spec Kit feature pack should implement `m3k-column-manager` in `libs/table`, with Storybook coverage for hidden, pinned, locked, many-column, and narrow states; unit tests for emitted state; and Cypress keyboard/focus tests. Saved View Manager should follow as the second slice.

## Close
This keeps m3kit launch-ready, enterprise credible, and within its clean-room, dependency-light architecture.
