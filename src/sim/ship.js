// Ship state and per-step update — orientation, fuel, engines.
// References:
//   * Lander.arm:MoveAndDrawPlayer @ 1734
//   * Lander.arm: physics block @ 1900-2050
//   * deep_dive: flying_by_mouse.html

import {
  GRAVITY, THRUST_FULL, THRUST_HOVER,
  VELOCITY_DAMPING, HIGHEST_ALTITUDE, LAUNCHPAD_ALTITUDE,
  FUEL_MAX, FUEL_BURN_FULL, FUEL_BURN_HOVER, REFUEL_RATE,
  TILT_DAMPING, MAX_TILT, UNDERCARRIAGE_Y, LANDING_SPEED,
} from '../constants.js';
import { vec3 } from '../math/vec3.js';
import { shipOrientation, mulVec } from '../math/mat3.js';

export function createShip() {
  return {
    // Sit on the pad: undercarriage touches LAUNCHPAD_ALTITUDE, so the
    // ship centre is one undercarriage-height above that.
    pos: vec3(0, LAUNCHPAD_ALTITUDE + UNDERCARRIAGE_Y, 0),
    vel: vec3(0, 0, 0),
    pitch: 0,    // forward/back tilt (radians)
    roll: 0,     // left/right tilt (radians)
    fuel: FUEL_MAX,
    landed: true,
    crashed: false,
  };
}

/** Apply one fixed timestep of physics to the ship. */
export function stepShip(ship, input) {
  if (ship.crashed) return;

  // While sitting on the pad with no thrust pressed, the ship just rests:
  // no gravity, no drift. Pressing thrust (or hover) commits to take-off.
  if (ship.landed && !input.thrust && !input.hover) {
    return;
  }

  // --- Tilt damping (Lander.arm: deep_dive flying_by_mouse) -------------
  // target tilt magnitudes from the input's virtual cursor (-1..+1)
  const targetPitch = input.pitch * MAX_TILT;
  const targetRoll  = input.roll  * MAX_TILT;
  ship.pitch -= (ship.pitch - targetPitch) * TILT_DAMPING;
  ship.roll  -= (ship.roll  - targetRoll ) * TILT_DAMPING;

  // --- Engines ----------------------------------------------------------
  const orient = shipOrientation(ship.pitch, ship.roll);
  // Local thrust axis is +Y (up). The original applies thrust along the
  // ship's "down" because the thruster points down — but it ALSO flips
  // sign because gravity is positive-y. In our y-up world, thrust is +Y
  // in local space, transformed to world by orient.
  const localThrust = vec3(0, 1, 0);
  const worldThrust = mulVec(orient, localThrust);

  let thrustMag = 0;
  let burn = 0;

  // Engines cut off above the highest altitude (Lander.arm:HIGHEST_ALTITUDE)
  if (ship.fuel > 0 && ship.pos.y < HIGHEST_ALTITUDE) {
    if (input.thrust) {
      thrustMag = THRUST_FULL;
      burn = FUEL_BURN_FULL;
    } else if (input.hover) {
      thrustMag = THRUST_HOVER;
      burn = FUEL_BURN_HOVER;
    }
  }

  ship.fuel = Math.max(0, ship.fuel - burn);

  // --- Integrate velocity ----------------------------------------------
  // Gravity always pulls down (-y in our coord system).
  ship.vel.y -= GRAVITY;
  ship.vel.x += worldThrust.x * thrustMag;
  ship.vel.y += worldThrust.y * thrustMag;
  ship.vel.z += worldThrust.z * thrustMag;

  // Friction (×63/64 per fixed step, per Lander.arm comment ~1900)
  ship.vel.x *= VELOCITY_DAMPING;
  ship.vel.y *= VELOCITY_DAMPING;
  ship.vel.z *= VELOCITY_DAMPING;

  // --- Integrate position ----------------------------------------------
  ship.pos.x += ship.vel.x;
  ship.pos.y += ship.vel.y;
  ship.pos.z += ship.vel.z;

  ship.landed = false;
}

/** Refuel while on the launchpad. */
export function refuel(ship) {
  ship.fuel = Math.min(FUEL_MAX, ship.fuel + REFUEL_RATE);
}

/** True if the ship is in a state safe to land in: tilt small, vy small. */
export function isSafeToLand(ship) {
  return Math.abs(ship.pitch) < 0.08
      && Math.abs(ship.roll)  < 0.08
      && Math.abs(ship.vel.y) < LANDING_SPEED
      && Math.abs(ship.vel.x) < LANDING_SPEED
      && Math.abs(ship.vel.z) < LANDING_SPEED;
}
