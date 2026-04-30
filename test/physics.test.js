import { describe, it, expect } from 'vitest';
import { createShip, stepShip, isSafeToLand, refuel } from '../src/sim/ship.js';
import {
  GRAVITY, FUEL_MAX, FUEL_BURN_FULL, VELOCITY_DAMPING, LAUNCHPAD_ALTITUDE,
  UNDERCARRIAGE_Y, REFUEL_RATE,
} from '../src/constants.js';

const idle = { pitch: 0, roll: 0, thrust: false, hover: false, fire: false };

describe('physics', () => {
  it('createShip starts on the launchpad with full fuel', () => {
    const s = createShip();
    expect(s.fuel).toBe(FUEL_MAX);
    expect(s.pos.y).toBeCloseTo(LAUNCHPAD_ALTITUDE + UNDERCARRIAGE_Y);
    expect(s.vel.y).toBe(0);
  });

  it('gravity pulls vy negative each step', () => {
    const s = createShip();
    s.landed = false;
    stepShip(s, idle);
    expect(s.vel.y).toBeLessThan(0);
  });

  it('damping reduces velocity by exactly 1 - 1/64 per step (no thrust)', () => {
    const s = createShip();
    s.vel = { x: 1, y: 0, z: 0 };  // start at zero gravity isn't possible, but x is unaffected by gravity
    s.landed = false;
    stepShip(s, idle);
    // vx_after = vx_before * VELOCITY_DAMPING
    expect(s.vel.x).toBeCloseTo(1 * VELOCITY_DAMPING, 5);
  });

  it('full thrust burns fuel', () => {
    const s = createShip();
    s.landed = false;
    const before = s.fuel;
    stepShip(s, { ...idle, thrust: true });
    expect(s.fuel).toBeLessThan(before);
    expect(before - s.fuel).toBeCloseTo(FUEL_BURN_FULL, 5);
  });

  it('idle does not burn fuel', () => {
    const s = createShip();
    s.landed = false;
    const before = s.fuel;
    stepShip(s, idle);
    expect(s.fuel).toBe(before);
  });

  it('zero fuel disables the engine even with thrust pressed', () => {
    const s = createShip();
    s.fuel = 0;
    s.landed = false;
    const before = { ...s.vel };
    stepShip(s, { ...idle, thrust: true });
    // The only velocity change should be gravity + damping, not thrust upward.
    // vy must decrease (gravity won) — meaning thrust did not fire.
    expect(s.vel.y).toBeLessThan(before.y);
  });

  it('isSafeToLand requires small tilt and small velocities', () => {
    const s = createShip();
    expect(isSafeToLand(s)).toBe(true);
    s.vel.y = -0.5;
    expect(isSafeToLand(s)).toBe(false);
  });

  it('refuel adds REFUEL_RATE per call up to FUEL_MAX', () => {
    const s = createShip();
    s.fuel = 100;
    refuel(s);
    expect(s.fuel).toBe(100 + REFUEL_RATE);
    s.fuel = FUEL_MAX - 1;
    refuel(s);
    expect(s.fuel).toBe(FUEL_MAX);
  });
});
