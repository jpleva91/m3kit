import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

import { BreadcrumbItem } from '../breadcrumbs/breadcrumb-item';
import {
  ListPageComponent,
  ListPagePrimaryAction,
} from './list-page.component';

const TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Reports', path: '/reports' },
  { label: 'Invoices' },
];

@Component({
  imports: [ListPageComponent],
  template: `
    <m3k-list-page
      title="Invoices"
      description="Billing period June 2026"
      [breadcrumbs]="breadcrumbs"
      [primaryAction]="primaryAction"
      [empty]="empty"
      (primaryActionClick)="onPrimaryAction()"
    >
      <div m3kListPageToolbar class="probe-toolbar">
        Status: overdue · Issued: Q2 2026
      </div>
      <ul class="probe-content">
        <li>INV-2041 — Acme Manufacturing — USD 12,480.00</li>
        <li>INV-2057 — Northwind Traders — USD 1,265.40</li>
      </ul>
      <div m3kListPageEmpty class="probe-empty">
        No invoices match the current filters.
      </div>
    </m3k-list-page>
  `,
})
class ListPageHostComponent {
  breadcrumbs: readonly BreadcrumbItem[] = TRAIL;
  primaryAction: ListPagePrimaryAction | undefined = {
    label: 'New invoice',
    icon: 'add',
  };
  empty = false;

  onPrimaryAction(): void {
    // Spied on in tests.
  }
}

function mountListPage(empty = false) {
  return cy.mount(ListPageHostComponent, {
    componentProperties: { empty },
    providers: [provideRouter([{ path: '**', children: [] }])],
  });
}

describe(ListPageComponent.name, () => {
  it('renders the header chrome and projects toolbar and content', () => {
    mountListPage();
    cy.get('h1').should('have.text', 'Invoices');
    cy.get('nav[aria-label="Breadcrumb"] li').should('have.length', 2);
    cy.get('.probe-toolbar').should('contain.text', 'Status: overdue');
    cy.get('.probe-content').should('contain.text', 'INV-2041');
    cy.get('.probe-empty').should('not.exist');
  });

  it('emits (primaryActionClick) when the header button is clicked', () => {
    mountListPage().then(({ component }) => {
      cy.spy(component, 'onPrimaryAction').as('primaryAction');
    });

    cy.get('.m3k-list-page__primary-action')
      .should('contain.text', 'New invoice')
      .find('mat-icon')
      .should('contain.text', 'add');
    cy.get('.m3k-list-page__primary-action').click();
    cy.get('@primaryAction').should('have.been.calledOnce');
  });

  it('shows the empty slot instead of content while empty', () => {
    mountListPage(true);
    cy.get('.probe-empty').should(
      'contain.text',
      'No invoices match the current filters.',
    );
    cy.get('.probe-content').should('not.exist');
    // The toolbar stays: the filters may be why the list is empty.
    cy.get('.probe-toolbar').should('be.visible');
  });
});
