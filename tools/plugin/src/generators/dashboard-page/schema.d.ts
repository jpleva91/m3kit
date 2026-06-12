export interface DashboardPageGeneratorSchema {
  /** Page name (dasherized), e.g. `revenue-overview`. */
  name: string;
  /** Host application project name. */
  project: string;
  /** Human-readable page title. */
  title?: string;
  /** Alias prefix of the lifted m3kit libs (auto-detected when omitted). */
  scope?: string;
}
