import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
} from './confirm-dialog.component';

const SEND_CONFIG: ConfirmDialogConfig = {
  title: 'Send invoice INV-2026-0042?',
  message: 'The invoice will be emailed to Cascade Outfitters and marked as sent.',
};

const VOID_CONFIG: ConfirmDialogConfig = {
  title: 'Void invoice INV-2026-0017?',
  message: 'Voiding removes the invoice from receivables and cannot be undone.',
  confirmLabel: 'Void invoice',
  cancelLabel: 'Keep invoice',
  destructive: true,
};

function mountConfirmDialog(config: ConfirmDialogConfig) {
  const close = cy.stub().as('close');
  return cy.mount(ConfirmDialogComponent, {
    providers: [
      provideNoopAnimations(),
      { provide: MAT_DIALOG_DATA, useValue: config },
      { provide: MatDialogRef, useValue: { close } },
    ],
  });
}

describe(ConfirmDialogComponent.name, () => {
  it('renders title, message, and default labels in the non-destructive posture', () => {
    mountConfirmDialog(SEND_CONFIG);

    cy.get('.m3k-confirm-dialog__title').should(
      'contain.text',
      'Send invoice INV-2026-0042?',
    );
    cy.get('.m3k-confirm-dialog__message').should(
      'contain.text',
      'marked as sent',
    );
    cy.get('.m3k-confirm-dialog__cancel')
      .invoke('text')
      .should((text) => expect(text.trim()).to.equal('Cancel'));
    cy.get('.m3k-confirm-dialog__confirm')
      .invoke('text')
      .should((text) => expect(text.trim()).to.equal('Confirm'));
    cy.get('.m3k-confirm-dialog__confirm').should(
      'not.have.class',
      'm3k-confirm-dialog__confirm--destructive',
    );
  });

  // One mount per test: `cy.stub().as('close')` runs synchronously, so a
  // second mount in the same test would re-alias `@close` before the queued
  // first assertion ever reads it.
  it('closes with true on confirm', () => {
    mountConfirmDialog(SEND_CONFIG);

    cy.get('.m3k-confirm-dialog__confirm').click();
    cy.get('@close').should('have.been.calledOnceWith', true);
  });

  it('closes with false on cancel', () => {
    mountConfirmDialog(SEND_CONFIG);

    cy.get('.m3k-confirm-dialog__cancel').click();
    cy.get('@close').should('have.been.calledOnceWith', false);
  });

  it('renders custom labels and the destructive confirm posture', () => {
    mountConfirmDialog(VOID_CONFIG);

    cy.get('.m3k-confirm-dialog__cancel').should('contain.text', 'Keep invoice');
    cy.get('.m3k-confirm-dialog__confirm')
      .should('contain.text', 'Void invoice')
      .and('have.class', 'm3k-confirm-dialog__confirm--destructive');
  });
});
