export interface PortAnalyzeGeneratorSchema {
  /** Target component/page/route path to analyze. */
  target: string;
  /** Optional Nx project name when the target is ambiguous. */
  project?: string;
  /** Domain name for the porting packet. */
  domain?: string;
  /** Page/feature name for the porting packet. */
  page?: string;
  /** Directory for analysis outputs. */
  outputDir?: string;
  /** Alias prefix used in recommendations. */
  scope?: string;
  /** When false, only logs analysis. */
  write?: boolean;
}
