import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: 'scope:reporting-core',
              onlyDependOnLibsWithTags: [],
            },
            // SCSS-only theming contract + default brand; depends on
            // nothing, anything may depend on it (styles-level only).
            {
              sourceTag: 'scope:reporting-theme',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'scope:reporting-material',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-theme',
              ],
            },
            {
              sourceTag: 'scope:reporting-testing',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-theme',
              ],
            },
            {
              sourceTag: 'scope:reporting-dashboard',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-theme',
              ],
            },
            {
              sourceTag: 'scope:reporting-charts',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-theme',
              ],
            },
            {
              sourceTag: 'scope:reporting-forms',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-theme',
              ],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-material',
                'scope:reporting-testing',
                'scope:reporting-charts',
                'scope:reporting-dashboard',
                'scope:reporting-forms',
                'scope:reporting-theme',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
