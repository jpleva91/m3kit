import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { EmptyStateComponent } from './empty-state.component';

@Component({
  imports: [EmptyStateComponent],
  template: `
    <m3k-empty-state
      icon="receipt_long"
      title="No invoices yet"
      description="Invoices you issue will appear here."
    >
      <button m3kEmptyStateActions type="button" data-cy="cta">New invoice</button>
    </m3k-empty-state>
  `,
})
class EmptyStateHostComponent {}

describe(EmptyStateComponent.name, () => {
  it('renders the icon, title, and description', () => {
    cy.mount(EmptyStateHostComponent, {
      providers: [provideNoopAnimations()],
    });
    cy.get('.m3k-empty-state__icon mat-icon').should('have.text', 'receipt_long');
    cy.get('h3.m3k-empty-state__title').should('have.text', 'No invoices yet');
    cy.get('.m3k-empty-state__description').should(
      'have.text',
      'Invoices you issue will appear here.',
    );
  });

  it('projects actions into the actions slot', () => {
    cy.mount(EmptyStateHostComponent, {
      providers: [provideNoopAnimations()],
    });
    cy.get('.m3k-empty-state__actions [data-cy="cta"]').should('have.text', 'New invoice');
  });

  it('omits the description element when not provided', () => {
    cy.mount(EmptyStateComponent, {
      componentProperties: { title: 'Nothing here' },
      providers: [provideNoopAnimations()],
    });
    cy.get('h3.m3k-empty-state__title').should('have.text', 'Nothing here');
    cy.get('.m3k-empty-state__description').should('not.exist');
    cy.get('.m3k-empty-state__icon mat-icon').should('have.text', 'inbox');
  });
});
