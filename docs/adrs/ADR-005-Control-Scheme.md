# ADR-005: Control Scheme — Pointer-Lock Polar Mouse with Keyboard Fallback

- **Status**: Accepted
- **Date**: 2026-04-30
- **Supersedes**: —
- **Superseded by**: —
- **Dependencies**: ADR-002

## Why (the problem)

The original *Lander*'s defining feel is its **polar-coordinate mouse control**: the mouse position relative to a notional centre sets the ship's tilt direction (angle) and tilt magnitude (distance). LMB = full thrust, MMB = hover, RMB = fire. This is the game's signature and is non-negotiable for "feels like the original".

The browser cannot read absolute mouse position outside its window, so we need a way to read continuous relative deltas without the cursor escaping. We also need a fallback for users without three-button mice (most laptops).

## Why not (rejected alternatives)

- **Read absolute `mousemove` coordinates** — works but the cursor escapes the canvas during fast play, breaking control and showing the OS pointer over the game.
- **Drag-only control (mouse held)** — diverges from original (you can fly without holding).
- **Keyboard-only WASD** — works but loses the analog polar feel completely.
- **Touch / on-screen joystick** — not faithful; mouse precision is core. (Mobile is out of scope per plan.)
- **Gamepad API** — additional code path with low payoff; could be added later.

## What (the decision)

**Primary**: Pointer Lock API. The user clicks the canvas to engage; `requestPointerLock()` hides the cursor and provides relative `movementX/movementY` deltas indefinitely. We accumulate deltas into an internal "virtual cursor" that represents distance-from-centre, then clamp to a maximum radius. From the virtual cursor we compute polar (r, θ) → ship tilt magnitude and direction. The damping equation `target = current − (current − target) / 2` per fixed step (50 Hz) matches the original.

- **LMB** → full thrust
- **MMB** → hover (auto-balance gravity)
- **RMB** → fire bullet (cost −1 point) — uses `contextmenu` event suppression
- **Esc** → release pointer lock (browser default)
- **Shift** alternative for hover (MMB-less laptops)

**Fallback** (no pointer lock): WASD / arrow keys to tilt, **Space** to thrust, **F** to fire, **H** to hover.

**Sensitivity** is exposed as `MOUSE_SENSITIVITY` in `src/constants.js` so the famous twitchiness can be tuned without touching control logic.

## How (consequences)

**Positive**: Faithful polar feel; cursor cannot escape the game; one input model handles all directions analogue; keyboard fallback covers laptops.

**Negative**: Pointer Lock requires a user gesture to activate — needs a "Click to play" overlay. Some users find pointer-lock disorienting; Esc is the universal escape hatch.

**Neutral**: Couples us to a modern browser API (Pointer Lock has been in all evergreens since 2013 — non-issue in 2026).
