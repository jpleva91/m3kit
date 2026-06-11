import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EMPTY, of } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

/** Input control rendered by `rpt-form-field`. */
export type FormFieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'textarea'
  | 'autocomplete'
  | 'chips'
  | 'checkbox'
  | 'toggle'
  | 'radio'
  | 'slider'
  | 'button-toggle'
  | 'date-range';

/** One choice offered by an option-driven form field. */
export interface FormFieldOption {
  readonly value: unknown;
  readonly label: string;
}

/** Controls of the `FormGroup` bound to a `date-range` field. */
export interface DateRangeControls {
  readonly start: FormControl<Date | null>;
  readonly end: FormControl<Date | null>;
}

/** Typed `FormGroup` consumed by `date-range` fields via the `range` input. */
export type DateRangeGroup = FormGroup<DateRangeControls>;

/**
 * Generic Material form field bound to a typed `FormControl`.
 *
 * Renders the appropriate control for its {@link FormFieldType}:
 *
 * - `text`, `number`, `currency`, and `textarea` render a `matInput`
 *   (`textarea` honors the `rows` input).
 * - `date` renders a `matInput` with a datepicker, and `date-range`
 *   renders a `mat-date-range-input` bound to the `range` `FormGroup`
 *   instead of `control` (both need a `DateAdapter`, e.g.
 *   `provideNativeDateAdapter()`).
 * - `select`, `autocomplete`, `radio`, and `button-toggle` offer the
 *   `options` input as choices; `autocomplete` filters them live
 *   against the typed text.
 * - `chips` renders a `mat-chip-grid` over a `FormControl<string[]>`,
 *   adding values from free text (Enter) or the `options` autocomplete.
 * - `checkbox`, `toggle`, `radio`, `slider`, and `button-toggle` do not
 *   fit `mat-form-field` structurally, so they render in a wrapper with
 *   the same label/hint/error chrome, visually aligned with the rest.
 *
 * Validation errors for `required`, `requiredTrue`, `min`, and `max`
 * are shown once the control is touched.
 *
 * ```html
 * <rpt-form-field label="Amount" type="currency" [control]="amount" />
 * <rpt-form-field label="Billing period" type="date-range" [range]="period" />
 * ```
 */
