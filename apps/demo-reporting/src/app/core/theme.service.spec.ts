import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const THEME_STORAGE_KEY = 'demo-reporting.theme';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');
  });

  function create(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  it('initializes from a stored preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const service = create();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggle switches the theme, persists it, and updates the root class', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const service = create();

    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.toggle();
    expect(service.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('falls back to the system preference when nothing is stored', () => {
    // JSDOM does not implement matchMedia; define it for this test.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    const service = create();
    expect(service.theme()).toBe('dark');
    delete (window as { matchMedia?: unknown }).matchMedia;
  });
});
