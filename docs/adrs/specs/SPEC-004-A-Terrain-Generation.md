# SPEC-004-A: Terrain Generation

Implements: [ADR-004](../ADR-004-Terrain-Generation.md)

## Module

`src/world/terrain.js` — sole owner of the height function. All other modules import `height(x, z)` from here.

## API

```js
/** @param {number} x  world x in tiles
 *  @param {number} z  world z in tiles
 *  @returns {number}  terrain height in tiles (positive = up) */
export function height(x, z): number;

/** Return one of: 'launchpad' | 'sea' | 'grass' for the tile centred at (x,z). */
export function tileType(x, z): 'launchpad' | 'sea' | 'grass';

/** Return the diffuse RGB string for a tile, given its corner heights and tile-row index. */
export function tileColor(prevAlt, currAlt, row): string;
```

## Formula (faithful, ADR-004)

```
height(x, z) = LAND_MID_HEIGHT
             - ( 2·sin(x − 2z) + 2·sin(4x + 3z)
               + 2·sin(3z − 5x) + 2·sin(7x + 5z)
               +     sin(5x + 11z) +     sin(10x + 7z) ) / 256
```

Implemented as a sum of `Math.sin` calls; `LAND_MID_HEIGHT` and the `/256` divisor exposed in `src/constants.js`.

## Launchpad

A flat 8×8-tile patch (per source: `LAUNCHPAD_SIZE = TILE_SIZE * 8`) at world origin. Inside this patch `height` returns `LAUNCHPAD_ALTITUDE` and `tileType` returns `'launchpad'`.

## Sea

Where the formula returns a height ≤ `SEA_LEVEL`, `tileType` returns `'sea'` and the colour is mid-blue `&004` (per `Lander.arm:1616-1620`).

## Acceptance criteria

- [ ] `height(0, 0)` returns `LAND_MID_HEIGHT` exactly (sin(0)=0)
- [ ] `height(x, z) === height(x + 2π, z)` and likewise for z (periodicity)
- [ ] `tileType(0, 0) === 'launchpad'`
- [ ] `tileColor` returns valid `#rrggbb` strings
- [ ] All modules consume `height` only via this module — `grep -r "Math.sin.*-.*Math.sin" src/` returns no other matches
