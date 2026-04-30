// Camera — fixed pitch downward, sits behind/above the ship.
// Reference:
//   * Lander.arm:114-118 (CAMERA_PLAYER_Z)
//   * Lander.arm:ProjectVertexOntoScreen @ 7159
//   * deep_dive: camera_and_landscape_offset.html

import {
  CAMERA_PITCH, CAMERA_HEIGHT_ABOVE_SHIP, CAMERA_BACK_FROM_SHIP,
  SCREEN_W, SCREEN_H, FOCAL, NEAR_Z,
} from '../constants.js';
import { rotX, mulVec } from '../math/mat3.js';

const cameraRot = rotX(-CAMERA_PITCH);

export function cameraPosition(ship) {
  return {
    x: ship.pos.x,
    y: ship.pos.y + CAMERA_HEIGHT_ABOVE_SHIP,
    z: ship.pos.z + CAMERA_BACK_FROM_SHIP,
  };
}

/**
 * Transform a world-space vertex into camera space.
 * (1) translate by -camera, (2) rotate by camera pitch.
 */
export function worldToCamera(v, cam) {
  const t = { x: v.x - cam.x, y: v.y - cam.y, z: v.z - cam.z };
  return mulVec(cameraRot, t);
}

/**
 * Project a camera-space vertex onto the 320×256 framebuffer.
 * Returns { x, y, z } where x,y are screen pixels and z is camera depth
 * (positive = further into the scene). Returns null if behind the near plane.
 */
export function projectCamera(c) {
  // Camera looks down -Z (right-handed, like OpenGL). After camera rotation
  // the world is in camera space; in front of camera ⇒ negative z.
  const depth = -c.z;
  if (depth < NEAR_Z) return null;
  const sx = (c.x * FOCAL) / depth + SCREEN_W / 2;
  const sy = (-c.y * FOCAL) / depth + SCREEN_H / 2;
  return { x: sx, y: sy, z: depth };
}

/** Convenience: world → screen in one call. */
export function project(v, cam) {
  return projectCamera(worldToCamera(v, cam));
}
