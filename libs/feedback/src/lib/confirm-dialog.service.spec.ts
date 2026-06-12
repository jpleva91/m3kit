import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogConfig,
} from './confirm-dialog.component';
import { ConfirmDialogService } from './confirm-dialog.service';

const CONFIG: ConfirmDialogConfig = {
  title: 'Void invoice INV-2026-0017?',
  message: 'Voiding removes the invoice from receivables.',
  confirmLabel: 'Void invoice',
  destructive: true,
};

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let afterClosed$: Subject<boolean | undefined>;

  beforeEach(() => {
    afterClosed$ = new Subject<boolean | undefined>();
    dialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => afterClosed$.asObservable(),
      }),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: dialog }],
    });
    service = TestBed.inject(ConfirmDialogService);
  });

  it('opens the m3k-confirm-dialog as an alertdialog with the config as data', () => {
    service.open(CONFIG).subscribe();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    const [component, options] = dialog.open.mock.calls[0] as [
      unknown,
      MatDialogConfig<ConfirmDialogConfig>,
    ];
    expect(component).toBe(ConfirmDialogComponent);
    expect(options.data).toBe(CONFIG);
    expect(options.role).toBe('alertdialog');
  });

  it('emits true when the dialog closes with true', () => {
    const results: boolean[] = [];
    service.open(CONFIG).subscribe((confirmed) => results.push(confirmed));

    afterClosed$.next(true);
    afterClosed$.complete();

    expect(results).toEqual([true]);
  });

  it('emits false when the dialog closes with false', () => {
    const results: boolean[] = [];
    service.open(CONFIG).subscribe((confirmed) => results.push(confirmed));

    afterClosed$.next(false);
    afterClosed$.complete();

    expect(results).toEqual([false]);
  });

  it('maps dismissal (undefined result) to false', () => {
    const results: boolean[] = [];
    service.open(CONFIG).subscribe((confirmed) => results.push(confirmed));

    afterClosed$.next(undefined);
    afterClosed$.complete();

    expect(results).toEqual([false]);
  });
});
