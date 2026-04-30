import { describe, it, expect } from 'vitest';
import { rawHeight, height, isLaunchpad, tileType, tileColor } from '../src/world/terrain.js';
import { LAND_MID_HEIGHT, LAUNCHPAD_ALTITUDE, SEA_LEVEL, LAUNCHPAD_SIZE } from '../src/constants.js';

describe('terrain', () => {
  it('rawHeight at origin equals LAND_MID_HEIGHT (sin(0)=0)', () => {
    expect(rawHeight(0, 0)).toBeCloseTo(LAND_MID_HEIGHT);
  });

  it('rawHeight is periodic in 2π for x', () => {
    const a = rawHeight(0.1, 0.2);
    const b = rawHeight(0.1 + 2 * Math.PI, 0.2);
    // Not exactly periodic because coefficients are integer multiples of x and z;
    // each term is periodic in 2π so the whole sum is too.
    expect(a).toBeCloseTo(b, 6);
  });

  it('rawHeight is periodic in 2π for z', () => {
    const a = rawHeight(0.3, 0.4);
    const b = rawHeight(0.3, 0.4 + 2 * Math.PI);
    expect(a).toBeCloseTo(b, 6);
  });

  it('isLaunchpad covers the 8x8 patch around origin', () => {
    expect(isLaunchpad(0, 0)).toBe(true);
    expect(isLaunchpad(LAUNCHPAD_SIZE / 2 - 0.1, 0)).toBe(true);
    expect(isLaunchpad(LAUNCHPAD_SIZE / 2 + 0.1, 0)).toBe(false);
  });

  it('height on the pad equals LAUNCHPAD_ALTITUDE', () => {
    expect(height(0, 0)).toBe(LAUNCHPAD_ALTITUDE);
    expect(height(2, -1)).toBe(LAUNCHPAD_ALTITUDE);
  });

  it('tileType identifies pad / sea / grass', () => {
    expect(tileType(0, 0)).toBe('launchpad');
    // In y-up: sea is where rawHeight dips BELOW SEA_LEVEL.
    let foundSea = false;
    for (let x = 10; x < 200; x += 0.7) {
      for (let z = 10; z < 200; z += 0.7) {
        if (rawHeight(x, z) < SEA_LEVEL) {
          expect(tileType(x, z)).toBe('sea');
          foundSea = true;
          break;
        }
      }
      if (foundSea) break;
    }
    expect(foundSea).toBe(true);
  });

  it('tileColor returns a string starting with rgb(', () => {
    const c = tileColor(20, 20, 0, 5);
    expect(c.startsWith('rgb(')).toBe(true);
  });
});
