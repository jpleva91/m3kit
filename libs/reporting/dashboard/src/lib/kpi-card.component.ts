import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { formatCurrency, formatNumber, formatPercent, getCurrencySymbol } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/** Display format applied to numeric KPI values. */
export type KpiValueFormat = 'number' | 'currency' | 'percent';

/** Sparkline drawing area; the SVG scales to the card width. */
const SPARKLINE_WIDTH = 100;
const SPARKLINE_HEIGHT = 32;
const SPARKLINE_PADDING = 2;

/**
 * Compact KPI tile for dashboards: a label, a (optionally formatted)
 * value, an optional delta with a trend arrow, an optional inline SVG
 * sparkline, and an optional leading icon.
 *
 * ```html
 * <rpt-kpi-card
 *   label="Total revenue"
 *   [value]="384200"
 *   format="currency"
 *   [delta]="12"
 *   [sparkline]="[3, 5, 4, 8, 7, 9]"
 *   icon="payments"
 * />
 * ```
 */
@Component({
  selector: 'rpt-kpi-card',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  /** Short metric name shown above the value. */
  readonly label = input.required<string>();

  /** Metric value; numbers can be formatted via `format`. */
  readonly value = input.required<string | number>();

  /** Optional numeric format; ignored for string values. */
  readonly format = input<KpiValueFormat | null>(null);

  /** ISO currency code used by the `currency` format. */
  readonly currencyCode = input<string>('USD');

  /**
   * Change versus the previous period. Positive renders an upward
   * arrow in the success color, negative a downward arrow in the
   * warning color; `null` hides the delta entirely.
   */
  readonly delta = input<number | null>(null);

  /** Series rendered as an inline SVG polyline; needs >= 2 points. */
  readonly sparkline = input<readonly number[] | null>(null);

  /** Optional Material icon name shown next to the label. */
  readonly icon = input<string | null>(null);

  private readonly locale = inject(LOCALE_ID);

  /** Value with the requested numeric format applied. */
  protected readonly formattedValue = computed<string>(() => {
    const value = this.value();
    if (typeof value !== 'number') {
      return value;
    }
    switch (this.format()) {
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
  });

  /** Delta rendered with an explicit sign (`+12`, `-3.5`). */
  protected readonly formattedDelta = computed<string>(() => {
    const delta = this.delta() ?? 0;
    const formatted = formatNumber(Math.abs(delta), this.locale);
    return delta < 0 ? `-${formatted}` : `+${formatted}`;
  });

  /** SVG polyline `points` for the sparkline, or `null` to hide it. */
  protected readonly sparklinePoints = computed<string | null>(() => {
    const series = this.sparkline();
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
  });

  protected readonly sparklineViewBox = `0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`;
}

/** Rounds to two decimals to keep the SVG attribute compact. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
