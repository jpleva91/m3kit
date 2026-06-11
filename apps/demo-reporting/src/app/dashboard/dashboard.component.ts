import { ChangeDetectionStrategy, Component, LOCALE_ID, inject } from '@angular/core';
import { formatCurrency, formatDate, getCurrencySymbol } from '@angular/common';
import {
  DashboardGridComponent,
  DetailCardComponent,
  DetailCardRow,
  GridSpanDirective,
  KpiCardComponent,
} from '@reporting/dashboard';
import { Invoice, makeInvoices, makeSupportTickets } from '@reporting/testing';

/** Seeds for the synthetic fixtures, so the dashboard is deterministic. */
const INVOICE_SEED = 1;
const TICKET_SEED = 7;

/**
 * Midpoint of the synthetic 150-day data window (base date 2026-01-01).
 * Used to derive simple "recent half vs older half" deltas.
 */
const PERIOD_MIDPOINT = '2026-03-17T00:00:00.000Z';

/**
 * Dashboard demo: a responsive `rpt-dashboard-grid` of KPI tiles and
 * detail cards, all computed from deterministic synthetic invoices and
 * support tickets.
 */
@Component({
  selector: 'app-dashboard',
  imports: [DashboardGridComponent, DetailCardComponent, GridSpanDirective, KpiCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly locale = inject(LOCALE_ID);

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
