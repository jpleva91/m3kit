import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One term/description pair in a {@link DescriptionListComponent}. */
export interface DescriptionListItem {
  /** Field name (rendered as `dt`) in label typography. */
  readonly term: string;
  /** Field value (rendered as `dd`) in body typography. */
  readonly description: string;
  /**
   * When true, the description renders in the brand data (mono) stack —
   * for identifiers, dates, and amounts that should align like data.
   */
  readonly mono?: boolean;
}

/** Column count for a {@link DescriptionListComponent}. */
export type DescriptionListColumns = 1 | 2;

/**
 * Definition list (`dl`/`dt`/`dd`) for record detail panes: muted
 * uppercase terms over body-type descriptions, optionally in two columns.
 * Mono descriptions use the brand data stack for identifiers and dates.
 *
 * ```html
 * <m3k-description-list
 *   [columns]="2"
 *   [items]="[
 *     { term: 'Customer', description: 'Acme Manufacturing GmbH' },
 *     { term: 'Account ID', description: 'CUST-00482', mono: true },
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'm3k-description-list',
  templateUrl: './description-list.component.html',
  styleUrl: './description-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionListComponent {
  /** Term/description pairs rendered in source order. */
  readonly items = input.required<readonly DescriptionListItem[]>();

  /** Column count; `2` lays pairs out in a two-column grid. */
  readonly columns = input<DescriptionListColumns>(1);
}
