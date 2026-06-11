import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppShellComponent } from './app-shell.component';
import { ShellNavItem, ShellPreset } from './shell-model';
import {
  ShellRailFooterDirective,
  ShellToolbarActionsDirective,
} from './shell-slots';

const NAV: readonly ShellNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/reports', label: 'Invoices', icon: 'table_chart', exact: true },
  { path: '/reports/customers', label: 'Customers', icon: 'group' },
];

@Component({
  imports: [
    AppShellComponent,
    ShellToolbarActionsDirective,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <rpt-app-shell [preset]="preset" [nav]="nav" title="demo-reporting">
      <ng-template rptShellToolbarActions>
        <button
          mat-icon-button
          type="button"
          class="probe-actions"
          aria-label="Switch to dark mode"
        >
          <mat-icon>dark_mode</mat-icon>
        </button>
      </ng-template>
      <p class="probe-content">Projected invoices view</p>
    </rpt-app-shell>
  `,
})
class ShellHostComponent {
  preset: ShellPreset = 'sidenav';
  nav: readonly ShellNavItem[] = NAV;
}

@Component({
  imports: [
    AppShellComponent,
    ShellToolbarActionsDirective,
    ShellRailFooterDirective,
  ],
  template: `
    <rpt-app-shell preset="contents-rail" [nav]="nav" title="Ledger">
      <ng-template rptShellToolbarActions>
        <button type="button" class="probe-actions">Theme</button>
      </ng-template>
      <ng-template rptShellRailFooter>
        <span class="probe-rail-footer">Edition note</span>
      </ng-template>
      <p class="probe-content">Projected view</p>
    </rpt-app-shell>
  `,
})
class RailFooterHostComponent {
  nav: readonly ShellNavItem[] = NAV;
}

function mountShell(preset: ShellPreset) {
  return cy.mount(ShellHostComponent, {
    componentProperties: { preset },
    providers: [
      // Catch-all componentless route so nav clicks resolve without the
      // consumer's route table (the shell never owns routing).
      provideRouter([{ path: '**', children: [] }]),
      provideNoopAnimations(),
    ],
  });
}

describe(AppShellComponent.name, () => {
  describe('sidenav preset (desktop)', () => {
    beforeEach(() => cy.viewport(1280, 800));

    it('renders the toolbar, docked nav list, projected content, and actions', () => {
      mountShell('sidenav');
      cy.get('mat-toolbar').should('contain.text', 'demo-reporting');
      cy.get('mat-sidenav').should('be.visible');
      cy.get('mat-nav-list a').should('have.length', 3);
      cy.get('mat-nav-list a mat-icon').first().should('contain.text', 'dashboard');
      cy.get('.app-content .probe-content').should('be.visible');
      cy.get('mat-toolbar .probe-actions').should('be.visible');
      cy.get('.nav-toggle').should('not.exist');
    });

    it('marks the clicked nav link active with aria-current="page"', () => {
      mountShell('sidenav');
      cy.contains('mat-nav-list a', 'Invoices').click();
      cy.contains('mat-nav-list a', 'Invoices')
        .should('have.attr', 'aria-current', 'page')
        .and('have.class', 'active-link');
      cy.contains('mat-nav-list a', 'Dashboard').should(
        'not.have.attr',
        'aria-current',
      );
    });
  });

  describe('sidenav preset (handset)', () => {
    beforeEach(() => cy.viewport(600, 800));

    it('overlays closed with a hamburger; toggles open; closes on navigate', () => {
      mountShell('sidenav');
      cy.get('.nav-toggle').should('be.visible');
      cy.get('mat-sidenav').should('not.be.visible');

      cy.get('.nav-toggle').click();
      cy.get('mat-sidenav').should('be.visible');

      cy.contains('mat-nav-list a', 'Customers').click();
      cy.get('mat-sidenav').should('not.be.visible');
    });
  });

  describe('command-bar preset', () => {
    it('renders the prompt, inline nav, controls cell, and footline', () => {
      cy.viewport(1280, 800);
      mountShell('command-bar');
      cy.get('.command-caret').should('have.text', '~$');
      cy.get('.command-title').should('have.text', 'demo-reporting');
      cy.get('.command-nav a').should('have.length', 3);
      cy.get('.command-nav a .command-pre').first().should('have.text', './');
      cy.get('.command-controls .probe-actions').should('be.visible');
      cy.get('.command-footline').should('contain.text', 'sync ok');
      cy.get('.command-content .probe-content').should('be.visible');
    });

    it('marks the active inline nav link', () => {
      cy.viewport(1280, 800);
      mountShell('command-bar');
      cy.contains('.command-nav a', 'Dashboard').click();
      cy.contains('.command-nav a', 'Dashboard')
        .should('have.attr', 'aria-current', 'page')
        .and('have.class', 'active');
    });

    it('wraps the bar and keeps controls reachable at handset width', () => {
      cy.viewport(600, 800);
      mountShell('command-bar');
      cy.get('.command-bar').should('have.css', 'flex-wrap', 'wrap');
      cy.get('.command-controls .probe-actions').should('be.visible');
    });
  });

  describe('contents-rail preset', () => {
    it('renders the masthead, folio-numbered nav, and rail-foot actions', () => {
      cy.viewport(1280, 800);
      mountShell('contents-rail');
      cy.get('.rail-masthead').should('have.text', 'demo-reporting');
      cy.get('.rail-nav a').should('have.length', 3);
      cy.get('.rail-folio').first().should('have.text', '01');
      cy.get('.rail-foot .probe-actions').should('be.visible');
      cy.get('.rail-content .probe-content').should('be.visible');
    });

    it('prefers the rail-footer slot over toolbar actions in the rail foot', () => {
      cy.viewport(1280, 800);
      cy.mount(RailFooterHostComponent, {
        providers: [
          provideRouter([{ path: '**', children: [] }]),
          provideNoopAnimations(),
        ],
      });
      cy.get('.rail-foot .probe-rail-footer').should('be.visible');
      cy.get('.rail-foot .probe-actions').should('not.exist');
    });

    it('overlays closed with a hamburger and closes on navigate at handset width', () => {
      cy.viewport(600, 800);
      mountShell('contents-rail');
      cy.get('.nav-toggle').should('be.visible');
      cy.get('mat-sidenav.rail').should('not.be.visible');

      cy.get('.nav-toggle').click();
      cy.get('mat-sidenav.rail').should('be.visible');

      cy.contains('.rail-nav a', 'Invoices').click();
      cy.get('mat-sidenav.rail').should('not.be.visible');
    });
  });

  describe('pill-tabs preset', () => {
    it('renders the three-column toolbar with centered pill nav', () => {
      cy.viewport(1280, 800);
      mountShell('pill-tabs');
      cy.get('.pill-title').should('have.text', 'demo-reporting');
      cy.get('.pill-nav a').should('have.length', 3);
      cy.get('.pill-controls .probe-actions').should('be.visible');
      cy.get('.pill-content .probe-content').should('be.visible');
    });

    it('marks the active pill', () => {
      cy.viewport(1280, 800);
      mountShell('pill-tabs');
      cy.contains('.pill-nav a', 'Customers').click();
      cy.contains('.pill-nav a', 'Customers')
        .should('have.attr', 'aria-current', 'page')
        .and('have.class', 'active');
    });

    it('wraps to a stacked grid and keeps controls reachable at handset width', () => {
      cy.viewport(600, 800);
      mountShell('pill-tabs');
      cy.get('.pill-toolbar').should(
        'have.css',
        'grid-template-areas',
        '"title controls" "nav nav"',
      );
      cy.get('.pill-controls .probe-actions').should('be.visible');
      cy.get('.pill-nav a').should('have.length', 3).and('be.visible');
    });
  });
});
