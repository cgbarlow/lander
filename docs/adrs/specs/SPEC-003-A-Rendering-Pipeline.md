# SPEC-003-A: Rendering Pipeline

Implements: [ADR-003](../ADR-003-Rendering-Pipeline.md)

## Modules

| File | Responsibility |
|---|---|
| `src/render/camera.js` | Camera state; world→screen projection |
| `src/render/pipeline.js` | Per-frame triangle assembly + sort + draw |
| `src/render/terrainMesh.js` | Build the visible-tile triangle list |
| `src/render/particles.js` | Exhaust + smoke + spark effects |
| `src/render/hud.js` | Score, fuel, lives, hi-score overlay |

## Frame sequence

```
1. Clear sky band (top), sea band fallback (bottom).
2. terrainMesh.build(camera, ship.position) → triangles (back-to-front)
3. objects.collectVisible(camera) → triangles
4. ship.shape().transform(orientation, position) → triangles
5. bullets / rocks → triangles
6. particles → 2D point sprites
7. Concatenate non-terrain triangles into a separate list, sort by min-z,
   then draw terrain (already ordered) + sorted overlay.
8. HUD draws to overlay layer.
```

## Camera (faithful to source `Lander.arm`)

- Player Z position fixed in world: camera always sits `CAMERA_PLAYER_Z = 5 tiles` behind the ship (per `Lander.arm:114`).
- Camera tilts down ~30° (calibrated against longplay video; tunable in constants).
- Focal length `f` chosen so a 1-tile object at 5 tiles distance is ~64 px on the 320×256 framebuffer.

## Triangle struct

```
{ a:Vec3, b:Vec3, c:Vec3, color:'#rrggbb', depth:number }
```

After projection `a/b/c` become screen-space `{x,y}` plus a `depth` for sorting.

## Lighting

Per-face flat shading: `lum = 0.4 + 0.6 · max(0, n · L)` where `L = normalize(0.4, 0.6, -0.7)` (light from above-and-slightly-left, per source comment line 1659). Source RGB multiplied by `lum`.

## VIDC colour conversion

The original 12-bit RGB (4 bits per channel, e.g. `&080`) → web RGB:

```
r8 = ((c >> 8) & 0xF) * 17
g8 = ((c >> 4) & 0xF) * 17
b8 = ( c       & 0xF) * 17
```

Implemented once in `src/constants.js#vidcToRgb()`.

## Acceptance criteria

- [ ] Camera projection: a vertex at world (0, 0, 5 tiles) lands at screen centre
- [ ] Backface cull removes ≥40% of object faces on a typical frame
- [ ] Painter sort: deeper triangles drawn first (manual visual check)
- [ ] Frame budget on a 2020-era laptop: < 10 ms in pipeline
