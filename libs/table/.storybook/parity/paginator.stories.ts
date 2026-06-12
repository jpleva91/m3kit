import { Component } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

/**
 * Plain Angular Material `mat-paginator` used standalone (no table), in three
 * realistic states at once: mid-collection with first/last buttons, a short
 * collection on its last page, and a disabled paginator.
 */
@Component({
  selector: 'parity-mat-paginator-host',
  standalone: true,
  imports: [MatPaginatorModule],
  template: `
    <section class="parity-stack">
      <h3>Mid-collection (page 4 of 487 support tickets)</h3>
      <mat-paginator
        [length]="487"
        [pageIndex]="3"
        [pageSize]="25"
        [pageSizeOptions]="[10, 25, 50, 100]"
        showFirstLastButtons
        aria-label="Select page of support tickets"
      ></mat-paginator>

      <h3>Last page (38 customers, page size 10)</h3>
      <mat-paginator
        [length]="38"
        [pageIndex]="3"
        [pageSize]="10"
        [pageSizeOptions]="[5, 10, 25]"
        aria-label="Select page of customers"
      ></mat-paginator>

      <h3>Disabled (results loading)</h3>
      <mat-paginator
        [length]="120"
        [pageIndex]="0"
        [pageSize]="20"
        [pageSizeOptions]="[20, 40]"
        [disabled]="true"
        showFirstLastButtons
        aria-label="Paginator disabled while loading"
      ></mat-paginator>
    </section>
  `,
  styles: [
    `
      .parity-stack {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 720px;
      }
      .parity-stack h3 {
        margin: 16px 0 0;
        font: var(--mat-sys-title-small);
        color: var(--mat-sys-on-surface-variant);
      }
      .parity-stack mat-paginator {
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: var(--app-radius-card);
      }
    `,
  ],
})
class ParityMatPaginatorHostComponent {}

const meta: Meta<ParityMatPaginatorHostComponent> = {
  component: ParityMatPaginatorHostComponent,
  title: 'Atoms/Paginator',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityMatPaginatorHostComponent>;

export const States: Story = {};
