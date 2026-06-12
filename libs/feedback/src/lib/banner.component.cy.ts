import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { BannerComponent, BannerSeverity } from './banner.component';

@Component({
  imports: [BannerComponent],
  template: `
    <m3k-banner [severity]="severity" [dismissible]="dismissible" (dismissed)="onDismissed()">
      7 invoices are overdue — totaling $12,840.00.
      <button m3kBannerAction type="button" data-cy="action">Review invoices</button>
    </m3k-banner>
  `,
})
class BannerHostComponent {
  severity: BannerSeverity = 'info';
  dismissible = false;
  onDismissed(): void {
    // Spied on by the test.
  }
}

function mountBanner(props: Partial<BannerHostComponent> = {}) {
  return cy.mount(BannerHostComponent, {
    componentProperties: props,
    providers: [provideNoopAnimations()],
  });
}

describe(BannerComponent.name, () => {
  it('renders the projected message with the info defaults', () => {
    mountBanner();
    cy.get('.m3k-banner')
      .should('have.class', 'm3k-banner--info')
      .and('have.attr', 'role', 'status');
    cy.get('.m3k-banner__icon').should('have.text', 'info');
    cy.get('.m3k-banner__message').should('contain.text', '7 invoices are overdue');
    cy.get('.m3k-banner__dismiss').should('not.exist');
  });

  it('maps warning and error severities to role="alert" with matching icons', () => {
    mountBanner({ severity: 'warning' });
    cy.get('.m3k-banner')
      .should('have.class', 'm3k-banner--warning')
      .and('have.attr', 'role', 'alert');
    cy.get('.m3k-banner__icon').should('have.text', 'warning');

    mountBanner({ severity: 'error' });
    cy.get('.m3k-banner')
      .should('have.class', 'm3k-banner--error')
      .and('have.attr', 'role', 'alert');
    cy.get('.m3k-banner__icon').should('have.text', 'error');
  });

  it('projects the action slot', () => {
    mountBanner();
    cy.get('.m3k-banner__action [data-cy="action"]').should('have.text', 'Review invoices');
  });

  it('emits dismissed when the dismiss button is clicked', () => {
    mountBanner({ dismissible: true }).then(({ component }) => {
      cy.spy(component, 'onDismissed').as('dismissed');
    });
    cy.get('.m3k-banner__dismiss').click();
    cy.get('@dismissed').should('have.been.calledOnce');
  });
});
