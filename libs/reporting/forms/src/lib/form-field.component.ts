import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

/** Input control rendered by `rpt-form-field`. */
export type FormFieldType = 'text' | 'number' | 'currency' | 'date' | 'select';

/** One choice offered by a `select` form field. */
export interface FormFieldOption {
  readonly value: unknown;
  readonly label: string;
}

/**
 * Generic Material form field bound to a typed `FormControl`.
 *
 * Renders the appropriate control for its {@link FormFieldType}:
 * `text` and `number`/`currency` render a `matInput`, `date` renders a
 * `matInput` with a datepicker (consumers must provide a `DateAdapter`,
 * e.g. `provideNativeDateAdapter()`), and `select` renders a
 * `mat-select` over the `options` input. Validation errors for
 * `required`, `min`, and `max` are shown via `mat-error` once the
 * control is touched.
 *
 * ```html
 * <rpt-form-field label="Amount" type="currency" [control]="amount" />
 * ```
 */
@Component({
  selector: 'rpt-form-field',
  imports: [
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent<V = unknown> {
  /** Floating label of the field. */
  readonly label = input.required<string>();

  /** Typed reactive control the field reads and writes. */
  readonly control = input.required<FormControl<V>>();

  /** Which input control to render. Defaults to `text`. */
  readonly type = input<FormFieldType>('text');

  /** Choices for `select` fields; ignored for other types. */
  readonly options = input<readonly FormFieldOption[]>([]);

  /** Optional hint shown under the field. */
  readonly hint = input<string>('');

  /** Marks the label with the Material required indicator. */
  readonly required = input<boolean>(false);

  /** Lower bound of a failed `min` validation, for the error message. */
  protected minBound(): number | null {
    const error: unknown = this.control().getError('min');
    return this.boundOf(error, 'min');
  }

  /** Upper bound of a failed `max` validation, for the error message. */
  protected maxBound(): number | null {
    const error: unknown = this.control().getError('max');
    return this.boundOf(error, 'max');
  }

  private boundOf(error: unknown, key: 'min' | 'max'): number | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }
    const bound = (error as Record<string, unknown>)[key];
    return typeof bound === 'number' ? bound : null;
  }
}
