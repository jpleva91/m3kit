import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

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
export type ThemeMode = 'light' | 'dark';

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

interface ThemeState {
  brand: ThemeBrand;
  mode: ThemeMode;
}

/**
 * Manages the active brand theme and color mode. Instruments is the default
 * brand and is applied to `html` with no brand class; alternate brands add a
 * `theme-<brand>` class, and dark mode adds the `dark` class. Each class
 * scope re-emits the M3 system tokens (see styles/_theme.scss).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _brand = signal<ThemeBrand>('instruments');
  private readonly _mode = signal<ThemeMode>('light');

  /** Currently active brand. */
  readonly brand = this._brand.asReadonly();

  /** Currently active color mode. */
  readonly mode = this._mode.asReadonly();

  constructor() {
    const initial = this.resolveInitialState();
    this._brand.set(initial.brand);
    this._mode.set(initial.mode);
    this.applyState(initial);
  }

  /** Switches between light and dark mode for the active brand. */
  toggleMode(): void {
    this.setMode(this._mode() === 'dark' ? 'light' : 'dark');
  }

  /** Sets the color mode, persists it, and updates the root element. */
  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    this.persistAndApply();
  }

  /** Sets the brand, persists it, and updates the root element. */
  setBrand(brand: ThemeBrand): void {
    this._brand.set(brand);
    this.persistAndApply();
  }

  private persistAndApply(): void {
    const state: ThemeState = { brand: this._brand(), mode: this._mode() };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(state));
    this.applyState(state);
  }

  /**
   * Applies the class scheme: `theme-<brand>` for alternate brands
   * (Instruments, the default, carries no brand class) plus `dark`.
   */
  private applyState(state: ThemeState): void {
    const root = this.document.documentElement;
    for (const brand of THEME_BRANDS) {
      root.classList.toggle(
        `theme-${brand}`,
        brand !== 'instruments' && brand === state.brand
      );
    }
    root.classList.toggle('dark', state.mode === 'dark');
  }

  private resolveInitialState(): ThemeState {
    const stored = this.readStoredState();
    if (stored) {
      return stored;
    }
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches;
    return { brand: 'instruments', mode: prefersDark ? 'dark' : 'light' };
  }

  private readStoredState(): ThemeState | null {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<ThemeState>;
      if (
        THEME_BRANDS.includes(parsed.brand as ThemeBrand) &&
        (parsed.mode === 'light' || parsed.mode === 'dark')
      ) {
        return { brand: parsed.brand as ThemeBrand, mode: parsed.mode };
      }
    } catch {
      // Fall through to legacy handling below.
    }
    // Legacy value: a bare 'light' | 'dark' string from the single-brand era.
    if (raw === 'light' || raw === 'dark') {
      return { brand: 'instruments', mode: raw };
    }
    return null;
  }
}
