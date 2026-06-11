import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Titled section layout for grouping form fields: a heading, an
 * optional description, and a content-projection slot for the fields.
 * Typography and colors come from the M3 system tokens.
 *
 * ```html
 * <rpt-form-section title="Billing" description="Where invoices are sent.">
 *   <rpt-form-field ... />
 * </rpt-form-section>
 * ```
 */
@Component({
  selector: 'rpt-form-section',
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSectionComponent {
  /** Section heading. */
  readonly title = input.required<string>();

  /** Optional supporting text under the heading. */
  readonly description = input<string>('');
}
