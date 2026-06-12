import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { BehaviorSubject } from 'rxjs';

import { AppShellComponent } from './app-shell.component';
import { ShellNavItem, ShellPreset } from './shell-model';
import {
  ShellRailFooterDirective,
  ShellToolbarActionsDirective,
} from './shell-slots';

/** Stand-in for the CDK observer so handset state is test-controlled. */
class FakeBreakpointObserver {
  readonly state = new BehaviorSubject({
    matches: false,
    breakpoints: {} as Record<string, boolean>,
  });

  observe() {
    return this.state.asObservable();
  }

  setHandset(matches: boolean) {
    this.state.next({ matches, breakpoints: {} });
  }
}

const NAV: readonly ShellNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/reports', label: 'Invoices', icon: 'table_chart', exact: true },
  { path: '/reports/customers', label: 'Customers' },
];

@Component({
  imports: [AppShellComponent, ShellToolbarActionsDirective],
  template: `
    <m3k-app-shell [preset]="preset" [nav]="nav" [title]="title">
      <ng-template m3kShellToolbarActions>
        <button type="button" class="probe-actions">Theme</button>
      </ng-template>
      <p class="probe-content">Projected invoices view</p>
    </m3k-app-shell>
  `,
})
class HostComponent {
  preset: ShellPreset = 'sidenav';
  nav: readonly ShellNavItem[] = NAV;
  title = 'demo-reporting';
}

@Component({
  imports: [
    AppShellComponent,
    ShellToolbarActionsDirective,
    ShellRailFooterDirective,
  ],
  template: `
    <m3k-app-shell preset="contents-rail" [nav]="nav" title="Ledger">
      <ng-template m3kShellToolbarActions>
        <button type="button" class="probe-actions">Theme</button>
      </ng-template>
      <ng-template m3kShellRailFooter>
        <span class="probe-rail-footer">Edition note</span>
      </ng-template>
      <p class="probe-content">Projected view</p>
    </m3k-app-shell>
  `,
})
class RailFooterHostComponent {
  nav: readonly ShellNavItem[] = NAV;
}

@Component({
  imports: [AppShellComponent],
  template: `
    <m3k-app-shell [preset]="preset" [nav]="nav" title="Bare">
      <p class="probe-content">Bare content</p>
    </m3k-app-shell>
  `,
})
class BareHostComponent {
  preset: ShellPreset = 'sidenav';
  nav: readonly ShellNavItem[] = [];
}

