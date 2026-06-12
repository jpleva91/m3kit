import { Component } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TreeComponent, TreeNode } from './tree.component';

const CATEGORIES: readonly TreeNode[] = [
  {
    id: 'orders',
    label: 'Orders',
    icon: 'folder',
    children: [
      { id: 'orders-open', label: 'Open orders', icon: 'table_chart' },
      {
        id: 'orders-archive',
        label: 'Archive',
        icon: 'folder',
        children: [{ id: 'orders-2025', label: 'Orders 2025', icon: 'table_chart' }],
      },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'folder',
    children: [{ id: 'customers-active', label: 'Active customers', icon: 'table_chart' }],
  },
  { id: 'readme', label: 'Read me', icon: 'description' },
];

@Component({
  imports: [TreeComponent],
  template: `
    <m3k-tree
      [nodes]="nodes"
      [(expandedIds)]="expandedIds"
      [selectable]="selectable"
      [(selectedId)]="selectedId"
    />
  `,
})
class TreeHostComponent {
  nodes = CATEGORIES;
  expandedIds: readonly string[] = [];
  selectable = false;
  selectedId: string | undefined = undefined;
}

function mountTree(overrides: Partial<TreeHostComponent> = {}) {
  return cy.mount(TreeHostComponent, {
    componentProperties: overrides,
    providers: [provideNoopAnimations()],
  });
}

describe(TreeComponent.name, () => {
  it('expands and collapses a branch via its toggle, writing expandedIds back', () => {
    mountTree().then(({ component }) => {
      cy.contains('.m3k-tree__label', 'Open orders').should('not.exist');

      cy.get('button[aria-label="Toggle Orders"]').click();
      cy.contains('.m3k-tree__label', 'Open orders')
        .should('be.visible')
        .then(() => {
          expect(component.expandedIds).to.include('orders');
        });

      cy.get('button[aria-label="Toggle Orders"]').click();
      cy.contains('.m3k-tree__label', 'Open orders')
        .should('not.exist')
        .then(() => {
          expect(component.expandedIds).to.not.include('orders');
        });
    });
  });

  it('renders branches expanded by the parent through expandedIds', () => {
    mountTree({ expandedIds: ['orders', 'orders-archive'] });
    cy.contains('.m3k-tree__label', 'Orders 2025').should('be.visible');
    cy.contains('.m3k-tree__label', 'Active customers').should('not.exist');
  });

  it('emits the clicked node id through selectedId when selectable', () => {
    mountTree({ selectable: true }).then(({ component }) => {
      cy.contains('.m3k-tree__node', 'Read me')
        .click()
        .should('have.class', 'm3k-tree__node--selected')
        .and('have.attr', 'aria-selected', 'true')
        .then(() => {
          expect(component.selectedId).to.equal('readme');
        });
    });
  });

  it('keeps row clicks inert while not selectable', () => {
    mountTree().then(({ component }) => {
      cy.contains('.m3k-tree__node', 'Read me')
        .click()
        .should('not.have.class', 'm3k-tree__node--selected')
        .then(() => {
          expect(component.selectedId).to.equal(undefined);
        });
    });
  });
});
