import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
} from './confirm-dialog.component';

const BASE_CONFIG: ConfirmDialogConfig = {
  title: 'Send invoice INV-2026-0042?',
  message: 'The invoice will be emailed to the customer and marked as sent.',
};

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const confirmButton = (): HTMLButtonElement =>
    element().querySelector('.m3k-confirm-dialog__confirm') as HTMLButtonElement;
  const cancelButton = (): HTMLButtonElement =>
    element().querySelector('.m3k-confirm-dialog__cancel') as HTMLButtonElement;

  async function setup(config: ConfirmDialogConfig = BASE_CONFIG): Promise<void> {
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: config },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  }

  it('renders the title and message', async () => {
    await setup();

    expect(
      element().querySelector('.m3k-confirm-dialog__title')?.textContent,
    ).toContain('Send invoice INV-2026-0042?');
    expect(
      element().querySelector('.m3k-confirm-dialog__message')?.textContent,
    ).toContain('emailed to the customer');
  });

  it('falls back to Confirm/Cancel labels when none are given', async () => {
    await setup();

    expect(confirmButton().textContent?.trim()).toBe('Confirm');
    expect(cancelButton().textContent?.trim()).toBe('Cancel');
  });

  it('renders custom button labels', async () => {
    await setup({
      ...BASE_CONFIG,
      confirmLabel: 'Send invoice',
      cancelLabel: 'Keep as draft',
    });

    expect(confirmButton().textContent?.trim()).toBe('Send invoice');
    expect(cancelButton().textContent?.trim()).toBe('Keep as draft');
  });

  it('does not carry the destructive modifier by default', async () => {
    await setup();

    expect(confirmButton().classList).not.toContain(
      'm3k-confirm-dialog__confirm--destructive',
    );
  });

  it('marks the confirm button destructive when configured', async () => {
    await setup({ ...BASE_CONFIG, destructive: true });

    expect(confirmButton().classList).toContain(
      'm3k-confirm-dialog__confirm--destructive',
    );
  });

  it('closes with true on confirm', async () => {
    await setup();

    confirmButton().click();

    expect(dialogRef.close).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('closes with false on cancel', async () => {
    await setup();

    cancelButton().click();

    expect(dialogRef.close).toHaveBeenCalledExactlyOnceWith(false);
  });
});
