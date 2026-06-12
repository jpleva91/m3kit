import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const THEME_STORAGE_KEY = 'demo-reporting.theme';
const BRAND_CLASSES = [
  'theme-instruments',
  'theme-terminal',
  'theme-ledger',
  'theme-field-guide',
  'theme-carbon',
  'theme-brutalist',
  'theme-meadow',
  'theme-beacon',
  'theme-noir',
  'theme-pop',
  'theme-gazette',
  'theme-synth',
];

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark', ...BRAND_CLASSES);
  });

  function create(): ThemeService {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ThemeService);
    // Persistence and DOM classes now flow through a store effect.
    TestBed.flushEffects();
    return service;
  }

  /** Runs a mutation and flushes the store's persist/apply effect. */
  function apply(mutate: () => void): void {
    mutate();
    TestBed.flushEffects();
  }

  it('initializes from a stored preference', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ brand: 'terminal', mode: 'dark' })
    );
    const service = create();
    expect(service.brand()).toBe('terminal');
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('theme-terminal')).toBe(
      true
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('migrates a legacy bare-mode value to the default brand', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const service = create();
    expect(service.brand()).toBe('instruments');
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggleMode switches the mode, persists it, and updates the root class', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ brand: 'instruments', mode: 'light' })
    );
    const service = create();

    apply(() => service.toggleMode());
    expect(service.mode()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(
      JSON.stringify({ brand: 'instruments', mode: 'dark' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    apply(() => service.toggleMode());
    expect(service.mode()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(
      JSON.stringify({ brand: 'instruments', mode: 'light' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setBrand applies the brand class, persists it, and keeps the mode', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ brand: 'instruments', mode: 'dark' })
    );
    const service = create();

    apply(() => service.setBrand('ledger'));
    expect(service.brand()).toBe('ledger');
    expect(service.mode()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(
      JSON.stringify({ brand: 'ledger', mode: 'dark' })
    );
    expect(document.documentElement.classList.contains('theme-ledger')).toBe(
      true
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    apply(() => service.setBrand('field-guide'));
    expect(
      document.documentElement.classList.contains('theme-field-guide')
    ).toBe(true);
    expect(document.documentElement.classList.contains('theme-ledger')).toBe(
      false
    );
  });

  it('applies the brand class for a newly registered brand (carbon)', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ brand: 'instruments', mode: 'light' })
    );
    const service = create();

    apply(() => service.setBrand('carbon'));
    expect(service.brand()).toBe('carbon');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(
      JSON.stringify({ brand: 'carbon', mode: 'light' })
    );
    expect(document.documentElement.classList.contains('theme-carbon')).toBe(
      true
    );
  });

  it('applies no brand class for instruments, the default brand', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ brand: 'terminal', mode: 'light' })
    );
    const service = create();

    apply(() => service.setBrand('instruments'));
    for (const brandClass of BRAND_CLASSES) {
      expect(document.documentElement.classList.contains(brandClass)).toBe(
        false
      );
    }
  });

  it('ignores invalid stored values and falls back to defaults', () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ brand: 'neon', mode: 'sideways' })
    );
    const service = create();
    expect(service.brand()).toBe('instruments');
    expect(service.mode()).toBe('light');
  });

  it('falls back to the system preference when nothing is stored', () => {
    // JSDOM does not implement matchMedia; define it for this test.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const service = create();
    expect(service.brand()).toBe('instruments');
    expect(service.mode()).toBe('dark');
    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});
