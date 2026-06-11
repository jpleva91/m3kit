import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { makeInvoices, makeSupportTickets } from '@m3kit/testing';

import { ThemeBrand, ThemeService } from '../core/theme.service';
import { DashboardComponent } from './dashboard.component';

const KPI_LABELS = ['Total revenue', 'Open invoices', 'Overdue', 'Open tickets'];

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    localStorage.clear();
  });

  /** Switches the active brand (and so the layout preset) mid-test. */
  function switchBrand(brand: ThemeBrand): void {
    TestBed.inject(ThemeService).setBrand(brand);
    fixture.detectChanges();
  }

  it('renders four KPI cards inside the dashboard grid', () => {
    const labels = Array.from(
      element.querySelectorAll('rpt-dashboard-grid rpt-kpi-card .rpt-kpi-card__label'),
    ).map((label) => label.textContent?.trim());
    expect(labels).toEqual(KPI_LABELS);
  });

  it('shows the paid-invoice revenue computed from the synthetic fixtures', () => {
    const expectedRevenue = makeInvoices(120, 1)
      .filter((invoice) => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const value = element.querySelector('rpt-kpi-card .rpt-kpi-card__value');
    const digits = Number(value?.textContent?.replace(/[^0-9.]/g, ''));
    expect(digits).toBe(expectedRevenue);
  });

  it('shows the open ticket count computed from the synthetic fixtures', () => {
    const expectedOpen = makeSupportTickets(40, 7).filter(
      (ticket) => ticket.status === 'open' || ticket.status === 'in-progress',
    ).length;

    const values = element.querySelectorAll('rpt-kpi-card .rpt-kpi-card__value');
    expect(Number(values[3].textContent?.replace(/[^0-9]/g, ''))).toBe(expectedOpen);
  });

  it('renders a revenue sparkline on the first KPI card', () => {
    const kpiCards = element.querySelectorAll('rpt-kpi-card');
    expect(kpiCards[0].querySelector('.rpt-kpi-card__sparkline polyline')).toBeTruthy();
  });

  it('renders the two-up chart row and the full-width stacked bars', () => {
    const titles = Array.from(element.querySelectorAll('rpt-chart-card h2')).map((title) =>
      title.textContent?.trim(),
    );
    expect(titles).toEqual([
      'Revenue by month',
      'Invoices by status',
      'Monthly invoices by status',
    ]);

    expect(element.querySelector('.dashboard__chart-row rpt-line-chart svg')).toBeTruthy();
    expect(element.querySelector('.dashboard__chart-row rpt-donut-chart svg')).toBeTruthy();
    expect(element.querySelector('.dashboard__chart-wide rpt-bar-chart svg')).toBeTruthy();
  });

  it('labels every chart for assistive tech', () => {
    const labels = Array.from(element.querySelectorAll('rpt-chart-card svg[role="img"]')).map(
      (svg) => svg.getAttribute('aria-label'),
    );
    expect(labels).toEqual([
      'Paid revenue by month, trailing twelve months',
      'Invoice count by status',
      'Monthly invoice counts stacked by status',
    ]);
  });

  it('shares one status legend across the donut and the stacked bars', () => {
    const legends = element.querySelectorAll('rpt-chart-legend');
    expect(legends.length).toBe(2);
    for (const legend of Array.from(legends)) {
      const labels = Array.from(legend.querySelectorAll('.rpt-chart-legend__label')).map(
        (label) => label.textContent?.trim(),
      );
      expect(labels).toEqual(['Draft', 'Sent', 'Paid', 'Overdue', 'Void']);
    }
  });

  it('renders the latest-invoice and top-customer detail cards', () => {
    const titles = Array.from(
      element.querySelectorAll('rpt-detail-card mat-card-title'),
    ).map((title) => title.textContent?.trim());
    expect(titles).toEqual(['Latest invoice', 'Top customer']);

    const latestInvoice = makeInvoices(120, 1).reduce((latest, invoice) =>
      invoice.issuedAt > latest.issuedAt ? invoice : latest,
    );
    const detailCards = element.querySelectorAll('rpt-detail-card');
    expect(detailCards[0].textContent).toContain(latestInvoice.number);
    expect(detailCards[1].textContent).toContain('Total billed');
  });

  it('composes the command-bar preset as a KPI strip with a compact detail row', () => {
    switchBrand('terminal');

    const labels = Array.from(
      element.querySelectorAll('rpt-kpi-strip .rpt-kpi-strip__label'),
    ).map((label) => label.textContent?.trim());
    expect(labels).toEqual(KPI_LABELS);

    // Revenue keeps its sparkline; cards and the grid are gone.
    expect(element.querySelector('rpt-kpi-strip .rpt-kpi-strip__sparkline polyline')).toBeTruthy();
    expect(element.querySelector('rpt-kpi-card')).toBeNull();
    expect(element.querySelectorAll('.dashboard__detail-row rpt-detail-card').length).toBe(2);

    // Charts run as a tight three-up row between the strip and the details.
    const strip = element.querySelector('.dashboard__chart-strip');
    expect(strip?.querySelectorAll('rpt-chart-card').length).toBe(3);
    expect(strip?.querySelector('rpt-line-chart svg')).toBeTruthy();
    expect(strip?.querySelector('rpt-bar-chart svg')).toBeTruthy();
    expect(strip?.querySelector('rpt-donut-chart svg')).toBeTruthy();
  });

  it('composes the contents-rail preset as a typeset figure stack with details beside', () => {
    switchBrand('ledger');

    const labels = Array.from(element.querySelectorAll('.dashboard__figure-label')).map(
      (label) => label.textContent?.trim(),
    );
    expect(labels).toEqual(KPI_LABELS);

    expect(element.querySelectorAll('.dashboard__figure-value').length).toBe(4);
    expect(element.querySelector('rpt-kpi-card')).toBeNull();
    expect(element.querySelectorAll('.dashboard__details rpt-detail-card').length).toBe(2);

    // Charts stack single-column in the broadsheet with editorial titles.
    const broadsheet = element.querySelector('.dashboard__broadsheet');
    expect(broadsheet?.querySelectorAll('rpt-chart-card').length).toBe(3);
    const titles = Array.from(broadsheet?.querySelectorAll('rpt-chart-card h2') ?? []).map(
      (title) => title.textContent?.trim(),
    );
    expect(titles).toEqual([
      'Receipts across the year',
      'Composition of the book',
      'The monthly account',
    ]);
  });

  it('keeps the card grid with sentiment corner accents for the pill-tabs preset', () => {
    switchBrand('field-guide');

    const cards = Array.from(element.querySelectorAll('rpt-kpi-card .rpt-kpi-card'));
    expect(
      cards.map((card) =>
        card.className
          .split(' ')
          .find((name) => name.startsWith('rpt-kpi-card--accent-')),
      ),
    ).toEqual([
      'rpt-kpi-card--accent-positive',
      'rpt-kpi-card--accent-neutral',
      'rpt-kpi-card--accent-negative',
      'rpt-kpi-card--accent-neutral',
    ]);

    // The default chart composition carries over: two-up row + wide bars.
    expect(element.querySelectorAll('.dashboard__chart-row rpt-chart-card').length).toBe(2);
    expect(element.querySelector('.dashboard__chart-wide rpt-bar-chart svg')).toBeTruthy();
  });
});
