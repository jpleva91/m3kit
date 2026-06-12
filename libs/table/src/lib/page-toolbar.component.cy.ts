import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PageToolbarComponent } from './page-toolbar.component';

@Component({
  imports: [PageToolbarComponent],
  template: `
    <m3k-page-toolbar [title]="title" [rowCount]="rowCount">
      <button type="button" class="export-action">Export</button>
    </m3k-page-toolbar>
  `,
})
class PageToolbarHostComponent {
  title = 'Invoices';
  rowCount: number | null = 128;
}

function mountPageToolbar(overrides: Partial<PageToolbarHostComponent> = {}) {
  return cy.mount(PageToolbarHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(PageToolbarComponent.name, () => {
  it('renders the title as the toolbar heading', () => {
    mountPageToolbar();
    cy.get('mat-toolbar.m3k-page-toolbar h1.m3k-page-toolbar__title').should(
      'have.text',
      'Invoices',
    );
  });

  it('shows the row count chip when a count is provided', () => {
    mountPageToolbar({ rowCount: 128 });
    cy.get('.m3k-page-toolbar__count').should('have.text', '128 rows');
  });

  it('hides the row count chip when the count is null', () => {
    mountPageToolbar({ rowCount: null });
    cy.get('.m3k-page-toolbar__count').should('not.exist');
  });

  it('shows a zero row count instead of hiding the chip', () => {
    mountPageToolbar({ rowCount: 0 });
    cy.get('.m3k-page-toolbar__count').should('have.text', '0 rows');
  });

  it('projects action content after the spacer', () => {
    mountPageToolbar();
    cy.get('mat-toolbar .export-action').should('be.visible').and('have.text', 'Export');
    cy.get('.m3k-page-toolbar__spacer').should('exist');
  });
});
