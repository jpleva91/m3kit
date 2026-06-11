import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { makeInvoices, makeSupportTickets } from '@m3kit/testing';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders four KPI cards inside the dashboard grid', () => {
    const labels = Array.from(
      element.querySelectorAll('rpt-dashboard-grid rpt-kpi-card .rpt-kpi-card__label'),
    ).map((label) => label.textContent?.trim());
    expect(labels).toEqual(['Total revenue', 'Open invoices', 'Overdue', 'Open tickets']);
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
});
