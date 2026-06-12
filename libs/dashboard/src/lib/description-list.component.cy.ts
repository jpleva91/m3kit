import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  DescriptionListColumns,
  DescriptionListComponent,
  DescriptionListItem,
} from './description-list.component';

@Component({
  imports: [DescriptionListComponent],
  template: `<m3k-description-list [items]="items" [columns]="columns" />`,
})
class DescriptionListHostComponent {
  items: readonly DescriptionListItem[] = [
    { term: 'Customer', description: 'Acme Manufacturing GmbH' },
    { term: 'Account ID', description: 'CUST-00482', mono: true },
    { term: 'Payment terms', description: 'Net 30' },
  ];
  columns: DescriptionListColumns = 1;
}

function mountDescriptionList(overrides: Partial<DescriptionListHostComponent> = {}) {
  return cy.mount(DescriptionListHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(DescriptionListComponent.name, () => {
  it('renders dt/dd pairs with definition-list semantics', () => {
    mountDescriptionList();
    cy.get('dl.m3k-description-list').should('exist');
    cy.get('dt.m3k-description-list__term').should('have.length', 3);
    cy.get('dt.m3k-description-list__term').first().should('have.text', 'Customer');
    cy.get('dd.m3k-description-list__description')
      .first()
      .should('have.text', 'Acme Manufacturing GmbH');
  });

  it('marks mono descriptions with the mono modifier', () => {
    mountDescriptionList();
    cy.get('dd.m3k-description-list__description')
      .eq(1)
      .should('have.class', 'm3k-description-list__description--mono')
      .and('contain.text', 'CUST-00482');
    cy.get('dd.m3k-description-list__description')
      .first()
      .should('not.have.class', 'm3k-description-list__description--mono');
  });

  it('lays pairs out in two columns when requested', () => {
    mountDescriptionList({ columns: 2 });
    cy.get('.m3k-description-list').should('have.class', 'm3k-description-list--two-column');
    cy.get('.m3k-description-list__item').then(($items) => {
      const first = $items[0].getBoundingClientRect();
      const second = $items[1].getBoundingClientRect();
      expect(second.left).to.be.greaterThan(first.left);
      expect(second.top).to.equal(first.top);
    });
  });
});
