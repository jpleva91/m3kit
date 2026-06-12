import { TestBed } from '@angular/core/testing';
import {
  applySavedView,
  type ReportTelemetryEvent,
  type SavedView,
} from '@m3kit/core';
import { REPORT_TELEMETRY_REPORTER } from '@m3kit/state';
import { INVOICES_TABLE_DEFINITION } from '@m3kit/testing';

import { SavedViewsService } from './saved-views.service';

function createService(events: ReportTelemetryEvent[] = []): SavedViewsService {
  TestBed.configureTestingModule({
    providers: [
      SavedViewsService,
      {
        provide: REPORT_TELEMETRY_REPORTER,
        useValue: { report: (event: ReportTelemetryEvent) => events.push(event) },
      },
    ],
  });
  return TestBed.inject(SavedViewsService);
}

describe('SavedViewsService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('seeds two authored invoice saved views created through the SavedView contract', () => {
    const service = createService();

    expect(service.views().map((view) => view.name)).toEqual([
      'Overdue invoices',
      'High-value recent',
    ]);
    expect(service.views().every((view) => view.reportId === INVOICES_TABLE_DEFINITION.id)).toBe(true);
    expect(service.views().every((view) => view.version === 1)).toBe(true);
    expect(service.views().map((view) => view.createdAt)).toEqual([
      '2026-06-12T00:00:00.000Z',
      '2026-06-12T00:00:00.000Z',
    ]);
  });

  it('applies seeded views through applySavedView and emits applied telemetry', () => {
    const events: ReportTelemetryEvent[] = [];
    const service = createService(events);
    const overdue = service.views().find((view) => view.name === 'Overdue invoices') as SavedView;

    const applied = service.apply(overdue.viewId);

    expect(applied).toEqual(applySavedView(overdue, INVOICES_TABLE_DEFINITION));
    expect(applied?.query.filter.fields).toEqual({ status: 'overdue' });
    expect(applied?.query.sort).toEqual({ key: 'dueAt', direction: 'asc' });
    expect(applied?.columns).toContainEqual({ key: 'amount', pinned: 'end' });
    expect(events).toEqual([
      {
        type: 'report.saved_view_applied',
        reportId: INVOICES_TABLE_DEFINITION.id,
        viewId: overdue.viewId,
        at: '2026-06-12T00:00:00.000Z',
      },
    ]);
  });

  it('creates and deletes in-memory views while reporting telemetry', () => {
    const events: ReportTelemetryEvent[] = [];
    const service = createService(events);

    const created = service.create({
      name: 'Paid by amount',
      query: {
        filter: { fields: { status: 'paid' } },
        sort: { key: 'amount', direction: 'desc' },
        page: { index: 0, size: 10 },
      },
      columns: [{ key: 'dueAt', visible: false }],
    });

    expect(service.views()).toContain(created);
    expect(created.reportId).toBe(INVOICES_TABLE_DEFINITION.id);
    expect(events.at(-1)).toEqual({
      type: 'report.saved_view_created',
      reportId: INVOICES_TABLE_DEFINITION.id,
      viewId: created.viewId,
      at: '2026-06-12T00:00:00.000Z',
    });

    expect(service.delete(created.viewId)).toBe(true);
    expect(service.views()).not.toContain(created);
    expect(service.delete(created.viewId)).toBe(false);
    expect(events.at(-1)).toEqual({
      type: 'report.saved_view_deleted',
      reportId: INVOICES_TABLE_DEFINITION.id,
      viewId: created.viewId,
      at: '2026-06-12T00:00:00.000Z',
    });
  });
});
