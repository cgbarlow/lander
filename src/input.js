// Pointer-lock mouse + keyboard fallback. See ADR-005 / SPEC-005-A.

import { MOUSE_SENSITIVITY, KEYBOARD_TILT_RATE } from './constants.js';

export function createInput(canvas) {
  const state = {
    pitch: 0,    // virtual-cursor Y, -1..+1 (forward/back)
    roll:  0,    // virtual-cursor X, -1..+1 (left/right)
    thrust: false,
    hover:  false,
    fire:   false,
    pointerLocked: false,
    keys: { w: false, a: false, s: false, d: false,
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            Space: false, ShiftLeft: false, KeyH: false, KeyF: false },
  };

  // --- Pointer lock ----------------------------------------------------
  canvas.addEventListener('click', () => {
    if (!document.pointerLockElement) {
      canvas.requestPointerLock?.();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    state.pointerLocked = document.pointerLockElement === canvas;
    if (state.pointerLocked) hideOverlay();
    else showOverlay();
  });

  // --- Mouse delta -----------------------------------------------------
  document.addEventListener('mousemove', (e) => {
    if (!state.pointerLocked) return;
    state.roll  = clamp(state.roll  + e.movementX * MOUSE_SENSITIVITY, -1, 1);
    state.pitch = clamp(state.pitch + e.movementY * MOUSE_SENSITIVITY, -1, 1);
  });

  // --- Mouse buttons ---------------------------------------------------
  document.addEventListener('mousedown', (e) => {
    if (!state.pointerLocked) return;
    if (e.button === 0) state.thrust = true;
    if (e.button === 1) { state.hover = true; e.preventDefault(); }
    if (e.button === 2) state.fire   = true;
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) state.thrust = false;
    if (e.button === 1) state.hover  = false;
    // fire is edge-triggered; consumed by the game loop.
  });
  document.addEventListener('contextmenu', (e) => {
    if (state.pointerLocked) e.preventDefault();
  });

  // --- Keyboard --------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { state.keys.Space = true; e.preventDefault(); }
    else if (e.code in state.keys) state.keys[e.code] = true;
    else if (e.key in state.keys) state.keys[e.key] = true;
    if (e.code === 'KeyF') state.fire = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') state.keys.Space = false;
    else if (e.code in state.keys) state.keys[e.code] = false;
    else if (e.key in state.keys) state.keys[e.key] = false;
  });

  /** Per-step update: fold keyboard nudges into the virtual cursor and
   * derive thrust/hover from mouse OR keyboard. Returns a snapshot. */
  function snapshot() {
    const k = state.keys;
    if (k.w || k.ArrowUp)    state.pitch = clamp(state.pitch - KEYBOARD_TILT_RATE, -1, 1);
    if (k.s || k.ArrowDown)  state.pitch = clamp(state.pitch + KEYBOARD_TILT_RATE, -1, 1);
    if (k.a || k.ArrowLeft)  state.roll  = clamp(state.roll  - KEYBOARD_TILT_RATE, -1, 1);
    if (k.d || k.ArrowRight) state.roll  = clamp(state.roll  + KEYBOARD_TILT_RATE, -1, 1);

    const thrust = state.thrust || k.Space;
    const hover  = state.hover  || k.ShiftLeft || k.KeyH;
    const fire   = state.fire;
    state.fire = false;
    return {
      pitch: state.pitch,
      roll:  state.roll,
      thrust, hover, fire,
      pointerLocked: state.pointerLocked,
    };
  }

  function reset() {
    state.pitch = 0;
    state.roll  = 0;
    state.thrust = state.hover = state.fire = false;
  }

  return { snapshot, reset, state };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function hideOverlay() {
  document.getElementById('overlay')?.classList.add('hidden');
}
function showOverlay() {
  document.getElementById('overlay')?.classList.remove('hidden');
}

// Pure helpers exported for unit tests.
export function applyMouseDelta(state, dx, dy, sens = MOUSE_SENSITIVITY) {
  state.roll  = clamp(state.roll  + dx * sens, -1, 1);
  state.pitch = clamp(state.pitch + dy * sens, -1, 1);
  return state;
}

export function applyDamping(current, target, factor = 0.5) {
  return current - (current - target) * factor;
}
