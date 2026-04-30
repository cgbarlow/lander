import { describe, it, expect } from 'vitest';
import { identity, mulVec, mulMat, rotX, rotY, rotZ, shipOrientation, transpose } from '../src/math/mat3.js';
import { vec3 } from '../src/math/vec3.js';

describe('mat3', () => {
  it('identity leaves vectors unchanged', () => {
    const v = vec3(1, 2, 3);
    expect(mulVec(identity(), v)).toEqual(v);
  });

  it('rotX 90° rotates +y to +z', () => {
    const r = rotX(Math.PI / 2);
    const v = mulVec(r, vec3(0, 1, 0));
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(1);
  });

  it('rotY 90° (right-handed) rotates +z to +x', () => {
    // Right-hand rule, thumb +Y, fingers curl from +Z toward +X.
    const r = rotY(Math.PI / 2);
    const v = mulVec(r, vec3(0, 0, 1));
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('rotZ 90° rotates +x to +y', () => {
    const r = rotZ(Math.PI / 2);
    const v = mulVec(r, vec3(1, 0, 0));
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
  });

  it('mulMat composes rotations', () => {
    const r = mulMat(rotZ(Math.PI / 2), rotX(Math.PI / 2));
    const v = mulVec(r, vec3(0, 1, 0));
    // X 90°: (0,1,0) → (0,0,1); then Z 90°: (0,0,1) → (0,0,1) (Z axis untouched)
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(1);
  });

  it('shipOrientation(0,0) is identity', () => {
    const m = shipOrientation(0, 0);
    expect(mulVec(m, vec3(1, 0, 0))).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('transpose round-trips', () => {
    const r = rotX(0.7);
    expect(transpose(transpose(r))).toEqual(r);
  });
});
