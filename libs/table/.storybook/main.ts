import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    './Introduction.mdx',
    './parity/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../charts/src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../dashboard/src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../forms/src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../shell/src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../../apps/demo-reporting/src/app/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  core: {
    disableTelemetry: true,
  },
  framework: {
    name: '@storybook/angular',
    options: {},
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs
