import { Tree, addProjectConfiguration, readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { dependencyClosure, liftGenerator } from './generator';

/** Builds a minimal extracted-m3kit fixture on disk (the tarball injection point). */
function createFixtureWorkspace(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'm3kit-lift-fixture-'));
  const write = (relative: string, content: string): void => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };

  write(
    'libs/core/project.json',
    JSON.stringify({
      name: 'm3kit-core',
      sourceRoot: 'libs/core/src',
      projectType: 'library',
      tags: ['type:lib', 'scope:m3kit-core'],
      targets: { lint: { executor: '@nx/eslint:lint' } },
    }),
  );
  write('libs/core/src/index.ts', 'export const CORE = true;\n');

  write(
    'libs/theme/project.json',
    JSON.stringify({
      name: 'm3kit-theme',
      sourceRoot: 'libs/theme/src',
      projectType: 'library',
      tags: ['type:lib', 'scope:m3kit-theme'],
      targets: { lint: { executor: '@nx/eslint:lint' } },
    }),
  );
  write('libs/theme/src/m3kit-theme/_contract.scss', '// contract\n');

  write(
    'libs/table/project.json',
    JSON.stringify({
      name: 'm3kit-table',
      sourceRoot: 'libs/table/src',
      projectType: 'library',
      tags: ['type:lib', 'scope:m3kit-table'],
      implicitDependencies: ['m3kit-theme'],
      targets: {
        lint: { executor: '@nx/eslint:lint' },
        storybook: { executor: '@storybook/angular:start-storybook' },
        'build-storybook': { executor: '@storybook/angular:build-storybook' },
        'component-test': { executor: '@nx/cypress:cypress' },
      },
    }),
  );
  write(
    'libs/table/src/lib/data-table.component.ts',
    "import { CORE } from '@m3kit/core';\nexport const TABLE = CORE;\n",
  );
  write('libs/table/src/index.ts', "export * from './lib/data-table.component';\n");

  return root;
}

describe('lift generator', () => {
  let tree: Tree;
  let fixture: string;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    fixture = createFixtureWorkspace();
  });

  afterEach(() => {
    fs.rmSync(fixture, { recursive: true, force: true });
  });

  it('computes the dependency closure', () => {
    expect(dependencyClosure(['table'])).toEqual(['core', 'theme', 'table']);
    expect(dependencyClosure(['state'])).toEqual(['core', 'state']);
    expect(dependencyClosure(['dashboard', 'charts'])).toEqual([
      'core',
      'theme',
      'dashboard',
      'charts',
    ]);
    expect(() => dependencyClosure(['nope'])).toThrow(/unknown m3kit lib/);
  });

  it('copies the requested lib plus its closure from the source dir', async () => {
    await liftGenerator(tree, { libs: ['table'], sourceDir: fixture });

    expect(tree.exists('libs/table/src/lib/data-table.component.ts')).toBe(true);
    expect(tree.exists('libs/core/src/index.ts')).toBe(true);
    expect(tree.exists('libs/theme/src/m3kit-theme/_contract.scss')).toBe(true);
  });

  it('rewrites @m3kit/* imports to the consumer scope', async () => {
    await liftGenerator(tree, { libs: ['table'], scope: 'acme', sourceDir: fixture });

    const component = tree.read('libs/table/src/lib/data-table.component.ts', 'utf-8');
    expect(component).toContain("from '@acme/core'");
    expect(component).not.toContain('@m3kit/');
  });

  it('rewires project names, tags, and implicit dependencies', async () => {
    await liftGenerator(tree, { libs: ['table'], scope: 'acme', sourceDir: fixture });

    const project = readJson(tree, 'libs/table/project.json');
    expect(project.name).toBe('acme-table');
    expect(project.tags).toEqual(['type:lib', 'scope:acme-table']);
    expect(project.implicitDependencies).toEqual(['acme-theme']);
  });

  it('strips demo-only Storybook/Cypress targets from lifted projects', async () => {
    await liftGenerator(tree, { libs: ['table'], sourceDir: fixture });

    const project = readJson(tree, 'libs/table/project.json');
    expect(project.targets.lint).toBeDefined();
    expect(project.targets.storybook).toBeUndefined();
    expect(project.targets['build-storybook']).toBeUndefined();
    expect(project.targets['component-test']).toBeUndefined();
  });

  it('adds tsconfig.base.json path aliases for TS libs but not theme', async () => {
    await liftGenerator(tree, { libs: ['table'], scope: 'acme', sourceDir: fixture });

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.paths['@acme/table']).toEqual(['libs/table/src/index.ts']);
    expect(tsconfig.compilerOptions.paths['@acme/core']).toEqual(['libs/core/src/index.ts']);
    expect(tsconfig.compilerOptions.paths['@acme/theme']).toBeUndefined();
  });

  it('patches theme includePaths into detectable Angular build targets', async () => {
    addProjectConfiguration(tree, 'web', {
      root: 'apps/web',
      sourceRoot: 'apps/web/src',
      projectType: 'application',
      targets: {
        build: {
          executor: '@angular-devkit/build-angular:application',
          options: { styles: ['apps/web/src/styles.scss'] },
        },
      },
    });

    await liftGenerator(tree, { libs: ['table'], sourceDir: fixture });

    const web = readProjectConfiguration(tree, 'web');
    expect(web.targets?.build.options.stylePreprocessorOptions.includePaths).toEqual([
      'libs/theme/src',
    ]);
  });

  it('is idempotent: re-runs never overwrite an already-lifted (owned) lib', async () => {
    await liftGenerator(tree, { libs: ['table'], scope: 'acme', sourceDir: fixture });
    tree.write('libs/table/src/lib/data-table.component.ts', '// locally modified\n');

    await liftGenerator(tree, { libs: ['table'], scope: 'acme', sourceDir: fixture });

    expect(tree.read('libs/table/src/lib/data-table.component.ts', 'utf-8')).toBe(
      '// locally modified\n',
    );
    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.paths['@acme/table']).toEqual(['libs/table/src/index.ts']);
  });

  it('fails loudly when the source has no such lib', async () => {
    fs.rmSync(path.join(fixture, 'libs/core'), { recursive: true });
    await expect(liftGenerator(tree, { libs: ['core'], sourceDir: fixture })).rejects.toThrow(
      /has no libs\/core/,
    );
  });
});
