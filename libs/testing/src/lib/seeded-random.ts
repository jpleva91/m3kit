/**
 * Tiny deterministic PRNG (mulberry32) so synthetic fixtures are fully
 * reproducible: the same seed always yields the same sequence.
 */
export interface SeededRandom {
  /** Next pseudo-random float in `[0, 1)`. */
  next(): number;
  /** Next pseudo-random integer in `[min, max]` (inclusive). */
  nextInt(min: number, max: number): number;
  /** Picks one item from a non-empty list, deterministically. */
  pick<T>(items: readonly T[]): T;
}

/**
 * Creates a mulberry32 generator seeded with the given integer.
 */
export function createSeededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    nextInt(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error('pick() requires a non-empty list');
      }
      return items[Math.floor(next() * items.length)];
    },
  };
}
