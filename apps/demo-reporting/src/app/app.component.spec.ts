import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(appRoutes), provideNoopAnimations()],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
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
    expect(localStorage.getItem('demo-reporting.theme')).toBe('dark');
    expect(toggle?.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'light_mode'
    );

    toggle?.click();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('demo-reporting.theme')).toBe('light');
  });
});
