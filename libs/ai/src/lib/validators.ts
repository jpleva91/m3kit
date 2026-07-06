export function isM3kNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isM3kBoundedString(minLength = 1, maxLength = 2000) {
  return (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;
}

export function countM3kSentences(value: string): number {
  return value
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

export function hasM3kSentenceCount(expected: number) {
  return (value: unknown): value is string => typeof value === 'string' && countM3kSentences(value) === expected;
}

export function isM3kJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
