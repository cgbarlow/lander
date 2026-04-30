# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Mobile / touch controls**: virtual thumbstick (bottom-left) plus
  THRUST / HOVER / FIRE on-screen buttons (bottom-right), shown
  automatically on coarse-pointer devices. Multi-touch supported so the
  stick and a button can be held simultaneously.

### Fixed

- **Backface cull was wrong** for any face offset from the camera origin
  (`n.z > 0` only works for faces at the origin). With the camera
  looking down-and-back at the resting ship, its upper faces have
  normals tilted slightly forward (+z) and were being culled — the ship
  was invisible until you took off and rotated. Replaced with the proper
  test: `dot(camera-space-vertex, normal) > 0` ⇒ backfacing.
- **iOS Safari clipped the touch controls** behind the bottom toolbar.
  Switched the layout to `100dvh` (dynamic viewport height) so the
  visible area excludes the dynamic browser chrome, added
  `viewport-fit=cover` and `env(safe-area-inset-*)` padding so controls
  clear the home indicator on iPhone X+, shrank the controls a touch on
  portrait phones (100 px joystick / 78 px buttons) so they fit
  comfortably without overlapping the canvas.

## [0.1.0] — 2026-04-30

### Added

- Initial browser recreation of *Lander* (David Braben, Acorn Archimedes 1987).
- Pure JavaScript + Vite + Canvas 2D stack (ADR-002).
- Software 3D rendering pipeline with painter-algorithm depth sort
  rendering at the original Mode 13 resolution (320×256), upscaled with
  pixelated CSS (ADR-003 / SPEC-003-A).
- Faithful six-term Fourier-synthesis terrain (ADR-004 / SPEC-004-A) ported
  from `Lander.arm:GetLandscapeAltitude`.
- Pointer-lock polar mouse control with WASD/Space/F/H keyboard fallback
  (ADR-005 / SPEC-005-A).
- All eight 3D object models (player ship, rock, small/tall/fir trees,
  gazebo, building, rocket) ported vertex-for-vertex from
  `Lander.arm:object*` blueprints with original VIDC palette indices.
- Newtonian flight physics: gravity, ×63/64 velocity damping, full + hover
  thrust, fuel burn, refuel-on-pad, engine cut-off above HIGHEST_ALTITUDE.
- Collision detection: shadow-projection ground hit (per
  `Lander.arm:GetLandscapeBelowVertex`), ship-vs-objects, bullets-vs-objects,
  bullets-vs-rocks, rocks-vs-ship.
- Falling rocks once score ≥ 800 (per source `Lander.arm:DropRocksFromTheSky`).
- Particle system: exhaust, smoke, explosions, sparks (484 particle cap
  matches `MAX_PARTICLES` in source).
- HUD: score, hi-score (persisted to `localStorage`), lives, fuel bar,
  transient messages.
- 71 unit + smoke tests via Vitest covering vec3, mat3, rng, terrain
  formula, shape vertex/face counts, camera projection, physics, collision,
  input, render pipeline, and a simulated flight.
- ADRs 001–005 + corresponding SPECs in `/docs/adrs/`.

### Notes

- Verified dependency versions (2026-04-30): vite 8.0.10, vitest 4.1.5,
  jsdom 29.1.0.
- Production bundle: ~21 KB JS (~8 KB gzipped).
- No backend, no runtime dependencies — pure static deploy.

[Unreleased]: https://github.com/cgbarlow/lander/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cgbarlow/lander/releases/tag/v0.1.0
