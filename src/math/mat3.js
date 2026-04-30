// 3x3 rotation matrices stored as flat arrays in column-major order:
//   m = [m00, m10, m20,   m01, m11, m21,   m02, m12, m22]
// (Lander.arm:CalculateRotationMatrix @ 6346)

export const identity = () => [1, 0, 0,  0, 1, 0,  0, 0, 1];

/** Rotate vector v by matrix m. */
export function mulVec(m, v) {
  return {
    x: m[0] * v.x + m[3] * v.y + m[6] * v.z,
    y: m[1] * v.x + m[4] * v.y + m[7] * v.z,
    z: m[2] * v.x + m[5] * v.y + m[8] * v.z,
  };
}

export function mulMat(a, b) {
  const r = new Array(9);
  for (let c = 0; c < 3; c++) {
    for (let row = 0; row < 3; row++) {
      r[c * 3 + row] =
        a[0 * 3 + row] * b[c * 3 + 0] +
        a[1 * 3 + row] * b[c * 3 + 1] +
        a[2 * 3 + row] * b[c * 3 + 2];
    }
  }
  return r;
}

/** Rotate around X axis (pitch). */
export function rotX(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return [
    1, 0,  0,
    0, c,  s,
    0, -s, c,
  ];
}

/** Rotate around Y axis (yaw). */
export function rotY(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return [
     c, 0, -s,
     0, 1,  0,
     s, 0,  c,
  ];
}

/** Rotate around Z axis (roll). */
export function rotZ(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return [
     c,  s, 0,
    -s,  c, 0,
     0,  0, 1,
  ];
}

/** Build a ship orientation from pitch (X) and roll (Z). The ship cannot
 * yaw (per the original — only one downward thruster, no rudder). */
export function shipOrientation(pitch, roll) {
  return mulMat(rotZ(roll), rotX(pitch));
}

/** Transpose a 3x3 (column-major). */
export function transpose(m) {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8],
  ];
}
