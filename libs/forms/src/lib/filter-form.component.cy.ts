import { Component, signal } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TableDefinition } from '@m3kit/core';

import {
  FILTER_FORM_DEBOUNCE_MS,
  FilterFormComponent,
  FilterFormValues,
} from './filter-form.component';
import { FormFieldOption } from './form-field.component';

interface InvoiceRow {
  readonly id: string;
  readonly customerName: string;
  readonly amount: number;
  readonly issuedAt: Date;
  readonly status: 'draft' | 'sent' | 'paid';
}

const INVOICE_DEFINITION: TableDefinition<InvoiceRow> = {
  id: 'invoices',
  title: 'Invoices',
  columns: [
    { key: 'id', header: 'Invoice', type: 'text', filterable: false },
    { key: 'customerName', header: 'Customer', type: 'text', filterable: true },
    { key: 'amount', header: 'Amount', type: 'currency', filterable: true },
    { key: 'issuedAt', header: 'Issued', type: 'date', filterable: true },
    { key: 'status', header: 'Status', type: 'badge', filterable: true },
  ],
};

const STATUS_OPTIONS: Readonly<Record<string, readonly FormFieldOption[]>> = {
  status: [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
  ],
};

@Component({
  imports: [FilterFormComponent],
  template: `
    <m3k-filter-form
      [definition]="definition"
      [options]="options"
      (filtersChange)="onFiltersChange($event)"
    />
  `,
})
class FilterFormHostComponent {
  readonly definition = INVOICE_DEFINITION;
  readonly options = STATUS_OPTIONS;
  readonly emissions = signal<readonly FilterFormValues[]>([]);

  onFiltersChange(filters: FilterFormValues): void {
    this.emissions.update((emissions) => [...emissions, filters]);
  }
}

function mountFilterForm() {
  return cy.mount(FilterFormHostComponent, {
    providers: [provideNoopAnimations(), provideNativeDateAdapter()],
  });
}

describe(FilterFormComponent.name, () => {
  it('builds one control per filterable column, typed by column type', () => {
    mountFilterForm();
    cy.get('m3k-form-field').should('have.length', 4); // "Invoice" is filterable: false
    cy.get('input[type="text"][aria-label="Customer"]').should('exist');
    cy.get('input[type="number"][step="0.01"][aria-label="Amount"]').should('exist');
    cy.get('mat-datepicker-toggle').should('exist');
    cy.get('mat-select').should('exist');
  });

  it('emits only dirty, non-empty values after the debounce', () => {
    cy.clock();
    mountFilterForm().then(({ component }) => {
      cy.get('input[aria-label="Customer"]').type('acme');
      cy.then(() => {
        expect(component.emissions()).to.have.length(0);
      });
      cy.tick(FILTER_FORM_DEBOUNCE_MS);
      cy.then(() => {
        expect(component.emissions()).to.deep.equal([{ customerName: 'acme' }]);
      });
    });
  });

  it('resets the form and emits an empty filter immediately', () => {
    cy.clock();
    mountFilterForm().then(({ component }) => {
      cy.get('input[aria-label="Customer"]').type('acme');
      cy.tick(FILTER_FORM_DEBOUNCE_MS);
      cy.contains('button', 'Reset').click();
      // No tick: the reset emission must flush synchronously.
      cy.then(() => {
        expect(component.emissions()).to.deep.equal([{ customerName: 'acme' }, {}]);
      });
      cy.get('input[aria-label="Customer"]').should('have.value', '');
    });
  });
});
