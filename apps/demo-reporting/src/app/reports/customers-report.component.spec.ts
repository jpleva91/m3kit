import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CustomersReportComponent } from './customers-report.component';

describe('CustomersReportComponent', () => {
  let fixture: ComponentFixture<CustomersReportComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersReportComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomersReportComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders the customers report toolbar with the total row count', () => {
    const toolbar = element.querySelector('m3k-page-toolbar');
    expect(toolbar?.textContent).toContain('Customers');
    expect(toolbar?.textContent).toContain('120');
  });

  it('renders the filter bar and a populated customer table', () => {
    expect(element.querySelector('m3k-table-filter-bar')).toBeTruthy();
    const rows = element.querySelectorAll('m3k-data-table tbody tr');
    // Default page size of the customers definition is 10.
    expect(rows.length).toBe(10);
    expect(element.textContent).toContain('Customer 0');
  });
});
