import { getM3kAiSkipReason } from './heuristics';

describe('getM3kAiSkipReason', () => {
  it('prioritizes explicit and capability skip reasons', () => {
    expect(getM3kAiSkipReason({ explicitlyDisabled: true, saveData: true })).toBe('disabled');
    expect(getM3kAiSkipReason({ workerSupported: false })).toBe('worker_unsupported');
  });

  it('skips save-data, slow connections, and low storage', () => {
    expect(getM3kAiSkipReason({ saveData: true })).toBe('save_data');
    expect(getM3kAiSkipReason({ effectiveType: '2g' })).toBe('slow_connection');
    expect(getM3kAiSkipReason({ quotaBytes: 100, usageBytes: 80, minRemainingStorageBytes: 50 })).toBe('low_storage');
  });

  it('returns null when the browser looks acceptable', () => {
    expect(getM3kAiSkipReason({ quotaBytes: 500, usageBytes: 100, minRemainingStorageBytes: 50 })).toBeNull();
  });
});
