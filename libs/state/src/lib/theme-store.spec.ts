import { TestBed } from '@angular/core/testing';

import { createThemeStore } from './theme-store';

const STORAGE_KEY = 'm3kit-state.test-theme';
const BRANDS = ['instruments', 'terminal', 'ledger'] as const;
const BRAND_CLASSES = BRANDS.map((brand) => `theme-${brand}`);

const ThemeStore = createThemeStore({
  brands: BRANDS,
  defaultBrand: 'instruments',
  storageKey: STORAGE_KEY,
});

function createStore(): InstanceType<typeof ThemeStore> {
  TestBed.configureTestingModule({});
  const store = TestBed.inject(ThemeStore);
  TestBed.flushEffects();
  return store;
}

describe('createThemeStore', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('dark', ...BRAND_CLASSES);
  });

  it('defaults to the default brand in light mode and applies no brand class', () => {
    const store = createStore();
    expect(store.brand()).toBe('instruments');
    expect(store.mode()).toBe('light');
    BRAND_CLASSES.forEach((cls) =>
      expect(document.documentElement.classList.contains(cls)).toBe(false)
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('initializes from a stored preference and applies classes', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ brand: 'terminal', mode: 'dark' })
    );
    const store = createStore();
    expect(store.brand()).toBe('terminal');
    expect(store.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-terminal')).toBe(
      true
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('migrates a legacy bare-mode value to the default brand', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    const store = createStore();
    expect(store.brand()).toBe('instruments');
    expect(store.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('rejects stored values with unknown brands or modes', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ brand: 'not-a-brand', mode: 'dark' })
    );
    const store = createStore();
    expect(store.brand()).toBe('instruments');
  });

  it('rejects unparseable stored values', () => {
    localStorage.setItem(STORAGE_KEY, '{nope');
    const store = createStore();
    expect(store.brand()).toBe('instruments');
    expect(store.mode()).toBe('light');
  });

  it('toggleMode switches mode, persists it, and updates the root class', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ brand: 'instruments', mode: 'light' })
    );
    const store = createStore();

    store.toggleMode();
    TestBed.flushEffects();
    expect(store.mode()).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ brand: 'instruments', mode: 'dark' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    store.toggleMode();
    TestBed.flushEffects();
    expect(store.mode()).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setBrand swaps the brand class, persists, and keeps the mode', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ brand: 'terminal', mode: 'dark' })
    );
    const store = createStore();

    store.setBrand('ledger');
    TestBed.flushEffects();

    expect(store.brand()).toBe('ledger');
    expect(store.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-ledger')).toBe(
      true
    );
    expect(document.documentElement.classList.contains('theme-terminal')).toBe(
      false
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ brand: 'ledger', mode: 'dark' })
    );
  });

  it('setBrand back to the default removes all brand classes', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ brand: 'terminal', mode: 'light' })
    );
    const store = createStore();

    store.setBrand('instruments');
    TestBed.flushEffects();

    BRAND_CLASSES.forEach((cls) =>
      expect(document.documentElement.classList.contains(cls)).toBe(false)
    );
  });

  it('setMode sets an explicit mode', () => {
    const store = createStore();
    store.setMode('dark');
    TestBed.flushEffects();
    expect(store.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('honors classlessDefault: false by classing the default brand', () => {
    const ClassedStore = createThemeStore({
      brands: BRANDS,
      defaultBrand: 'instruments',
      storageKey: STORAGE_KEY,
      classlessDefault: false,
    });
    TestBed.configureTestingModule({});
    TestBed.inject(ClassedStore);
    TestBed.flushEffects();

    expect(
      document.documentElement.classList.contains('theme-instruments')
    ).toBe(true);
  });
});
