/**
 * Scaffold-phase placeholder export.
 *
 * The Material/CDK reporting components (report table, filter bar,
 * toolbar) land here in a later phase, after the clean-room review
 * gate, built on the contracts from @reporting/core.
 */
export const REPORTING_MATERIAL_PLACEHOLDER = 'reporting-material' as const;

export type ReportingMaterialPlaceholder =
  typeof REPORTING_MATERIAL_PLACEHOLDER;
