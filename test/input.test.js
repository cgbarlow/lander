import { describe, it, expect } from 'vitest';
import { applyMouseDelta, applyDamping } from '../src/input.js';

describe('input', () => {
  it('applyMouseDelta accumulates and clamps', () => {
    const s = { pitch: 0, roll: 0 };
    applyMouseDelta(s, 100, 50, 0.01);
    expect(s.roll).toBeCloseTo(1.0);    // clamped at 1
    expect(s.pitch).toBeCloseTo(0.5);
    applyMouseDelta(s, 100, 0, 0.01);   // try to push past
    expect(s.roll).toBe(1);             // still clamped
  });

  it('applyDamping moves halfway by default (faithful equation)', () => {
    expect(applyDamping(1, 0)).toBeCloseTo(0.5);
    expect(applyDamping(0.5, 0)).toBeCloseTo(0.25);
    // Three iterations of "halfway to zero"
    let v = 1;
    for (let i = 0; i < 10; i++) v = applyDamping(v, 0);
    expect(v).toBeCloseTo(1 / 1024, 5);
  });

  it('applyDamping converges toward target', () => {
    let v = 0;
    for (let i = 0; i < 20; i++) v = applyDamping(v, 1);
    expect(v).toBeCloseTo(1, 4);
  });
});
