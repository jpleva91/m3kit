import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Severity of a {@link TimelineEvent}; drives the marker color pair. */
export type TimelineEventKind = 'info' | 'success' | 'warning' | 'error';

/** One entry in a {@link TimelineComponent} activity feed. */
export interface TimelineEvent {
  /** Stable identity used for list tracking. */
  readonly id: string;
  /** Event headline. */
  readonly title: string;
  /**
   * When the event happened. Rendered verbatim inside a `time` element
   * (and as its `datetime` attribute), so pass a pre-formatted string.
   */
  readonly timestamp: string;
  /** Optional supporting copy under the headline. */
  readonly description?: string;
  /** Optional Material icon name rendered inside the marker. */
  readonly icon?: string;
  /** Severity tinting the marker; defaults to `info`. */
  readonly kind?: TimelineEventKind;
}

/** Resolved per-event view model rendered by the template. */
interface TimelineEventView {
  readonly id: string;
  readonly title: string;
  readonly timestamp: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly kind: TimelineEventKind;
}

/**
 * Vertical activity feed: an ordered list of events, each with a
 * severity-tinted marker dot on a shared connector rail, a headline, a
 * `time` element in the brand data stack, and optional supporting copy.
 * Marker colors follow the kit's severity pairs (`--app-severity-*` with
 * M3 system fallbacks), matching `m3k-banner`.
 *
 * ```html
 * <m3k-timeline
 *   [events]="[
 *     { id: 'evt-1', title: 'Ticket created', timestamp: '2026-05-28 09:14' },
 *     { id: 'evt-2', title: 'Fix deployed', timestamp: '2026-05-29 16:40', kind: 'success' },
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'm3k-timeline',
  imports: [MatIconModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  /** Events rendered top to bottom in source order. */
  readonly events = input.required<readonly TimelineEvent[]>();

  /** Events resolved into render-ready view models. */
  protected readonly views = computed<readonly TimelineEventView[]>(() =>
    this.events().map((event) => ({
      id: event.id,
      title: event.title,
      timestamp: event.timestamp,
      description: event.description ?? null,
      icon: event.icon ?? null,
      kind: event.kind ?? 'info',
    })),
  );
}
