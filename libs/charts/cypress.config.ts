import { nxComponentTestingPreset } from '@nx/angular/plugins/component-testing';
import { defineConfig } from 'cypress';

const preset = nxComponentTestingPreset(__filename);

export default defineConfig({
  component: {
    ...preset,
    devServer: {
      ...preset.devServer,
      // Fixed per-project dev-server port (8082-8086 across the five CT
      // libs) so parallel component-test runs don't race the same
      // auto-assigned port (EADDRINUSE).
      webpackConfig: { devServer: { port: 8082 } },
    },
  },
});
