import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'demo-reporting.theme';

/**
 * Manages the active Material theme. The light theme is applied to `html`
 * globally; dark mode is activated by adding the `dark` class to the root
 * element, which re-emits the M3 color system tokens (see styles/_theme.scss).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _theme = signal<ThemeMode>(this.resolveInitialTheme());

  /** Currently active theme. */
  readonly theme = this._theme.asReadonly();

  constructor() {
    this.applyTheme(this._theme());
  }

  /** Switches between light and dark mode. */
  toggle(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }

  /** Sets the theme, persists it, and updates the root element class. */
  setTheme(theme: ThemeMode): void {
    this._theme.set(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode): void {
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private resolveInitialTheme(): ThemeMode {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
