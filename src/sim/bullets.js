// Bullets — short-lived projectiles that inherit ship velocity.
// Reference: Lander.arm:AddBulletParticleToBuffer @ 3519

import { BULLET_SPEED, BULLET_LIFETIME, BULLET_COST } from '../constants.js';
import { vec3, add, mul } from '../math/vec3.js';
import { shipOrientation, mulVec } from '../math/mat3.js';

/** Spawn a bullet from the ship, charging the cost. Returns the bullet or null. */
export function fireBullet(ship, score) {
  if (score.value < BULLET_COST) {
    // Original allows negative scores; we follow suit so play continues.
  }
  score.value -= BULLET_COST;
  const orient = shipOrientation(ship.pitch, ship.roll);
  // Bullets fly forward along ship -Z (forward in ship space).
  const dir = mulVec(orient, vec3(0, 0, -1));
  const v = mul(dir, BULLET_SPEED);
  // Inherit ship velocity (Lander.arm comment ~3540).
  v.x += ship.vel.x;
  v.y += ship.vel.y;
  v.z += ship.vel.z;
  return {
    pos: { ...ship.pos },
    vel: v,
    life: BULLET_LIFETIME,
  };
}

export function stepBullets(bullets) {
  for (const b of bullets) {
    b.pos.x += b.vel.x;
    b.pos.y += b.vel.y;
    b.pos.z += b.vel.z;
    b.life--;
  }
  // remove dead bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].life <= 0) bullets.splice(i, 1);
  }
}
