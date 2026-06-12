import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { StatListComponent, StatListItem } from './stat-list.component';

@Component({
  imports: [StatListComponent],
  template: `<m3k-stat-list [items]="items" [dense]="dense" />`,
})
class StatListHostComponent {
  items: readonly StatListItem[] = [
    { label: 'Total billed', value: 1284902.44, format: 'currency', delta: 4.2 },
    { label: 'Overdue balance', value: 86240.55, format: 'currency', delta: -2.1 },
    { label: 'Collection rate', value: 0.866, format: 'percent' },
  ];
  dense = false;
}

function mountStatList(overrides: Partial<StatListHostComponent> = {}) {
  return cy.mount(StatListHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(StatListComponent.name, () => {
  it('renders one row per item with formatted values', () => {
    mountStatList();
    cy.get('.m3k-stat-list__row').should('have.length', 3);
    cy.get('.m3k-stat-list__row').first().find('.m3k-stat-list__label').should('have.text', 'Total billed');
    cy.get('.m3k-stat-list__row').first().find('.m3k-stat-list__value').should('have.text', '$1,284,902.44');
    cy.get('.m3k-stat-list__row').last().find('.m3k-stat-list__value').should('have.text', '87%');
  });

  it('colors deltas by sentiment with explicit signs', () => {
    mountStatList();
    cy.get('.m3k-stat-list__row')
      .first()
      .find('.m3k-stat-list__delta')
      .should('have.class', 'm3k-stat-list__delta--up')
      .and('have.text', '+4.2');
    cy.get('.m3k-stat-list__row')
      .eq(1)
      .find('.m3k-stat-list__delta')
      .should('have.class', 'm3k-stat-list__delta--down')
      .and('have.text', '-2.1');
  });

  it('hides the delta when omitted', () => {
    mountStatList();
    cy.get('.m3k-stat-list__row').last().find('.m3k-stat-list__delta').should('not.exist');
  });

  it('applies the dense modifier', () => {
    mountStatList({ dense: true });
    cy.get('.m3k-stat-list').should('have.class', 'm3k-stat-list--dense');
  });
});
