import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Subject, of, timer } from 'rxjs';
import { debounce, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { ReportColumnDef, ReportColumnType, ReportDefinition } from '@reporting/core';

import { FormFieldComponent, FormFieldOption, FormFieldType } from './form-field.component';

/** Filters emitted by `rpt-filter-form`: dirty, non-empty values by column key. */
export type FilterFormValues = Readonly<Record<string, unknown>>;

/** Milliseconds the filter form waits after the last edit before emitting. */
export const FILTER_FORM_DEBOUNCE_MS = 250;

/**
 * Field-filter form generated from a `ReportDefinition<T>`: builds one
 * typed control per column whose `filterable` is not `false`, choosing
 * the input by column type (`text` → text, `number`/`currency` →
 * number, `date` → datepicker, `badge` → select fed from the `options`
 * map). Emits `filtersChange` with only dirty, non-empty values,
 * debounced by {@link FILTER_FORM_DEBOUNCE_MS} and deduplicated. The
 * Reset button clears the form and emits an empty filter immediately,
 * cancelling any pending debounced emission.
 *
 * Composable with `rpt-report-table`: wire `filtersChange` to the
 * table's `fieldFilters` input.
 */
@Component({
  selector: 'rpt-filter-form',
  imports: [FormFieldComponent, MatButtonModule],
  templateUrl: './filter-form.component.html',
  styleUrl: './filter-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterFormComponent<T> {
  /** Report whose filterable columns drive the generated controls. */
  readonly definition = input.required<ReportDefinition<T>>();

  /** Select choices per `badge` column key (e.g. distinct status values). */
  readonly options = input<Readonly<Record<string, readonly FormFieldOption[]>>>({});

  /** Emits the debounced map of dirty, non-empty filter values. */
  readonly filtersChange = output<FilterFormValues>();

  /** Columns that participate in field filtering. */
  protected readonly fields = computed(() =>
    this.definition().columns.filter((column) => column.filterable !== false),
  );

  /** Typed form rebuilt whenever the definition changes. */
  protected readonly form = computed(() => {
    const controls: Record<string, FormControl<unknown>> = {};
    for (const column of this.fields()) {
      controls[column.key] = createFilterControl(column.type);
    }
    return new FormGroup(controls);
  });

  private readonly changes = new Subject<{ readonly immediate: boolean }>();

  constructor() {
    toObservable(this.form)
      .pipe(
        switchMap((form) => form.valueChanges),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.changes.next({ immediate: false }));

    this.changes
      .pipe(
        // Immediate changes (reset) flush synchronously and cancel any
        // pending debounced edit; typing keeps the usual debounce.
        debounce(({ immediate }) =>
          immediate ? of(0) : timer(FILTER_FORM_DEBOUNCE_MS),
        ),
        map(() => this.activeFilters()),
        distinctUntilChanged(filtersEqual),
        takeUntilDestroyed(),
      )
      .subscribe((filters) => this.filtersChange.emit(filters));
  }

  /** Control bound to the given column key. */
  protected controlFor(key: string): FormControl<unknown> {
    const control = this.form().controls[key];
    if (!control) {
      throw new Error(`rpt-filter-form: no control for column "${key}".`);
    }
    return control;
  }

  /** Field type rendered for a column. */
  protected fieldTypeFor(column: ReportColumnDef<T>): FormFieldType {
    return FIELD_TYPE_BY_COLUMN_TYPE[column.type];
  }

  /** Select choices for a column, from the `options` map. */
  protected optionsFor(key: string): readonly FormFieldOption[] {
    return this.options()[key] ?? [];
  }

  /** Clears every control and emits an empty filter immediately. */
  protected reset(): void {
    this.form().reset();
    this.changes.next({ immediate: true });
  }

  private activeFilters(): FilterFormValues {
    const filters: Record<string, unknown> = {};
    for (const [key, control] of Object.entries(this.form().controls)) {
      if (!control.dirty) {
        continue;
      }
      const value = normalizeFilterValue(control.value);
      if (value !== undefined) {
        filters[key] = value;
      }
    }
    return filters;
  }
}

const FIELD_TYPE_BY_COLUMN_TYPE: Readonly<Record<ReportColumnType, FormFieldType>> = {
  text: 'text',
  number: 'number',
  currency: 'currency',
  date: 'date',
  badge: 'select',
};

function createFilterControl(type: ReportColumnType): FormControl<unknown> {
  switch (type) {
    case 'number':
    case 'currency':
      return new FormControl<number | null>(null);
    case 'date':
      return new FormControl<Date | null>(null);
    case 'badge':
      return new FormControl<unknown>(null);
    default:
      return new FormControl<string | null>(null);
  }
}

/** Maps empty values (`null`, `''`, whitespace) to `undefined`; trims strings. */
function normalizeFilterValue(value: unknown): unknown {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
}

function filtersEqual(a: FilterFormValues, b: FilterFormValues): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  return (
    aKeys.length === bKeys.length &&
    aKeys.every((key) => valuesEqual(a[key], b[key]))
  );
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return a === b;
}
