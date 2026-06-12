import { Tree, addProjectConfiguration, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { reportPageGenerator } from './generator';

describe('report-page generator', () => {
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
    await reportPageGenerator(tree, { name: 'open-invoices', project: 'demo' });

    const base = 'apps/demo/src/app/open-invoices/open-invoices-page';
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

  it('composes page-header + filter-form + data-table wired together', async () => {
    await reportPageGenerator(tree, { name: 'open-invoices', project: 'demo' });

    const html =
      tree.read('apps/demo/src/app/open-invoices/open-invoices-page.component.html', 'utf-8') ??
      '';
    expect(html).toContain('<m3k-page-header');
    expect(html).toContain('<m3k-filter-form');
    expect(html).toContain('<m3k-data-table');
    expect(html).toContain('(filtersChange)="onFiltersChange($event)"');
    expect(html).toContain('[fieldFilters]="fieldFilters()"');
  });

  it('stubs a TableDefinition and an InMemoryTableDataSource', async () => {
    await reportPageGenerator(tree, { name: 'open-invoices', project: 'demo' });

    const data =
      tree.read('apps/demo/src/app/open-invoices/open-invoices-page.data.ts', 'utf-8') ?? '';
    expect(data).toContain('OPEN_INVOICES_TABLE_DEFINITION: TableDefinition<OpenInvoicesRow>');
    expect(data).toContain('new InMemoryTableDataSource<OpenInvoicesRow>(STUB_ROWS)');
  });

  it('detects the lifted alias prefix from tsconfig.base.json', async () => {
    writeJson(tree, 'tsconfig.base.json', {
      compilerOptions: {
        paths: { '@acme/core': ['libs/core/src/index.ts'] },
      },
    });

    await reportPageGenerator(tree, { name: 'open-invoices', project: 'demo' });

    const component =
      tree.read('apps/demo/src/app/open-invoices/open-invoices-page.component.ts', 'utf-8') ?? '';
    expect(component).toContain("from '@acme/forms'");
    expect(component).toContain("from '@acme/shell'");
    expect(component).toContain("from '@acme/table'");
  });

  it('honors an explicit title and scope', async () => {
    await reportPageGenerator(tree, {
      name: 'open-invoices',
      project: 'demo',
      title: 'Open Invoices Ledger',
      scope: 'ui',
    });

    const data =
      tree.read('apps/demo/src/app/open-invoices/open-invoices-page.data.ts', 'utf-8') ?? '';
    expect(data).toContain("title: 'Open Invoices Ledger'");
    expect(data).toContain("from '@ui/core'");
  });
});
