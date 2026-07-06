import { countM3kSentences, hasM3kSentenceCount, isM3kBoundedString, isM3kJsonObject } from './validators';

describe('m3k ai validators', () => {
  it('checks bounded strings and sentence counts', () => {
    expect(isM3kBoundedString(2, 4)('abc')).toBe(true);
    expect(isM3kBoundedString(2, 4)('abcdef')).toBe(false);
    expect(countM3kSentences('One. Two!')).toBe(2);
    expect(hasM3kSentenceCount(2)('One. Two!')).toBe(true);
  });

  it('identifies JSON object outputs', () => {
    expect(isM3kJsonObject({ ok: true })).toBe(true);
    expect(isM3kJsonObject(['no'])).toBe(false);
  });
});
