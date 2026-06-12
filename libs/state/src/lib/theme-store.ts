import { DOCUMENT } from '@angular/common';
import { effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

/** Color mode of a theme. */
export type ThemeMode = 'light' | 'dark';

/** Persisted theme preference. */
export interface ThemeState<TBrand extends string> {
  brand: TBrand;
  mode: ThemeMode;
}

/** Configuration for `createThemeStore`. */
export interface ThemeStoreConfig<TBrand extends string> {
  /** All known brands; stored values outside this list are rejected. */
  readonly brands: readonly TBrand[];
  /** Brand applied when nothing valid is stored. */
  readonly defaultBrand: TBrand;
  /** `localStorage` key the preference is persisted under. */
  readonly storageKey: string;
  /**
   * When `true` (the default, matching the kit's theming scheme) the
   * default brand carries no `theme-<brand>` class on `<html>`; alternate
   * brands add one, and dark mode adds the `dark` class.
   */
  readonly classlessDefault?: boolean;
}

function prefersDark(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  } catch {
    return false;
  }
}

function readStoredState<TBrand extends string>(
  config: ThemeStoreConfig<TBrand>
): ThemeState<TBrand> | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(config.storageKey);
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ThemeState<TBrand>>;
    if (
      config.brands.includes(parsed.brand as TBrand) &&
      (parsed.mode === 'light' || parsed.mode === 'dark')
    ) {
      return { brand: parsed.brand as TBrand, mode: parsed.mode };
    }
  } catch {
    // Fall through to legacy handling below.
  }
  // Legacy value: a bare 'light' | 'dark' string from the single-brand era.
  if (raw === 'light' || raw === 'dark') {
    return { brand: config.defaultBrand, mode: raw };
  }
  return null;
}

function resolveInitialState<TBrand extends string>(
  config: ThemeStoreConfig<TBrand>
): ThemeState<TBrand> {
  return (
    readStoredState(config) ?? {
      brand: config.defaultBrand,
      mode: prefersDark() ? 'dark' : 'light',
    }
  );
}

function persistState<TBrand extends string>(
  config: ThemeStoreConfig<TBrand>,
  state: ThemeState<TBrand>
): void {
  try {
    localStorage.setItem(config.storageKey, JSON.stringify(state));
  } catch {
    // Storage unavailable (SSR, privacy mode): theming still applies.
  }
}

function applyState<TBrand extends string>(
  root: HTMLElement,
  config: ThemeStoreConfig<TBrand>,
  state: ThemeState<TBrand>
): void {
  const classlessDefault = config.classlessDefault ?? true;
  for (const brand of config.brands) {
    const isActive =
      brand === state.brand &&
      !(classlessDefault && brand === config.defaultBrand);
    root.classList.toggle(`theme-${brand}`, isActive);
  }
  root.classList.toggle('dark', state.mode === 'dark');
}

/**
 * Creates a root-provided SignalStore that owns the active brand theme and
 * color mode. API-compatible with the demo `ThemeService` surface:
 * `brand()`, `mode()`, `setBrand`, `setMode`, `toggleMode`.
 *
 * On init the store restores the persisted preference (validating against
 * `brands`, migrating legacy bare-mode values, falling back to
 * `prefers-color-scheme`), then a `withHooks`/`effect` pipeline keeps
 * `localStorage` and the `<html>` class list (`theme-<brand>` + `dark`)
 * in sync with every state change.
 *
 * ```ts
 * export const ThemeStore = createThemeStore({
 *   brands: ['instruments', 'terminal', 'ledger'] as const,
 *   defaultBrand: 'instruments',
 *   storageKey: 'my-app.theme',
 * });
 *
 * const theme = inject(ThemeStore);
 * theme.toggleMode();
 * ```
 */
export function createThemeStore<TBrand extends string>(
  config: ThemeStoreConfig<TBrand>
) {
  return signalStore(
    { providedIn: 'root' },
    withState<ThemeState<TBrand>>({
      brand: config.defaultBrand,
      mode: 'light',
    }),
    withMethods((store) => ({
      /** Sets the brand; persistence and DOM classes follow reactively. */
      setBrand(brand: TBrand): void {
        patchState(store, { brand });
      },
      /** Sets the color mode; persistence and DOM classes follow reactively. */
      setMode(mode: ThemeMode): void {
        patchState(store, { mode });
      },
      /** Switches between light and dark mode for the active brand. */
      toggleMode(): void {
        patchState(store, (state) => ({
          mode: state.mode === 'dark' ? ('light' as const) : ('dark' as const),
        }));
      },
    })),
    withHooks({
      onInit(store) {
        const documentRef = inject(DOCUMENT);
        patchState(store, resolveInitialState(config));
        effect(() => {
          const state: ThemeState<TBrand> = {
            brand: store.brand(),
            mode: store.mode(),
          };
          persistState(config, state);
          applyState(documentRef.documentElement, config, state);
        });
      },
    })
  );
}
