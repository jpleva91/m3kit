import { Component, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ErrorStateComponent } from './error-state.component';

@Component({
  imports: [ErrorStateComponent],
  template: `
    <m3k-error-state
      title="Could not load invoices"
      description="The invoice list did not respond."
      details="GET /api/invoices -> 503 Service Unavailable"
      (retry)="retries.set(retries() + 1)"
    />
  `,
})
class ErrorStateHostComponent {
  readonly retries = signal(0);
}

@Component({
  imports: [ErrorStateComponent],
  template: `
    <m3k-error-state title="Could not save customer">
      <button m3kErrorStateActions type="button" data-cy="custom-action">Reload record</button>
    </m3k-error-state>
  `,
})
class ProjectingErrorStateHostComponent {}

describe(ErrorStateComponent.name, () => {
  it('renders the title, description, and collapsed technical details', () => {
    cy.mount(ErrorStateHostComponent, {
      providers: [provideNoopAnimations()],
    });
    cy.get('h3.m3k-error-state__title').should('have.text', 'Could not load invoices');
    cy.get('.m3k-error-state__description').should(
      'have.text',
      'The invoice list did not respond.',
    );
    cy.get('details.m3k-error-state__details').should('not.have.attr', 'open');
    // Chromium renders closed-<details> content via `content-visibility:
    // hidden`, which Cypress's `not.be.visible` does not recognize as
    // hidden — `Element.checkVisibility()` does.
    cy.get('.m3k-error-state__details-text').should(($pre) => {
      expect($pre[0].checkVisibility()).to.equal(false);
    });

    cy.get('.m3k-error-state__details-summary').click();
    cy.get('.m3k-error-state__details-text')
      .should('be.visible')
      .and('have.text', 'GET /api/invoices -> 503 Service Unavailable');
  });

  it('emits retry when the default Try again button is clicked', () => {
    cy.mount(ErrorStateHostComponent, {
      providers: [provideNoopAnimations()],
    }).then(({ component }) => {
      cy.get('.m3k-error-state__retry').should('contain.text', 'Try again').click();
      cy.then(() => {
        expect(component.retries()).to.equal(1);
      });
    });
  });

  it('replaces the default retry button with projected actions', () => {
    cy.mount(ProjectingErrorStateHostComponent, {
      providers: [provideNoopAnimations()],
    });
    cy.get('.m3k-error-state__retry').should('not.exist');
    cy.get('.m3k-error-state__actions [data-cy="custom-action"]').should(
      'have.text',
      'Reload record',
    );
  });
});
