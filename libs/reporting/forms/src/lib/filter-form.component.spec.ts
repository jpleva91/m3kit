import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReportDefinition } from '@m3kit/core';

import { FilterFormComponent, FilterFormValues } from './filter-form.component';
import { FormFieldOption } from './form-field.component';

interface OrderRow {
  readonly id: number;
  readonly productName: string;
  readonly quantity: number;
  readonly total: number;
  readonly placedAt: string;
  readonly status: string;
}

const ORDERS_DEFINITION: ReportDefinition<OrderRow> = {
  id: 'orders',
  title: 'Orders',
  columns: [
    { key: 'id', header: 'Order #', type: 'number', filterable: false },
    { key: 'productName', header: 'Product', type: 'text', filterable: true },
    { key: 'quantity', header: 'Quantity', type: 'number' },
    { key: 'total', header: 'Total', type: 'currency', filterable: true },
    { key: 'placedAt', header: 'Placed', type: 'date', filterable: true },
    { key: 'status', header: 'Status', type: 'badge', filterable: true },
  ],
};

const STATUS_OPTIONS: readonly FormFieldOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
];

@Component({
  imports: [FilterFormComponent],
  template: `
    <rpt-filter-form
      [definition]="definition"
      [options]="options"
      (filtersChange)="changes.push($event)"
    />
  `,
})
class HostComponent {
  definition = ORDERS_DEFINITION;
  options: Readonly<Record<string, readonly FormFieldOption[]>> = {
    status: STATUS_OPTIONS,
  };
  changes: FilterFormValues[] = [];
}

describe('FilterFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let element: HTMLElement;

  const inputFor = (label: string): HTMLInputElement => {
    const fields = Array.from(element.querySelectorAll('rpt-form-field'));
    const field = fields.find((candidate) => candidate.textContent?.includes(label));
    return field?.querySelector('input') as HTMLInputElement;
  };

  const typeInto = (label: string, value: string): void => {
    const input = inputFor(label);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('builds one field per column whose filterable is not false', () => {
    const labels = Array.from(element.querySelectorAll('mat-label')).map(
      (label) => label.textContent?.trim(),
    );
    // `id` is filterable: false; `quantity` (undefined) is included.
    expect(labels).toEqual(['Product', 'Quantity', 'Total', 'Placed', 'Status']);
  });

  it('maps column types to controls: text/number inputs, datepicker, select', () => {
    expect(inputFor('Product').type).toBe('text');
    expect(inputFor('Quantity').type).toBe('number');
    expect(inputFor('Total').type).toBe('number');
    expect(inputFor('Placed').getAttribute('aria-haspopup')).toBe('dialog');
    expect(element.querySelector('mat-select')).not.toBeNull();
  });

  it('emits dirty, non-empty values debounced by 250ms', fakeAsync(() => {
    typeInto('Product', '  Widget  ');

    tick(249);
    expect(host.changes).toEqual([]);

    tick(1);
    expect(host.changes).toEqual([{ productName: 'Widget' }]);
  }));

  it('omits pristine and emptied controls from the payload', fakeAsync(() => {
    typeInto('Product', 'Widget');
    typeInto('Quantity', '3');
    tick(250);
    expect(host.changes).toEqual([{ productName: 'Widget', quantity: 3 }]);

    typeInto('Product', '');
    tick(250);
    expect(host.changes[1]).toEqual({ quantity: 3 });
  }));

  it('deduplicates successive identical payloads', fakeAsync(() => {
    typeInto('Product', 'Widget');
    tick(250);
    typeInto('Product', 'Widget ');
    tick(250);

    expect(host.changes).toEqual([{ productName: 'Widget' }]);
  }));

  it('resets the form and emits an empty payload immediately', fakeAsync(() => {
    typeInto('Product', 'Widget');
    tick(250);

    const reset = element.querySelector('.rpt-filter-form__actions button') as HTMLButtonElement;
    expect(reset.textContent).toContain('Reset');
    reset.click();

    // No tick: the reset must already have been emitted.
    expect(host.changes).toEqual([{ productName: 'Widget' }, {}]);

    fixture.detectChanges();
    expect(inputFor('Product').value).toBe('');
  }));

  it('cancels a pending debounced edit when reset', fakeAsync(() => {
    typeInto('Product', 'Widget');
    tick(100);

    const reset = element.querySelector('.rpt-filter-form__actions button') as HTMLButtonElement;
    reset.click();
    tick(250);

    // 'Widget' never fires; the reset's empty payload wins.
    expect(host.changes).toEqual([{}]);
  }));

  it('rebuilds the form when the definition changes', () => {
    host.definition = {
      id: 'products',
      title: 'Products',
      columns: [{ key: 'productName', header: 'Product', type: 'text' }],
    } as ReportDefinition<OrderRow>;
    fixture.detectChanges();

    const labels = Array.from(element.querySelectorAll('mat-label')).map(
      (label) => label.textContent?.trim(),
    );
    expect(labels).toEqual(['Product']);
  });
});
