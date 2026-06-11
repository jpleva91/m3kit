import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Routed-page header: a single `h1` set in the brand display typography
 * token, an optional supporting subtitle, and an end-aligned actions slot.
 *
 * ```html
 * <rpt-page-header title="Invoices" subtitle="Billing period June 2026">
 *   <button rptPageHeaderActions mat-stroked-button>Export</button>
 * </rpt-page-header>
 * ```
 */
@Component({
  selector: 'rpt-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  /** Page title — rendered as the component's only `h1`. */
  readonly title = input.required<string>();

  /** Optional supporting line beneath the title. */
  readonly subtitle = input<string>('');
}
