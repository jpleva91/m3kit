import { Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { dashboardPageGenerator } from './generator';

describe('dashboard-page generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'demo', {
      root: 'apps/demo',
      sourceRoot: 'apps/demo/src',
      projectType: 'application',
    });
  });

  it('scaffolds the page component, template, styles, spec, and data stub', async () => {
    await dashboardPageGenerator(tree, { name: 'revenue-overview', project: 'demo' });

    const base = 'apps/demo/src/app/revenue-overview/revenue-overview-page';
    for (const suffix of [
      '.component.ts',
      '.component.html',
      '.component.scss',
      '.component.spec.ts',
      '.data.ts',
    ]) {
      expect(tree.exists(`${base}${suffix}`)).toBe(true);
    }
  });

  it('composes page-header + KPI cards + chart cards in a dashboard grid', async () => {
    await dashboardPageGenerator(tree, { name: 'revenue-overview', project: 'demo' });

    const html =
      tree.read(
        'apps/demo/src/app/revenue-overview/revenue-overview-page.component.html',
        'utf-8',
      ) ?? '';
    expect(html).toContain('<m3k-page-header');
    expect(html).toContain('<m3k-dashboard-grid');
    expect(html).toContain('<m3k-kpi-card');
    expect(html).toContain('<m3k-chart-card');
    expect(html).toContain('<m3k-line-chart');
    expect(html).toContain('<m3k-bar-chart');
  });

  it('stubs KPI items and line/bar chart series', async () => {
    await dashboardPageGenerator(tree, { name: 'revenue-overview', project: 'demo' });

    const data =
      tree.read('apps/demo/src/app/revenue-overview/revenue-overview-page.data.ts', 'utf-8') ??
      '';
    expect(data).toContain('REVENUE_OVERVIEW_KPIS: readonly RevenueOverviewKpi[]');
    expect(data).toContain('REVENUE_OVERVIEW_TREND_SERIES: readonly LineChartSeries[]');
    expect(data).toContain('REVENUE_OVERVIEW_BREAKDOWN_SERIES: readonly BarChartSeries[]');
  });

  it('imports the composing components from the configured scope', async () => {
    await dashboardPageGenerator(tree, {
      name: 'revenue-overview',
      project: 'demo',
      scope: 'ui',
    });

    const component =
      tree.read('apps/demo/src/app/revenue-overview/revenue-overview-page.component.ts', 'utf-8') ??
      '';
    expect(component).toContain("from '@ui/charts'");
    expect(component).toContain("from '@ui/dashboard'");
    expect(component).toContain("from '@ui/shell'");
    expect(component).toContain('ChangeDetectionStrategy.OnPush');
  });
});
