import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { makeInvoices } from '@m3kit/testing';

import { ReportsComponent } from './reports.component';

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders the invoices report toolbar with the total row count', () => {
    const toolbar = element.querySelector('m3k-page-toolbar');
    expect(toolbar?.textContent).toContain('Invoices');
    expect(toolbar?.textContent).toContain('120');
  });

  it('renders the filter bar and a populated invoice table', () => {
    expect(element.querySelector('m3k-table-filter-bar')).toBeTruthy();
    const rows = element.querySelectorAll('m3k-data-table tbody tr');
    // Default page size of the invoices definition is 10.
    expect(rows.length).toBe(10);
    expect(element.textContent).toContain('INV-2026-');
  });

  it('renders the field-filter form inside an expansion panel', () => {
    const panel = element.querySelector('mat-expansion-panel');
    expect(panel?.textContent).toContain('Field filters');
    expect(panel?.querySelector('m3k-filter-form')).toBeTruthy();
  });

  it('feeds filter form values into the table as field filters', fakeAsync(() => {
    // Same fixtures the component builds its data source from.
    const invoices = makeInvoices(120, 1);
    const target = invoices[0].customerName;
    const expectedRows = Math.min(
      invoices.filter((invoice) => invoice.customerName === target).length,
      10,
    );

    const form = element.querySelector('m3k-filter-form') as HTMLElement;
    const customerField = Array.from(form.querySelectorAll('m3k-form-field')).find(
      (field) => field.textContent?.includes('Customer'),
    ) as HTMLElement;
    const input = customerField.querySelector('input') as HTMLInputElement;

    input.value = target;
    input.dispatchEvent(new Event('input'));
    tick(250);
    fixture.detectChanges();

    const customerCells = Array.from(
      element.querySelectorAll('m3k-data-table td.cdk-column-customerName'),
    ).map((cell) => cell.textContent?.trim());
    expect(customerCells.length).toBe(expectedRows);
    expect(customerCells.every((cell) => cell === target)).toBe(true);
  }));
});
