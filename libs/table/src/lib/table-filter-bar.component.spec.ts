import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TableDefinition } from '@m3kit/core';

import {
  TableFilterBarChange,
  TableFilterBarComponent,
} from './table-filter-bar.component';

interface CustomerRow {
  readonly id: number;
  readonly customerName: string;
}

const CUSTOMER_DEFINITION: TableDefinition<CustomerRow> = {
  id: 'customers',
  title: 'Customers',
  columns: [
    { key: 'id', header: 'Id', type: 'number' },
    { key: 'customerName', header: 'Customer', type: 'text' },
  ],
};

@Component({
  imports: [TableFilterBarComponent],
  template: `
    <m3k-table-filter-bar
      [definition]="definition"
      (filterChange)="changes.push($event)"
    />
  `,
})
class HostComponent {
  definition = CUSTOMER_DEFINITION;
  changes: TableFilterBarChange[] = [];
}

describe('TableFilterBarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const inputEl = (): HTMLInputElement =>
    (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;

  const typeText = (value: string): void => {
    const input = inputEl();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('labels the search field after the report title', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Search Customers',
    );
  });

  it('debounces input by 200ms and emits the trimmed text', fakeAsync(() => {
    typeText('  acm');
    typeText('  acme  ');

    tick(199);
    expect(host.changes).toEqual([]);

    tick(1);
    expect(host.changes).toEqual([{ text: 'acme' }]);
  }));

  it('deduplicates successive identical values', fakeAsync(() => {
    typeText('acme');
    tick(200);
    typeText('acme ');
    tick(200);

    expect(host.changes).toEqual([{ text: 'acme' }]);
  }));

  it('shows a clear button only when text is present, and clears on click', fakeAsync(() => {
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Clear search"]'),
    ).toBeNull();

    typeText('acme');
    tick(200);
    fixture.detectChanges();

    const clear = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    expect(clear).not.toBeNull();

    clear.click();
    fixture.detectChanges();

    expect(inputEl().value).toBe('');
    expect(host.changes).toEqual([{ text: 'acme' }, { text: '' }]);
  }));

  it('clears immediately without waiting for the debounce', fakeAsync(() => {
    typeText('acme');
    tick(200);
    fixture.detectChanges();

    const clear = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    clear.click();

    // No tick: the clear must already have been emitted.
    expect(host.changes).toEqual([{ text: 'acme' }, { text: '' }]);

    fixture.detectChanges();
    expect(inputEl().value).toBe('');
  }));

  it('cancels a pending debounced keystroke when cleared', fakeAsync(() => {
    typeText('acme');
    tick(200);
    fixture.detectChanges();

    typeText('acmex');
    tick(100);
    fixture.detectChanges();

    const clear = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    clear.click();
    tick(200);

    // 'acmex' never fires; the clear wins.
    expect(host.changes).toEqual([{ text: 'acme' }, { text: '' }]);
  }));

  it('re-emits the same text typed again after a clear', fakeAsync(() => {
    typeText('acme');
    tick(200);
    fixture.detectChanges();

    const clear = (fixture.nativeElement as HTMLElement).querySelector(
      'button[aria-label="Clear search"]',
    ) as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    typeText('acme');
    tick(200);

    expect(host.changes).toEqual([{ text: 'acme' }, { text: '' }, { text: 'acme' }]);
  }));
});
