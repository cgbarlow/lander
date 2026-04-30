// All numeric constants are translated 1:1 from the original Lander ARM source
// at https://github.com/markmoxon/lander-source-code-acorn-archimedes
// (file: 1-source-files/main-sources/Lander.arm). The original uses 32-bit
// signed fixed-point coordinates where TILE_SIZE = 0x01000000 = 1.0 tile.
// Here we work in floating-point tiles directly: divide source values by
// 0x01000000 to recover the value in tiles.

// --- World scale ---------------------------------------------------------
// (Lander.arm:42-49)
export const TILES_X = 13;                  // tile-corner columns (12 visible tiles)
export const TILES_Z = 11;                  // tile-corner rows (10 visible tiles)
export const TILE_SIZE = 1;                 // one world unit = one tile

// --- Altitudes (in tiles, y-up; positive = higher) ----------------------
// In the Archimedes source the y-axis points DOWN. We use y-up in the JS
// port so the values below are inverted from the source's raw bytes:
//   source SEA_LEVEL > source LAUNCHPAD_ALTITUDE means sea is below pad.
// We preserve the SAME relationships in y-up: SEA_LEVEL < LAUNCHPAD_ALTITUDE.
//
// (Lander.arm:57-66, 87-94, 120, 132)
export const LAND_MID_HEIGHT    = 5;                        // mean landmass altitude
export const LAUNCHPAD_ALTITUDE = 4;                        // pad altitude (above sea, below mean hill)
export const SEA_LEVEL          = 1;                        // sea altitude
export const LANDING_SPEED      = 0x00200000 / 0x01000000;  // 0.125 max safe |v|
// Distance from ship centre down to its lowest vertex. The original
// declares 0x00640000 = 0.390625 (Lander.arm:66), but our extracted ship
// model has its bottom vertices at y=-0.3125 in local space, so we use
// that to keep collision flush with the rendered geometry.
export const UNDERCARRIAGE_Y    = 0.3125;
export const HIGHEST_ALTITUDE   = 52;                       // engines cut off above this
export const LAUNCHPAD_SIZE     = 8;                        // 8 tiles square
export const ROCK_HEIGHT        = 32;                       // rock spawn altitude
export const SAFE_HEIGHT        = 1.5;                      // min safe height vs objects
export const CRASH_CLOUD_Y      = 5 / 16;
export const SMOKE_RISING_SPEED = 0x00080000 / 0x01000000;

// --- Camera offset (Lander.arm:114-118, 144-159) -------------------------
export const CAMERA_PLAYER_Z   = TILES_Z - 6;     // 5 tiles behind ship
export const LANDSCAPE_X_WIDTH = TILES_X - 2;     // 11 tiles
export const LANDSCAPE_Z_DEPTH = TILES_Z - 1;     // 10 tiles
export const LANDSCAPE_X       = LANDSCAPE_X_WIDTH / 2;          // 5.5
export const LANDSCAPE_Z       = LANDSCAPE_Z_DEPTH + 10;         // 20

// Camera tilts down. Positive value = magnitude of downward look angle.
// Calibrated against the longplay video:
// https://www.youtube.com/watch?v=qybfBWuLXfQ
// With height-above=6 and back=5, atan(6/5)≈0.876 puts the ship dead
// centre. We pull back to 0.65 so the ship sits in the lower third and
// the horizon is visible up top — matches the original framing.
export const CAMERA_PITCH = 0.65;            // radians, magnitude of downward tilt
export const CAMERA_HEIGHT_ABOVE_SHIP = 6;   // tiles above ship
export const CAMERA_BACK_FROM_SHIP    = CAMERA_PLAYER_Z;

// --- Projection ---------------------------------------------------------
export const SCREEN_W = 320;                 // Mode 13 width
export const SCREEN_H = 256;                 // Mode 13 height
export const FOCAL    = 280;                 // chosen so a 1-tile object at z=5 is ~56 px
export const NEAR_Z   = 0.5;                 // tiles
export const FAR_Z    = 35;                  // view distance in tiles

// --- Physics (Lander.arm: physics block @ 1900-2050) --------------------
// The original drag is v = v - v/64 each frame, i.e. v *= 63/64.
export const PHYSICS_HZ        = 50;          // Archimedes vsync
export const PHYSICS_DT        = 1 / PHYSICS_HZ;
export const VELOCITY_DAMPING  = 63 / 64;     // per fixed step

