import { Component } from '@angular/core';

import { SkeletonComponent, SkeletonVariant } from './skeleton.component';

@Component({
  imports: [SkeletonComponent],
  template: `<m3k-skeleton [variant]="variant" [width]="width" [height]="height" />`,
})
class SkeletonHostComponent {
  variant: SkeletonVariant = 'text';
  width: string | null = null;
  height: string | null = null;
}

function mountSkeleton(props: Partial<SkeletonHostComponent> = {}) {
  return cy.mount(SkeletonHostComponent, { componentProperties: props });
}

describe(SkeletonComponent.name, () => {
  it('renders the text variant by default, hidden from assistive tech', () => {
    mountSkeleton();
    cy.get('.m3k-skeleton')
      .should('have.class', 'm3k-skeleton--text')
      .and('have.attr', 'aria-hidden', 'true');
  });

  it('applies the variant class and a circle stays circular', () => {
    mountSkeleton({ variant: 'circle' });
    cy.get('.m3k-skeleton')
      .should('have.class', 'm3k-skeleton--circle')
      .and('have.css', 'border-radius', '50%');
  });

  it('applies width and height overrides', () => {
    mountSkeleton({ variant: 'rect', width: '200px', height: '64px' });
    cy.get('.m3k-skeleton').invoke('outerWidth').should('eq', 200);
    cy.get('.m3k-skeleton').invoke('outerHeight').should('eq', 64);
  });

  it('pulses opacity with the calm 1.6s animation (no shimmer sweep)', () => {
    mountSkeleton();
    cy.get('.m3k-skeleton')
      .should(($el) => {
        // Emulated view encapsulation scopes @keyframes names with an
        // `_ngcontent-*` prefix; assert the authored name as a suffix.
        expect($el.css('animation-name')).to.match(/m3k-skeleton-pulse$/);
      })
      .and('have.css', 'animation-duration', '1.6s');
    // No shimmer theater: the surface is a flat tone, not a gradient sweep.
    cy.get('.m3k-skeleton').should('have.css', 'background-image', 'none');
  });
});
