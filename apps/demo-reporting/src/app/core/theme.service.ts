import { Injectable, inject } from '@angular/core';
import { createThemeStore, type ThemeMode } from '@m3kit/state';

export type ThemeBrand =
  | 'instruments'
  | 'terminal'
  | 'ledger'
  | 'field-guide'
  | 'carbon'
  | 'brutalist'
  | 'meadow'
  | 'beacon'
  | 'noir'
  | 'pop'
  | 'gazette'
  | 'synth';

export type { ThemeMode } from '@m3kit/state';

export const THEME_BRANDS: readonly ThemeBrand[] = [
  'instruments',
  'terminal',
  'ledger',
  'field-guide',
  'carbon',
  'brutalist',
  'meadow',
  'beacon',
  'noir',
  'pop',
  'gazette',
  'synth',
];

const THEME_STORAGE_KEY = 'demo-reporting.theme';

/**
 * Root-provided `@m3kit/state` theme store configured with the demo's
 * twelve brands. Restores the persisted preference (validating brands,
 * migrating legacy bare-mode values, falling back to
 * `prefers-color-scheme`) and keeps `localStorage` plus the `<html>`
 * class list in sync reactively.
 */
const ThemeStore = createThemeStore<ThemeBrand>({
  brands: THEME_BRANDS,
  defaultBrand: 'instruments',
  storageKey: THEME_STORAGE_KEY,
});

/**
 * Manages the active brand theme and color mode. Instruments is the default
 * brand and is applied to `html` with no brand class; alternate brands add a
 * `theme-<brand>` class, and dark mode adds the `dark` class. Each class
 * scope re-emits the M3 system tokens (see styles/_theme.scss).
 *
 * Thin facade over `createThemeStore` from `@m3kit/state`; the public
 * surface (`brand()`, `mode()`, `setBrand`, `setMode`, `toggleMode`) is
 * unchanged from the pre-store implementation.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(ThemeStore);

  /** Currently active brand. */
  readonly brand = this.store.brand;

  /** Currently active color mode. */
  readonly mode = this.store.mode;

  /** Switches between light and dark mode for the active brand. */
  toggleMode(): void {
    this.store.toggleMode();
  }

  /** Sets the color mode; persistence and the root classes follow reactively. */
  setMode(mode: ThemeMode): void {
    this.store.setMode(mode);
  }

  /** Sets the brand; persistence and the root classes follow reactively. */
  setBrand(brand: ThemeBrand): void {
    this.store.setBrand(brand);
  }
}
