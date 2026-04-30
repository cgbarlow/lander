// Terrain — single source of truth for landscape height & colour.
// Algorithm: six-term Fourier synthesis, faithful to the original.
// Reference:
//   * https://lander.bbcelite.com/deep_dives/generating_the_landscape.html
//   * Lander.arm:GetLandscapeAltitude (line ~1285)
//
// Y-axis convention (consistent across this codebase): y is altitude in
// tiles, positive = up. Sea level = 0. The launchpad is a flat patch at
// LAUNCHPAD_ALTITUDE. Hills go up from there to ~LAND_MID_HEIGHT + 5.

import {
  LAND_MID_HEIGHT, LAUNCHPAD_ALTITUDE, SEA_LEVEL,
  LAUNCHPAD_SIZE, vidcToRgb, vidcToRgbTinted, SEA_COLOR_VIDC,
} from '../constants.js';

const AMPLITUDE = 0.5;  // total /2 so ±5 tile swing for coefficients summing to 10

/**
 * Pure terrain altitude, in tiles (positive = up). Matches the original's
 * Fourier formula. Range roughly [LAND_MID_HEIGHT - 5, LAND_MID_HEIGHT + 5].
 *
 * @param {number} x  world x in tiles
 * @param {number} z  world z in tiles
 * @returns {number}  altitude in tiles
 */
export function rawHeight(x, z) {
  // Fourier coefficients (2,2,2,2,1,1) lifted from Lander.arm
  const sum =
      2 * Math.sin(    x -  2 * z)
    + 2 * Math.sin(4 * x +  3 * z)
    + 2 * Math.sin(3 * z -  5 * x)
    + 2 * Math.sin(7 * x +  5 * z)
    +     Math.sin(5 * x + 11 * z)
    +     Math.sin(10 * x + 7 * z);
  return LAND_MID_HEIGHT + sum * AMPLITUDE;
}

/** True if (x, z) falls inside the launchpad patch at the world origin. */
export function isLaunchpad(x, z) {
  const half = LAUNCHPAD_SIZE / 2;
  return x >= -half && x <= half && z >= -half && z <= half;
}

/**
 * Final visible terrain height. Launchpad → flat at LAUNCHPAD_ALTITUDE.
 * Anywhere the raw formula dips below SEA_LEVEL → flat at SEA_LEVEL (sea).
 */
export function height(x, z) {
  if (isLaunchpad(x, z)) return LAUNCHPAD_ALTITUDE;
  const h = rawHeight(x, z);
  if (h < SEA_LEVEL) return SEA_LEVEL;
  return h;
}

/** Tile classification. */
export function tileType(x, z) {
  if (isLaunchpad(x, z)) return 'launchpad';
  if (rawHeight(x, z) < SEA_LEVEL) return 'sea';
  return 'grass';
}

/** Surface normal at (x, z) via central differences. */
const DELTA = 0.25;
export function normalAt(x, z) {
  const hL = height(x - DELTA, z);
  const hR = height(x + DELTA, z);
  const hD = height(x, z - DELTA);
  const hU = height(x, z + DELTA);
  // Surface y = h(x,z), normal = (-∂h/∂x, 1, -∂h/∂z) normalised
  const nx = (hL - hR) / (2 * DELTA);
  const ny = 1;
  const nz = (hD - hU) / (2 * DELTA);
  const len = Math.hypot(nx, ny, nz);
  return { x: nx / len, y: ny / len, z: nz / len };
}

/**
 * Tile colour. Mirrors GetLandscapeTileColour (Lander.arm:1545). The
 * original encodes:
 *   * sea  → blue (VIDC &004)
 *   * pad  → grey (R=G=B=4)
 *   * else → R = bit2(altitude)*4, G = 4 + bit3(altitude)*4, B = 0
 *           plus a brightness term per tile-row (depth shading).
 *
 * We translate the bit pattern to a smooth altitude-based hue so it works
 * in floating point while preserving the "green pockmarked with brown" feel.
 */
export function tileColor(x, z, slope = 0, depthRow = 5) {
  if (isLaunchpad(x, z)) return vidcToRgb(0x444);
  if (tileType(x, z) === 'sea') return vidcToRgb(SEA_COLOR_VIDC);

  const h = rawHeight(x, z);
  const q = Math.floor((h + 5) * 4); // 0..40-ish
  const r = ((q & 0x4) >> 2) * 4;     // 0 or 4
  const g = 4 + ((q & 0x8) >> 3) * 4; // 4 or 8
  const b = 0;

  const depthLum = 0.45 + 0.055 * Math.max(1, Math.min(10, depthRow));
  const slopeLum = Math.max(0, slope) * 0.6;
  const lum = Math.min(1.2, depthLum + slopeLum);

  return vidcToRgbTinted((r << 8) | (g << 4) | b, lum);
}
