import { Component, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TableDefinition } from '@m3kit/core';

import {
  TABLE_FILTER_DEBOUNCE_MS,
  TableFilterBarChange,
  TableFilterBarComponent,
} from './table-filter-bar.component';

interface InvoiceRow {
  readonly id: string;
  readonly customerName: string;
}

const INVOICE_DEFINITION: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
  columns: [
    { key: 'id', header: 'Invoice', type: 'text' },
    { key: 'customerName', header: 'Customer', type: 'text' },
  ],
};

@Component({
  imports: [TableFilterBarComponent],
  template: `
    <m3k-table-filter-bar
      [definition]="definition"
      (filterChange)="onFilterChange($event)"
    />
  `,
})
class FilterBarHostComponent {
  readonly definition = INVOICE_DEFINITION;
  readonly emissions = signal<readonly TableFilterBarChange[]>([]);

  onFilterChange(change: TableFilterBarChange): void {
    this.emissions.update((emissions) => [...emissions, change]);
  }
}

describe(TableFilterBarComponent.name, () => {
  it('emits the typed text only after the debounce elapses', () => {
    cy.clock();
    cy.mount(FilterBarHostComponent, {
      providers: [provideNoopAnimations()],
    }).then(({ component }) => {
      cy.get('input[aria-label="Search Invoices"]').type('acme');
      cy.then(() => {
        expect(component.emissions()).to.have.length(0);
      });
      cy.tick(TABLE_FILTER_DEBOUNCE_MS);
      cy.then(() => {
        expect(component.emissions()).to.deep.equal([{ text: 'acme' }]);
      });
    });
  });

  it('clears immediately, bypassing the debounce', () => {
    cy.clock();
    cy.mount(FilterBarHostComponent, {
      providers: [provideNoopAnimations()],
    }).then(({ component }) => {
      cy.get('input[aria-label="Search Invoices"]').type('acme');
      cy.tick(TABLE_FILTER_DEBOUNCE_MS);
      cy.get('button[aria-label="Clear search"]').click();
      // No tick: the clear emission must flush synchronously.
      cy.then(() => {
        expect(component.emissions()).to.deep.equal([{ text: 'acme' }, { text: '' }]);
      });
      cy.get('input[aria-label="Search Invoices"]').should('have.value', '');
    });
  });
});
