import type { Preview } from '@storybook/angular';

/**
 * Theme toolbar: toggles the `dark` class on the preview root element so the
 * M3 system tokens emitted by storybook-theme.scss flip between light and
 * dark color schemes.
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Material color scheme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (story, context) => {
      const isDark = context.globals['theme'] === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
      return story();
    },
  ],
};

export default preview;
