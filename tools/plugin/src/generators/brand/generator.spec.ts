import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { brandGenerator } from './generator';

const OPTIONS = {
  name: 'midnight',
  primary: '#2A2D6E',
  tertiary: '#B08D57',
  neutral: '#5C5F6E',
};

const AGGREGATOR = 'apps/demo-reporting/src/styles/_theme.scss';

describe('brand generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('scaffolds the SCSS pair implementing the brand mixin contract', async () => {
    await brandGenerator(tree, OPTIONS);

    const brand = tree.read('styles/themes/_midnight.scss', 'utf-8') ?? '';
    expect(tree.exists('styles/themes/_midnight-colors.scss')).toBe(true);
    expect(brand).toContain("@use 'm3kit-theme' as contract;");
    expect(brand).toContain('@mixin brand-light()');
    expect(brand).toContain('@mixin brand-dark()');
    expect(brand).toContain('contract.status-tokens($_status-light)');
    expect(brand).toContain('contract.chart-tokens($_chart-light...)');
    expect(brand).toContain('#2A2D6E');
  });

  it('documents the palette regeneration seeds in the colors file', async () => {
    await brandGenerator(tree, OPTIONS);

    const colors = tree.read('styles/themes/_midnight-colors.scss', 'utf-8') ?? '';
    expect(colors).toContain('@angular/material:theme-color');
    expect(colors).toContain("--primary-color='#2A2D6E'");
    expect(colors).toContain("--tertiary-color='#B08D57'");
    expect(colors).toContain("--neutral-color='#5C5F6E'");
  });

  it('templates the palettes from the Instruments brand when available', async () => {
    tree.write(
      'libs/theme/src/m3kit-theme/themes/instruments/_colors.scss',
      '$primary-palette: (placeholder);\n$tertiary-palette: (placeholder);\n',
    );

    await brandGenerator(tree, OPTIONS);

    const colors = tree.read('styles/themes/_midnight-colors.scss', 'utf-8') ?? '';
    expect(colors).toContain('$primary-palette: (placeholder);');
    expect(colors).not.toContain('@error');
  });

  it('registers the brand in the aggregator when run inside m3kit', async () => {
    tree.write(
      AGGREGATOR,
      [
        "@use 'm3kit-theme/themes/instruments';",
        "@use './themes/terminal';",
        '',
        '@mixin app-theme() {',
        '  html {',
        '    @include instruments.brand-light();',
        '  }',
        '}',
        '',
      ].join('\n'),
    );

    await brandGenerator(tree, OPTIONS);

    expect(tree.exists('apps/demo-reporting/src/styles/themes/_midnight.scss')).toBe(true);
    const aggregator = tree.read(AGGREGATOR, 'utf-8') ?? '';
    expect(aggregator).toContain("@use './themes/midnight';");
    expect(aggregator).toContain('html.theme-midnight {');
    expect(aggregator).toContain('html.theme-midnight.dark {');
    expect(aggregator).toContain('midnight.brand-dark()');
  });

  it('is idempotent: re-running does not duplicate the registration', async () => {
    tree.write(
      AGGREGATOR,
      "@use './themes/terminal';\n\n@mixin app-theme() {\n  html {\n  }\n}\n",
    );

    await brandGenerator(tree, OPTIONS);
    await brandGenerator(tree, OPTIONS);

    const aggregator = tree.read(AGGREGATOR, 'utf-8') ?? '';
    expect(aggregator.split("@use './themes/midnight';").length - 1).toBe(1);
    expect(aggregator.split('html.theme-midnight {').length - 1).toBe(1);
  });
});
