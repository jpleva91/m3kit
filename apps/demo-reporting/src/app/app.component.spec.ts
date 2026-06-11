import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { ThemeService } from './core/theme.service';

describe('AppComponent', () => {
  const BRAND_CLASSES = [
    'theme-instruments',
    'theme-terminal',
    'theme-ledger',
    'theme-field-guide',
  ];

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', ...BRAND_CLASSES);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(appRoutes), provideNoopAnimations()],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', ...BRAND_CLASSES);
  });

  it('should render the toolbar title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar span')?.textContent).toContain(
      'demo-reporting'
    );
  });

  it('should render the Dashboard, Invoices, and Customers nav items', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navItems = Array.from(
      compiled.querySelectorAll('mat-nav-list a [matListItemTitle]')
    ).map((item) => item.textContent?.trim());
    expect(navItems).toEqual(['Dashboard', 'Invoices', 'Customers']);
  });

  it(`should have as title 'demo-reporting'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('demo-reporting');
  });

  it('should render a theme toggle button showing the dark_mode icon by default', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector('mat-toolbar button.theme-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'dark_mode'
    );
  });

  it('should render a brand switcher that applies the selected brand class', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const switcher = compiled.querySelector<HTMLButtonElement>(
      'mat-toolbar button.brand-switcher'
    );
    expect(switcher).toBeTruthy();

    switcher?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const items = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')
    );
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      'checkInstruments',
      'Terminal',
      'Ledger',
      'Field Guide',
    ]);

    items[1].click();
    fixture.detectChanges();

    expect(
      document.documentElement.classList.contains('theme-terminal')
    ).toBe(true);
    expect(
      JSON.parse(localStorage.getItem('demo-reporting.theme') ?? '{}')
    ).toEqual({ brand: 'terminal', mode: 'light' });
  });

  it('should switch to the command-bar layout preset for the terminal brand', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Default brand (instruments) renders the sidenav shell.
    expect(compiled.querySelector('mat-sidenav-container')).toBeTruthy();
    expect(compiled.querySelector('header.command-bar')).toBeNull();

    TestBed.inject(ThemeService).setBrand('terminal');
    fixture.detectChanges();

    expect(compiled.querySelector('mat-sidenav-container')).toBeNull();
    expect(compiled.querySelector('header.command-bar')).toBeTruthy();
    expect(compiled.querySelector('footer.command-footline')).toBeTruthy();
  });

  it('should toggle dark mode on the root element and persist it', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const toggle = compiled.querySelector<HTMLButtonElement>(
      'mat-toolbar button.theme-toggle'
    );

    toggle?.click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('demo-reporting.theme')).toBe(
      JSON.stringify({ brand: 'instruments', mode: 'dark' })
    );
    expect(toggle?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'light_mode'
    );

    toggle?.click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('demo-reporting.theme')).toBe(
      JSON.stringify({ brand: 'instruments', mode: 'light' })
    );
  });
});
