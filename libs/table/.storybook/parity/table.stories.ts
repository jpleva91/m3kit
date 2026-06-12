import { CurrencyPipe, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

interface OrderRow {
  readonly id: string;
  readonly customer: string;
  readonly product: string;
  readonly quantity: number;
  readonly total: number;
  readonly status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  readonly orderedAt: Date;
}

const CUSTOMERS = [
  'Northwind Traders',
  'Cascade Outfitters',
  'Bluebird Analytics',
  'Hargrove & Sons',
  'Meridian Labs',
  'Pioneer Freight',
] as const;

const PRODUCTS = [
  'Field Notebook (A5)',
  'Brass Caliper',
  'Surveyor Tripod',
  'Waxed Canvas Tote',
  'Topographic Map Set',
] as const;

const STATUSES: readonly OrderRow['status'][] = [
  'Pending',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const ORDERS: readonly OrderRow[] = Array.from({ length: 42 }, (_, i) => ({
  id: `ORD-${String(1001 + i)}`,
  customer: CUSTOMERS[i % CUSTOMERS.length],
  product: PRODUCTS[i % PRODUCTS.length],
  quantity: (i % 9) + 1,
  total: Math.round(((i % 9) + 1) * (18.5 + (i % 5) * 7.25) * 100) / 100,
  status: STATUSES[i % STATUSES.length],
  orderedAt: new Date(2026, i % 12, (i % 27) + 1),
}));

/**
 * Plain Angular Material `mat-table` (no m3kit wrapper) with `matSort`, a
 * `mat-paginator`, and a sticky header row inside a scrolling container —
 * proving the brand token system fully themes raw Material data tables.
 */
@Component({
  selector: 'parity-mat-table-host',
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, CurrencyPipe, DatePipe],
  template: `
    <div class="parity-table-container">
      <table mat-table [dataSource]="dataSource" matSort matSortActive="orderedAt" matSortDirection="desc">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Order</th>
          <td mat-cell *matCellDef="let row">{{ row.id }}</td>
        </ng-container>

        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Customer</th>
          <td mat-cell *matCellDef="let row">{{ row.customer }}</td>
        </ng-container>

        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Product</th>
          <td mat-cell *matCellDef="let row">{{ row.product }}</td>
        </ng-container>

        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="parity-num">Qty</th>
          <td mat-cell *matCellDef="let row" class="parity-num">{{ row.quantity }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="parity-num">Total</th>
          <td mat-cell *matCellDef="let row" class="parity-num">
            {{ row.total | currency : 'USD' : 'symbol' : '1.2-2' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let row">{{ row.status }}</td>
        </ng-container>

        <ng-container matColumnDef="orderedAt">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Ordered</th>
          <td mat-cell *matCellDef="let row">{{ row.orderedAt | date : 'mediumDate' }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
    <mat-paginator
      [pageSizeOptions]="[5, 10, 25]"
      [pageSize]="10"
      showFirstLastButtons
      aria-label="Select page of orders"
    ></mat-paginator>
  `,
  styles: [
    `
      .parity-table-container {
        max-height: 420px;
        overflow: auto;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-card);
      }
      .parity-num {
        text-align: end;
        font-family: var(--app-font-data);
      }
    `,
  ],
})
class ParityMatTableHostComponent implements AfterViewInit {
  readonly displayedColumns = [
    'id',
    'customer',
    'product',
    'quantity',
    'total',
    'status',
    'orderedAt',
  ];
  readonly dataSource = new MatTableDataSource<OrderRow>([...ORDERS]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
}

const meta: Meta<ParityMatTableHostComponent> = {
  component: ParityMatTableHostComponent,
  title: 'Atoms/Table',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityMatTableHostComponent>;

export const SortedPaginatedSticky: Story = {};
