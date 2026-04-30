// Single source of truth for 3D vector math (DRY). All other modules
// must use these helpers rather than re-implementing.

/** @typedef {{x:number,y:number,z:number}} Vec3 */

export const vec3 = (x = 0, y = 0, z = 0) => ({ x, y, z });
export const clone = (a) => ({ x: a.x, y: a.y, z: a.z });

export const add  = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub  = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const mul  = (a, s) => ({ x: a.x * s,   y: a.y * s,   z: a.z * s   });
export const neg  = (a)    => ({ x: -a.x,      y: -a.y,      z: -a.z      });

export const dot   = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a, b) => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const length2 = (a) => a.x * a.x + a.y * a.y + a.z * a.z;
export const length  = (a) => Math.sqrt(length2(a));

export const normalize = (a) => {
  const len = length(a);
  if (len < 1e-12) return vec3();
  return mul(a, 1 / len);
};

export const lerp = (a, b, t) => add(mul(a, 1 - t), mul(b, t));

// Mutating add for hot-path velocity integration.
export const addInPlace = (a, b) => { a.x += b.x; a.y += b.y; a.z += b.z; return a; };
export const scaleInPlace = (a, s) => { a.x *= s; a.y *= s; a.z *= s; return a; };
