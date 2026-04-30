// Mulberry32 — small, fast, deterministic 32-bit PRNG with a good cycle
// and decent statistical quality. Used for deterministic object placement
// so the same seed yields the same world (faithful to the original which
// generated objects from a fixed sequence).

export function makeRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic float in [a, b). */
export function randRange(rng, a, b) {
  return a + rng() * (b - a);
}

/** Deterministic integer in [0, n). */
export function randInt(rng, n) {
  return Math.floor(rng() * n);
}
