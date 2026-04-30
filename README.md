# Lander

A faithful browser recreation of David Braben's **Lander** (Acorn
Archimedes, 1987) — the first ARM game ever written, the predecessor to
*Zarch*, and a direct ancestor of *Elite II*.

Pilot a one-thruster lander over a procedurally generated 3D landscape.
Land level on the launchpad to refuel. Shoot trees, buildings and gazebos
for score. Watch for falling rocks once you pass 800.

Runs entirely in the browser. No backend, no install, ~21 KB of
JavaScript (~8 KB gzipped).

## Play

```sh
npm install
npm run dev      # http://localhost:5173
```

Or build the static site:

```sh
npm run build    # writes ./dist
npm run preview  # serves ./dist on http://localhost:4173
```

### Controls

| Action  | Mouse                | Keyboard            |
|---------|----------------------|---------------------|
| Tilt    | move (analogue)      | W A S D / arrow keys |
| Thrust  | left button          | Space               |
| Hover   | middle button        | H or Shift          |
| Fire    | right button (−1 pt) | F                   |
| Release | Esc                  | Esc                 |

Click the canvas to engage Pointer Lock. Esc releases the cursor.

### Scoring

| Target           | Points |
|------------------|-------:|
| Small leafy tree |     5  |
| Tall leafy tree  |     5  |
| Fir tree         |     5  |
| Gazebo           |    15  |
| Building         |    25  |
| Rocket           |    50  |
| Successful land  |   100  |
| Bullet shot      |    −1  |
| Falling rock     |    10  |

## How it works

The game is implemented as a small software 3D engine on Canvas 2D. Each
frame the visible terrain (a window of ~36×36 tiles around the ship) is
sampled from the original's six-term Fourier formula, two triangles per
tile are appended back-to-front, then objects, ship, bullets, rocks and
particles are added, projected, depth-sorted and filled. Internal
framebuffer is the original 320×256 (Mode 13) resolution; the canvas is
upscaled with `image-rendering: pixelated` for the chunky look.

### Faithfulness

Every numeric constant, every vertex and face index, every palette colour
and every algorithm comes from the **annotated ARM source code** of the
original game published by Mark Moxon at
[github.com/markmoxon/lander-source-code-acorn-archimedes](https://github.com/markmoxon/lander-source-code-acorn-archimedes).
Where the code touches a behaviour also covered by Moxon's
[Lander deep-dive articles](https://lander.bbcelite.com/deep_dives/), the
relevant URL is cited in the comments.

Specifically:

- `src/world/shapes.js` — vertex and face data for the player ship, rock,
  trees, gazebo, building and rocket are translated 1:1 from
  `Lander.arm:objectPlayer / objectRock / objectSmallLeafyTree / …` (lines
  12718–13276). Y-axis is flipped (the ARM source uses y-down; we use
  y-up) but the numeric magnitudes and face winding match.
- `src/world/terrain.js` — six-term Fourier formula matches
  `Lander.arm:GetLandscapeAltitude`.
- `src/sim/ship.js` — gravity, ×63/64 damping, thrust, fuel burn match
  the physics block at `Lander.arm:1900-2050`.
- `src/sim/collision.js` — shadow-projection ground check follows
  `Lander.arm:GetLandscapeBelowVertex`.
- `src/render/camera.js` — camera offset (5 tiles back, 6 tiles up,
  ~37° downward tilt) follows `CAMERA_PLAYER_Z` in source.
- `src/constants.js` — numeric constants are pulled from
  `Lander.arm:42-179` and inverted where the y-down→y-up flip applies.

## Architecture

| Layer       | Module                              |
|-------------|-------------------------------------|
| Maths       | `src/math/{vec3,mat3,rng}.js`       |
| World       | `src/world/{terrain,shapes,objects}.js` |
| Simulation  | `src/sim/{ship,bullets,rocks,collision}.js` |
| Rendering   | `src/render/{camera,pipeline,terrainMesh,particles,hud}.js` |
| Input       | `src/input.js`                      |
| Game loop   | `src/game.js`                       |
| Entry       | `src/main.js`                       |

See `docs/adrs/` for the architectural decisions and `docs/adrs/specs/`
for the implementation specs.

## Tests

```sh
npm test          # one-shot run
npm run test:watch
```

71 tests cover vector / matrix maths, the deterministic RNG, the Fourier
terrain formula, the shape-table vertex/face counts (against source
ground truth), camera projection invariants, physics step semantics
(gravity / damping / fuel), all collision paths, input damping equation,
the rendering pipeline (smoke), object placement variety, and a
simulated flight (thrust → ascent, cut → descent, hover → balance).

## Stack

- **JavaScript** (ES modules, no transpilation step)
- **Vite** 8.0.10 — dev server + production minifier
- **Vitest** 4.1.5 + **jsdom** 29.1.0 — testing
- **HTML5 Canvas 2D** — software 3D pipeline
- No runtime dependencies

Verified 2026-04-30.

## Credits

Original game © David Braben, 1987.
Disassembly, deep dives and ARM source repository © Mark Moxon — without
the bbcelite.com project this recreation would not have been possible.

This implementation is a clean-room port to JavaScript, written as an
exercise in faithful retro-game preservation.

## Licence

Code in this repository is released under the same spirit of openness as
Moxon's annotated disassembly. Please refer to that project for details
on the original game's IP status.
