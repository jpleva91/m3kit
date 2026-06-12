import { Component } from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { provideAnimations } from '@angular/platform-browser/animations';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';

/** Sample sheet: export options for the current orders report. */
@Component({
  selector: 'parity-export-sheet',
  standalone: true,
  imports: [MatListModule, MatIconModule],
  template: `
    <h3 class="parity-sheet-title">Export 42 orders</h3>
    <mat-nav-list>
      <button mat-list-item (click)="choose('csv')">
        <mat-icon matListItemIcon>table_view</mat-icon>
        <span matListItemTitle>CSV spreadsheet</span>
        <span matListItemLine>Columns as currently visible</span>
      </button>
      <button mat-list-item (click)="choose('pdf')">
        <mat-icon matListItemIcon>picture_as_pdf</mat-icon>
        <span matListItemTitle>PDF report</span>
        <span matListItemLine>Formatted with totals and cover page</span>
      </button>
      <button mat-list-item (click)="choose('link')">
        <mat-icon matListItemIcon>link</mat-icon>
        <span matListItemTitle>Share a link</span>
        <span matListItemLine>Anyone in the workspace can view</span>
      </button>
      <a mat-list-item [disabled]="true">
        <mat-icon matListItemIcon>cloud_upload</mat-icon>
        <span matListItemTitle>Push to warehouse</span>
        <span matListItemLine>Unavailable for filtered views</span>
      </button>
    </mat-nav-list>
  `,
  styles: [
    `
      .parity-sheet-title {
        margin: 16px 16px 0;
        font: var(--mat-sys-title-medium);
        color: var(--mat-sys-on-surface);
      }
    `,
  ],
})
class ParityExportSheetComponent {
  constructor(private readonly sheetRef: MatBottomSheetRef<ParityExportSheetComponent>) {}

  choose(format: string): void {
    this.sheetRef.dismiss(format);
  }
}

/**
 * Plain Angular Material `MatBottomSheet` launcher (no m3kit wrapper) opening
 * a realistic export-options nav list, including a disabled option.
 */
@Component({
  selector: 'parity-bottom-sheet-launcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatBottomSheetModule],
  template: `
    <div class="parity-launchers">
      <button mat-flat-button (click)="open()">
        <mat-icon>ios_share</mat-icon>
        Export orders…
      </button>
      <p class="parity-result">Last choice: {{ lastChoice }}</p>
    </div>
  `,
  styles: [
    `
      .parity-launchers {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .parity-result {
        margin: 0;
        font: var(--mat-sys-body-small);
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
})
class ParityBottomSheetLauncherComponent {
  lastChoice = '(none yet)';

  constructor(private readonly bottomSheet: MatBottomSheet) {}

  open(): void {
    this.bottomSheet
      .open(ParityExportSheetComponent)
      .afterDismissed()
      .subscribe((choice) => {
        this.lastChoice = choice ?? 'dismissed';
      });
  }
}

const meta: Meta<ParityBottomSheetLauncherComponent> = {
  component: ParityBottomSheetLauncherComponent,
  title: 'Material Parity/Bottom Sheet',
  decorators: [applicationConfig({ providers: [provideAnimations()] })],
};
export default meta;
type Story = StoryObj<ParityBottomSheetLauncherComponent>;

export const ExportOptionsSheet: Story = {};
