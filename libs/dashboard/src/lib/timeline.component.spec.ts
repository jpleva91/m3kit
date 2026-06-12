import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineComponent, TimelineEvent } from './timeline.component';

@Component({
  imports: [TimelineComponent],
  template: `<m3k-timeline [events]="events" />`,
})
class HostComponent {
  events: readonly TimelineEvent[] = [
    {
      id: 'evt-1',
      title: 'Ticket created',
      timestamp: '2026-05-28 09:14',
      description: 'Customer reported a failed export on the invoices report.',
      icon: 'confirmation_number',
    },
    {
      id: 'evt-2',
      title: 'Escalated to engineering',
      timestamp: '2026-05-28 11:02',
      kind: 'warning',
    },
    { id: 'evt-3', title: 'Fix deployed', timestamp: '2026-05-29 16:40', kind: 'success' },
  ];
}

describe('TimelineComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const events = (): readonly Element[] =>
    Array.from(element().querySelectorAll('.m3k-timeline__event'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one list item per event inside an ordered list', () => {
    expect(element().querySelector('ol.m3k-timeline')).not.toBeNull();
    expect(events().length).toBe(3);
    expect(events()[0].querySelector('.m3k-timeline__title')?.textContent?.trim()).toBe(
      'Ticket created',
    );
  });

  it('renders the timestamp as a time element with a datetime attribute', () => {
    const time = events()[0].querySelector('time.m3k-timeline__timestamp');
    expect(time?.textContent?.trim()).toBe('2026-05-28 09:14');
    expect(time?.getAttribute('datetime')).toBe('2026-05-28 09:14');
  });

  it('renders the description only when given', () => {
    expect(events()[0].querySelector('.m3k-timeline__description')?.textContent?.trim()).toBe(
      'Customer reported a failed export on the invoices report.',
    );
    expect(events()[1].querySelector('.m3k-timeline__description')).toBeNull();
  });

  it('tints markers by kind, defaulting to info', () => {
    const markers = events().map((event) => event.querySelector('.m3k-timeline__marker'));
    expect(markers[0]?.classList).toContain('m3k-timeline__marker--info');
    expect(markers[1]?.classList).toContain('m3k-timeline__marker--warning');
    expect(markers[2]?.classList).toContain('m3k-timeline__marker--success');

    host.events = [{ id: 'evt-9', title: 'Export failed', timestamp: '2026-05-30', kind: 'error' }];
    fixture.detectChanges();
    expect(element().querySelector('.m3k-timeline__marker')?.classList).toContain(
      'm3k-timeline__marker--error',
    );
  });

  it('renders the optional icon inside the marker', () => {
    const withIcon = events()[0].querySelector('.m3k-timeline__marker');
    expect(withIcon?.classList).toContain('m3k-timeline__marker--with-icon');
    expect(withIcon?.querySelector('.m3k-timeline__marker-icon')?.textContent?.trim()).toBe(
      'confirmation_number',
    );

    const withoutIcon = events()[1].querySelector('.m3k-timeline__marker');
    expect(withoutIcon?.classList).not.toContain('m3k-timeline__marker--with-icon');
    expect(withoutIcon?.querySelector('.m3k-timeline__marker-icon')).toBeNull();
  });

  it('draws connectors between events but not after the last one', () => {
    expect(element().querySelectorAll('.m3k-timeline__connector').length).toBe(2);
    expect(events()[2].querySelector('.m3k-timeline__connector')).toBeNull();
  });

  it('hides the decorative rail from assistive technology', () => {
    expect(events()[0].querySelector('.m3k-timeline__rail')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});
