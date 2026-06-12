import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { userEvent, within } from '@storybook/test';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Parity gallery: raw Angular Material menu with a nested export submenu,
 * icons, a disabled item, and a divider — opened via the story play function.
 */
@Component({
  selector: 'parity-menu-demo',
  standalone: true,
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="parity-row">
      <button mat-flat-button [matMenuTriggerFor]="invoiceMenu">
        <mat-icon>more_vert</mat-icon>
        Invoice actions
      </button>

      <mat-menu #invoiceMenu="matMenu">
        <button mat-menu-item>
          <mat-icon>visibility</mat-icon>
          <span>View invoice</span>
        </button>
        <button mat-menu-item>
          <mat-icon>edit</mat-icon>
          <span>Edit draft</span>
        </button>
        <button mat-menu-item [matMenuTriggerFor]="exportMenu">
          <mat-icon>ios_share</mat-icon>
          <span>Export</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item disabled>
          <mat-icon>undo</mat-icon>
          <span>Revert to sent</span>
        </button>
        <button mat-menu-item>
          <mat-icon>block</mat-icon>
          <span>Void invoice</span>
        </button>
      </mat-menu>

      <mat-menu #exportMenu="matMenu">
        <button mat-menu-item [matMenuTriggerFor]="csvMenu">
          <mat-icon>table_view</mat-icon>
          <span>CSV</span>
        </button>
        <button mat-menu-item>
          <mat-icon>picture_as_pdf</mat-icon>
          <span>PDF</span>
        </button>
        <button mat-menu-item>
          <mat-icon>code</mat-icon>
          <span>JSON</span>
        </button>
      </mat-menu>

      <mat-menu #csvMenu="matMenu">
        <button mat-menu-item>Current page</button>
        <button mat-menu-item>All 128 invoices</button>
        <button mat-menu-item>Selected rows only</button>
      </mat-menu>
    </div>
  `,
  styles: [
    `
      .parity-row {
        padding: 16px;
        min-height: 360px;
      }
    `,
  ],
})
class ParityMenuDemoComponent {}

const meta: Meta<ParityMenuDemoComponent> = {
  component: ParityMenuDemoComponent,
  title: 'Material Parity/Menu',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityMenuDemoComponent>;

export const NestedMenu: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /invoice actions/i })
    );
  },
};
