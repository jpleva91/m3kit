export type PortPageMode = 'scaffold' | 'analysis-only' | 'runbook-only';

export interface PortPageGeneratorSchema {
  /** Target component/page/route path to analyze when no analysis file is supplied. */
  target?: string;
  /** Domain name for generated libraries. */
  domain?: string;
  /** Page/feature name. */
  page?: string;
  /** Path to an analysis.json emitted by port-analyze. */
  analysis?: string;
  /** Generation mode. */
  mode?: PortPageMode;
  /** Root for generated libraries. */
  destinationRoot?: string;
  /** Alias prefix for lifted m3kit libs. */
  scope?: string;
  /** Override m3kit libs. */
  libs?: string[];
  /** Reserved for future route application; v1 never rewrites routes. */
  apply?: boolean;
  /** Overwrite generated destinations when explicit. */
  force?: boolean;
}
