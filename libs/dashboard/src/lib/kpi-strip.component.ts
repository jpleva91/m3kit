import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { formatCurrency, formatNumber, formatPercent, getCurrencySymbol } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import type { KpiValueFormat } from './kpi-card.component';

/** One readout in a {@link KpiStripComponent}. */
export interface KpiStripItem {
  /** Short metric name shown above the value. */
  readonly label: string;
  /** Metric value; numbers can be formatted via `format`. */
  readonly value: string | number;
  /** Optional numeric format; ignored for string values. */
  readonly format?: KpiValueFormat;
  /**
   * Change versus the previous period. Positive renders an upward arrow
   * in the positive sentiment color, negative a downward arrow in the
   * negative one; `null`/omitted hides the delta entirely.
   */
  readonly delta?: number | null;
  /** Series rendered as an inline SVG polyline; needs >= 2 points. */
  readonly sparkline?: readonly number[] | null;
}

/** Resolved per-item view model rendered by the template. */
interface KpiStripReadout {
  readonly label: string;
  readonly value: string;
  readonly delta: number | null;
  readonly formattedDelta: string;
  readonly sparklinePoints: string | null;
}

/** Sparkline drawing area; the SVG keeps a fixed inline footprint. */
const SPARKLINE_WIDTH = 84;
const SPARKLINE_HEIGHT = 24;
const SPARKLINE_PADDING = 2;

/**
 * Inline divided KPI readout row: a single hairline-divided strip of
 * label-over-value readouts with optional deltas and sparklines. The
 * dense, full-width sibling of {@link KpiCardComponent} — values render
 * in the brand data (mono) stack with tabular figures.
 *
 * ```html
 * <m3k-kpi-strip
 *   [items]="[
 *     { label: 'Total revenue', value: 1284902.44, format: 'currency', delta: 4.2 },
 *     { label: 'Open invoices', value: 38, delta: 6, sparkline: [3, 5, 4, 8] },
 *   ]"
 * />
 * ```
 */
@Component({
  selector: 'm3k-kpi-strip',
  imports: [MatIconModule],
  templateUrl: './kpi-strip.component.html',
  styleUrl: './kpi-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiStripComponent {
  /** Readouts rendered left to right, separated by hairline dividers. */
  readonly items = input.required<readonly KpiStripItem[]>();

  /** ISO currency code used by the `currency` format. */
  readonly currencyCode = input<string>('USD');

  private readonly locale = inject(LOCALE_ID);

  /** Items resolved into render-ready readouts. */
  protected readonly readouts = computed<readonly KpiStripReadout[]>(() =>
    this.items().map((item) => {
      const delta = item.delta ?? null;
      return {
        label: item.label,
        value: this.formatValue(item),
        delta,
        formattedDelta: delta === null ? '' : this.formatDelta(delta),
        sparklinePoints: sparklinePoints(item.sparkline ?? null),
      };
    }),
  );

  protected readonly sparklineViewBox = `0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`;
  protected readonly sparklineWidth = SPARKLINE_WIDTH;
  protected readonly sparklineHeight = SPARKLINE_HEIGHT;

  /** Item value with its requested numeric format applied. */
  private formatValue(item: KpiStripItem): string {
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
      case 'number':
        return formatNumber(value, this.locale);
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

/** SVG polyline `points` for a sparkline series, or `null` to hide it. */
function sparklinePoints(series: readonly number[] | null): string | null {
  if (!series || series.length < 2) {
    return null;
  }
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;
  const innerHeight = SPARKLINE_HEIGHT - 2 * SPARKLINE_PADDING;
  const stepX = SPARKLINE_WIDTH / (series.length - 1);
  return series
    .map((value, i) => {
      // Flat series draws a midline; otherwise scale into the padded box.
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const x = i * stepX;
      const y = SPARKLINE_HEIGHT - SPARKLINE_PADDING - normalized * innerHeight;
      return `${round2(x)},${round2(y)}`;
    })
    .join(' ');
}

/** Rounds to two decimals to keep the SVG attribute compact. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
