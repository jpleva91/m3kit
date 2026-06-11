import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ReportToolbarComponent } from './report-toolbar.component';

@Component({
  imports: [ReportToolbarComponent],
  template: `
    <rpt-report-toolbar [title]="title" [rowCount]="rowCount">
      <button type="button" class="export-action">Export</button>
    </rpt-report-toolbar>
  `,
})
class ReportToolbarHostComponent {
  title = 'Invoices';
  rowCount: number | null = 128;
}

function mountReportToolbar(overrides: Partial<ReportToolbarHostComponent> = {}) {
  return cy.mount(ReportToolbarHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(ReportToolbarComponent.name, () => {
  it('renders the title as the toolbar heading', () => {
    mountReportToolbar();
    cy.get('mat-toolbar.rpt-report-toolbar h1.rpt-report-toolbar__title').should(
      'have.text',
      'Invoices',
    );
  });

  it('shows the row count chip when a count is provided', () => {
    mountReportToolbar({ rowCount: 128 });
    cy.get('.rpt-report-toolbar__count').should('have.text', '128 rows');
  });

  it('hides the row count chip when the count is null', () => {
    mountReportToolbar({ rowCount: null });
    cy.get('.rpt-report-toolbar__count').should('not.exist');
  });

  it('shows a zero row count instead of hiding the chip', () => {
    mountReportToolbar({ rowCount: 0 });
    cy.get('.rpt-report-toolbar__count').should('have.text', '0 rows');
  });

  it('projects action content after the spacer', () => {
    mountReportToolbar();
    cy.get('mat-toolbar .export-action').should('be.visible').and('have.text', 'Export');
    cy.get('.rpt-report-toolbar__spacer').should('exist');
  });
});
