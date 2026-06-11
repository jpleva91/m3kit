import type { Preview } from '@storybook/angular';

const BRANDS = ['instruments', 'terminal', 'ledger', 'field-guide'] as const;

/**
 * Theme toolbars: `brand` applies a `theme-<brand>` class (Instruments, the
 * default, carries no brand class) and `mode` toggles the `dark` class on the
 * preview root element, so the M3 system tokens emitted by
 * storybook-theme.scss switch between the four brands and light/dark.
 */
const preview: Preview = {
  globalTypes: {
    brand: {
      description: 'Brand theme',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: 'instruments', title: 'Instruments' },
          { value: 'terminal', title: 'Terminal' },
          { value: 'ledger', title: 'Ledger' },
          { value: 'field-guide', title: 'Field Guide' },
        ],
        dynamicTitle: true,
      },
    },
    mode: {
      description: 'Material color scheme',
      toolbar: {
        title: 'Mode',
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
    brand: 'instruments',
    mode: 'light',
  },
  decorators: [
    (story, context) => {
      const brand = context.globals['brand'] ?? 'instruments';
      const isDark = context.globals['mode'] === 'dark';
      for (const root of [document.documentElement, document.body]) {
        for (const candidate of BRANDS) {
          root.classList.toggle(
            `theme-${candidate}`,
            candidate !== 'instruments' && candidate === brand
          );
        }
        root.classList.toggle('dark', isDark);
      }
      return story();
    },
  ],
};

export default preview;
