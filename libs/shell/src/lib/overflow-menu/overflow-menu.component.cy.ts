import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MenuActionItem } from './overflow-menu-model';
import { OverflowMenuComponent } from './overflow-menu.component';

const INVOICE_ACTIONS: readonly MenuActionItem[] = [
  { id: 'view', label: 'View invoice', icon: 'visibility' },
  { id: 'duplicate', label: 'Duplicate as draft', icon: 'content_copy' },
  { id: 'record-payment', label: 'Record payment', icon: 'payments', disabled: true },
  { id: 'void', label: 'Void invoice', icon: 'block', destructive: true, divider: true },
];

@Component({
  imports: [OverflowMenuComponent],
  template: `
    <m3k-overflow-menu
      ariaLabel="Invoice INV-2026-0042 actions"
      [items]="items"
      (action)="onAction($event)"
    />
  `,
})
class OverflowMenuHostComponent {
  items: readonly MenuActionItem[] = INVOICE_ACTIONS;
  readonly selected: string[] = [];

  /** Spied on in tests; records emissions like a real host would. */
  onAction(id: string): void {
    this.selected.push(id);
  }
}

function mountOverflowMenu(
  overrides: Partial<OverflowMenuHostComponent> = {},
) {
  return cy
    .mount(OverflowMenuHostComponent, {
      componentProperties: overrides,
      providers: [provideNoopAnimations()],
    })
    .then(({ component }) => {
      cy.spy(component, 'onAction').as('action');
    });
}

describe(OverflowMenuComponent.name, () => {
  it('opens the menu from the trigger and emits the clicked item id', () => {
    mountOverflowMenu();

    cy.get('button.m3k-overflow-menu__trigger')
      .should('have.attr', 'aria-label', 'Invoice INV-2026-0042 actions')
      .click();
    cy.get('.mat-mdc-menu-panel').should('be.visible');
    cy.get('button.m3k-overflow-menu__item').should('have.length', 4);

    cy.contains('button.m3k-overflow-menu__item', 'View invoice').click();
    cy.get('@action').should('have.been.calledOnceWith', 'view');
    cy.get('.mat-mdc-menu-panel').should('not.exist');
  });

  it('opens with the keyboard (Enter) and focuses the first item', () => {
    mountOverflowMenu();

    // A real Enter activation is a keydown followed by a click.
    cy.get('button.m3k-overflow-menu__trigger')
      .focus()
      .trigger('keydown', { key: 'Enter', keyCode: 13 })
      .trigger('click');

    cy.get('.mat-mdc-menu-panel').should('be.visible');
    cy.focused()
      .should('have.class', 'm3k-overflow-menu__item')
      .and('contain.text', 'View invoice');
  });

  it('renders the destructive item styled with the error class and a leading divider', () => {
    mountOverflowMenu();

    cy.get('button.m3k-overflow-menu__trigger').click();
    cy.contains('button.m3k-overflow-menu__item', 'Void invoice').should(
      'have.class',
      'm3k-overflow-menu__item--destructive',
    );
    cy.get('.mat-mdc-menu-panel mat-divider').should('have.length', 1);
  });

  it('never emits for a disabled item', () => {
    mountOverflowMenu();

    cy.get('button.m3k-overflow-menu__trigger').click();
    cy.contains('button.m3k-overflow-menu__item', 'Record payment')
      .should('be.disabled')
      .click({ force: true });

    cy.get('@action').should('not.have.been.called');
    cy.get('.mat-mdc-menu-panel').should('be.visible');
  });
});
