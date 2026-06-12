import {
  isReportError,
  isRetryableKind,
  REPORT_ERROR_KINDS,
  toReportError,
  type ReportError,
  type ReportErrorKind,
} from './report-error';

describe('REPORT_ERROR_KINDS', () => {
  it('covers the closed taxonomy exactly', () => {
    expect(REPORT_ERROR_KINDS).toEqual([
      'network',
      'timeout',
      'validation',
      'not-found',
      'forbidden',
      'internal',
      'unknown',
    ]);
  });
});

describe('isRetryableKind', () => {
  it('marks transient transport kinds as retryable', () => {
    expect(isRetryableKind('network')).toBe(true);
    expect(isRetryableKind('timeout')).toBe(true);
  });

  it('marks every other kind as not retryable', () => {
    const nonRetryable: ReportErrorKind[] = [
      'validation',
      'not-found',
      'forbidden',
      'internal',
      'unknown',
    ];
    for (const kind of nonRetryable) {
      expect(isRetryableKind(kind)).toBe(false);
    }
  });
});

describe('isReportError', () => {
  it('accepts a minimal valid shape', () => {
    expect(
      isReportError({ kind: 'network', message: 'offline', retryable: true }),
    ).toBe(true);
  });

  it('accepts optional correlationId and string-record details', () => {
    expect(
      isReportError({
        kind: 'internal',
        message: 'boom',
        retryable: false,
        correlationId: 'abc-123',
        details: { status: '500' },
      }),
    ).toBe(true);
  });

  it('rejects kinds outside the closed taxonomy', () => {
    expect(
      isReportError({ kind: 'rate-limited', message: 'x', retryable: true }),
    ).toBe(false);
  });

  it('rejects missing or mistyped required fields', () => {
    expect(isReportError({ kind: 'network', message: 'x' })).toBe(false);
    expect(isReportError({ kind: 'network', retryable: true })).toBe(false);
    expect(
      isReportError({ kind: 'network', message: 42, retryable: true }),
    ).toBe(false);
    expect(
      isReportError({ kind: 'network', message: 'x', retryable: 'yes' }),
    ).toBe(false);
  });

  it('rejects non-string details values and non-record details', () => {
    expect(
      isReportError({
        kind: 'network',
        message: 'x',
        retryable: true,
        details: { count: 3 },
      }),
    ).toBe(false);
    expect(
      isReportError({
        kind: 'network',
        message: 'x',
        retryable: true,
        details: ['nope'],
      }),
    ).toBe(false);
  });

  it('rejects primitives and null', () => {
    expect(isReportError(null)).toBe(false);
    expect(isReportError(undefined)).toBe(false);
    expect(isReportError('error')).toBe(false);
    expect(isReportError(42)).toBe(false);
  });
});

describe('toReportError', () => {
  it('passes through values that already satisfy the shape', () => {
    const error: ReportError = {
      kind: 'forbidden',
      message: 'No access to this report.',
      retryable: false,
      correlationId: 'req-7',
    };
    expect(toReportError(error)).toBe(error);
  });

  it('normalizes an Error, using its message', () => {
    expect(toReportError(new Error('fetch exploded'))).toEqual({
      kind: 'unknown',
      message: 'fetch exploded',
      retryable: false,
    });
  });

  it('normalizes an Error with an empty message to the fallback text', () => {
    const result = toReportError(new Error(''));
    expect(result.kind).toBe('unknown');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('normalizes a non-empty string into the message', () => {
    expect(toReportError('the backend said no', 'internal')).toEqual({
      kind: 'internal',
      message: 'the backend said no',
      retryable: false,
    });
  });

  it('normalizes unknown values to a generic message without leaking them', () => {
    for (const value of [undefined, null, 42, { strange: true }, [], '   ']) {
      const result = toReportError(value);
      expect(result.kind).toBe('unknown');
      expect(result.retryable).toBe(false);
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.message).not.toContain('strange');
    }
  });

  it('honors the fallbackKind and derives retryable from it', () => {
    expect(toReportError(new Error('offline'), 'network')).toEqual({
      kind: 'network',
      message: 'offline',
      retryable: true,
    });
    expect(toReportError(new Error('too slow'), 'timeout').retryable).toBe(
      true,
    );
    expect(toReportError(new Error('bad input'), 'validation').retryable).toBe(
      false,
    );
  });

  it('never throws, even for hostile objects', () => {
    const hostile = new Proxy(
      {},
      {
        get(): never {
          throw new Error('gotcha');
        },
        has(): never {
          throw new Error('gotcha');
        },
      },
    );
    expect(() => toReportError(hostile)).not.toThrow();
    const result = toReportError(hostile);
    expect(result.kind).toBe('unknown');
    expect(result.retryable).toBe(false);
  });
});
