import { Tree, readJson, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { portPageGenerator } from './generator';

function seedAnalysis(tree: Tree): void {
  writeJson(tree, 'm3kit-porting/orders/orders-list/analysis.json', {
    schemaVersion: 1,
    target: 'apps/demo/src/app/orders/orders-page.component.ts',
    projectName: 'demo',
    domain: 'orders',
    page: 'orders-list',
    sourceFiles: ['apps/demo/src/app/orders/orders-page.component.ts'],
    inferredM3kitLibs: ['core', 'theme', 'shell', 'forms', 'table', 'feedback', 'state'],
    dataAccessSeams: [{ file: 'apps/demo/src/app/orders/orders.service.ts', status: 'manual-review', reason: 'HttpClient' }],
    uiComponents: [{ kind: 'table', evidence: 'mat-table' }],
    routeSnippets: ["{ path: 'orders-list', loadComponent: () => import('@acme/orders/feature-orders-list').then((m) => m.OrdersListPageComponent) }"],
    manualReviewItems: ['Port OrdersService by hand behind generated facade tests.'],
    generatedAt: '2026-07-06T00:00:00.000Z',
  });
}

function expectTestableProject(tree: Tree, projectRoot: string, projectName: string): void {
  expect(readJson(tree, `${projectRoot}/project.json`)).toMatchObject({
    name: projectName,
    targets: {
      test: {
        executor: '@nx/vite:test',
        options: { reportsDirectory: `../../../coverage/${projectRoot}` },
      },
    },
  });
  expect(tree.exists(`${projectRoot}/tsconfig.json`)).toBe(true);
  expect(tree.exists(`${projectRoot}/tsconfig.lib.json`)).toBe(true);
  expect(tree.exists(`${projectRoot}/tsconfig.spec.json`)).toBe(true);
  expect(tree.exists(`${projectRoot}/vite.config.mts`)).toBe(true);
  expect(tree.read(`${projectRoot}/vite.config.mts`, 'utf-8')).toContain(
    "import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';",
  );
  expect(tree.read(`${projectRoot}/vite.config.mts`, 'utf-8')).toContain('plugins: [angular(), nxViteTsPaths()]');
  expect(tree.read(`${projectRoot}/src/test-setup.ts`, 'utf-8')).toContain('initTestEnvironment');
}

describe('port-page generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    writeJson(tree, 'tsconfig.base.json', {
      compilerOptions: { paths: { '@acme/core': ['libs/core/src/index.ts'] } },
    });
    seedAnalysis(tree);
  });

  it('generates side-by-side feature, data-access, and ui Nx library scaffolds', async () => {
    await portPageGenerator(tree, {
      analysis: 'm3kit-porting/orders/orders-list/analysis.json',
      domain: 'orders',
      page: 'orders-list',
      apply: false,
    });

    expect(tree.exists('libs/orders/feature-orders-list/src/lib/orders-list-page.component.ts')).toBe(true);
    expect(tree.exists('libs/orders/feature-orders-list/src/lib/orders-list-page.component.spec.ts')).toBe(true);
    expect(tree.exists('libs/orders/data-access/src/lib/orders-list.facade.ts')).toBe(true);
    expect(tree.exists('libs/orders/data-access/src/lib/orders-list.facade.spec.ts')).toBe(true);
    expect(tree.exists('libs/orders/ui/src/lib/orders-list-summary.component.ts')).toBe(true);
    expect(tree.exists('libs/orders/ui/src/lib/orders-list-summary.component.spec.ts')).toBe(true);
    expect(tree.exists('libs/orders/ui/src/lib/orders-list-summary.component.stories.ts')).toBe(true);
    expect(tree.exists('libs/orders/ui/src/lib/orders-list-summary.component.cy.ts')).toBe(true);

    expect(readJson(tree, 'libs/orders/feature-orders-list/project.json')).toMatchObject({
      name: 'orders-feature-orders-list',
      tags: ['scope:orders', 'type:feature'],
    });
    expect(readJson(tree, 'libs/orders/data-access/project.json')).toMatchObject({
      name: 'orders-data-access',
      tags: ['scope:orders', 'type:data-access'],
    });
    expect(readJson(tree, 'libs/orders/ui/project.json')).toMatchObject({
      name: 'orders-ui',
      tags: ['scope:orders', 'type:ui'],
    });
    expectTestableProject(tree, 'libs/orders/feature-orders-list', 'orders-feature-orders-list');
    expectTestableProject(tree, 'libs/orders/data-access', 'orders-data-access');
    expectTestableProject(tree, 'libs/orders/ui', 'orders-ui');
  });

  it('keeps quickstart test commands aligned to generated Nx test targets and configs', async () => {
    await portPageGenerator(tree, {
      analysis: 'm3kit-porting/orders/orders-list/analysis.json',
      domain: 'orders',
      page: 'orders-list',
      apply: false,
    });

    const quickstart = tree.read('m3kit-porting/orders/orders-list/quickstart.md', 'utf-8') ?? '';
    for (const [command, projectRoot] of [
      ['npx nx test orders-data-access', 'libs/orders/data-access'],
      ['npx nx test orders-ui', 'libs/orders/ui'],
      ['npx nx test orders-feature-orders-list', 'libs/orders/feature-orders-list'],
    ] as const) {
      expect(quickstart).toContain(command);
      const project = readJson(tree, `${projectRoot}/project.json`);
      expect(project.targets.test.executor).toBe('@nx/vite:test');
      expect(tree.exists(`${projectRoot}/tsconfig.spec.json`)).toBe(true);
      expect(tree.exists(`${projectRoot}/vite.config.mts`)).toBe(true);
    }
  });

  it('generates a data-access spec that has the files required by the emitted Vitest target', async () => {
    await portPageGenerator(tree, {
      analysis: 'm3kit-porting/orders/orders-list/analysis.json',
      domain: 'orders',
      page: 'orders-list',
      apply: false,
    });

    const spec = tree.read('libs/orders/data-access/src/lib/orders-list.facade.spec.ts', 'utf-8') ?? '';
    expect(spec).toContain("import { OrdersListFacade } from './orders-list.facade';");
    expect(tree.read('libs/orders/data-access/vite.config.mts', 'utf-8')).toContain(
      "include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']",
    );
    expect(readJson(tree, 'libs/orders/data-access/tsconfig.spec.json')).toMatchObject({
      files: ['src/test-setup.ts'],
      include: ['vite.config.mts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts'],
    });
  });

  it('keeps app routes untouched and emits manual wiring, lift, and rollback runbook guidance', async () => {
    tree.write('apps/demo/src/app/app.routes.ts', 'export const routes = [];\n');

    await portPageGenerator(tree, {
      analysis: 'm3kit-porting/orders/orders-list/analysis.json',
      domain: 'orders',
      page: 'orders-list',
      apply: false,
    });

    expect(tree.read('apps/demo/src/app/app.routes.ts', 'utf-8')).toBe('export const routes = [];\n');
    const runbook = tree.read('m3kit-porting/orders/orders-list/runbook.md', 'utf-8') ?? '';
    expect(runbook).toContain('npx nx g @m3kit/plugin:lift --libs=shell,forms,table,feedback,state --scope=acme');
    expect(runbook).toContain("loadComponent: () => import('@acme/orders/feature-orders-list')");
    expect(runbook).toContain('Rollback');
  });

  it('generates a complete Spec Kit packet and safe AI wiring prompt', async () => {
    await portPageGenerator(tree, {
      analysis: 'm3kit-porting/orders/orders-list/analysis.json',
      domain: 'orders',
      page: 'orders-list',
    });

    for (const file of [
      'spec.md',
      'plan.md',
      'tasks.md',
      'quickstart.md',
      'governance.yaml',
      'contracts/source-behavior.md',
      'contracts/data-access.md',
      'contracts/ui-states.md',
      'checklists/requirements.md',
      'ai-wiring-prompt.md',
    ]) {
      expect(tree.exists(`m3kit-porting/orders/orders-list/${file}`)).toBe(true);
    }
    const governance = tree.read('m3kit-porting/orders/orders-list/governance.yaml', 'utf-8') ?? '';
    expect(governance).toContain('non_destructive_default: true');
    const prompt = tree.read('m3kit-porting/orders/orders-list/ai-wiring-prompt.md', 'utf-8') ?? '';
    expect(prompt).toContain('Do not delete, move, or rewrite the original route/page files');
  });

  it('refuses to overwrite existing destinations without force and writes a conflict report', async () => {
    tree.write('libs/orders/ui/src/lib/orders-list-summary.component.ts', '// owned by user\n');

    await expect(
      portPageGenerator(tree, {
        analysis: 'm3kit-porting/orders/orders-list/analysis.json',
        domain: 'orders',
        page: 'orders-list',
      }),
    ).rejects.toThrow(/Refusing to overwrite/);

    expect(tree.read('libs/orders/ui/src/lib/orders-list-summary.component.ts', 'utf-8')).toBe('// owned by user\n');
    expect(tree.read('m3kit-porting/orders/orders-list/conflicts.md', 'utf-8')).toContain(
      'libs/orders/ui/src/lib/orders-list-summary.component.ts',
    );
  });
});
