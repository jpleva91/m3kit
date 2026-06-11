/**
 * Scaffold-phase placeholder export.
 *
 * The reporting contracts (report definitions, column definitions,
 * query/filter/sort/pagination models, datasource interfaces) land here
 * in a later phase, after the clean-room review gate. This token exists
 * so the library has a named, importable export and a passing test
 * until then.
 */
export const REPORTING_CORE_PLACEHOLDER = 'reporting-core' as const;

export type ReportingCorePlaceholder = typeof REPORTING_CORE_PLACEHOLDER;
