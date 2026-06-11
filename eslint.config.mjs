import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist'],
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
            {
              sourceTag: 'scope:reporting-material',
              onlyDependOnLibsWithTags: ['scope:reporting-core'],
            },
            {
              sourceTag: 'scope:reporting-testing',
              onlyDependOnLibsWithTags: ['scope:reporting-core'],
            },
            {
              sourceTag: 'scope:reporting-dashboard',
              onlyDependOnLibsWithTags: ['scope:reporting-core'],
            },
            {
              sourceTag: 'scope:reporting-forms',
              onlyDependOnLibsWithTags: ['scope:reporting-core'],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'scope:reporting-core',
                'scope:reporting-material',
                'scope:reporting-testing',
                'scope:reporting-dashboard',
                'scope:reporting-forms',
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
