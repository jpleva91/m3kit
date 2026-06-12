import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getCurrencySymbol,
} from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {
  DEFAULT_PAGE_SIZE,
  ColumnDef,
  TableDataSource,
  TableDefinition,
  PageState,
  DataQuery,
  SortState,
  createEmptyPage,
} from '@m3kit/core';

/**
 * Material table for a `TableDefinition<T>` backed by any
 * `TableDataSource<T>`.
 *
 * Owns the full query state (text filter, sort, page) as signals and
 * re-fetches whenever any part of it — or the data source itself —
 * changes. Renders columns dynamically from the definition with
 * type-aware cell formatting (`text`, `number`, `date`, `currency`,
 * `badge`), header sorting, pagination, a loading bar, an empty state
 * row, and a distinct error state row when the data source errors.
 *
 * Text filtering is driven either by the `textFilter` input (e.g. wired
 * to `m3k-table-filter-bar`'s `filterChange` output) or imperatively
 * via {@link applyTextFilter}. Per-field exact-match filtering is driven
 * the same way: by the `fieldFilters` input (e.g. wired to a filter
 * form's output) or imperatively via {@link applyFieldFilters}.
 */
@Component({
  selector: 'm3k-data-table',
  imports: [MatPaginatorModule, MatProgressBarModule, MatSortModule, MatTableModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T> {
  /** Declarative report definition driving columns and defaults. */
  readonly definition = input.required<TableDefinition<T>>();

  /** Source the table fetches pages from on every query change. */
  readonly dataSource = input.required<TableDataSource<T>>();

  /** Free-text filter applied across searchable fields. */
  readonly textFilter = input<string>('');

  /** Per-field exact-match filters, keyed by row property name. */
  readonly fieldFilters = input<Readonly<Record<string, unknown>>>({});

  /** Emits the clicked row. */
  readonly rowClicked = output<T>();

  /** Page size choices offered by the paginator. */
  protected readonly pageSizeOptions: readonly number[] = [5, 10, 25, 50, 100];

  private readonly locale = inject(LOCALE_ID);

  /** Effective text filter; tracks the input until overridden imperatively. */
  private readonly text = linkedSignal(() => this.textFilter());

  /** Effective field filters; track the input until overridden imperatively. */
  private readonly fields = linkedSignal(() => this.fieldFilters());

  /** Active sort; resets to the definition's default when it changes. */
  private readonly sort = linkedSignal<SortState<T> | null>(
    () => this.definition().defaultSort ?? null,
  );

  /**
   * Active page. Returns to the first page whenever the definition or
   * any filter changes, preserving a user-chosen page size.
   */
  private readonly page = linkedSignal<
    {
      readonly defaultSize: number;
      readonly text: string;
      readonly fields: Readonly<Record<string, unknown>>;
    },
    PageState
  >({
    source: () => ({
      defaultSize: this.definition().defaultPageSize ?? DEFAULT_PAGE_SIZE,
      text: this.text(),
      fields: this.fields(),
    }),
    computation: (source, previous) => ({
      index: 0,
      size: previous?.value.size ?? source.defaultSize,
    }),
  });

  /** Complete query sent to the data source. */
  readonly query = computed<DataQuery>(() => {
    const sort = this.sort();
    const fields = this.fields();
    return {
      filter: {
        text: this.text().trim() || undefined,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      },
      // Widen `keyof T & string` to the untyped sort state `DataQuery` carries.
      sort: sort ? { key: sort.key, direction: sort.direction } : null,
      page: this.page(),
    };
  });

  private readonly loadingState = signal(false);

  private readonly errorState = signal(false);

  private readonly request = computed(() => ({
    dataSource: this.dataSource(),
    query: this.query(),
  }));

  private readonly pageResult = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ dataSource, query }) => {
        this.loadingState.set(true);
        this.errorState.set(false);
        return dataSource.fetch(query).pipe(
          tap(() => this.loadingState.set(false)),
          catchError(() => {
            this.errorState.set(true);
            this.loadingState.set(false);
            return of(createEmptyPage<T>(query));
          }),
        );
      }),
    ),
    { initialValue: createEmptyPage<T>() },
  );

  /** Whether a fetch is in flight. */
  readonly loading = this.loadingState.asReadonly();

  /** Whether the most recent fetch errored; cleared on the next fetch. */
  readonly error = this.errorState.asReadonly();

  /** Column definitions of the current report. */
  readonly columns = computed(() => this.definition().columns);

  /** Column keys, in render order. */
  readonly displayedColumns = computed(() => this.columns().map((column) => column.key));

  /** Rows of the current page. */
  readonly rows = computed(() => this.pageResult().rows);

  /** Filtered (pre-pagination) row count, for the paginator. */
  readonly totalCount = computed(() => this.pageResult().totalCount);

  /** Zero-based index of the current page. */
  readonly pageIndex = computed(() => this.page().index);

  /** Size of the current page. */
  readonly pageSize = computed(() => this.page().size);

  protected readonly sortActive = computed(() => this.sort()?.key ?? '');

  protected readonly sortDirection = computed(() => this.sort()?.direction ?? '');

  /** Applies a free-text filter, overriding the `textFilter` input. */
  applyTextFilter(text: string): void {
    this.text.set(text);
  }

  /** Applies per-field exact-match filters, overriding the `fieldFilters` input. */
  applyFieldFilters(fields: Readonly<Record<string, unknown>>): void {
    this.fields.set(fields);
  }

  protected onSortChange(sortEvent: Sort): void {
    this.sort.set(
      sortEvent.direction === ''
        ? null
        : {
            key: sortEvent.active as keyof T & string,
            direction: sortEvent.direction,
          },
    );
    this.page.update((page) => ({ ...page, index: 0 }));
  }

  protected onPage(event: PageEvent): void {
    this.page.set({ index: event.pageIndex, size: event.pageSize });
  }

  /** Formats a cell value according to its column's type and format hints. */
  protected formatCell(row: T, column: ColumnDef<T>): string {
    const value = (row as Record<string, unknown>)[column.key];
    if (value == null || value === '') {
      return '';
    }
    switch (column.type) {
      case 'number':
        return formatNumber(Number(value), this.locale, column.format?.digitsInfo);
      case 'currency': {
        const code = column.format?.currencyCode ?? 'USD';
        return formatCurrency(
          Number(value),
          this.locale,
          getCurrencySymbol(code, 'narrow', this.locale),
          code,
          column.format?.digitsInfo,
        );
      }
      case 'date':
        return formatDate(
          value as string | number | Date,
          column.format?.dateFormat ?? 'mediumDate',
          this.locale,
        );
      default:
        return String(value);
    }
  }

  /** Resolves the badge color token for a `badge` cell. */
  protected badgeColor(row: T, column: ColumnDef<T>): string {
    const value = (row as Record<string, unknown>)[column.key];
    return column.format?.badgeColors?.[String(value)] ?? 'default';
  }
}
