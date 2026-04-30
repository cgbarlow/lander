// Falling rocks — spawn once score >= ROCK_SCORE_THRESHOLD.
// Reference: Lander.arm:DropRocksFromTheSky @ 4578

import {
  ROCK_HEIGHT, ROCK_FALL_SPEED, ROCK_SPAWN_PROB, ROCK_SCORE_THRESHOLD,
} from '../constants.js';
import { makeRng, randRange } from '../math/rng.js';

const rng = makeRng(0xCAFE);

export function maybeSpawnRock(rocks, ship, score) {
  if (score.value < ROCK_SCORE_THRESHOLD) return;
  if (rng() > ROCK_SPAWN_PROB) return;

  // Spawn a rock above the ship, slightly off-axis.
  const offX = randRange(rng, -3, 3);
  const offZ = randRange(rng, -3, 3);
  rocks.push({
    pos: { x: ship.pos.x + offX, y: ROCK_HEIGHT, z: ship.pos.z + offZ },
    vel: { x: 0, y: -ROCK_FALL_SPEED, z: 0 },
    rotation: 0,
    rotSpeed: randRange(rng, -0.1, 0.1),
    life: 600,
  });
}

export function stepRocks(rocks) {
  for (const r of rocks) {
    r.pos.x += r.vel.x;
    r.pos.y += r.vel.y;
    r.pos.z += r.vel.z;
    r.rotation += r.rotSpeed;
    r.life--;
  }
  for (let i = rocks.length - 1; i >= 0; i--) {
    if (rocks[i].life <= 0 || rocks[i].pos.y < -1) rocks.splice(i, 1);
  }
}