@Component({
  selector: 'rpt-form-field',
  imports: [
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    NgTemplateOutlet,
    ReactiveFormsModule,
  ],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent<V = unknown> {
  /** Floating label of the field. */
  readonly label = input.required<string>();

  /**
   * Typed reactive control the field reads and writes. Required for
   * every type except `date-range`, which binds `range` instead.
   */
  readonly control = input<FormControl<V>>();

  /** Typed `{ start, end }` group bound by `date-range` fields. */
  readonly range = input<DateRangeGroup>();

  /** Which input control to render. Defaults to `text`. */
  readonly type = input<FormFieldType>('text');

  /**
   * Choices for `select`, `autocomplete`, `chips`, `radio`, and
   * `button-toggle` fields; ignored for other types.
   */
  readonly options = input<readonly FormFieldOption[]>([]);

  /** Optional hint shown under the field. */
  readonly hint = input<string>('');

  /** Marks the label with the Material required indicator. */
  readonly required = input<boolean>(false);

  /** Visible rows of a `textarea` field. Defaults to `3`. */
  readonly rows = input<number>(3);

  /** Lower bound of a `slider` field. Defaults to `0`. */
  readonly min = input<number>(0);

  /** Upper bound of a `slider` field. Defaults to `100`. */
  readonly max = input<number>(100);

  /** Step increment of a `slider` field. Defaults to `1`. */
  readonly step = input<number>(1);

  /** Text typed into the chip input, drives chip option filtering. */
  protected readonly chipQuery = signal('');

  /** Live value of the bound control, for option filtering. */
  private readonly liveValue = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control ? control.valueChanges.pipe(startWith(control.value)) : of(undefined),
      ),
    ),
  );

  /** `options` filtered against the text typed into an `autocomplete`. */
  protected readonly filteredOptions = computed(() => {
    const query = this.liveValue();
    if (typeof query !== 'string' || query.trim() === '') {
      return this.options();
    }
    const lowered = query.trim().toLowerCase();
    return this.options().filter((option) =>
      option.label.toLowerCase().includes(lowered),
    );
  });

  /** Chips currently selected by a `chips` field. */
  protected readonly selectedChips = computed(() => {
    const value = this.liveValue();
    return Array.isArray(value) ? value.map(String) : [];
  });

  /** Unselected `options` matching the chip input text. */
  protected readonly chipOptions = computed(() => {
    const selected = new Set(this.selectedChips());
    const lowered = this.chipQuery().trim().toLowerCase();
    return this.options().filter(
      (option) =>
        !selected.has(String(option.value)) &&
        (lowered === '' || option.label.toLowerCase().includes(lowered)),
    );
  });

  constructor() {
    // The error/hint chrome reads non-reactive control state (touched,
    // errors), so nudge OnPush whenever the bound control reports any
    // event (value, status, touched, pristine).
    const changeDetector = inject(ChangeDetectorRef);
    toObservable(computed(() => this.control() ?? this.range()))
      .pipe(
        switchMap((control) => (control ? control.events : EMPTY)),
        takeUntilDestroyed(),
      )
      .subscribe(() => changeDetector.markForCheck());
  }

  /** Bound control; throws when missing for a type that needs one. */
  protected ctrl(): FormControl<V> {
    const control = this.control();
    if (!control) {
      throw new Error(
        `rpt-form-field: type "${this.type()}" requires the "control" input.`,
      );
    }
    return control;
  }

  /** Bound range group; throws when missing for a `date-range` field. */
  protected rangeGroup(): DateRangeGroup {
    const range = this.range();
    if (!range) {
      throw new Error('rpt-form-field: type "date-range" requires the "range" input.');
    }
    return range;
  }

  /** Renders the autocomplete's selected value with its option label. */
  protected readonly displayOptionLabel = (value: unknown): string => {
    const match = this.options().find((option) => option.value === value);
    if (match) {
      return match.label;
    }
    return value == null ? '' : String(value);
  };

  /** Tracks chip input text for option filtering. */
  protected onChipQueryInput(event: Event): void {
    this.chipQuery.set((event.target as HTMLInputElement).value);
  }

  /** Adds a free-text chip on Enter. */
  protected addChip(event: MatChipInputEvent): void {
    this.appendChip(event.value);
    event.chipInput.clear();
    this.chipQuery.set('');
  }

  /** Adds the chip picked from the autocomplete. */
  protected selectChip(event: MatAutocompleteSelectedEvent, input: HTMLInputElement): void {
    this.appendChip(String(event.option.value));
    event.option.deselect();
    input.value = '';
    this.chipQuery.set('');
  }

  /** Removes a chip and writes the remaining values to the control. */
  protected removeChip(chip: string): void {
    const control = this.chipsControl();
    control.setValue(this.selectedChips().filter((value) => value !== chip));
    control.markAsDirty();
  }

  /** Single error message of the field, or `null` when valid. */
  protected errorMessage(): string | null {
    const label = this.label();
    if (this.hasFieldError('required')) {
      return `${label} is required.`;
    }
    if (this.hasFieldError('min')) {
      return `${label} must be at least ${this.minBound()}.`;
    }
    if (this.hasFieldError('max')) {
      return `${label} must be at most ${this.maxBound()}.`;
    }
    return null;
  }

  /** Error message of a wrapper-rendered field, gated on touch. */
  protected wrapperError(): string | null {
    return this.ctrl().touched ? this.errorMessage() : null;
  }

  private hasFieldError(code: string): boolean {
    if (this.type() === 'date-range') {
      const { start, end } = this.rangeGroup().controls;
      return (
        this.rangeGroup().hasError(code) || start.hasError(code) || end.hasError(code)
      );
    }
    return this.ctrl().hasError(code);
  }

  private appendChip(raw: string): void {
    const value = raw.trim();
    if (value === '' || this.selectedChips().includes(value)) {
      return;
    }
    const control = this.chipsControl();
    control.setValue([...this.selectedChips(), value]);
    control.markAsDirty();
  }

  private chipsControl(): FormControl<string[]> {
    return this.ctrl() as unknown as FormControl<string[]>;
  }

  /** Lower bound of a failed `min` validation, for the error message. */
  protected minBound(): number | null {
    const error: unknown = this.ctrl().getError('min');
    return this.boundOf(error, 'min');
  }

  /** Upper bound of a failed `max` validation, for the error message. */
  protected maxBound(): number | null {
    const error: unknown = this.ctrl().getError('max');
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
