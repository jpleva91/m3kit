import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { expect, within } from '@storybook/test';
import { signalStore } from '@ngrx/signals';
import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';
import { withDataQuery } from '@m3kit/state';
import { DataTableComponent, TableFilterBarComponent } from '@m3kit/table';
import { INVOICES_TABLE_DEFINITION, Invoice, makeInvoices } from '@m3kit/testing';

const InvoiceStore = signalStore(
  withDataQuery<Invoice>({ debounceMs: 0, initialPageSize: 10 }),
);

/**
 * The `withDataQuery` ↔ `m3k-data-table` integration proof: the store is
 * the single fetch path and the table runs in controlled mode, rendering
 * store state and routing sort/page intent back through `setSort`/`setPage`.
 * This story lives in the demo app because it composes `@m3kit/state` with
 * `@m3kit/table`, an edge the library boundaries forbid inside either lib.
 */
@Component({
  selector: 'app-data-table-store-driven',
  imports: [DataTableComponent, TableFilterBarComponent],
  providers: [InvoiceStore],
  template: `
    <m3k-table-filter-bar
      [definition]="definition"
      (filterChange)="store.setTextFilter($event.text)"
    />
    <m3k-data-table
      [definition]="definition"
      [rows]="store.rows()"
      [loading]="store.loading()"
      [error]="store.error()"
      [totalCount]="store.totalCount()"
      [sort]="store.sort()"
      [page]="store.page()"
      (sortChange)="store.setSort($event)"
      (pageChange)="store.setPage($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DataTableStoreDrivenComponent {
  protected readonly definition: TableDefinition<Invoice> = INVOICES_TABLE_DEFINITION;

  protected readonly store = inject(InvoiceStore);

  constructor() {
    // Widened because the store's query carries untyped sort state.
    const sort = this.definition.defaultSort;
    this.store.setSort(sort ? { key: sort.key, direction: sort.direction } : null);
    this.store.connect(new InMemoryTableDataSource<Invoice>(makeInvoices(40, 1)));
  }
}

const meta: Meta<DataTableStoreDrivenComponent> = {
  component: DataTableStoreDrivenComponent,
  title: 'Organisms/DataTable/StoreDriven',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<DataTableStoreDrivenComponent>;

export const StoreDriven: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getAllByText(/INV-2026-/i).length).toBeGreaterThan(0);
  },
};
