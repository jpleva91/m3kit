import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { formatCurrency, formatNumber, formatPercent, getCurrencySymbol } from '@angular/common';

/** Display format applied to numeric stat values. */
export type StatListFormat = 'plain' | 'currency' | 'percent';

/** One label/value row in a {@link StatListComponent}. */
export interface StatListItem {
  /** Row label shown on the left. */
  readonly label: string;
  /** Row value, right-aligned; numbers can be formatted via `format`. */
  readonly value: string | number;
  /**
   * Change versus the previous period. Positive renders in the positive
   * sentiment color, negative in the negative one; omitted hides the
   * delta entirely.
   */
  readonly delta?: number;
  /**
   * Optional numeric format; ignored for string values. `plain` (the
   * default) renders the number as-is, without locale grouping.
   */
  readonly format?: StatListFormat;
}

/** Resolved per-item view model rendered by the template. */
interface StatListRow {
  readonly label: string;
  readonly value: string;
  readonly delta: number | null;
  readonly formattedDelta: string;
}

/**
 * Compact label/value rows for summary panels: each row pairs a muted
 * label with a right-aligned value in the brand data (mono) stack with
 * tabular figures, plus an optional sentiment-colored delta. The
 * unframed sibling of {@link DetailCardComponent} — drop it inside any
 * card or panel that already provides its own chrome.
 *
 * ```html
 * <m3k-stat-list
 *   [items]="[
 *     { label: 'Total billed', value: 1284902.44, format: 'currency', delta: 4.2 },
 *     { label: 'Collection rate', value: 0.866, format: 'percent', delta: -1.2 },
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'm3k-stat-list',
  templateUrl: './stat-list.component.html',
  styleUrl: './stat-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatListComponent {
  /** Rows rendered top to bottom, separated by hairline dividers. */
  readonly items = input.required<readonly StatListItem[]>();

  /** When true, tightens row padding and type for sidebar-grade panels. */
  readonly dense = input<boolean>(false);

  /** ISO currency code used by the `currency` format. */
  readonly currencyCode = input<string>('USD');

  private readonly locale = inject(LOCALE_ID);

  /** Items resolved into render-ready rows. */
  protected readonly rows = computed<readonly StatListRow[]>(() =>
    this.items().map((item) => {
      const delta = item.delta ?? null;
      return {
        label: item.label,
        value: this.formatValue(item),
        delta,
        formattedDelta: delta === null ? '' : this.formatDelta(delta),
      };
    }),
  );

  /** Item value with its requested numeric format applied. */
  private formatValue(item: StatListItem): string {
    const { value } = item;
    if (typeof value !== 'number') {
      return value;
    }
    switch (item.format) {
      case 'currency':
        return formatCurrency(
          value,
          this.locale,
          getCurrencySymbol(this.currencyCode(), 'narrow', this.locale),
          this.currencyCode(),
        );
      case 'percent':
        return formatPercent(value, this.locale);
      default:
        return String(value);
    }
  }

  /** Delta rendered with an explicit sign (`+12`, `-3.5`). */
  private formatDelta(delta: number): string {
    const formatted = formatNumber(Math.abs(delta), this.locale);
    return delta < 0 ? `-${formatted}` : `+${formatted}`;
  }
}
