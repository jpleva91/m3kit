# Contestant Entry: openai-codex/gpt-5.5

## Selected feature

Token-driven `DataState` component for reporting surfaces.

A reusable UI component that standardizes non-happy-path report states:

- Loading
- Empty
- Error
- No permission
- Filtered-out / no matching results
- Offline / unavailable
- Success with optional summary metadata

This is a self-added feature intended to improve m3kit readiness by filling a common reporting UI gap without requiring data backends, hosted services, model downloads, credentials, or new dependencies.

## Why this wins for m3kit readiness

Reporting UIs repeatedly need to communicate “why there is no useful chart/table right now.” If each feature implements loading, empty, and error states independently, the library quickly accumulates inconsistent spacing, copy patterns, icon use, focus behavior, and token usage.

A dedicated `DataState` component is high-leverage because it:

- Improves perceived reliability of report pages before real integrations exist.
- Supports static Storybook demos with mocked props only.
- Requires no backend, API key, hosted endpoint, or dependency.
- Reinforces token-only styling and library boundaries.
- Creates a reusable primitive for tables, charts, dashboards, cards, and report sections.
- Is feasible as a small, testable component with clear acceptance criteria.

Acceptance criteria:

- Component renders one of a finite set of typed states.
- Component accepts title, description, optional icon slot, optional actions, and optional metadata.
- Component uses only existing design tokens from `DESIGN.md`.
- Component is framework-local and does not fetch data.
- Component has Storybook stories for each UX state.
- Unit tests cover rendering, ARIA behavior, and action projection.
- Cypress component/e2e coverage verifies keyboard and visual-state basics.

## Component API sketch

```ts
export type M3DataStateKind =
  | 'loading'
  | 'empty'
  | 'error'
  | 'forbidden'
  | 'filtered'
  | 'offline'
  | 'ready';

export interface M3DataStateAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  ariaLabel?: string;
}

export interface M3DataStateMetaItem {
  label: string;
  value: string | number;
}

@Component({
  selector: 'm3-data-state',
})
export class M3DataStateComponent {
  @Input({ required: true }) kind!: M3DataStateKind;

  @Input() title?: string;
  @Input() description?: string;

  @Input() actions: M3DataStateAction[] = [];
  @Input() meta: M3DataStateMetaItem[] = [];

  @Input() compact = false;
  @Input() fullHeight = false;

  @Output() actionSelected = new EventEmitter<M3DataStateAction>();
}
```

Projected-content alternative for stronger composition:

```html
<m3-data-state kind="empty">
  <m3-data-state-title>No reports yet</m3-data-state-title>
  <m3-data-state-description>
    Create a report or adjust your filters.
  </m3-data-state-description>

  <m3-data-state-actions>
    <button m3Button variant="primary">Create report</button>
    <button m3Button variant="secondary">Clear filters</button>
  </m3-data-state-actions>
</m3-data-state>
```

Preferred direction: support simple inputs first, with content projection for actions and rich descriptions if existing m3kit patterns favor projection.

## UX states

Loading:

- Shows progress affordance and short status text.
- Uses `aria-busy="true"` on the container.
- Avoids layout shift by supporting fixed/min-height variants.

Empty:

- Used when a report area has no data yet.
- Supports a primary action such as “Create report,” “Import data,” or “Configure source.”
- No backend assumptions.

Filtered:

- Used when data exists but current filters exclude all rows.
- Encourages “Clear filters” or “Edit filters.”
- Distinct from true empty state.

Error:

- Communicates failure without exposing technical internals by default.
- Supports retry action.
- Optional details slot can be added later, but should be collapsed or omitted in v1.

Forbidden:

- Indicates the user cannot view the report or section.
- Copy should avoid implying that permissions can be changed locally.
- No auth integration required.

Offline / unavailable:

- Indicates temporary unavailability.
- Suitable for demo-only static state.
- No network detection required in v1.

Ready:

- Optional success/summary state for report cards that have loaded.
- Can show small metadata such as “24 rows,” “Updated 2 min ago,” or “3 filters applied.”
- Should not replace tables/charts; it supplements them.

## Token/theming plan

Styling must be token-only and should not introduce raw color, spacing, radius, or typography values.

Token categories expected from `DESIGN.md`:

