# ADR-004: Terrain Generation — Six-Term Fourier Synthesis (Faithful Port)

- **Status**: Accepted
- **Date**: 2026-04-30
- **Supersedes**: —
- **Superseded by**: —
- **Dependencies**: ADR-002

## Why (the problem)

The world needs a procedurally generated landscape that:

- Looks identical to the original game's terrain at the same world coordinates
- Costs no memory (the original ran in 256KB of RAM)
- Is deterministic (the same coordinate always returns the same height — required for collision and rendering to agree)

## Why not (rejected alternatives)

- **Stored heightmap** — would consume 256×256×4 = 256KB per landscape; loses the elegant infinite-tile property; not faithful to the source.
- **Perlin / Simplex noise** — modern, smooth, but produces a different landscape from the original. Faithfulness requires the *exact* original formula.
- **A different sum of sines (different coefficients)** — would diverge from reference frames in the longplay video. Same objection.

## What (the decision)

Implement the function exactly as documented in `lander.bbcelite.com/deep_dives/generating_the_landscape.html` and verified against `Lander.arm:GetLandscapeAltitude`:

```
height(x, z) = LAND_MID_HEIGHT
             - ( 2·sin(x − 2z) + 2·sin(4x + 3z)
               + 2·sin(3z − 5x) + 2·sin(7x + 5z)
               +     sin(5x + 11z) +     sin(10x + 7z) ) / 256
```

Where `x` and `z` are world coordinates in tiles, and the result is in tiles. `LAND_MID_HEIGHT = 5` tiles (per source line 120). The amplitude is tuned so the formula range is roughly `[−5, +5]` tiles (per the source comment: "+/- 5 tiles is added by the Fourier synthesis").

**Sea level**: tiles whose corner heights all reach `SEA_LEVEL` (5.3125 tiles below the surface in source units) render as flat blue (per `Lander.arm:GetLandscapeTileColour:1616-1620`).

**Launchpad**: a fixed flat tile at world origin coloured grey (per `Lander.arm:GetLandscapeTileColour:1611-1614`); altitude `LAUNCHPAD_ALTITUDE`.

The single source-of-truth function lives at `src/world/terrain.js` and is consumed by render, collision, and object-placement modules — no parallel implementation may exist (DRY).

## How (consequences)

**Positive**: Byte-perfect terrain shape against the original. Zero memory cost — infinite tileable. One source of truth eliminates render/collision divergence.

**Negative**: The formula is periodic (the original lives with this); player will encounter repeats over very long flights.

**Neutral**: Locks the world shape — we cannot offer alternative landscapes without breaking faithfulness.
