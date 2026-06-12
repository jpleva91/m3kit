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
 * Material table for a `TableDefinition<T>`, usable in two modes.
 *
 * **Uncontrolled (default):** bind `dataSource` and the table owns the
 * full query state (text filter, sort, page) as signals, re-fetching
 * whenever any part of it — or the data source itself — changes.
 *
 * **Controlled:** bind `rows` (its presence switches the mode) and the
 * table never fetches; it renders the externally owned state
 * (`rows`/`loading`/`error`/`totalCount`/`sort`/`page`) and surfaces
 * user intent through `sortChange`/`pageChange` instead of feeding its
 * internal pipeline. This is how a `withDataQuery` SignalStore from
 * `@m3kit/state` drives the table as the single fetch path.
 *
 * Both modes render columns dynamically from the definition with
 * type-aware cell formatting (`text`, `number`, `date`, `currency`,
 * `badge`), header sorting, pagination, a loading bar, an empty state
 * row, and a distinct error state row.
 *
 * In uncontrolled mode, text filtering is driven either by the
 * `textFilter` input (e.g. wired to `m3k-table-filter-bar`'s
 * `filterChange` output) or imperatively via {@link applyTextFilter}.
 * Per-field exact-match filtering is driven the same way: by the
 * `fieldFilters` input (e.g. wired to a filter form's output) or
 * imperatively via {@link applyFieldFilters}.
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

  /**
   * Source the table fetches pages from on every query change
   * (uncontrolled mode). Ignored — never fetched — while `rows` is bound.
   */
  readonly dataSource = input<TableDataSource<T> | undefined>(undefined);

  /** Free-text filter applied across searchable fields (uncontrolled mode). */
  readonly textFilter = input<string>('');

  /** Per-field exact-match filters, keyed by row property name (uncontrolled mode). */
  readonly fieldFilters = input<Readonly<Record<string, unknown>>>({});

  /**
   * Externally fetched rows. Binding a value switches the table to
   * controlled mode: it stops fetching from `dataSource` and renders
   * the provided state as-is.
   */
  readonly rows = input<readonly T[] | undefined>(undefined);

  /** External loading flag (controlled mode). */
  readonly loading = input<boolean | undefined>(undefined);

  /** External error message, or `null` when healthy (controlled mode). */
  readonly error = input<string | null | undefined>(undefined);

  /** External filtered (pre-pagination) row count (controlled mode). */
  readonly totalCount = input<number | undefined>(undefined);

  /** External sort state (controlled mode). */
  readonly sort = input<SortState | null | undefined>(undefined);

  /** External pagination state (controlled mode). */
  readonly page = input<PageState | undefined>(undefined);

  /** Emits the clicked row. */
  readonly rowClicked = output<T>();

  /** Emits the sort the user chose via a header (`null` clears the sort). */
  readonly sortChange = output<SortState | null>();

  /** Emits the page index/size the user chose via the paginator. */
  readonly pageChange = output<PageState>();

  /** Page size choices offered by the paginator. */
  protected readonly pageSizeOptions: readonly number[] = [5, 10, 25, 50, 100];

  private readonly locale = inject(LOCALE_ID);

  /** True when `rows` is bound: external state renders, internal fetching is off. */
  readonly controlled = computed(() => this.rows() !== undefined);

  /** Effective text filter; tracks the input until overridden imperatively. */
  private readonly text = linkedSignal(() => this.textFilter());

  /** Effective field filters; track the input until overridden imperatively. */
  private readonly fields = linkedSignal(() => this.fieldFilters());

  /** Table-owned sort; resets to the definition's default when it changes. */
  private readonly ownSort = linkedSignal<SortState<T> | null>(
    () => this.definition().defaultSort ?? null,
  );

  /**
   * Table-owned page. Returns to the first page whenever the definition
   * or any filter changes, preserving a user-chosen page size.
   */
  private readonly ownPage = linkedSignal<
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

  /** Complete query sent to the data source (uncontrolled mode). */
  readonly query = computed<DataQuery>(() => {
    const sort = this.ownSort();
    const fields = this.fields();
    return {
      filter: {
        text: this.text().trim() || undefined,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      },
      // Widen `keyof T & string` to the untyped sort state `DataQuery` carries.
      sort: sort ? { key: sort.key, direction: sort.direction } : null,
      page: this.ownPage(),
    };
  });

  private readonly loadingState = signal(false);

  private readonly errorState = signal(false);

  /** Fetch request, or `null` when controlled or without a data source. */
  private readonly request = computed(() => {
    if (this.controlled()) {
      return null;
    }
    const dataSource = this.dataSource();
    return dataSource ? { dataSource, query: this.query() } : null;
  });

  private readonly pageResult = toSignal(
    toObservable(this.request).pipe(
      switchMap((request) => {
        if (!request) {
          return of(createEmptyPage<T>());
        }
        this.loadingState.set(true);
        this.errorState.set(false);
        return request.dataSource.fetch(request.query).pipe(
          tap(() => this.loadingState.set(false)),
          catchError(() => {
            this.errorState.set(true);
            this.loadingState.set(false);
            return of(createEmptyPage<T>(request.query));
          }),
        );
      }),
    ),
    { initialValue: createEmptyPage<T>() },
  );

  /** Whether the table is loading: the `loading` input when controlled, the in-flight fetch otherwise. */
  readonly isLoading = computed(() =>
    this.controlled() ? (this.loading() ?? false) : this.loadingState(),
  );

  /** Whether the table is in an error state: the `error` input when controlled, the last fetch otherwise. */
  readonly hasError = computed(() =>
    this.controlled() ? this.error() != null : this.errorState(),
  );

  /** Error row message; controlled mode renders the `error` input's text. */
  protected readonly errorText = computed(
    () => (this.controlled() && this.error()) || 'Failed to load data.',
  );

  /** Column definitions of the current report. */
  readonly columns = computed(() => this.definition().columns);

  /** Column keys, in render order. */
  readonly displayedColumns = computed(() => this.columns().map((column) => column.key));

  /** Rows currently rendered: the `rows` input when controlled, the fetched page otherwise. */
  readonly displayedRows = computed(() =>
    this.controlled() ? (this.rows() ?? []) : this.pageResult().rows,
  );

  /** Filtered (pre-pagination) row count, for the paginator. */
  readonly totalRows = computed(() =>
    this.controlled()
      ? (this.totalCount() ?? this.rows()?.length ?? 0)
      : this.pageResult().totalCount,
  );

  /** Sort rendered by the headers; widened because the `sort` input is untyped. */
  private readonly effectiveSort = computed<SortState | null>(() => {
    if (this.controlled()) {
      return this.sort() ?? null;
    }
    const sort = this.ownSort();
    // Widen `keyof T & string` to the untyped sort state.
    return sort ? { key: sort.key, direction: sort.direction } : null;
  });

  private readonly effectivePage = computed<PageState>(
    () =>
      (this.controlled() ? this.page() : this.ownPage()) ?? {
        index: 0,
        size: this.definition().defaultPageSize ?? DEFAULT_PAGE_SIZE,
      },
  );

  /** Zero-based index of the current page. */
  readonly pageIndex = computed(() => this.effectivePage().index);

  /** Size of the current page. */
  readonly pageSize = computed(() => this.effectivePage().size);

  protected readonly sortActive = computed(() => this.effectiveSort()?.key ?? '');

  protected readonly sortDirection = computed(() => this.effectiveSort()?.direction ?? '');

  /** Applies a free-text filter, overriding the `textFilter` input. */
  applyTextFilter(text: string): void {
    this.text.set(text);
  }

  /** Applies per-field exact-match filters, overriding the `fieldFilters` input. */
  applyFieldFilters(fields: Readonly<Record<string, unknown>>): void {
    this.fields.set(fields);
  }

  protected onSortChange(sortEvent: Sort): void {
    const sort: SortState<T> | null =
      sortEvent.direction === ''
        ? null
        : {
            key: sortEvent.active as keyof T & string,
            direction: sortEvent.direction,
          };
    if (!this.controlled()) {
      this.ownSort.set(sort);
      this.ownPage.update((page) => ({ ...page, index: 0 }));
    }
    // Widen `keyof T & string` to the untyped sort state the output carries.
    this.sortChange.emit(sort ? { key: sort.key, direction: sort.direction } : null);
  }

  protected onPage(event: PageEvent): void {
    const page: PageState = { index: event.pageIndex, size: event.pageSize };
    if (!this.controlled()) {
      this.ownPage.set(page);
    }
    this.pageChange.emit(page);
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
