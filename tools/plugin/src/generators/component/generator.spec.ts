import { Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { componentGenerator } from './generator';

describe('component generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'm3kit-widgets', {
      root: 'libs/widgets',
      sourceRoot: 'libs/widgets/src',
      projectType: 'library',
      tags: ['type:lib', 'scope:m3kit-widgets'],
    });
    tree.write('libs/widgets/src/index.ts', '');
  });

  it('scaffolds the component plus the full coverage bar', async () => {
    await componentGenerator(tree, { name: 'status-pill', project: 'm3kit-widgets' });

    const base = 'libs/widgets/src/lib/status-pill.component';
    for (const ext of ['.ts', '.html', '.scss', '.spec.ts', '.stories.ts', '.cy.ts']) {
      expect(tree.exists(`${base}${ext}`)).toBe(true);
    }
  });

  it('emits an on-contract component: standalone signals, OnPush, m3k- selector', async () => {
    await componentGenerator(tree, { name: 'status-pill', project: 'm3kit-widgets' });

    const component = tree.read('libs/widgets/src/lib/status-pill.component.ts', 'utf-8') ?? '';
    expect(component).toContain("selector: 'm3k-status-pill'");
    expect(component).toContain('ChangeDetectionStrategy.OnPush');
    expect(component).toContain('input.required<string>()');
    expect(component).toContain('export class StatusPillComponent');
    expect(component).not.toContain('NgModule');
  });

  it('emits token-only SCSS (no raw hex, only var(--mat-sys-*/--app-*))', async () => {
    await componentGenerator(tree, { name: 'status-pill', project: 'm3kit-widgets' });

    const scss = tree.read('libs/widgets/src/lib/status-pill.component.scss', 'utf-8') ?? '';
    expect(scss).toMatch(/var\(--mat-sys-/);
    expect(scss).toMatch(/var\(--app-radius-/);
    expect(scss).not.toMatch(/:\s*#[0-9a-f]{3,8}\b/i);
  });

  it('exports the component from the lib barrel, idempotently', async () => {
    await componentGenerator(tree, { name: 'status-pill', project: 'm3kit-widgets' });
    await componentGenerator(tree, { name: 'status-pill', project: 'm3kit-widgets' });

    const barrel = tree.read('libs/widgets/src/index.ts', 'utf-8') ?? '';
    const occurrences = barrel.split("export * from './lib/status-pill.component';").length - 1;
    expect(occurrences).toBe(1);
  });
});
