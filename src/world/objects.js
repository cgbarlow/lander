// Place objects pseudo-randomly across the world. Faithful to the
// original's behaviour:
//   - trees dominate (5/11 of the spawn table)
//   - rockets are the launchpad markers (3/11)
//   - building (1/11) and gazebo (1/11) are rarer scoring targets
//   - objects do not spawn over water or on the launchpad itself
// Reference: Lander.arm:objectTypes table @ 4640
//            deep_dive: placing_objects_on_the_map.html

import { OBJECT_TYPES, WORLD_TILES, LAUNCHPAD_SIZE } from '../constants.js';
import { tileType, isLaunchpad, height } from './terrain.js';
import { SHAPES } from './shapes.js';
import { makeRng, randInt, randRange } from '../math/rng.js';

/** Build a deterministic list of placed objects covering the world. */
export function buildObjects(seed = 1987) {
  const rng = makeRng(seed);
  const out = [];
  // Roughly 1 object per 3 tiles² of land.
  const target = Math.floor(WORLD_TILES * WORLD_TILES / 9);
  const halfPad = LAUNCHPAD_SIZE / 2 + 2;

  // Always place 3 rockets along the launchpad's right edge.
  for (let i = -1; i <= 1; i++) {
    out.push({
      type: 'rocket',
      x: halfPad,
      z: i * 2,
      yaw: 0,
      destroyed: false,
      score: 50,
    });
  }

  let attempts = 0;
  while (out.length < target && attempts < target * 4) {
    attempts++;
    const x = randRange(rng, -WORLD_TILES / 2, WORLD_TILES / 2);
    const z = randRange(rng, -WORLD_TILES / 2, WORLD_TILES / 2);
    if (isLaunchpad(x, z)) continue;
    if (tileType(x, z) === 'sea') continue;
    // Don't place too close to the pad — the player needs space.
    if (Math.abs(x) < halfPad && Math.abs(z) < halfPad) continue;

    const typeIndex = 1 + randInt(rng, OBJECT_TYPES.length - 1);
    const name = OBJECT_TYPES[typeIndex];
    if (!name || !SHAPES[name]) continue;

    const score = scoreFor(name);
    out.push({
      type: name,
      x, z,
      yaw: randRange(rng, 0, Math.PI * 2),
      destroyed: false,
      score,
    });
  }
  return out;
}

function scoreFor(name) {
  switch (name) {
    case 'building':       return 25;
    case 'gazebo':         return 15;
    case 'rocket':         return 50;
    case 'firTree':
    case 'smallLeafyTree':
    case 'tallLeafyTree':  return 5;
    default:               return 1;
  }
}

/** Sample only those objects close enough to the camera to be worth drawing. */
export function visibleObjects(objects, cx, cz, radius) {
  const r2 = radius * radius;
  const out = [];
  for (const o of objects) {
    const dx = o.x - cx, dz = o.z - cz;
    if (dx * dx + dz * dz <= r2) out.push(o);
  }
  return out;
}

/** Get the ground y at this object's foot. */
export function objectGroundY(obj) {
  return height(obj.x, obj.z);
}
