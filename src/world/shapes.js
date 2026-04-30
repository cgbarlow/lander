// 3D object blueprints (vertices, faces, colours, flags) ported 1:1 from
// the original Lander ARM source. The vertex coordinates and normals use
// the same 8.24 signed fixed-point encoding as `Lander.arm`; we convert
// at load time so the source data remains directly comparable to the
// reference (and reviewable by anyone with the .arm files).
//
// Reference: Lander.arm:12718-13276 (object* labels)
// Y-axis is FLIPPED (original: y-down, ours: y-up).

import { vidcToRgb } from '../constants.js';

/** Convert 32-bit signed 8.24 fixed-point hex to float in tiles. */
function fp(hex) {
  let v = hex >>> 0;
  if (v & 0x80000000) v -= 0x100000000;
  return v / 0x01000000;
}

/** Build a vertex with the Y axis flipped (source y-down → our y-up). */
const v = (x, y, z) => ({ x: fp(x), y: -fp(y), z: fp(z) });

/** Build a face (vertex indices a/b/c, source normal hex, colour hex). */
const f = (a, b, c, nx, ny, nz, col) => ({
  a, b, c,
  // Normal y also flipped to match our coordinate system. Magnitude doesn't
  // matter — the renderer normalises before lighting.
  n: { x: fp(nx), y: -fp(ny), z: fp(nz) },
  color: vidcToRgb(col),
  colorVidc: col,
});

// === Player ship ========================================================
// Lander.arm:12801-12837   9 vertices, 9 faces.
// Flags %00000011 → rotates, has shadow.
export const ship = {
  name: 'player',
  flags: { rotates: true, shadow: true },
  vertices: [
    v(0x01000000, 0x00500000, 0x00800000),  // 0
    v(0x01000000, 0x00500000, 0xFF800000),  // 1
    v(0x00000000, 0x000A0000, 0xFECCCCCD),  // 2
    v(0xFF19999A, 0x00500000, 0x00000000),  // 3
    v(0x00000000, 0x000A0000, 0x01333333),  // 4
    v(0xFFE66667, 0xFF880000, 0x00000000),  // 5  cockpit top
    v(0x00555555, 0x00500000, 0x00400000),  // 6  undercarriage
    v(0x00555555, 0x00500000, 0xFFC00000),  // 7
    v(0xFFCCCCCD, 0x00500000, 0x00000000),  // 8
  ],
  faces: [
    f(0, 1, 5, 0x457C441A, 0x9E2A1F4C, 0x00000000, 0x080),
    f(1, 2, 5, 0x35F5D83B, 0x9BC03EC1, 0xDA12D71D, 0x040),
    f(0, 5, 4, 0x35F5D83B, 0x9BC03EC1, 0x25ED28E3, 0x040),
    f(2, 3, 5, 0xB123D51C, 0xAF3F50EE, 0xD7417278, 0x040),
    f(3, 4, 5, 0xB123D51D, 0xAF3F50EE, 0x28BE8D88, 0x040),
    f(1, 2, 3, 0xF765D8CD, 0x73242236, 0xDF4FD176, 0x088),
    f(0, 3, 4, 0xF765D8CD, 0x73242236, 0x20B02E8A, 0x088),
    f(0, 1, 3, 0x00000000, 0x78000000, 0x00000000, 0x044),
    f(6, 7, 8, 0x00000000, 0x78000000, 0x00000000, 0xC80),
  ],
};

