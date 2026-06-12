import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import type { ExportResult } from '@m3kit/core';

import { ExportDownloadService } from './export-download';

function successResult(overrides: Partial<Extract<ExportResult, { kind: 'success' }>> = {}): Extract<ExportResult, { kind: 'success' }> {
  return {
    kind: 'success',
    request: {
      reportId: 'invoices',
      format: 'csv',
      scope: 'page',
      fileBaseName: 'Invoices',
      query: { version: 1 },
      columns: [{ key: 'number', header: 'Invoice #' }],
      requestedAt: '2026-06-12T10:00:00.000Z',
    },
    filename: 'invoices_2026-06-12.csv',
    mediaType: 'text/csv',
    content: 'Invoice #\r\nINV-2026-0001',
    rowCount: 1,
    ...overrides,
  };
}

describe('ExportDownloadService', () => {
  let service: ExportDownloadService;
  let createObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>;
  let clicked: HTMLAnchorElement[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportDownloadService);
    clicked = [];
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:demo-export');
    revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(this: HTMLAnchorElement) {
      clicked.push(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a blob from the ExportResult content and triggers an anchor download with the ExportResult filename', () => {
    const result = successResult({
      filename: 'customer-aging_2026-06-12.json',
      mediaType: 'application/json',
      content: '[{"id":"C-1"}]',
    });

    service.download(result);

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectUrlSpy.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/json');
    expect(clicked).toHaveLength(1);
    expect(clicked[0].download).toBe('customer-aging_2026-06-12.json');
    expect(clicked[0].href).toBe('blob:demo-export');
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:demo-export');
  });

  it('uses the injected document to create the anchor and does not append it to the DOM', () => {
    const documentRef = TestBed.inject(DOCUMENT);
    const createElementSpy = vi.spyOn(documentRef, 'createElement');

    service.download(successResult());

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(documentRef.querySelector('a[download="invoices_2026-06-12.csv"]')).toBeNull();
  });

  it('does not create a Blob or click an anchor for failed export results', () => {
    const failedResult: ExportResult = {
      kind: 'error',
      request: successResult().request,
      error: { kind: 'internal', message: 'Export failed', retryable: false },
    };

    service.download(failedResult);

    expect(createObjectUrlSpy).not.toHaveBeenCalled();
    expect(clicked).toEqual([]);
  });
});
