import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular';
import { provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InMemoryTableDataSource, TableDefinition } from '@m3kit/core';
import {
  ChartCardComponent,
  ChartLegendComponent,
  DonutChartComponent,
  LineChartComponent,
  type ChartLegendItem,
  type DonutChartSlice,
  type LineChartSeries,
} from '@m3kit/charts';
import {
  DashboardGridComponent,
  GridSpanDirective,
  KpiCardComponent,
} from '@m3kit/dashboard';
import {
  AppShellComponent,
  PageHeaderComponent,
  ShellToolbarActionsDirective,
  type ShellNavItem,
} from '@m3kit/shell';

import { DataTableComponent } from '../../src/lib/data-table.component';

/**
 * Pages: a complete dashboard page — an `AppShell` template wrapping a
 * `PageHeader`, a KPI `DashboardGrid`, two `ChartCard` organisms (line +
 * donut), and a `DataTable`. All data is synthetic and inline so the story
 * doubles as copyable source for a real routed page.
 */

interface InvoiceRow {
  readonly id: string;
  readonly customerName: string;
  readonly amount: number;
  readonly status: 'draft' | 'sent' | 'paid' | 'overdue';
  readonly issuedAt: Date;
}

const STATUSES: readonly InvoiceRow['status'][] = [
  'sent',
  'paid',
  'paid',
  'overdue',
  'draft',
];

const INVOICES: readonly InvoiceRow[] = Array.from({ length: 18 }, (_, i) => ({
  id: `INV-2026-${String(i + 1).padStart(4, '0')}`,
  customerName: `Customer ${String((i * 37) % 120).padStart(4, '0')}`,
  amount: Math.round((480 + i * 211.4) * 100) / 100,
  status: STATUSES[i % STATUSES.length],
  issuedAt: new Date(2026, i % 6, (i * 5) % 27 + 1),
}));

const INVOICE_DEFINITION: TableDefinition<InvoiceRow> = {
  id: 'recent-invoices',
  title: 'Recent invoices',
  columns: [
    { key: 'id', header: 'Invoice', type: 'text', sortable: true, width: '160px' },
    { key: 'customerName', header: 'Customer', type: 'text', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      type: 'currency',
      sortable: true,
      align: 'end',
      format: { currencyCode: 'USD', digitsInfo: '1.2-2' },
    },
    { key: 'status', header: 'Status', type: 'badge' },
    {
      key: 'issuedAt',
      header: 'Issued',
      type: 'date',
      sortable: true,
      format: { dateFormat: 'mediumDate' },
    },
  ],
  defaultSort: { key: 'issuedAt', direction: 'desc' },
  defaultPageSize: 5,
};

const NAV: readonly ShellNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/invoices', label: 'Invoices', icon: 'table_chart' },
  { path: '/customers', label: 'Customers', icon: 'group' },
];

const REVENUE_SERIES: readonly LineChartSeries[] = [
  {
    name: 'Paid revenue',
    points: [
      { x: 'Jan', y: 38200 },
      { x: 'Feb', y: 41950 },
      { x: 'Mar', y: 39400 },
      { x: 'Apr', y: 46800 },
      { x: 'May', y: 51200 },
      { x: 'Jun', y: 49650 },
    ],
  },
  {
    name: 'Outstanding',
    points: [
      { x: 'Jan', y: 9100 },
      { x: 'Feb', y: 7400 },
      { x: 'Mar', y: 11250 },
      { x: 'Apr', y: 8300 },
      { x: 'May', y: 6900 },
      { x: 'Jun', y: 7750 },
    ],
  },
];

const STATUS_SLICES: readonly DonutChartSlice[] = [
  { label: 'Paid', value: 612 },
  { label: 'Sent', value: 187 },
  { label: 'Overdue', value: 64 },
  { label: 'Draft', value: 41 },
];

const STATUS_LEGEND: readonly ChartLegendItem[] = STATUS_SLICES.map(
  (slice, i) => ({ label: slice.label, colorIndex: i })
);

const meta: Meta<AppShellComponent> = {
  component: AppShellComponent,
  title: 'Pages/FullDashboard',
  parameters: {
    docs: { source: { type: 'code' } },
    layout: 'fullscreen',
  },
  decorators: [
    applicationConfig({
      providers: [
        // The shell never owns routing; an empty route table with disabled
        // initial navigation lets the chrome mount inside the story canvas.
        provideRouter([], withDisabledInitialNavigation()),
        provideNoopAnimations(),
      ],
    }),
    moduleMetadata({
      imports: [
        PageHeaderComponent,
        ShellToolbarActionsDirective,
        DashboardGridComponent,
        GridSpanDirective,
        KpiCardComponent,
        ChartCardComponent,
        LineChartComponent,
        DonutChartComponent,
        ChartLegendComponent,
        DataTableComponent,
        MatButtonModule,
        MatIconModule,
      ],
    }),
  ],
};
export default meta;
type Story = StoryObj<AppShellComponent>;

export const InvoicingOverview: Story = {
  args: {
    preset: 'sidenav',
    nav: NAV,
    title: 'demo-reporting',
  },
  render: (args) => ({
    props: {
      ...args,
      revenueSeries: REVENUE_SERIES,
      statusSlices: STATUS_SLICES,
      statusLegend: STATUS_LEGEND,
      invoiceDefinition: INVOICE_DEFINITION,
      invoiceDataSource: new InMemoryTableDataSource(INVOICES),
    },
    template: `
      <m3k-app-shell [preset]="preset" [nav]="nav" [title]="title">
        <ng-template m3kShellToolbarActions>
          <button mat-icon-button type="button" aria-label="Switch to dark mode">
            <mat-icon>dark_mode</mat-icon>
          </button>
        </ng-template>

        <section style="display: grid; gap: 1.5rem;">
          <m3k-page-header title="Dashboard" subtitle="Invoicing overview — last 6 months" />

          <m3k-dashboard-grid minColumnWidth="14rem" gap="1rem">
            <m3k-kpi-card label="Total revenue" [value]="267200" format="currency" [delta]="9" icon="payments" />
            <m3k-kpi-card label="Outstanding" [value]="50700" format="currency" [delta]="-6" icon="schedule" />
            <m3k-kpi-card label="Invoices issued" [value]="904" format="number" [delta]="4" icon="receipt_long" />
            <m3k-kpi-card label="Overdue rate" [value]="0.071" format="percent" [delta]="-2" icon="warning" />
          </m3k-dashboard-grid>

          <m3k-dashboard-grid minColumnWidth="20rem" gap="1rem">
            <m3k-chart-card [m3kGridSpan]="2" title="Revenue" subtitle="Paid vs outstanding, last 6 months">
              <m3k-line-chart
                [series]="revenueSeries"
                [area]="true"
                [height]="220"
                ariaLabel="Paid revenue and outstanding balance by month"
              />
            </m3k-chart-card>
            <m3k-chart-card title="Status mix" subtitle="All invoices">
              <m3k-donut-chart
                [slices]="statusSlices"
                centerLabel="Invoices"
                centerValue="904"
                [height]="220"
                ariaLabel="Invoice count by status"
              />
              <m3k-chart-legend m3kChartCardLegend [items]="statusLegend" />
            </m3k-chart-card>
          </m3k-dashboard-grid>

          <m3k-data-table [definition]="invoiceDefinition" [dataSource]="invoiceDataSource" />
        </section>
      </m3k-app-shell>
    `,
  }),
};