// === Rock ===============================================================
// Lander.arm:12718-12749  6 vertices (octahedron), 8 faces.
export const rock = {
  name: 'rock',
  flags: { rotates: true, shadow: true },
  vertices: [
    v(0x00000000, 0x00000000, 0x00A00000),  // +z
    v(0x00A00000, 0x00A00000, 0x00000000),
    v(0xFF600000, 0x00A00000, 0x00000000),
    v(0x00A00000, 0xFF600000, 0x00000000),
    v(0xFF600000, 0xFF600000, 0x00000000),
    v(0x00000000, 0x00000000, 0xFF600000),  // -z
  ],
  faces: [
    f(0, 1, 2, 0x00000000, 0x54DA5200, 0x54DA5200, 0x444),
    f(0, 3, 1, 0x54DA5200, 0x00000000, 0x54DA5200, 0x444),
    f(0, 4, 3, 0x00000000, 0xAB25AE00, 0x54DA5200, 0x444),
    f(0, 2, 4, 0xAB25AE00, 0x00000000, 0x54DA5200, 0x444),
    f(5, 1, 2, 0x00000000, 0x54DA5200, 0xAB25AE00, 0x444),
    f(5, 3, 1, 0x54DA5200, 0x00000000, 0xAB25AE00, 0x444),
    f(5, 4, 3, 0x00000000, 0xAB25AE00, 0xAB25AE00, 0x444),
    f(5, 2, 4, 0xAB25AE00, 0x00000000, 0xAB25AE00, 0x444),
  ],
};

// === Small leafy tree ===================================================
// Lander.arm:12849-12882   11 vertices, 5 faces.
export const smallLeafyTree = {
  name: 'smallLeafyTree',
  flags: { rotates: false, shadow: true },
  vertices: [
    v(0x00300000, 0xFE800000, 0x00300000),
    v(0xFFD9999A, 0x00000000, 0x00000000),
    v(0x00266666, 0x00000000, 0x00000000),
    v(0x00000000, 0xFEF33334, 0xFF400000),
    v(0x00800000, 0xFF400000, 0xFF800000),
    v(0xFF400000, 0xFECCCCCD, 0xFFD55556),
    v(0xFF800000, 0xFEA66667, 0x00400000),
    v(0x00800000, 0xFE59999A, 0x002AAAAA),
    v(0x00C00000, 0xFEA66667, 0xFFC00000),
    v(0xFFA00000, 0xFECCCCCD, 0x00999999),
    v(0x00C00000, 0xFF400000, 0x00C00000),
  ],
  faces: [
    f(0, 9, 10, 0x14A01873, 0xAF8F9F93, 0x56A0681E, 0x040),
    f(0, 1, 2,  0x00000000, 0x00000000, 0x00000000, 0x400),
    f(0, 3, 4,  0x499A254E, 0xB123FC2C, 0xCB6D5299, 0x080),
    f(0, 5, 6,  0xE4D2EEBE, 0x8DC82837, 0xE72FE5E9, 0x080),
    f(0, 7, 8,  0xD5710585, 0xB29EF364, 0xAEC07EB3, 0x080),
  ],
};

// === Tall leafy tree ====================================================
// Lander.arm:12894-12931   14 vertices, 6 faces.
export const tallLeafyTree = {
  name: 'tallLeafyTree',
  flags: { rotates: false, shadow: true },
  vertices: [
    v(0x0036DB6D, 0xFD733334, 0x00300000),
    v(0xFFD00000, 0x00000000, 0x00000000),
    v(0x00300000, 0x00000000, 0x00000000),
    v(0x00000000, 0xFE0CCCCD, 0xFF400000),
    v(0x00800000, 0xFE59999A, 0xFF800000),
    v(0xFF533334, 0xFE333334, 0xFFC92493),
    v(0xFF400000, 0xFEA66667, 0x00600000),
    v(0x00000000, 0xFF19999A, 0xFF666667),
    v(0xFF800000, 0xFF400000, 0xFFA00000),
    v(0xFFA00000, 0xFE800000, 0x00999999),
    v(0x00C00000, 0xFECCCCCD, 0x00C00000),
    v(0xFFB33334, 0xFF19999A, 0x00E66666),
    v(0x00800000, 0xFF400000, 0x00C00000),
    v(0x00300000, 0xFE59999A, 0x00300000),
  ],
  faces: [
    f(0, 9, 10,   0xFD3D01DD, 0xD2CB371E, 0x6F20024E, 0x040),
    f(13, 11, 12, 0x1E6F981A, 0xBB105ECE, 0x5D638B16, 0x080),
    f(0, 1, 2,    0x00000000, 0x00000000, 0x00000000, 0x400),
    f(0, 3, 4,    0x49D96509, 0xB8E72762, 0xC19E3A19, 0x080),
    f(0, 5, 6,    0xAD213B74, 0xB641CA5D, 0x2DC40650, 0x040),
    f(13, 7, 8,   0xC9102051, 0xAC846CAD, 0xBD92A8C1, 0x040),
  ],
};

