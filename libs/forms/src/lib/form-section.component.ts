import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Heading levels a form section can slot into a page outline at. */
export type FormSectionHeadingLevel = 2 | 3 | 4;

/**
 * Titled section layout for grouping form fields: a heading, an
 * optional description, and a content-projection slot for the fields.
 * Typography and colors come from the M3 system tokens. The heading's
 * outline level is configurable via `headingLevel` so sections nest
 * correctly under the host page's headings.
 *
 * ```html
 * <m3k-form-section title="Billing" description="Where invoices are sent.">
 *   <m3k-form-field ... />
 * </m3k-form-section>
 * ```
 */
@Component({
  selector: 'm3k-form-section',
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSectionComponent {
  /** Section heading. */
  readonly title = input.required<string>();

  /** Optional supporting text under the heading. */
  readonly description = input<string>('');

  /** Outline level of the section heading. */
  readonly headingLevel = input<FormSectionHeadingLevel>(3);
}