- Surface/background tokens for container and subtle state panels.
- Text tokens for title, description, muted metadata, and destructive/error copy.
- Spacing tokens for vertical rhythm and compact/full layouts.
- Border/radius tokens for panel shape.
- Focus tokens for projected or built-in actions.
- Icon/color semantic tokens for neutral, warning, error, and success-like states.

The component should expose no arbitrary color inputs. State appearance should be semantic and internally mapped to tokens.

Example theming strategy:

- `empty`, `filtered`, `loading`: neutral/subtle surface treatment.
- `error`: error semantic foreground and subtle error surface if available.
- `forbidden`: warning or neutral-restricted semantic treatment.
- `offline`: warning/subtle unavailable treatment.
- `ready`: success or neutral-positive treatment only if existing tokens support it.

If `DESIGN.md` does not define enough semantic state tokens, v1 should fall back to neutral tokens rather than inventing new styles.

## Accessibility notes

- Container should use semantic region labeling when embedded in complex reporting pages.
- Loading state should expose polite status text with `role="status"` where appropriate.
- Error state should use `role="alert"` only when the error appears dynamically and needs immediate announcement.
- Do not trap focus.
- If actions are rendered, they must be reachable by keyboard in DOM order.
- Icon-only visuals must not be the only indication of state.
- Default titles/descriptions should be plain language and not rely on color.
- Support reduced-motion expectations if any loading animation is used.
- Preserve visible focus indicators from the existing token system.
- Avoid automatically moving focus unless a parent workflow explicitly owns focus management.

## Storybook, unit, and Cypress plan

Storybook stories:

- `Loading`
- `Empty`
- `Filtered`
- `Error`
- `Forbidden`
- `Offline`
- `ReadyWithMetadata`
- `Compact`
- `FullHeight`
- `WithProjectedActions`
- `LongCopy`
- `NoDescription`

Unit tests:

- Renders required state kind.
- Applies correct accessible role/attributes for loading and error variants.
- Emits `actionSelected` when an input-defined action is activated.
- Renders projected action content without duplicating semantics.
- Handles missing optional title/description safely.
- Does not render empty metadata/action containers.
- Compact and full-height inputs apply expected host classes.

Cypress plan:

- Component story smoke tests for each state.
- Keyboard navigation through actions.
- Focus visibility check on action controls.
- Snapshot or visual-regression-friendly stories with deterministic content.
- No network stubbing required because the component is static and prop-driven.

## Implementation feasibility and sequence

Feasibility: high.

No new dependencies are required.

Suggested sequence:

1. Confirm existing component naming, selector, and export conventions from `AGENTS.md` and current m3kit UI package structure.
2. Add typed component API with finite `kind` union.
3. Implement neutral token-only layout first.
4. Add semantic state classes mapped only to existing design tokens.
5. Add Storybook stories for all states using static mocked content.
6. Add unit tests for rendering, accessibility attributes, and actions.
7. Add Cypress coverage against the Storybook examples or component harness.
8. Review for library-boundary compliance and remove any app-specific report assumptions.

This can be built as a small isolated component and adopted incrementally by report cards, table wrappers, chart wrappers, and dashboard panels.

## Evidence consulted

Per instruction, no tools or commands were called.

Evidence named in the prompt:

- `docs/readiness/m3kit-ui-tournament/2026-07-06/notebooklm-source-packet.md`
- `docs/readiness/m3kit-ui-tournament/2026-07-06/feature-candidate-list.md`
- `AGENTS.md`
- `DESIGN.md`

Constraints applied from the prompt:

- Proposal/prototype only.
- No source code modification.
- No new dependencies.
- No hosted endpoints, API keys, credentials, model downloads, real data, or backends.
- Preserve token-only styling.
- Preserve library boundaries.
- Do not claim command execution.

## Risks / rejection conditions

Reject or defer this feature if:

- Existing candidate list already contains a stronger, more foundational primitive required before this one.
- Current m3kit library already has an equivalent state/empty/error component.
- `DESIGN.md` lacks enough spacing, surface, text, border, and semantic tokens to implement the component without raw values.
- Existing library conventions prohibit projected actions or require a different composition model.
- The component starts accumulating data-fetching, permission-checking, retry orchestration, or backend behavior.
- The API becomes too app-specific to reporting and cannot serve tables, cards, charts, and dashboard panels generically.
- Accessibility behavior cannot be tested reliably in the current Storybook/unit/Cypress setup.
session_id: 20260706_085313_35aea0