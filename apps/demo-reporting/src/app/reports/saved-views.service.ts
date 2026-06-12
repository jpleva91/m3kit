import { Injectable, computed, inject, signal } from '@angular/core';
import {
  applySavedView,
  createSavedView,
  serializeDataQuery,
  type AppliedSavedView,
  type ColumnViewState,
  type DataQuery,
  type SavedView,
} from '@m3kit/core';
import { REPORT_TELEMETRY_REPORTER } from '@m3kit/state';
import { INVOICES_TABLE_DEFINITION } from '@m3kit/testing';

interface CreateInvoiceSavedViewInput {
  readonly name: string;
  readonly description?: string;
  readonly query: DataQuery;
  readonly columns?: readonly ColumnViewState[];
  readonly viewId?: string;
}

const REPORT_ID = INVOICES_TABLE_DEFINITION.id;
const AUTHORED_VIEW_DATE = new Date('2026-06-12T00:00:00.000Z');

function invoiceView(input: CreateInvoiceSavedViewInput): SavedView {
  return createSavedView(
    {
      reportId: REPORT_ID,
      viewId: input.viewId ?? viewIdFromName(input.name),
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      query: serializeDataQuery(input.query),
      ...(input.columns !== undefined ? { columns: input.columns } : {}),
    },
    AUTHORED_VIEW_DATE,
  );
}

const SEEDED_INVOICE_VIEWS: readonly SavedView[] = [
  invoiceView({
    viewId: 'invoices-overdue',
    name: 'Overdue invoices',
    description: 'Invoices that are overdue, due soonest first.',
    query: {
      filter: { fields: { status: 'overdue' } },
      sort: { key: 'dueAt', direction: 'asc' },
      page: { index: 0, size: INVOICES_TABLE_DEFINITION.defaultPageSize ?? 10 },
    },
    columns: [{ key: 'amount', pinned: 'end' }],
  }),
  invoiceView({
    viewId: 'invoices-high-value-recent',
    name: 'High-value recent',
    description: 'Largest recent invoices with secondary columns hidden.',
    query: {
      filter: {},
      sort: { key: 'amount', direction: 'desc' },
      page: { index: 0, size: INVOICES_TABLE_DEFINITION.defaultPageSize ?? 10 },
    },
    columns: [
      { key: 'number' },
      { key: 'customerName' },
      { key: 'amount', pinned: 'end' },
      { key: 'status' },
      { key: 'issuedAt', visible: false },
      { key: 'dueAt', visible: false },
    ],
  }),
];

@Injectable()
export class SavedViewsService {
  private readonly telemetry = inject(REPORT_TELEMETRY_REPORTER);
  private readonly registry = signal<readonly SavedView[]>(SEEDED_INVOICE_VIEWS);
  private nextId = 1;

  readonly views = computed(() => this.registry());

  create(input: CreateInvoiceSavedViewInput): SavedView {
    const view = createSavedView(
      {
        reportId: REPORT_ID,
        viewId: input.viewId ?? this.nextViewId(input.name),
        name: input.name,
        ...(input.description !== undefined ? { description: input.description } : {}),
        query: serializeDataQuery(input.query),
        ...(input.columns !== undefined ? { columns: input.columns } : {}),
      },
      new Date(),
    );

    this.registry.update((views) => [...views, view]);
    this.report('report.saved_view_created', view.viewId);
    return view;
  }

  apply(viewId: string): AppliedSavedView | null {
    const view = this.registry().find((candidate) => candidate.viewId === viewId);
    if (view === undefined) {
      return null;
    }

    const applied = applySavedView(view, INVOICES_TABLE_DEFINITION);
    if (applied !== null) {
      this.report('report.saved_view_applied', view.viewId);
    }
    return applied;
  }

  delete(viewId: string): boolean {
    const before = this.registry();
    if (!before.some((view) => view.viewId === viewId)) {
      return false;
    }

    this.registry.set(before.filter((view) => view.viewId !== viewId));
    this.report('report.saved_view_deleted', viewId);
    return true;
  }

  private nextViewId(name: string): string {
    const base = viewIdFromName(name);
    let candidate = base;
    const existing = new Set(this.registry().map((view) => view.viewId));
    while (existing.has(candidate)) {
      candidate = `${base}-${this.nextId++}`;
    }
    return candidate;
  }

  private report(
    type:
      | 'report.saved_view_created'
      | 'report.saved_view_applied'
      | 'report.saved_view_deleted',
    viewId: string,
  ): void {
    this.telemetry.report({
      type,
      reportId: REPORT_ID,
      viewId,
      at: new Date().toISOString(),
    });
  }
}

function viewIdFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `invoices-${slug || 'view'}`;
}
