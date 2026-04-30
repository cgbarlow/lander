// Collision — ship vs ground (shadow projection), ship vs objects, bullets vs
// objects, rocks vs ship.
// References:
//   * Lander.arm:GetLandscapeBelowVertex @ 1492
//   * Lander.arm:LandOnLaunchpad @ 2492
//   * deep_dive: collisions_and_bullets.html

import { height, isLaunchpad } from '../world/terrain.js';
import { shipOrientation, mulVec } from '../math/mat3.js';
import { ship as shipShape, shapeRadius, shapeHeight } from '../world/shapes.js';
import { SHAPES } from '../world/shapes.js';
import {
  UNDERCARRIAGE_Y, LAUNCHPAD_ALTITUDE, BULLET_RADIUS,
  ROCK_RADIUS, SAFE_HEIGHT,
} from '../constants.js';
import { isSafeToLand } from './ship.js';

/** Returns 'safe' | 'land' | 'crash'. Mutates ship.pos.y to clamp to ground. */
export function checkGround(ship) {
  // Apply ship orientation to each vertex; compare world y to terrain y.
  const orient = shipOrientation(ship.pitch, ship.roll);
  let lowest = Infinity;
  let lowestX = ship.pos.x, lowestZ = ship.pos.z;
  for (const v of shipShape.vertices) {
    const w = mulVec(orient, v);
    const wx = ship.pos.x + w.x;
    const wy = ship.pos.y + w.y;
    const wz = ship.pos.z + w.z;
    const groundY = height(wx, wz);
    // ground y is the surface altitude. If vertex y < groundY → impact.
    const clearance = wy - groundY;
    if (clearance < lowest) {
      lowest = clearance;
      lowestX = wx;
      lowestZ = wz;
    }
  }

  if (lowest > 0.01) return 'safe';

  // Touching or below ground. Are we on the launchpad and stable?
  if (isLaunchpad(lowestX, lowestZ) && isSafeToLand(ship)) {
    // Snap to pad altitude.
    ship.pos.y = LAUNCHPAD_ALTITUDE - UNDERCARRIAGE_Y;
    ship.vel.x = 0;
    ship.vel.y = 0;
    ship.vel.z = 0;
    ship.pitch = 0;
    ship.roll = 0;
    ship.landed = true;
    return 'land';
  }

  return 'crash';
}

/** Did the ship collide with any standing object? */
export function shipVsObjects(ship, objects) {
  for (const obj of objects) {
    if (obj.destroyed) continue;
    const dx = ship.pos.x - obj.x;
    const dz = ship.pos.z - obj.z;
    const r = shapeRadius(SHAPES[obj.type] ?? shipShape) + 0.4;
    if (dx * dx + dz * dz > r * r) continue;
    // Top of object reaches groundY - shapeHeight.
    const groundY = height(obj.x, obj.z);
    const top = groundY + shapeHeight(SHAPES[obj.type] ?? shipShape);
    const dipBelow = ship.pos.y - UNDERCARRIAGE_Y;
    if (dipBelow < top + 0.05) {
      return obj;
    }
  }
  return null;
}

/** Test all bullets against all objects. Returns a list of (bullet, object) hits. */
export function bulletsVsObjects(bullets, objects) {
  const hits = [];
  for (const b of bullets) {
    for (const obj of objects) {
      if (obj.destroyed) continue;
      const dx = b.pos.x - obj.x;
      const dz = b.pos.z - obj.z;
      const r = shapeRadius(SHAPES[obj.type] ?? shipShape) + BULLET_RADIUS;
      if (dx * dx + dz * dz > r * r) continue;
      const groundY = height(obj.x, obj.z);
      const top = groundY + shapeHeight(SHAPES[obj.type] ?? shipShape);
      if (b.pos.y >= groundY && b.pos.y <= top + 0.5) {
        hits.push({ bullet: b, object: obj });
        break;
      }
    }
  }
  return hits;
}

/** Did any rock hit the ship? */
export function rocksVsShip(rocks, ship) {
  for (const r of rocks) {
    const dx = r.pos.x - ship.pos.x;
    const dy = r.pos.y - ship.pos.y;
    const dz = r.pos.z - ship.pos.z;
    if (dx * dx + dy * dy + dz * dz < (ROCK_RADIUS + 0.6) * (ROCK_RADIUS + 0.6)) {
      return r;
    }
  }
  return null;
}

/** Did any bullet hit a rock? Returns hits to dispatch. */
export function bulletsVsRocks(bullets, rocks) {
  const hits = [];
  for (const b of bullets) {
    for (const r of rocks) {
      const dx = b.pos.x - r.pos.x;
      const dy = b.pos.y - r.pos.y;
      const dz = b.pos.z - r.pos.z;
      if (dx*dx + dy*dy + dz*dz < (ROCK_RADIUS + BULLET_RADIUS) ** 2) {
        hits.push({ bullet: b, rock: r });
        break;
      }
    }
  }
  return hits;
}