// === Fir tree ===========================================================
// Lander.arm:13015-13039   5 vertices, 2 faces.
export const firTree = {
  name: 'firTree',
  flags: { rotates: false, shadow: true },
  vertices: [
    v(0xFFA00000, 0xFFC92493, 0xFFC92493),
    v(0x00600000, 0xFFC92493, 0xFFC92493),
    v(0x00000000, 0xFE333334, 0x0036DB6D),
    v(0x00266666, 0x00000000, 0x00000000),
    v(0xFFD9999A, 0x00000000, 0x00000000),
  ],
  faces: [
    f(2, 3, 4, 0x00000000, 0x00000000, 0x00000000, 0x400),
    f(0, 1, 2, 0x00000000, 0xE0B0E050, 0x8C280943, 0x040),
  ],
};

// === Gazebo =============================================================
// Lander.arm:13051-13089   13 vertices, 8 faces.
export const gazebo = {
  name: 'gazebo',
  flags: { rotates: false, shadow: true },
  vertices: [
    v(0x00000000, 0xFF000000, 0x00000000),
    v(0xFF800000, 0xFF400000, 0x00800000),
    v(0xFF800000, 0xFF400000, 0xFF800000),
    v(0x00800000, 0xFF400000, 0xFF800000),
    v(0x00800000, 0xFF400000, 0x00800000),
    v(0xFF800000, 0x00000000, 0x00800000),
    v(0xFF800000, 0x00000000, 0xFF800000),
    v(0x00800000, 0x00000000, 0xFF800000),
    v(0x00800000, 0x00000000, 0x00800000),
    v(0xFF99999A, 0xFF400000, 0x00800000),
    v(0xFF99999A, 0xFF400000, 0xFF800000),
    v(0x00666666, 0xFF400000, 0xFF800000),
    v(0x00666666, 0xFF400000, 0x00800000),
  ],
  faces: [
    f(1, 5, 9,  0x00000000, 0x00000000, 0x78000000, 0x444),
    f(2, 6, 10, 0x00000000, 0x00000000, 0x88000000, 0x444),
    f(0, 1, 4,  0x00000000, 0x94AB325B, 0x35AA66D2, 0x400),
    f(3, 7, 11, 0x00000000, 0x00000000, 0x88000000, 0x444),
    f(4, 8, 12, 0x00000000, 0x00000000, 0x78000000, 0x444),
    f(0, 1, 2,  0xCA55992E, 0x94AB325B, 0x00000000, 0x840),
    f(0, 3, 4,  0x35AA66D2, 0x94AB325B, 0x00000000, 0x840),
    f(0, 2, 3,  0x00000000, 0x94AB325B, 0xCA55992E, 0x400),
  ],
};

