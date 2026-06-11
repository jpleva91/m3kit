import { ChangeDetectionStrategy, Component, LOCALE_ID, computed, inject } from '@angular/core';
import { formatCurrency, formatDate, formatNumber, getCurrencySymbol } from '@angular/common';
import {
  BarChartComponent,
  ChartCardComponent,
  ChartLegendComponent,
  DonutChartComponent,
  LineChartComponent,
} from '@m3kit/charts';
import {
  DashboardGridComponent,
  DetailCardComponent,
  DetailCardRow,
  KpiCardComponent,
  KpiStripComponent,
  KpiStripItem,
} from '@m3kit/dashboard';
import { Invoice, makeInvoices, makeSupportTickets } from '@m3kit/testing';

import { BRAND_LAYOUT_PRESETS } from '../core/layout-presets';
import { ThemeService } from '../core/theme.service';
import {
  invoiceStatusLegend,
  invoiceStatusSlices,
  monthlyRevenueSeries,
  monthlyStatusBars,
} from './dashboard-data';

/** Seeds for the synthetic fixtures, so the dashboard is deterministic. */
const INVOICE_SEED = 1;
const TICKET_SEED = 7;

/**
 * Midpoint of the synthetic 150-day data window (base date 2026-01-01).
 * Used to derive simple "recent half vs older half" deltas.
 */
const PERIOD_MIDPOINT = '2026-03-17T00:00:00.000Z';

/**
 * Dashboard demo: the same four KPI metrics, three charts, and two
 * detail cards, all computed from deterministic synthetic invoices and
 * support tickets, composed differently per shell layout preset (see
 * core/layout-presets):
 *
 * - `sidenav` (default)  KPI grid, two-up chart row, full-width bars, details
 * - `command-bar`        hairline KPI strip; tight three-up chart row; data is the page
 * - `contents-rail`      typeset figure rail beside a single-column chart broadsheet
 * - `pill-tabs`          the default composition with sentiment corner accents
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    BarChartComponent,
    ChartCardComponent,
    ChartLegendComponent,
    DashboardGridComponent,
    DetailCardComponent,
    DonutChartComponent,
    KpiCardComponent,
    KpiStripComponent,
    LineChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly locale = inject(LOCALE_ID);
  private readonly themeService = inject(ThemeService);

  /** Shell layout for the active brand; drives the page composition. */
  protected readonly layoutPreset = computed(
    () => BRAND_LAYOUT_PRESETS[this.themeService.brand()],
  );

  private readonly invoices = makeInvoices(120, INVOICE_SEED);
  private readonly tickets = makeSupportTickets(40, TICKET_SEED);

  private readonly paidInvoices = this.invoices.filter((invoice) => invoice.status === 'paid');
  private readonly openInvoices = this.invoices.filter((invoice) => invoice.status === 'sent');
  private readonly overdueInvoices = this.invoices.filter(
    (invoice) => invoice.status === 'overdue',
  );
  private readonly openTickets = this.tickets.filter(
    (ticket) => ticket.status === 'open' || ticket.status === 'in-progress',
  );

  /** Sum of all paid invoice amounts. */
  protected readonly totalRevenue = this.paidInvoices.reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  );

  protected readonly openInvoiceCount = this.openInvoices.length;
  protected readonly overdueCount = this.overdueInvoices.length;
  protected readonly openTicketCount = this.openTickets.length;

  /** Paid revenue per calendar month, oldest first, for the sparkline. */
  protected readonly revenueByMonth: readonly number[] = monthlyTotals(this.paidInvoices);

  /** Paid revenue in the recent half minus the older half of the window. */
  protected readonly revenueDelta =
    sumAmounts(this.paidInvoices.filter((i) => i.issuedAt >= PERIOD_MIDPOINT)) -
    sumAmounts(this.paidInvoices.filter((i) => i.issuedAt < PERIOD_MIDPOINT));

  protected readonly openInvoicesDelta = recentMinusOlder(
    this.openInvoices.map((invoice) => invoice.issuedAt),
  );

  protected readonly overdueDelta = recentMinusOlder(
    this.overdueInvoices.map((invoice) => invoice.issuedAt),
  );

  protected readonly openTicketsDelta = recentMinusOlder(
    this.openTickets.map((ticket) => ticket.openedAt),
  );

  /** The four metrics as `rpt-kpi-strip` readouts (command-bar preset). */
  protected readonly kpiStripItems: readonly KpiStripItem[] = [
    {
      label: 'Total revenue',
      value: this.totalRevenue,
      format: 'currency',
      delta: this.revenueDelta,
      sparkline: this.revenueByMonth,
    },
    { label: 'Open invoices', value: this.openInvoiceCount, format: 'number', delta: this.openInvoicesDelta },
    { label: 'Overdue', value: this.overdueCount, format: 'number', delta: this.overdueDelta },
    { label: 'Open tickets', value: this.openTicketCount, format: 'number', delta: this.openTicketsDelta },
  ];

  /** The four metrics as typeset ledger figures (contents-rail preset). */
  protected readonly figures: readonly DashboardFigure[] = [
    {
      label: 'Total revenue',
      value: this.currency(this.totalRevenue),
      delta: this.revenueDelta,
      formattedDelta: `${this.signedNumber(this.revenueDelta)} on prior period`,
      note: 'Receipts against the prior period',
      lede: true,
    },
    {
      label: 'Open invoices',
      value: this.number(this.openInvoiceCount),
      delta: this.openInvoicesDelta,
      formattedDelta: this.signedNumber(this.openInvoicesDelta),
      note: 'Awaiting settlement',
    },
    {
      label: 'Overdue',
      value: this.number(this.overdueCount),
      delta: this.overdueDelta,
      formattedDelta: this.signedNumber(this.overdueDelta),
      note: 'Past terms; escalation advised',
      negative: true,
    },
    {
      label: 'Open tickets',
      value: this.number(this.openTicketCount),
      delta: this.openTicketsDelta,
      formattedDelta: this.signedNumber(this.openTicketsDelta),
      note: 'Service correspondence pending',
    },
  ];

  /** Paid revenue per month over a trailing year, for the line chart. */
  protected readonly revenueSeries = monthlyRevenueSeries();

  /** Invoice counts by status, for the donut chart. */
  protected readonly statusSlices = invoiceStatusSlices(this.invoices);

  /** Shared status legend (same order/colors as donut and bars). */
  protected readonly statusLegend = invoiceStatusLegend();

  /** Invoice counts per issue month split by status (stacked bars). */
  protected readonly monthlyStatus = monthlyStatusBars(this.invoices);

  /** Total invoice count, formatted for the donut center. */
  protected readonly invoiceCount = this.number(this.invoices.length);

  /** Most recently issued invoice. */
  protected readonly latestInvoice = this.invoices.reduce((latest, invoice) =>
    invoice.issuedAt > latest.issuedAt ? invoice : latest,
  );

  protected readonly latestInvoiceRows: readonly DetailCardRow[] = [
    { label: 'Number', value: this.latestInvoice.number },
    { label: 'Customer', value: this.latestInvoice.customerName },
    { label: 'Amount', value: this.currency(this.latestInvoice.amount) },
    { label: 'Status', value: this.latestInvoice.status },
    { label: 'Issued', value: this.date(this.latestInvoice.issuedAt) },
    { label: 'Due', value: this.date(this.latestInvoice.dueAt) },
  ];

  /** Customer with the highest total billed across all invoices. */
  private readonly topCustomer = topCustomerByTotal(this.invoices);

  protected readonly topCustomerRows: readonly DetailCardRow[] = [
    { label: 'Customer', value: this.topCustomer.customerName },
    { label: 'Invoices', value: this.topCustomer.invoiceCount },
    { label: 'Total billed', value: this.currency(this.topCustomer.totalBilled) },
    { label: 'Largest invoice', value: this.currency(this.topCustomer.largestAmount) },
  ];

  private currency(amount: number): string {
    return formatCurrency(amount, this.locale, getCurrencySymbol('USD', 'narrow', this.locale));
  }

  private date(iso: string): string {
    return formatDate(iso, 'mediumDate', this.locale);
  }

  private number(value: number): string {
    return formatNumber(value, this.locale);
  }

  /** Delta rendered with an explicit sign (`+12`, `-3.5`), as in the lib. */
  private signedNumber(delta: number): string {
    const formatted = formatNumber(Math.abs(delta), this.locale);
    return delta < 0 ? `-${formatted}` : `+${formatted}`;
  }
}

