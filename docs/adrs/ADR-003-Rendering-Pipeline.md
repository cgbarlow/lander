# ADR-003: Rendering Pipeline — Software Painter on Canvas 2D

- **Status**: Accepted
- **Date**: 2026-04-30
- **Supersedes**: —
- **Superseded by**: —
- **Dependencies**: ADR-002

## Why (the problem)

The original *Lander* draws the world as flat-shaded filled triangles (terrain tiles + 3D objects + ship + particles), depth-sorted with a painter / "bin sort" algorithm, projected onto a 320×256 framebuffer. Recreating that look in the browser needs a pipeline that:

- Produces visually faithful output (same colours, same flat-shaded look, same camera framing)
- Sustains 50 fps on commodity hardware
- Is straightforward to test and reason about

## Why not (rejected alternatives)

- **WebGL with shaders** — best perf, but adds GPU state, shaders, vertex/index buffers. Overkill for ~1500 triangles. Reconsider only if Canvas 2D under-performs.
- **Three.js / Babylon** — full 3D scene graphs, heavy bundles, hide the painter algorithm we want to mirror.
- **WebGPU** — too new and not universally supported in 2026 browsers; same overkill argument as WebGL.
- **Real z-buffer in software** — Canvas 2D has no per-pixel depth; would require shadow ImageData manipulation, far slower than the painter algorithm.

## What (the decision)

A frame proceeds:

1. **Visible-set assembly** — gather terrain tiles in an N×N window around the ship, plus objects within view radius, plus ship + bullets + rocks + particles. (See SPEC-003-A.)
2. **World→camera transform** — subtract camera position, then rotate by the fixed downward camera pitch.
3. **Backface culling** in camera space using the dot of the face normal with the view vector.
4. **Perspective projection** — `x' = f·x/-z`, `y' = f·y/-z`, then map to the 320×256 framebuffer; near-plane clip.
5. **Flat shading** — `lum = clamp(normal · sunDir, 0, 1)` modulating the source-derived RGB.
6. **Painter sort** — by triangle min-z. Terrain is appended in back-to-front grid order to minimise sort cost.
7. **Fill** — `ctx.beginPath(); moveTo(...); lineTo(...) × 2; closePath(); fill();` plus `stroke()` with the same colour to eliminate Canvas seam artefacts.
8. **Particles** drawn last, then HUD on a separate overlay layer.

Internal canvas is 320×256, scaled with `image-rendering: pixelated`.

## How (consequences)

**Positive**: Matches original look; simple control flow; easy to unit-test camera/projection in isolation; bundle stays tiny.

**Negative**: Per-triangle Canvas calls have overhead — measurable cap around 2–3k tris/frame. View distance is tunable to stay safely under that.

**Neutral**: Locks us into a software pipeline. If we later want effects like real shadows or normal mapping we'd have to redesign — but those weren't in the original anyway.