// === Building ===========================================================
// Lander.arm:13101-13146   16 vertices, 12 faces.
export const building = {
  name: 'building',
  flags: { rotates: false, shadow: false },
  vertices: [
    v(0xFF19999A, 0xFF266667, 0x00000000),
    v(0xFF400000, 0xFF266667, 0x00000000),
    v(0x00C00000, 0xFF266667, 0x00000000),
    v(0x00E66666, 0xFF266667, 0x00000000),
    v(0xFF19999A, 0xFF8CCCCD, 0x00A66666),
    v(0xFF19999A, 0xFF8CCCCD, 0xFF59999A),
    v(0x00E66666, 0xFF8CCCCD, 0x00A66666),
    v(0x00E66666, 0xFF8CCCCD, 0xFF59999A),
    v(0xFF400000, 0xFF666667, 0x00800000),
    v(0xFF400000, 0xFF666667, 0xFF800000),
    v(0x00C00000, 0xFF666667, 0x00800000),
    v(0x00C00000, 0xFF666667, 0xFF800000),
    v(0xFF400000, 0x00000000, 0x00800000),
    v(0xFF400000, 0x00000000, 0xFF800000),
    v(0x00C00000, 0x00000000, 0x00800000),
    v(0x00C00000, 0x00000000, 0xFF800000),
  ],
  faces: [
    f(0, 4, 6,    0x00000000, 0x99CD0E6D, 0x3EE445CC, 0x400),
    f(0, 3, 6,    0x00000000, 0x99CD0E6D, 0x3EE445CC, 0x400),
    f(1, 8, 9,    0x88000000, 0x00000000, 0x00000000, 0xDDD),
    f(2, 10, 11,  0x78000000, 0x00000000, 0x00000000, 0x555),
    f(8, 12, 13,  0x88000000, 0x00000000, 0x00000000, 0xFFF),
    f(8, 9, 13,   0x88000000, 0x00000000, 0x00000000, 0xFFF),
    f(10, 14, 15, 0x78000000, 0x00000000, 0x00000000, 0x777),
    f(10, 11, 15, 0x78000000, 0x00000000, 0x00000000, 0x777),
    f(9, 13, 15,  0x00000000, 0x00000000, 0x88000000, 0xBBB),
    f(9, 11, 15,  0x00000000, 0x00000000, 0x88000000, 0xBBB),
    f(0, 5, 7,    0x00000000, 0x99CD0E6D, 0xC11BBA34, 0x800),
    f(0, 3, 7,    0x00000000, 0x99CD0E6D, 0xC11BBA34, 0x800),
  ],
};

// === Rocket =============================================================
// Lander.arm:13238-13276   13 vertices, 8 faces.
export const rocket = {
  name: 'rocket',
  flags: { rotates: false, shadow: true },
  vertices: [
    v(0x00000000, 0xFE400000, 0x00000000),
    v(0xFFC80000, 0xFFD745D2, 0x00380000),
    v(0xFFC80000, 0xFFD745D2, 0xFFC80000),
    v(0x00380000, 0xFFD745D2, 0x00380000),
    v(0x00380000, 0xFFD745D2, 0xFFC80000),
    v(0xFF900000, 0x00000000, 0x00700000),
    v(0xFF900000, 0x00000000, 0xFF900000),
    v(0x00700000, 0x00000000, 0x00700000),
    v(0x00700000, 0x00000000, 0xFF900000),
    v(0xFFE40000, 0xFF071C72, 0x001C0000),
    v(0xFFE40000, 0xFF071C72, 0xFFE40000),
    v(0x001C0000, 0xFF071C72, 0x001C0000),
    v(0x001C0000, 0xFF071C72, 0xFFE40000),
  ],
  faces: [
    f(9, 1, 5,  0x00000000, 0x00000000, 0x00000000, 0xCC0),
    f(11, 3, 7, 0x00000000, 0x00000000, 0x00000000, 0xCC0),
    f(0, 1, 3,  0x00000000, 0xEFA75F67, 0x76E1A76B, 0xC00),
    f(0, 1, 2,  0x891E5895, 0xEFA75F67, 0x00000000, 0x800),
    f(3, 0, 4,  0x76E1A76B, 0xEFA75F67, 0x00000000, 0x800),
    f(0, 2, 4,  0x00000000, 0xEFA75F67, 0x891E5895, 0xC00),
    f(10, 2, 6, 0x00000000, 0x00000000, 0x00000000, 0xCC0),
    f(12, 4, 8, 0x00000000, 0x00000000, 0x00000000, 0xCC0),
  ],
};

// Index for placement by name (matches OBJECT_TYPES in constants.js).
export const SHAPES = {
  smallLeafyTree, tallLeafyTree, firTree, gazebo, building, rocket,
};

/** Return an axis-aligned bounding-box height for an object (max |y|).
 *  Used by collision to decide what counts as "in the way". */
export function shapeHeight(shape) {
  let max = 0;
  for (const v of shape.vertices) {
    if (v.y > max) max = v.y;
    if (-v.y > max) max = -v.y;
  }
  return max;
}

/** Approximate horizontal radius (max sqrt(x^2+z^2)). */
export function shapeRadius(shape) {
  let max = 0;
  for (const v of shape.vertices) {
    const r = Math.hypot(v.x, v.z);
    if (r > max) max = r;
  }
  return max;
}
