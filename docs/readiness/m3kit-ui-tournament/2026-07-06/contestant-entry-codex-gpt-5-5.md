# Contestant Entry: Codex/GPT-5

## Selected feature
Self-added: `m3k-saved-view-menu`, a table/report saved-view picker and manager.

Acceptance criteria:
- Users can select, create, rename, duplicate, reset, and delete saved table views.
- A saved view captures `SerializedDataQuery`, `ColumnViewState`, sorting, pagination-size preference, and optional label/description.
- Emits persistence events only; no backend, storage, credentials, or real data.
- Works with existing `@m3kit/core` saved-view helpers and table `columnState`.

## Why this wins for m3kit readiness
m3kit already has table state, URL query helpers, saved-view helpers, and a demo reporting surface, but saved views are a readiness-critical workflow that currently appears headless from the AGENTS.md inventory. A reusable saved-view UI turns those contracts into an adoption-ready reporting pattern without new dependencies.

## Component API sketch
```ts
type SavedViewMenuMode = 'readonly' | 'editable';

@Component({ selector: 'm3k-saved-view-menu' })
export class SavedViewMenuComponent {
  views = input.required<SavedView[]>();
  activeViewId = input<string | null>(null);
  dirty = input(false);
  mode = input<SavedViewMenuMode>('editable');

  viewSelected = output<string>();
  viewCreate = output<SavedViewDraft>();
  viewRename = output<{ id: string; name: string }>();
  viewDuplicate = output<string>();
  viewDelete = output<string>();
  viewReset = output<string>();
}
```

## UX states
Default selected view, unsaved changes indicator, empty state, readonly mode, max-name validation, duplicate-name validation, destructive delete confirmation, disabled actions while parent persistence is pending.

## Token/theming plan
Token-only SCSS: `--mat-sys-*` for typography/color/state layers, `--app-radius-control` for trigger/menu controls, `--app-radius-card` for dialog surfaces, `--app-font-data` only for compact metadata. No brand selectors, no raw hex, no new `--app-*` token unless review proves saved-view status needs one.

## Accessibility notes
Use Material menu/dialog primitives internally. Trigger has `aria-haspopup="menu"` and reflects active view name. Dirty state is text plus icon, not color-only. Rename/create inputs have explicit labels and validation messages. Delete confirmation receives focus, supports Escape, and returns focus to trigger.

## Storybook, unit, and Cypress plan
Storybook in table stories: empty, single view, many views, dirty active view, readonly, validation error, dark/light brand examples.

Unit tests: event emissions, disabled states, validation, active label computation, readonly action filtering.

Cypress component tests: keyboard open/select, create/rename/delete flows, focus return after dialog, accessible validation text.

## Implementation feasibility and sequence
1. Add component in `libs/table/src/lib/saved-view-menu.*`.
2. Reuse `SavedView` contracts from `@m3kit/core`.
3. Add story/spec/cy beside the component.
4. Export from `libs/table/src/index.ts`.
5. Optionally wire into demo reporting after the component lands.

No new dependency required.

## Evidence consulted
Used: AGENTS.md content provided in the prompt, especially library boundaries, token contract, exported component inventory, coverage bar, and no-new-dependency rules.

Could not inspect the requested local files because the command runner failed before execution with `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`, including `rtk read`, plain `sed`, `wc`, and `pwd`. That means this packet is provisional if tournament rules require verified reads of:
- `docs/readiness/m3kit-ui-tournament/2026-07-06/notebooklm-source-packet.md`
- `docs/readiness/m3kit-ui-tournament/2026-07-06/feature-candidate-list.md`
- `DESIGN.md`

## Risks / rejection conditions
Reject if the candidate list already deprioritizes saved views, if `DESIGN.md` forbids this interaction pattern, or if saved-view persistence semantics are not stable enough in `@m3kit/core`. Also reject if implementation needs app-specific storage; this component should stay event-driven and source-internalizable.
