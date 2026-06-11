/**
 * Ready-made `ReportDefinition` fixtures for the synthetic domains, typed
 * against @reporting/core, so consumers can demo a report instantly:
 *
 * ```ts
 * const dataSource = new InMemoryReportDataSource(makeInvoices(100));
 * const definition = INVOICES_REPORT_DEFINITION;
 * ```
 */
import type { ReportDefinition } from '@reporting/core';

import type { Customer, Invoice } from './factories';

/** Demo report over synthetic invoices. */
export const INVOICES_REPORT_DEFINITION: ReportDefinition<Invoice> = {
  id: 'demo-invoices',
  title: 'Invoices',
  description: 'Synthetic invoice fixtures for demos and tests.',
  defaultSort: { key: 'issuedAt', direction: 'desc' },
  defaultPageSize: 10,
  columns: [
    { key: 'number', header: 'Invoice #', type: 'text', sortable: true, width: '140px' },
    { key: 'customerName', header: 'Customer', type: 'text', sortable: true, filterable: true },
    {
      key: 'amount',
      header: 'Amount',
      type: 'currency',
      sortable: true,
      align: 'end',
      format: { currencyCode: 'USD', digitsInfo: '1.2-2' },
    },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      filterable: true,
      align: 'center',
      format: {
        badgeColors: {
          draft: 'neutral',
          sent: 'primary',
          paid: 'success',
          overdue: 'warn',
          void: 'accent',
        },
      },
    },
    {
      key: 'issuedAt',
      header: 'Issued',
      type: 'date',
      sortable: true,
      format: { dateFormat: 'mediumDate' },
    },
    {
      key: 'dueAt',
      header: 'Due',
      type: 'date',
      sortable: true,
      format: { dateFormat: 'mediumDate' },
    },
  ],
};

/** Demo report over synthetic customers. */
export const CUSTOMERS_REPORT_DEFINITION: ReportDefinition<Customer> = {
  id: 'demo-customers',
  title: 'Customers',
  description: 'Synthetic customer fixtures for demos and tests.',
  defaultSort: { key: 'customerName', direction: 'asc' },
  defaultPageSize: 10,
  columns: [
    { key: 'customerName', header: 'Customer', type: 'text', sortable: true, filterable: true },
    { key: 'companyName', header: 'Company', type: 'text', sortable: true, filterable: true },
    { key: 'email', header: 'Email', type: 'text' },
    {
      key: 'segment',
      header: 'Segment',
      type: 'badge',
      filterable: true,
      align: 'center',
      format: {
        badgeColors: {
          smb: 'neutral',
          'mid-market': 'primary',
          enterprise: 'success',
        },
      },
    },
    {
      key: 'creditLimit',
      header: 'Credit limit',
      type: 'currency',
      sortable: true,
      align: 'end',
      format: { currencyCode: 'USD', digitsInfo: '1.0-0' },
    },
    {
      key: 'createdAt',
      header: 'Created',
      type: 'date',
      sortable: true,
      format: { dateFormat: 'mediumDate' },
    },
  ],
};
