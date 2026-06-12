import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'm3k',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'm3k',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
  {
    // Parity-gallery story hosts are storybook-only scaffolding, not
    // published components; the selector contract doesn't apply to them.
    files: ['**/.storybook/parity/**/*.stories.ts'],
    rules: {
      '@angular-eslint/component-selector': 'off',
    },
  },
  {
    // Pages-level composed examples (atomic-design "Pages") live in the
    // Storybook host, which is already the one sanctioned cross-lib surface
    // (main.ts globs every lib). These two story files are disposable
    // storybook scaffolding, not table lib code, so the table scope
    // constraint doesn't apply to them. Component code under src/ stays
    // fully boundary-enforced.
    files: [
      '**/.storybook/parity/full-dashboard.stories.ts',
      '**/.storybook/parity/settings-form.stories.ts',
    ],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
