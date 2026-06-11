import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportToolbarComponent } from './report-toolbar.component';

@Component({
  imports: [ReportToolbarComponent],
  template: `
    <rpt-report-toolbar [title]="title" [rowCount]="rowCount">
      <button class="export-action" type="button">Export</button>
    </rpt-report-toolbar>
  `,
})
class HostComponent {
  title = 'Support Tickets';
  rowCount: number | null = null;
}

describe('ReportToolbarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title', () => {
    expect(element().querySelector('.rpt-report-toolbar__title')?.textContent).toBe(
      'Support Tickets',
    );
  });

  it('hides the row count when null and shows it when set', () => {
    expect(element().querySelector('.rpt-report-toolbar__count')).toBeNull();

    host.rowCount = 42;
    fixture.detectChanges();

    expect(
      element().querySelector('.rpt-report-toolbar__count')?.textContent?.trim(),
    ).toBe('42 rows');
  });

  it('projects action content', () => {
    expect(element().querySelector('.export-action')?.textContent).toBe('Export');
  });
});
