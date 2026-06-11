import { provideRouter } from '@angular/router';

import { BreadcrumbItem } from './breadcrumb-item';
import { BreadcrumbsComponent } from './breadcrumbs.component';

const TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Reports', path: '/reports' },
  { label: 'Customers', path: '/reports/customers' },
  { label: 'Acme Manufacturing' },
];

function mountBreadcrumbs(items: readonly BreadcrumbItem[] = TRAIL) {
  return cy.mount(BreadcrumbsComponent, {
    componentProperties: { items },
    providers: [provideRouter([{ path: '**', children: [] }])],
  });
}

describe(BreadcrumbsComponent.name, () => {
  it('renders an accessible breadcrumb nav with an ordered list', () => {
    mountBreadcrumbs();
    cy.get('nav[aria-label="Breadcrumb"] ol > li').should('have.length', 3);
  });

  it('links intermediate items and marks the last as the current page', () => {
    mountBreadcrumbs();
    cy.get('a').should('have.length', 2);
    cy.get('a').first().should('have.attr', 'href', '/reports');
    cy.get('[aria-current="page"]')
      .should('have.text', 'Acme Manufacturing')
      .and('match', 'span');
  });

  it('hides separators from assistive technology', () => {
    mountBreadcrumbs();
    cy.get('.rpt-breadcrumbs__separator')
      .should('have.length', 2)
      .each(($separator) => {
        expect($separator.attr('aria-hidden')).to.equal('true');
      });
  });

  it('renders a single item as plain current-page text', () => {
    mountBreadcrumbs([{ label: 'Dashboard' }]);
    cy.get('a').should('not.exist');
    cy.get('.rpt-breadcrumbs__separator').should('not.exist');
    cy.get('[aria-current="page"]').should('have.text', 'Dashboard');
  });
});
