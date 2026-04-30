// Build the visible terrain triangle list. We sample heights on a grid
// centred on the ship and emit two triangles per tile.
// Tiles are emitted back-to-front so the painter's algorithm doesn't need
// to sort them.

import { height, tileType, tileColor, isLaunchpad } from '../world/terrain.js';
import { VIEW_TILES, SUN_DIR, AMBIENT, DIFFUSE, vidcToRgbTinted, SEA_COLOR_VIDC } from '../constants.js';
import { dot, normalize, sub, cross } from '../math/vec3.js';

/**
 * Generate triangles for the visible terrain window centred on (cx, cz).
 * Triangles are pre-shaded with face normal · sun light.
 */
export function buildTerrain(cx, cz) {
  const tiles = [];
  const half = VIEW_TILES;
  const ix0 = Math.floor(cx) - half;
  const iz0 = Math.floor(cz) - half;
  const ix1 = ix0 + half * 2;
  const iz1 = iz0 + half * 2;

  // Iterate FAR z first so painter draws back-to-front. In camera-y-up
  // coordinates, "far" is z > camera.z (positive offset from ship).
  for (let iz = iz1 - 1; iz >= iz0; iz--) {
    for (let ix = ix0; ix < ix1; ix++) {
      // Four corners of the tile (counter-clockwise looking from above).
      const x0 = ix,     z0 = iz;
      const x1 = ix + 1, z1 = iz;
      const x2 = ix + 1, z2 = iz + 1;
      const x3 = ix,     z3 = iz + 1;
      const v0 = { x: x0, y: height(x0, z0), z: z0 };
      const v1 = { x: x1, y: height(x1, z1), z: z1 };
      const v2 = { x: x2, y: height(x2, z2), z: z2 };
      const v3 = { x: x3, y: height(x3, z3), z: z3 };

      const tt = tileType(ix + 0.5, iz + 0.5);
      const baseLum = computeLum(v0, v1, v2);
      const colA = chooseColor(ix + 0.5, iz + 0.5, tt, baseLum);
      tiles.push({
        a: v0, b: v1, c: v2,
        color: colA,
        type: 'terrain',
      });
      const baseLum2 = computeLum(v0, v2, v3);
      const colB = chooseColor(ix + 0.5, iz + 0.5, tt, baseLum2);
      tiles.push({
        a: v0, b: v2, c: v3,
        color: colB,
        type: 'terrain',
      });
    }
  }
  return tiles;
}

function computeLum(a, b, c) {
  const n = normalize(cross(sub(b, a), sub(c, a)));
  return AMBIENT + DIFFUSE * Math.max(0, dot(n, SUN_DIR));
}

function chooseColor(x, z, tt, lum) {
  if (tt === 'sea') {
    // Sea has its own subtle shimmer based on lum.
    return vidcToRgbTinted(SEA_COLOR_VIDC, 0.6 + 0.4 * lum);
  }
  if (tt === 'launchpad' || isLaunchpad(x, z)) {
    return vidcToRgbTinted(0x666, 0.7 + 0.3 * lum);
  }
  // Grass: mix green / brown by altitude (faithful to bit2/bit3 trick).
  // Use a hash on integer coords for variety.
  const h = -Math.floor(((x | 0) * 73856093) ^ ((z | 0) * 19349663));
  const altBit2 = (h & 0x4) ? 4 : 0;       // brown vs no brown
  const altBit3 = (h & 0x8) ? 8 : 4;       // dark vs light green
  const vidc = (altBit2 << 8) | (altBit3 << 4) | 0;
  return vidcToRgbTinted(vidc, lum);
}
