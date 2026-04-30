import { describe, it, expect } from 'vitest';
import {
  vec3, add, sub, mul, dot, cross, length, normalize, lerp,
} from '../src/math/vec3.js';

describe('vec3', () => {
  it('constructs', () => {
    expect(vec3(1, 2, 3)).toEqual({ x: 1, y: 2, z: 3 });
    expect(vec3()).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('adds, subtracts, scales', () => {
    expect(add(vec3(1, 2, 3), vec3(4, 5, 6))).toEqual({ x: 5, y: 7, z: 9 });
    expect(sub(vec3(4, 5, 6), vec3(1, 2, 3))).toEqual({ x: 3, y: 3, z: 3 });
    expect(mul(vec3(1, 2, 3), 2)).toEqual({ x: 2, y: 4, z: 6 });
  });

  it('dot product', () => {
    expect(dot(vec3(1, 2, 3), vec3(4, -5, 6))).toBe(4 - 10 + 18);
    expect(dot(vec3(1, 0, 0), vec3(0, 1, 0))).toBe(0);
  });

  it('cross product (right-handed)', () => {
    const c = cross(vec3(1, 0, 0), vec3(0, 1, 0));
    expect(c).toEqual({ x: 0, y: 0, z: 1 });
  });

  it('length and normalize', () => {
    expect(length(vec3(3, 4, 0))).toBe(5);
    const n = normalize(vec3(3, 4, 0));
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(length(n)).toBeCloseTo(1);
  });

  it('normalize zero vector returns zero', () => {
    expect(normalize(vec3(0, 0, 0))).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('lerp', () => {
    expect(lerp(vec3(0, 0, 0), vec3(10, 20, 30), 0.5)).toEqual({ x: 5, y: 10, z: 15 });
  });
});
