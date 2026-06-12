import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PageHeaderComponent } from './page-header.component';

@Component({
  imports: [PageHeaderComponent],
  template: `
    <m3k-page-header [title]="title" [subtitle]="subtitle">
      <button m3kPageHeaderActions type="button" class="probe-action">
        Export
      </button>
    </m3k-page-header>
  `,
})
class PageHeaderHostComponent {
  title = 'Invoices';
  subtitle = '';
}

function mountPageHeader(overrides: Partial<PageHeaderHostComponent> = {}) {
  return cy.mount(PageHeaderHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(PageHeaderComponent.name, () => {
  it('renders the title as a single h1', () => {
    mountPageHeader();
    cy.get('h1').should('have.length', 1).and('have.text', 'Invoices');
  });

  it('omits the subtitle when empty and renders it when provided', () => {
    mountPageHeader();
    cy.get('.m3k-page-header__subtitle').should('not.exist');

    mountPageHeader({ subtitle: 'Billing period June 2026' });
    cy.get('.m3k-page-header__subtitle').should(
      'have.text',
      'Billing period June 2026',
    );
  });

  it('aligns projected actions to the header end', () => {
    mountPageHeader();
    cy.get('.m3k-page-header__actions .probe-action').should('be.visible');
    cy.get('.m3k-page-header').then(($header) => {
      const headerRight = $header[0].getBoundingClientRect().right;
      cy.get('.probe-action').then(($action) => {
        const actionRight = $action[0].getBoundingClientRect().right;
        expect(headerRight - actionRight).to.be.lessThan(24);
      });
    });
  });
});
