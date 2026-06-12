import { addons } from 'storybook/internal/manager-api';
import { create } from 'storybook/internal/theming';

/**
 * Manager (sidebar/chrome) branding. Uses the consolidated Storybook 8
 * `storybook/internal/*` entry points — `@storybook/manager-api` and
 * `@storybook/theming` are not installed as standalone packages here.
 */
addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'm3kit',
    brandUrl: 'https://github.com/jpleva91/m3kit',
    brandTarget: '_blank',
  }),
});