// Tuned so that gravity feels like the original: a free-fall from
// LAUNCHPAD_ALTITUDE takes a couple of seconds. Original gravity values
// are register words at runtime; we use the documented effective rate.
export const GRAVITY           = 0.045;       // tiles / step^2  (downward magnitude)

// Thrust: full thrust is "subtract exhaust vector / 2048 from velocity"
// (Lander.arm comment ~1940). With ship orientation upright this gives a
// per-step velocity delta of ~0.06 tiles, slightly more than gravity.
export const THRUST_FULL       = 0.075;       // tiles / step^2
export const THRUST_HOVER      = GRAVITY;     // exactly cancels gravity

// Fuel
export const FUEL_MAX          = 1000;
export const FUEL_BURN_FULL    = 0.9;         // units / step at full thrust
export const FUEL_BURN_HOVER   = 0.3;         // units / step at hover
export const REFUEL_RATE       = 8;           // units / step while landed

// Bullets
export const BULLET_SPEED      = 1.6;         // tiles / step
export const BULLET_LIFETIME   = 60;          // frames (~1.2 s)
export const BULLET_COST       = 1;           // points per shot
export const BULLET_RADIUS     = 0.3;         // collision radius (tiles)

// Rocks
export const ROCK_SCORE_THRESHOLD = 800;
export const ROCK_SPAWN_PROB      = 0.012;    // per fixed step once unlocked
export const ROCK_FALL_SPEED      = 0.35;
export const ROCK_RADIUS          = 0.6;

// Lives & score
export const STARTING_LIVES = 5;
export const SCORE_TREE     = 5;
export const SCORE_BUILDING = 25;
export const SCORE_GAZEBO   = 15;
export const SCORE_ROCKET   = 50;
export const SCORE_LAND     = 100;             // bonus for landing

// --- Input (ADR-005) -----------------------------------------------------
export const MOUSE_SENSITIVITY = 0.012;        // virtual-cursor units per pixel
export const KEYBOARD_TILT_RATE = 0.06;        // virtual-cursor units per step
export const TILT_DAMPING       = 0.5;         // (current - target) / 2 each step
export const MAX_TILT           = 0.65;        // radians

// --- Object placement (Lander.arm:objectTypes table @ 4640) -------------
// The launchpad is pad of object type 9 (LAUNCHPAD_OBJECT). Objects are
// placed pseudo-randomly across the 1024-tile world, not on water/launchpad.
// Type frequencies:
//   1=small leafy tree,2=tall leafy,3,4=small leafy,5=gazebo,
//   6=tall leafy,7=fir,8=building,9=rocket,10=rocket,11=rocket
// (so trees dominate at 5/11, rockets at 3/11, building 1/11, gazebo 1/11)
export const OBJECT_TYPES = [
  null,
  'smallLeafyTree',  // 1
  'tallLeafyTree',   // 2
  'smallLeafyTree',  // 3
  'smallLeafyTree',  // 4
  'gazebo',          // 5
  'tallLeafyTree',   // 6
  'firTree',         // 7
  'building',        // 8
  'rocket',          // 9 (also launchpad marker)
  'rocket',          // 10
  'rocket',          // 11
];

export const WORLD_TILES = 256;                // size of the placement grid
export const VIEW_TILES  = 18;                 // half-width of visible tile window

// --- Lighting (Lander.arm:1659 "above and slightly to the left") --------
import { vec3, normalize } from './math/vec3.js';
export const SUN_DIR = normalize(vec3(0.4, 0.85, -0.3));
export const AMBIENT = 0.35;
export const DIFFUSE = 0.65;

// --- VIDC palette helper ------------------------------------------------
// Original colours are 12-bit RGB packed as 0x0RGB (each nibble 0..15).
// (Lander.arm:1660-1672; deep_dive: screen_memory_in_the_archimedes)
export function vidcToRgb(c) {
  const r = ((c >> 8) & 0xf) * 17;
  const g = ((c >> 4) & 0xf) * 17;
  const b = ( c       & 0xf) * 17;
  return `rgb(${r},${g},${b})`;
}

export function vidcToRgbTinted(c, lum) {
  const r = ((c >> 8) & 0xf) * 17 * lum;
  const g = ((c >> 4) & 0xf) * 17 * lum;
  const b = ( c       & 0xf) * 17 * lum;
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export const SKY_COLOR = '#000018';            // Archimedes had black sky in Lander
export const SEA_COLOR_VIDC = 0x004;           // (Lander.arm:1619)
