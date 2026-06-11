/**
 * Chart-shaped views of the synthetic fixtures for the dashboard page.
 *
 * Everything here is derived from the deterministic `@m3kit/testing`
 * factories, so the charts render the same picture on every run.
 */
import {
  BarChartSeries,
  ChartLegendItem,
  DonutChartSlice,
  LineChartSeries,
} from '@m3kit/charts';
import { Invoice, InvoiceStatus, makeInvoices } from '@m3kit/testing';

/**
 * Invoice statuses in factory order. Donut slices, stacked-bar series,
 * and legend rows all use this order so the cycled `--app-chart-N`
 * colors line up across the three.
 */
export const INVOICE_STATUS_ORDER: readonly InvoiceStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'void',
];

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

/**
 * Trailing-year month labels ending at the synthetic data window
 * (the factories issue dates Jan–May 2026; the trend looks back 12mo).
 */
const TREND_MONTH_LABELS: readonly string[] = [
  'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
  'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May',
];

/** One deterministic invoice batch per trend month. */
const TREND_INVOICES_PER_MONTH = 30;
const TREND_SEED = 500;

/** Month names indexed by `MM - 1` for the stacked-bar categories. */
const MONTH_NAMES: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Paid revenue per month over a trailing 12-month window, as a single
 * line-chart series. Each month draws its own seeded invoice batch, so
 * the trend is deterministic and obviously synthetic.
 */
export function monthlyRevenueSeries(): readonly LineChartSeries[] {
  const points = TREND_MONTH_LABELS.map((label, month) => {
    const batch = makeInvoices(TREND_INVOICES_PER_MONTH, TREND_SEED + month * TREND_INVOICES_PER_MONTH);
    const paidTotal = batch
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    return { x: label, y: paidTotal };
  });
  return [{ name: 'Paid revenue', points }];
}

/** Invoice counts by status, in {@link INVOICE_STATUS_ORDER}. */
export function invoiceStatusSlices(invoices: readonly Invoice[]): readonly DonutChartSlice[] {
  return INVOICE_STATUS_ORDER.map((status) => ({
    label: STATUS_LABELS[status],
    value: invoices.filter((invoice) => invoice.status === status).length,
  }));
}

/** Legend rows matching the status slice/series order and colors. */
export function invoiceStatusLegend(): readonly ChartLegendItem[] {
  return INVOICE_STATUS_ORDER.map((status, colorIndex) => ({
    label: STATUS_LABELS[status],
    colorIndex,
  }));
}

/** Stacked-bar inputs: month categories plus one series per status. */
export interface MonthlyStatusBars {
  readonly categories: readonly string[];
  readonly series: readonly BarChartSeries[];
}

/**
 * Invoice counts per issue month, split by status, for the stacked
 * monthly bars. Months come from the invoices' own `issuedAt` window.
 */
export function monthlyStatusBars(invoices: readonly Invoice[]): MonthlyStatusBars {
  const months = [...new Set(invoices.map((invoice) => invoice.issuedAt.slice(0, 7)))].sort();
  const categories = months.map((month) => MONTH_NAMES[Number(month.slice(5, 7)) - 1]);
  const series = INVOICE_STATUS_ORDER.map((status) => ({
    name: STATUS_LABELS[status],
    values: months.map(
      (month) =>
        invoices.filter(
          (invoice) => invoice.status === status && invoice.issuedAt.startsWith(month),
        ).length,
    ),
  }));
  return { categories, series };
}
