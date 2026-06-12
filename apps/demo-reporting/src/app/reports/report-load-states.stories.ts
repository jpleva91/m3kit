import { ChangeDetectionStrategy, Component, computed, effect, input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { signalStore } from '@ngrx/signals';
import { NEVER, Observable, of, throwError } from 'rxjs';
import {
  createEmptyPage,
  type DataPage,
  type DataQuery,
  type LoadState,
  type TableDataSource,
} from '@m3kit/core';
import { BannerComponent, EmptyStateComponent, ErrorStateComponent, SkeletonComponent } from '@m3kit/feedback';
import { withDataQuery } from '@m3kit/state';
import { DataTableComponent } from '@m3kit/table';
import { INVOICES_TABLE_DEFINITION, type Invoice, makeInvoices } from '@m3kit/testing';

type LoadStateScenario = 'idle' | 'loading' | 'refreshing' | 'success' | 'stale' | 'empty' | 'error';

const invoiceRows = makeInvoices(8, 1);

const InvoiceLoadStateStore = signalStore(
  withDataQuery<Invoice>({ debounceMs: 0, initialPageSize: 5, reportId: 'storybook-load-states' }),
);

function stateData(state: LoadState<DataPage<Invoice>>): DataPage<Invoice> | null {
  switch (state.kind) {
    case 'success':
    case 'refreshing':
      return state.data;
    case 'error':
      return state.data ?? null;
    default:
      return null;
  }
}

class ScenarioDataSource implements TableDataSource<Invoice> {
  constructor(private readonly scenario: LoadStateScenario) {}

  fetch(query: DataQuery): Observable<DataPage<Invoice>> {
    if (this.scenario === 'loading') {
      return NEVER;
    }
    if (this.scenario === 'empty') {
      return of(createEmptyPage<Invoice>(query));
    }
    if (this.scenario === 'error') {
      return throwError(() => new globalThis.Error('Synthetic reporting API failure'));
    }
    return of({
      rows: invoiceRows.slice(0, query.page.size),
      totalCount: invoiceRows.length,
      pageIndex: query.page.index,
      pageSize: query.page.size,
    });
  }
}

@Component({
  selector: 'app-report-load-state-frame',
  imports: [
    BannerComponent,
    DataTableComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    MatButtonModule,
    SkeletonComponent,
  ],
  providers: [InvoiceLoadStateStore],
  template: `
    <section class="report-load-state-frame" [attr.data-scenario]="scenario()">
      <header>
        <p class="eyebrow">Reporting load-state taxonomy</p>
        <h2>{{ title() }}</h2>
        <p>{{ description() }}</p>
      </header>

      @if (scenario() === 'idle') {
        <div class="frame frame--plain" data-testid="load-state-idle">
          Choose filters and run the report to load invoice data.
        </div>
      } @else if (scenario() === 'loading') {
        <div class="frame frame--skeleton" data-testid="load-state-loading">
          <m3k-skeleton variant="text" width="28%" />
          <m3k-skeleton variant="rect" height="18rem" />
        </div>
      } @else if (scenario() === 'empty') {
        <m3k-empty-state
          data-testid="load-state-empty"
          icon="receipt_long"
          title="No invoices match"
          description="Try clearing filters or widening the report date range."
        />
      } @else if (scenario() === 'error') {
        <m3k-error-state
          data-testid="load-state-error"
          title="Could not load invoices"
          [description]="store.errorMessage() ?? 'The reporting API returned an error.'"
          details="Synthetic reporting API failure"
          (retry)="store.refresh()"
        />
      } @else {
        @if (scenario() === 'stale') {
          <m3k-banner severity="warning" data-testid="load-state-stale">
            Showing stale invoice data. Refresh to re-run the report query.
            <button m3kBannerAction mat-button type="button" (click)="store.refresh()">Refresh</button>
          </m3k-banner>
        }
        <m3k-data-table
          [definition]="definition"
          [rows]="rows()"
          [loading]="scenario() === 'refreshing'"
          [totalCount]="totalCount()"
          [sort]="store.sort()"
          [page]="store.page()"
          [columnState]="columnState"
          (sortChange)="store.setSort($event)"
          (pageChange)="store.setPage($event)"
        />
      }
    </section>
  `,
  styles: [
    `
      .report-load-state-frame {
        display: grid;
        gap: 1rem;
        padding: 1rem;
      }

      .eyebrow {
        color: var(--mat-sys-primary);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        margin: 0 0 0.25rem;
        text-transform: uppercase;
      }

      h2,
      p {
        margin: 0;
      }

      header {
        display: grid;
        gap: 0.25rem;
      }

      .frame {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 1rem;
        color: var(--mat-sys-on-surface-variant);
        padding: 1rem;
      }

      .frame--plain {
        background: var(--mat-sys-surface-container-low);
      }

      .frame--skeleton {
        display: grid;
        gap: 0.75rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReportLoadStateFrameComponent {
  readonly scenario = input<LoadStateScenario>('success');

  protected readonly definition = INVOICES_TABLE_DEFINITION;
  protected readonly columnState = [
    { key: 'invoiceNumber', pinned: 'start', width: '10rem' },
    { key: 'customer' },
    { key: 'status' },
    { key: 'amount', pinned: 'end', width: '9rem' },
    { key: 'dueDate', visible: false },
  ] as const;

  protected readonly store = inject(InvoiceLoadStateStore);

  protected readonly rows = computed(() => {
    return stateData(this.presentedState())?.rows ?? [];
  });

  protected readonly totalCount = computed(() => {
    return stateData(this.presentedState())?.totalCount ?? 0;
  });

  protected readonly title = computed(() => {
    const state = this.scenario();
    return `${state.charAt(0).toUpperCase()}${state.slice(1)} report state`;
  });

  protected readonly description = computed(() => {
    switch (this.scenario()) {
      case 'idle':
        return 'No fetch has started yet.';
      case 'loading':
        return 'Initial fetch is in flight, so the shell renders skeleton structure.';
      case 'refreshing':
        return 'Last good rows remain visible while a refresh fetch is in flight.';
      case 'success':
        return 'A populated page renders through m3k-data-table.';
      case 'stale':
        return 'A stale successful page keeps data visible and adds a refresh affordance.';
      case 'empty':
        return 'A successful zero-row response maps to m3k-empty-state.';
      case 'error':
        return 'A failed fetch maps to m3k-error-state with retry.';
    }
  });

  protected readonly presentedState = computed<LoadState<DataPage<Invoice>>>(() => {
    if (this.scenario() === 'refreshing') {
      return {
        kind: 'refreshing',
        data: { rows: invoiceRows.slice(0, 5), totalCount: invoiceRows.length, pageIndex: 0, pageSize: 5 },
      };
    }
    if (this.scenario() === 'stale') {
      return {
        kind: 'success',
        data: { rows: invoiceRows.slice(0, 5), totalCount: invoiceRows.length, pageIndex: 0, pageSize: 5 },
        stale: true,
      };
    }
    return this.store.loadState();
  });

  constructor() {
    effect(() => {
      const scenario = this.scenario();
      if (scenario === 'idle') {
        return;
      }
      this.store.connect(new ScenarioDataSource(scenario));
      if (scenario === 'stale') {
        this.store.markStale();
      }
    });
  }
}

const meta: Meta<ReportLoadStateFrameComponent> = {
  component: ReportLoadStateFrameComponent,
  title: 'Pages/Reports/Load States',
  decorators: [applicationConfig({ providers: [provideNoopAnimations()] })],
};
export default meta;

type Story = StoryObj<ReportLoadStateFrameComponent>;

const expectScenario = async (canvasElement: HTMLElement, text: RegExp): Promise<void> => {
  const canvas = within(canvasElement);
  expect(await canvas.findByText(text)).toBeInTheDocument();
};

export const Idle: Story = {
  args: { scenario: 'idle' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /choose filters/i),
};

export const Loading: Story = {
  args: { scenario: 'loading' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /initial fetch/i),
};

export const Refreshing: Story = {
  args: { scenario: 'refreshing' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /INV-2026-/i),
};

export const Success: Story = {
  args: { scenario: 'success' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /INV-2026-/i),
};

export const Empty: Story = {
  args: { scenario: 'empty' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /no invoices match/i),
};

export const ErrorState: Story = {
  args: { scenario: 'error' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /could not load invoices/i),
};

export const StaleSuccess: Story = {
  args: { scenario: 'stale' },
  play: ({ canvasElement }) => expectScenario(canvasElement, /showing stale/i),
};
