/**
 * Scaffold-phase placeholder export.
 *
 * The test harnesses and synthetic data factories (customers, orders,
 * invoices, support tickets, products) land here in a later phase,
 * after the clean-room review gate, built on the contracts from
 * @reporting/core.
 */
export const REPORTING_TESTING_PLACEHOLDER = 'reporting-testing' as const;

export type ReportingTestingPlaceholder = typeof REPORTING_TESTING_PLACEHOLDER;
