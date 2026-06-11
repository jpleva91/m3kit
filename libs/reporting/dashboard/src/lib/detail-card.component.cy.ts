import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { DetailCardComponent, DetailCardRow } from './detail-card.component';

const INVOICE_ROWS: readonly DetailCardRow[] = [
  { label: 'Customer', value: 'Acme Corp' },
  { label: 'Amount', value: '$1,105.00' },
  { label: 'Status', value: 'sent' },
];

@Component({
  imports: [DetailCardComponent],
  template: `
    <rpt-detail-card title="Latest invoice" subtitle="INV-2026-0042" [rows]="rows">
      <button rptDetailCardActions type="button" data-cy="action">Refresh</button>
      <a rptDetailCardFooter data-cy="footer-link">View all invoices</a>
    </rpt-detail-card>
  `,
})
class DetailCardHostComponent {
  rows: readonly DetailCardRow[] = INVOICE_ROWS;
}

function mountDetailCard(rows: readonly DetailCardRow[] = INVOICE_ROWS) {
  return cy.mount(DetailCardHostComponent, {
    componentProperties: { rows },
    providers: [provideNoopAnimations()],
  });
}

describe(DetailCardComponent.name, () => {
  it('renders the title, subtitle, and one row per entry', () => {
    mountDetailCard();
    cy.get('h2[mat-card-title]').should('have.text', 'Latest invoice');
    cy.get('mat-card-subtitle').should('have.text', 'INV-2026-0042');
    cy.get('.rpt-detail-card__row').should('have.length', 3);
    cy.get('.rpt-detail-card__row-label').first().should('have.text', 'Customer');
    cy.get('.rpt-detail-card__row-value').first().should('have.text', 'Acme Corp');
  });

  it('projects actions into the header and footer content into the footer', () => {
    mountDetailCard();
    cy.get('.rpt-detail-card__actions [data-cy="action"]').should('contain.text', 'Refresh');
    cy.get('.rpt-detail-card__footer [data-cy="footer-link"]').should(
      'contain.text',
      'View all invoices',
    );
  });

  it('shows a placeholder when there are no rows', () => {
    mountDetailCard([]);
    cy.get('.rpt-detail-card__row').should('not.exist');
    cy.get('.rpt-detail-card__empty').should('contain.text', 'No details available.');
  });
});
