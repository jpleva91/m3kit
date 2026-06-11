import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ChartCardComponent } from './chart-card.component';

@Component({
  imports: [ChartCardComponent],
  template: `
    <rpt-chart-card
      [title]="title"
      [subtitle]="subtitle"
      [loading]="loading"
      [empty]="empty"
      [emptyMessage]="emptyMessage"
    >
      <svg class="test-chart"></svg>
      <span rptChartCardLegend class="test-legend">legend</span>
    </rpt-chart-card>
  `,
})
class HostComponent {
  title = 'Revenue';
  subtitle: string | null = null;
  loading = false;
  empty = false;
  emptyMessage = 'No data to display.';
}

describe('ChartCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (selector: string): string | undefined =>
    element().querySelector(selector)?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title as an h2 and projects the chart and legend', () => {
    const title = element().querySelector('h2.rpt-chart-card__title');
    expect(title?.textContent?.trim()).toBe('Revenue');
    expect(element().querySelector('.test-chart')).not.toBeNull();
    expect(element().querySelector('.rpt-chart-card__legend .test-legend')).not.toBeNull();
  });

  it('hides the subtitle until one is provided', () => {
    expect(element().querySelector('.rpt-chart-card__subtitle')).toBeNull();

    host.subtitle = 'Last 6 months';
    fixture.detectChanges();
    expect(text('.rpt-chart-card__subtitle')).toBe('Last 6 months');
  });

  it('swaps the chart for a progress bar while loading', () => {
    host.loading = true;
    fixture.detectChanges();

    expect(element().querySelector('mat-progress-bar.rpt-chart-card__progress')).not.toBeNull();
    expect(element().querySelector('.test-chart')).toBeNull();
    expect(element().querySelector('.rpt-chart-card__empty')).toBeNull();
  });

  it('swaps the chart for the empty message when empty', () => {
    host.empty = true;
    fixture.detectChanges();

    expect(text('.rpt-chart-card__empty')).toBe('No data to display.');
    expect(element().querySelector('.test-chart')).toBeNull();

    host.emptyMessage = 'Nothing invoiced yet.';
    fixture.detectChanges();
    expect(text('.rpt-chart-card__empty')).toBe('Nothing invoiced yet.');
  });

  it('prefers the loading state over the empty state', () => {
    host.loading = true;
    host.empty = true;
    fixture.detectChanges();

    expect(element().querySelector('.rpt-chart-card__progress')).not.toBeNull();
    expect(element().querySelector('.rpt-chart-card__empty')).toBeNull();
  });
});
