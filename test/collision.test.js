import { describe, it, expect } from 'vitest';
import { createShip } from '../src/sim/ship.js';
import {
  checkGround, shipVsObjects, bulletsVsObjects, rocksVsShip,
} from '../src/sim/collision.js';
import { vec3 } from '../src/math/vec3.js';
import { height } from '../src/world/terrain.js';

describe('collision — ground (shadow projection)', () => {
  it('safe high above the pad', () => {
    const s = createShip();
    s.landed = false;
    s.pos.y -= 5;  // 5 tiles above ground (y is "altitude", down is greater)
    // Above ground in our y-up convention means y is greater than terrain.
    s.pos.y += 10; // make sure we're definitely above
    expect(checkGround(s)).toBe('safe');
  });

  it('snaps to launchpad when stable and at pad height', () => {
    const s = createShip();   // already at LAUNCHPAD_ALTITUDE - UNDERCARRIAGE_Y
    s.landed = false;
    s.vel = vec3();
    expect(checkGround(s)).toBe('land');
  });

  it('crashes if descent speed too high', () => {
    const s = createShip();
    s.landed = false;
    s.vel = vec3(0, -2, 0);   // way faster than LANDING_SPEED
    expect(checkGround(s)).toBe('crash');
  });

  it('crashes if tilted significantly when touching down', () => {
    const s = createShip();
    s.landed = false;
    s.pitch = 0.5;
    expect(checkGround(s)).toBe('crash');
  });
});

describe('collision — ship vs objects', () => {
  it('detects collision when ship sits on top of an object', () => {
    const s = createShip();
    // Spawn an obstacle right at the ship.
    const obj = { type: 'building', x: s.pos.x, z: s.pos.z, destroyed: false, yaw: 0, score: 25 };
    expect(shipVsObjects(s, [obj])).toBeTruthy();
  });

  it('no collision when far away', () => {
    const s = createShip();
    const obj = { type: 'building', x: s.pos.x + 50, z: s.pos.z + 50, destroyed: false, yaw: 0, score: 25 };
    expect(shipVsObjects(s, [obj])).toBeNull();
  });

  it('skips destroyed objects', () => {
    const s = createShip();
    const obj = { type: 'building', x: s.pos.x, z: s.pos.z, destroyed: true, yaw: 0, score: 25 };
    expect(shipVsObjects(s, [obj])).toBeNull();
  });
});

describe('collision — bullets vs objects', () => {
  it('finds a hit when bullet overlaps object xz at object height', () => {
    const obj = { type: 'building', x: 10, z: 10, destroyed: false, yaw: 0, score: 25 };
    // Find the actual ground altitude where the object sits and put the bullet
    // just above that — that's where the building's body lives.
    const y = height(10, 10) + 0.3;
    const b = { pos: vec3(10, y, 10), vel: vec3(), life: 30 };
    const hits = bulletsVsObjects([b], [obj]);
    expect(hits.length).toBe(1);
  });

  it('no hit when bullet is far above object', () => {
    const obj = { type: 'building', x: 10, z: 10, destroyed: false, yaw: 0, score: 25 };
    const b = { pos: vec3(10, 1000, 10), vel: vec3(), life: 30 };
    expect(bulletsVsObjects([b], [obj]).length).toBe(0);
  });
});

describe('collision — rocks vs ship', () => {
  it('detects rock at same position', () => {
    const s = createShip();
    const r = { pos: { ...s.pos }, vel: vec3(), rotation: 0, rotSpeed: 0, life: 100 };
    expect(rocksVsShip([r], s)).toBeTruthy();
  });
  it('no detection when far', () => {
    const s = createShip();
    const r = { pos: vec3(99, 99, 99), vel: vec3(), rotation: 0, rotSpeed: 0, life: 100 };
    expect(rocksVsShip([r], s)).toBeNull();
  });
});
