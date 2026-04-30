import { describe, it, expect } from 'vitest';
import { makeRng, randInt, randRange } from '../src/math/rng.js';

describe('rng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeRng(123);
    const b = makeRng(123);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces values in [0, 1)', () => {
    const r = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different streams', () => {
    const a = makeRng(1)();
    const b = makeRng(2)();
    expect(a).not.toBe(b);
  });

  it('randInt within bounds', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) {
      const n = randInt(r, 10);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(10);
    }
  });

  it('randRange within bounds', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) {
      const v = randRange(r, -5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(5);
    }
  });
});