/** One row in the contents-rail "Principal figures" typeset stack. */
interface DashboardFigure {
  readonly label: string;
  readonly value: string;
  readonly delta: number;
  readonly formattedDelta: string;
  readonly note: string;
  /** The lead figure renders one optical size up. */
  readonly lede?: boolean;
  /** Negative-status figures take the overdue status color. */
  readonly negative?: boolean;
}

function sumAmounts(invoices: readonly Invoice[]): number {
  return invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
}

/** Count of dates on/after the midpoint minus the count before it. */
function recentMinusOlder(dates: readonly string[]): number {
  const recent = dates.filter((date) => date >= PERIOD_MIDPOINT).length;
  return recent - (dates.length - recent);
}

/** Sums invoice amounts per `YYYY-MM` month, returned oldest first. */
function monthlyTotals(invoices: readonly Invoice[]): number[] {
  const byMonth = new Map<string, number>();
  for (const invoice of invoices) {
    const month = invoice.issuedAt.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + invoice.amount);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, total]) => total);
}

interface TopCustomer {
  readonly customerName: string;
  readonly invoiceCount: number;
  readonly totalBilled: number;
  readonly largestAmount: number;
}

function topCustomerByTotal(invoices: readonly Invoice[]): TopCustomer {
  const byCustomer = new Map<string, Invoice[]>();
  for (const invoice of invoices) {
    const list = byCustomer.get(invoice.customerName) ?? [];
    list.push(invoice);
    byCustomer.set(invoice.customerName, list);
  }
  let top: TopCustomer = {
    customerName: '—',
    invoiceCount: 0,
    totalBilled: 0,
    largestAmount: 0,
  };
  for (const [customerName, list] of byCustomer) {
    const totalBilled = sumAmounts(list);
    if (totalBilled > top.totalBilled) {
      top = {
        customerName,
        invoiceCount: list.length,
        totalBilled,
        largestAmount: Math.max(...list.map((invoice) => invoice.amount)),
      };
    }
  }
  return top;
}
