import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { SnackbarService, SnackbarSeverity } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  const snackBarRef = { onAction: vi.fn() };

  const lastConfig = (): MatSnackBarConfig =>
    snackBar.open.mock.calls.at(-1)?.[2] as MatSnackBarConfig;

  beforeEach(() => {
    snackBar = { open: vi.fn().mockReturnValue(snackBarRef) };

    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(SnackbarService);
  });

  it('shows an info snackbar by default with the default duration and no action', () => {
    service.show('Monthly revenue report scheduled');

    expect(snackBar.open).toHaveBeenCalledExactlyOnceWith(
      'Monthly revenue report scheduled',
      undefined,
      { duration: 4000, panelClass: 'm3k-snack-info' },
    );
  });

  it.each<SnackbarSeverity>(['info', 'success', 'warning', 'error'])(
    'maps severity %s to the m3k-snack-%s panel class',
    (severity) => {
      service.show('Invoice INV-2026-0042 updated', { severity });

      expect(lastConfig().panelClass).toBe(`m3k-snack-${severity}`);
    },
  );

  it('passes the action label through', () => {
    service.show('Order ORD-1017 deleted', {
      severity: 'success',
      action: 'Undo',
    });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Order ORD-1017 deleted',
      'Undo',
      expect.objectContaining({ panelClass: 'm3k-snack-success' }),
    );
  });

  it('honors a custom duration', () => {
    service.show('Export failed: orders-2026-05.csv', {
      severity: 'error',
      durationMs: 8000,
    });

    expect(lastConfig().duration).toBe(8000);
  });

  it('returns the MatSnackBarRef from the underlying snackbar', () => {
    expect(service.show('Saved')).toBe(snackBarRef);
  });
});
