# SPEC-005-A: Control Scheme

Implements: [ADR-005](../ADR-005-Control-Scheme.md)

## Module

`src/input.js` — owns all input. Exports a single `Input` object with a `state` snapshot per frame.

## State shape

```js
{
  pitch:   number,  // -1..+1, mouse Y normalised  (forward/back tilt target)
  roll:    number,  // -1..+1, mouse X normalised  (left/right tilt target)
  thrust:  boolean, // LMB or Space
  hover:   boolean, // MMB or Shift or H
  fire:    boolean, // RMB or F  (edge-triggered: true for one frame per press)
  pointerLocked: boolean,
}
```

## Pointer lock activation

- Show a "Click to play" overlay when the canvas is not pointer-locked.
- On click: `canvas.requestPointerLock()`.
- Listen on `pointerlockchange` to update `state.pointerLocked`.
- On `pointerlockerror`: keep overlay, show a small message.

## Mouse → polar tilt

Maintain a virtual cursor `{ vx, vy }` initialised to `{0,0}`. Each `mousemove` event while locked:

```
vx = clamp(vx + e.movementX * MOUSE_SENSITIVITY, -1, 1)
vy = clamp(vy + e.movementY * MOUSE_SENSITIVITY, -1, 1)
```

Each fixed step (50 Hz) decay slightly toward 0 (`vx *= AUTO_CENTER`, default 1.0 = no auto-centre, faithful). Damping equation applied in `ship.js` translates `(vx, vy)` to actual ship pitch/roll using `next = current − (current − target) / 2`.

## Keyboard fallback

Bind on `keydown` / `keyup`:

| Key | Action |
|---|---|
| W / ↑ | nudge `vy` toward −1 |
| S / ↓ | nudge `vy` toward +1 |
| A / ← | nudge `vx` toward −1 |
| D / → | nudge `vx` toward +1 |
| Space | thrust |
| Shift / H | hover |
| F | fire |

## Mouse buttons

| Event | Sets |
|---|---|
| `mousedown` button 0 | `thrust = true` |
| `mouseup` button 0 | `thrust = false` |
| `mousedown` button 1 | `hover = true` |
| `mouseup` button 1 | `hover = false` |
| `mousedown` button 2 | latches `fire = true` for next frame |
| `contextmenu` | `e.preventDefault()` (so RMB doesn't open menu) |

## Acceptance criteria

- [ ] Click on canvas → cursor hides, `state.pointerLocked === true`
- [ ] Press Esc → cursor reappears, overlay returns
- [ ] Move mouse right → `vx` increases, capped at +1
- [ ] WASD works without pointer lock
- [ ] RMB doesn't open the browser context menu
- [ ] Unit-testable functions exported: `applyMouseDelta(state, dx, dy, sens)`, `applyDamping(current, target)`
