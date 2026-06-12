/**
 * One step of an `m3k-stepper-flow` wizard. UI-free: the definition carries
 * identity and progress state only; step content is supplied separately via
 * `ng-template[m3kStepPanel]` keyed by `id`.
 *
 * `completed` is the linear-mode gate — the flow never marks steps done by
 * itself; the consumer flips the flag when its own validity rules pass (e.g.
 * a step form becomes valid) and the footer's Next/Finish buttons honor it.
 */
export interface StepDefinition {
  /** Stable identity; matches a panel's `m3kStepPanel` template key. */
  id: string;
  /** Step header label. */
  label: string;
  /** Optional steps may be skipped even in linear flows. Default `false`. */
  optional?: boolean;
  /** Consumer-owned progress flag gating linear advancement. Default `false`. */
  completed?: boolean;
}
