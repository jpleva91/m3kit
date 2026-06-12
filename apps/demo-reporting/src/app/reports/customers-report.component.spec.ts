import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { encodeDataQueryParam, InMemoryTableDataSource, type DataQuery } from '@m3kit/core';

import { CustomersReportComponent } from './customers-report.component';
import { REPORT_QUERY_PARAM } from './report-url-state';

describe('CustomersReportComponent', () => {
  let fixture: ComponentFixture<CustomersReportComponent>;
  let element: HTMLElement;
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  let router: { navigate: ReturnType<typeof vi.fn<Router['navigate']>> };
  let queryParamValue: string | null;

  beforeEach(async () => {
    queryParamValue = null;
    router = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [CustomersReportComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: vi.fn((key: string) => (key === REPORT_QUERY_PARAM ? queryParamValue : null)),
              },
            },
          },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fetchSpy = vi.spyOn(InMemoryTableDataSource.prototype, 'fetch');
    createComponent();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('fetches exactly once on init, through the store only', () => {
    // The table is controlled ([rows] bound), so the store's connect()
    // is the single fetch path — no second pipeline inside the table.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('routes paginator events through the store as the only fetch path', () => {
    const next = element.querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const query = fetchSpy.mock.calls[1][0] as { page: unknown };
    expect(query.page).toEqual({ index: 1, size: 10 });
  });

  it('round-trips customer report query state through the URL helper', () => {
    const initialQuery: DataQuery = {
      filter: { text: 'Customer' },
      sort: { key: 'customerName', direction: 'desc' },
      page: { index: 2, size: 10 },
    };

    queryParamValue = encodeDataQueryParam(initialQuery);
    fetchSpy.mockClear();
    createComponent();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toEqual(initialQuery);

    const next = element.querySelector(
      'button.mat-mdc-paginator-navigation-next',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: {
        [REPORT_QUERY_PARAM]: encodeDataQueryParam({
          ...initialQuery,
          page: { index: 3, size: 10 },
        }),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CustomersReportComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }
});
