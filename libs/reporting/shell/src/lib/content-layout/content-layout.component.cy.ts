import { Component } from '@angular/core';

import {
  ContentLayoutComponent,
  ContentLayoutMode,
} from './content-layout.component';

@Component({
  imports: [ContentLayoutComponent],
  template: `
    <rpt-content-layout [mode]="mode">
      <section class="probe-primary">Invoice table</section>
      <aside rptContentAside class="probe-aside">Filters</aside>
    </rpt-content-layout>
  `,
})
class ContentLayoutHostComponent {
  mode: ContentLayoutMode = 'full';
}

function mountLayout(mode: ContentLayoutMode) {
  return cy.mount(ContentLayoutHostComponent, {
    componentProperties: { mode },
  });
}

describe(ContentLayoutComponent.name, () => {
  it('spans the available width in full mode', () => {
    cy.viewport(1280, 800);
    mountLayout('full');
    cy.get('.rpt-content-layout--full').should('be.visible');
    cy.get('.probe-primary').should('be.visible');
  });

  it('constrains content to a centered column in centered mode', () => {
    cy.viewport(1280, 800);
    mountLayout('centered');
    cy.get('.rpt-content-layout--centered').then(($wrapper) => {
      const rect = $wrapper[0].getBoundingClientRect();
      const parentRect = $wrapper[0].parentElement?.getBoundingClientRect();
      expect(rect.width).to.be.at.most(1080);
      // Centered: roughly equal gutters on both sides of the host.
      const leftGutter = rect.left - (parentRect?.left ?? 0);
      const rightGutter = (parentRect?.right ?? 0) - rect.right;
      expect(leftGutter).to.be.greaterThan(0);
      expect(Math.abs(leftGutter - rightGutter)).to.be.lessThan(2);
    });
  });

  it('renders primary and aside side by side in split mode at desktop width', () => {
    cy.viewport(1280, 800);
    mountLayout('split');
    cy.get('.probe-primary').then(($primary) => {
      cy.get('.probe-aside').then(($aside) => {
        const primary = $primary[0].getBoundingClientRect();
        const aside = $aside[0].getBoundingClientRect();
        expect(aside.left).to.be.greaterThan(primary.right);
        expect(aside.width).to.be.lessThan(primary.width);
      });
    });
  });

  it('stacks the split regions at handset width', () => {
    cy.viewport(600, 800);
    mountLayout('split');
    cy.get('.probe-primary').then(($primary) => {
      cy.get('.probe-aside').then(($aside) => {
        const primary = $primary[0].getBoundingClientRect();
        const aside = $aside[0].getBoundingClientRect();
        expect(aside.top).to.be.greaterThan(primary.bottom - 1);
      });
    });
  });
});
