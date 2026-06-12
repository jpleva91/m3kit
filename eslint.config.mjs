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
              sourceTag: 'scope:m3kit-core',
              onlyDependOnLibsWithTags: [],
            },
            // SCSS-only theming contract + default brand; depends on
            // nothing, anything may depend on it (styles-level only).
            {
              sourceTag: 'scope:m3kit-theme',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'scope:m3kit-table',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-theme',
              ],
            },
            {
              sourceTag: 'scope:m3kit-testing',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-theme',
              ],
            },
            {
              sourceTag: 'scope:m3kit-dashboard',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-theme',
              ],
            },
            {
              sourceTag: 'scope:m3kit-charts',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-theme',
              ],
            },
            {
              sourceTag: 'scope:m3kit-forms',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-theme',
              ],
            },
            {
              sourceTag: 'scope:m3kit-shell',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-theme',
              ],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'scope:m3kit-core',
                'scope:m3kit-table',
                'scope:m3kit-testing',
                'scope:m3kit-charts',
                'scope:m3kit-dashboard',
                'scope:m3kit-forms',
                'scope:m3kit-shell',
                'scope:m3kit-theme',
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