describe('AppShellComponent', () => {
  let breakpoints: FakeBreakpointObserver;

  beforeEach(() => {
    breakpoints = new FakeBreakpointObserver();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideNoopAnimations(),
        { provide: BreakpointObserver, useValue: breakpoints },
      ],
    });
  });

  function mount<T>(component: { new (): T }): ComponentFixture<T> {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture;
  }

  const element = (fixture: ComponentFixture<unknown>): HTMLElement =>
    fixture.nativeElement as HTMLElement;

  async function navigate(fixture: ComponentFixture<unknown>, url: string) {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
  }

  describe('sidenav preset (default)', () => {
    it('renders the toolbar title and one nav row per item', () => {
      const fixture = mount(HostComponent);
      const el = element(fixture);

      expect(el.querySelector('mat-toolbar span')?.textContent).toContain(
        'demo-reporting',
      );
      const rows = Array.from(
        el.querySelectorAll('mat-nav-list a [matListItemTitle]'),
      ).map((row) => row.textContent?.trim());
      expect(rows).toEqual(['Dashboard', 'Invoices', 'Customers']);
    });

    it('renders icons only for items that declare one', () => {
      const fixture = mount(HostComponent);
      const links = element(fixture).querySelectorAll('mat-nav-list a');

      expect(links[0].querySelector('mat-icon')?.textContent?.trim()).toBe(
        'dashboard',
      );
      expect(links[2].querySelector('mat-icon')).toBeNull();
    });

    it('projects the default content into the content area', () => {
      const fixture = mount(HostComponent);
      expect(
        element(fixture).querySelector('.app-content .probe-content')
          ?.textContent,
      ).toContain('Projected invoices view');
    });

    it('stamps the toolbar-actions template at the toolbar end', () => {
      const fixture = mount(HostComponent);
      expect(
        element(fixture).querySelector('mat-toolbar .probe-actions'),
      ).toBeTruthy();
    });

    it('marks the active route with aria-current="page"', async () => {
      const fixture = mount(HostComponent);
      await navigate(fixture, '/dashboard');

      const active = element(fixture).querySelector(
        'mat-nav-list a[aria-current="page"]',
      );
      expect(active?.textContent).toContain('Dashboard');
    });

    it('treats exact as opt-in: a prefix link stays active on child routes', async () => {
      const fixture = mount(HostComponent);
      await navigate(fixture, '/reports/customers');

      const activeTitles = () =>
        Array.from(
          element(fixture).querySelectorAll(
            'mat-nav-list a[aria-current="page"] [matListItemTitle]',
          ),
        ).map((title) => title.textContent?.trim());
      // '/reports' has exact: true so it must NOT match the child route;
      // '/reports/customers' (exact omitted -> false) matches itself.
      expect(activeTitles()).toEqual(['Customers']);

      await navigate(fixture, '/reports');
      expect(activeTitles()).toEqual(['Invoices']);
    });

    it('docks the sidenav open at desktop width with no hamburger', () => {
      const fixture = mount(HostComponent);
      const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
        .componentInstance as MatSidenav;

      expect(sidenav.mode).toBe('side');
      expect(sidenav.opened).toBe(true);
      expect(element(fixture).querySelector('.nav-toggle')).toBeNull();
    });

    it('switches to a closed over-mode overlay with a hamburger at handset width', () => {
      const fixture = mount(HostComponent);
      breakpoints.setHandset(true);
      fixture.detectChanges();

      const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
        .componentInstance as MatSidenav;
      expect(sidenav.mode).toBe('over');
      expect(sidenav.opened).toBe(false);
      expect(element(fixture).querySelector('.nav-toggle')).toBeTruthy();
    });

    it('closes the overlay when a nav link is activated at handset width', async () => {
      const fixture = mount(HostComponent);
      breakpoints.setHandset(true);
      fixture.detectChanges();

      const sidenav = fixture.debugElement.query(By.directive(MatSidenav))
        .componentInstance as MatSidenav;
      sidenav.open();
      fixture.detectChanges();
      expect(sidenav.opened).toBe(true);

      element(fixture)
        .querySelector<HTMLAnchorElement>('mat-nav-list a')
        ?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(sidenav.opened).toBe(false);
    });
  });

  describe('preset switching at runtime', () => {
    it('re-renders the chrome per preset and keeps the projected content', () => {
      const fixture = mount(HostComponent);
      const host = fixture.componentInstance;
      const el = element(fixture);

      expect(el.querySelector('mat-sidenav-container.app-container')).toBeTruthy();

      host.preset = 'command-bar';
      fixture.detectChanges();
      expect(el.querySelector('mat-sidenav-container')).toBeNull();
      expect(el.querySelector('header.command-bar')).toBeTruthy();
      expect(el.querySelector('footer.command-footline')).toBeTruthy();
      expect(el.querySelector('.command-content .probe-content')).toBeTruthy();

      host.preset = 'contents-rail';
      fixture.detectChanges();
      expect(el.querySelector('header.command-bar')).toBeNull();
      expect(el.querySelector('mat-sidenav-container.rail-container')).toBeTruthy();
      expect(el.querySelector('.rail-content .probe-content')).toBeTruthy();

      host.preset = 'pill-tabs';
      fixture.detectChanges();
      expect(el.querySelector('mat-sidenav-container')).toBeNull();
      expect(el.querySelector('mat-toolbar.pill-toolbar')).toBeTruthy();
      expect(el.querySelector('.pill-content .probe-content')).toBeTruthy();
    });
  });

  describe('command-bar preset', () => {
    it('renders the prompt, ./ prefixed nav links, and the status footline', () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'command-bar';
      fixture.detectChanges();
      const el = element(fixture);

      expect(el.querySelector('.command-caret')?.textContent).toBe('~$');
      expect(el.querySelector('.command-title')?.textContent).toBe(
        'demo-reporting',
      );
      const links = Array.from(el.querySelectorAll('.command-nav a'));
      expect(links).toHaveLength(3);
      expect(links[0].querySelector('.command-pre')?.textContent).toBe('./');
      expect(el.querySelector('.command-footline')?.textContent).toContain(
        'sync ok',
      );
    });

    it('stamps the toolbar-actions template in the bordered controls cell', () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'command-bar';
      fixture.detectChanges();

      expect(
        element(fixture).querySelector('.command-controls .probe-actions'),
      ).toBeTruthy();
    });
  });

  describe('contents-rail preset', () => {
    it('renders the masthead and folio-numbered contents nav', () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'contents-rail';
      fixture.detectChanges();
      const el = element(fixture);

      expect(el.querySelector('.rail-masthead')?.textContent).toBe(
        'demo-reporting',
      );
      const folios = Array.from(el.querySelectorAll('.rail-folio')).map(
        (folio) => folio.textContent,
      );
      expect(folios).toEqual(['01', '02', '03']);
    });

    it('falls back to the toolbar-actions template in the rail foot', () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'contents-rail';
      fixture.detectChanges();

      expect(
        element(fixture).querySelector('.rail-foot .probe-actions'),
      ).toBeTruthy();
    });

    it('prefers the rail-footer template over toolbar actions when provided', () => {
      const fixture = mount(RailFooterHostComponent);
      const el = element(fixture);

      expect(el.querySelector('.rail-foot .probe-rail-footer')).toBeTruthy();
      expect(el.querySelector('.rail-foot .probe-actions')).toBeNull();
    });

    it('overlays closed with a hamburger at handset width', () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'contents-rail';
      breakpoints.setHandset(true);
      fixture.detectChanges();

      const rail = fixture.debugElement.query(By.directive(MatSidenav))
        .componentInstance as MatSidenav;
      expect(rail.mode).toBe('over');
      expect(rail.opened).toBe(false);
      expect(element(fixture).querySelector('.nav-toggle')).toBeTruthy();
    });

    it('closes the rail overlay when a nav link is activated at handset width', async () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'contents-rail';
      breakpoints.setHandset(true);
      fixture.detectChanges();

      const rail = fixture.debugElement.query(By.directive(MatSidenav))
        .componentInstance as MatSidenav;
      rail.open();
      fixture.detectChanges();

      element(fixture)
        .querySelector<HTMLAnchorElement>('.rail-nav a')
        ?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(rail.opened).toBe(false);
    });
  });

  describe('pill-tabs preset', () => {
    it('renders the title, centered pill nav, and end-aligned controls', () => {
      const fixture = mount(HostComponent);
      fixture.componentInstance.preset = 'pill-tabs';
      fixture.detectChanges();
      const el = element(fixture);

      expect(el.querySelector('.pill-title')?.textContent).toBe(
        'demo-reporting',
      );
      const labels = Array.from(el.querySelectorAll('.pill-nav a')).map(
        (a) => a.textContent?.trim(),
      );
      expect(labels).toEqual(['Dashboard', 'Invoices', 'Customers']);
      expect(el.querySelector('.pill-controls .probe-actions')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('renders an empty nav region without errors', () => {
      const fixture = mount(BareHostComponent);
      const el = element(fixture);

      expect(el.querySelectorAll('mat-nav-list a')).toHaveLength(0);
      expect(el.querySelector('.probe-content')?.textContent).toContain(
        'Bare content',
      );
    });

    it('renders each controls position empty when no slot is projected', () => {
      const fixture = mount(BareHostComponent);
      const host = fixture.componentInstance;
      const el = element(fixture);

      host.preset = 'command-bar';
      fixture.detectChanges();
      expect(el.querySelector('.command-controls')?.children).toHaveLength(0);

      host.preset = 'contents-rail';
      fixture.detectChanges();
      expect(el.querySelector('.rail-foot')?.children).toHaveLength(0);

      host.preset = 'pill-tabs';
      fixture.detectChanges();
      expect(el.querySelector('.pill-controls')?.children).toHaveLength(0);
    });
  });
});
