// Pointer-lock mouse + keyboard fallback + touch (mobile). See ADR-005
// / SPEC-005-A. Touch uses a virtual thumbstick + on-screen buttons; the
// stick's polar offset feeds the same `pitch`/`roll` virtual cursor that
// the mouse drives, so the rest of the engine sees one input model.

import { MOUSE_SENSITIVITY, KEYBOARD_TILT_RATE } from './constants.js';

const isTouchDevice = typeof window !== 'undefined'
  && (('ontouchstart' in window)
      || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

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

  // --- Pointer lock (desktop) -----------------------------------------
  // Skip the pointer-lock dance entirely on touch devices — there's no
  // cursor to lock and requestPointerLock would just fail.
  if (!isTouchDevice) {
    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock?.();
      }
    });
  } else {
    // On touch, dismiss the overlay on first interaction.
    const dismissOnce = () => { hideOverlay(); state.pointerLocked = true; };
    canvas.addEventListener('touchstart', dismissOnce, { once: true, passive: true });
  }

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

  // --- Touch controls --------------------------------------------------
  // Virtual thumbstick (left) + three buttons (right). Each control owns
  // its own touch identifier so the player can hold the stick with one
  // thumb and press THRUST with the other simultaneously.

  const stickEl   = document.getElementById('joystick');
  const stickKnob = document.getElementById('joystick-knob');
  const btnThrust = document.getElementById('btn-thrust');
  const btnHover  = document.getElementById('btn-hover');
  const btnFire   = document.getElementById('btn-fire');
  const STICK_RADIUS_PX = 60;   // movement radius of the knob in pixels

  let stickTouchId = null;
  let stickCenterX = 0, stickCenterY = 0;

  function updateStickFromTouch(t) {
    let dx = (t.clientX - stickCenterX) / STICK_RADIUS_PX;
    let dy = (t.clientY - stickCenterY) / STICK_RADIUS_PX;
    const r = Math.hypot(dx, dy);
    if (r > 1) { dx /= r; dy /= r; }
    state.roll  = dx;
    state.pitch = dy;
    if (stickKnob) {
      stickKnob.style.transform =
        `translate(${dx * STICK_RADIUS_PX}px, ${dy * STICK_RADIUS_PX}px)`;
    }
  }

  function releaseStick() {
    stickTouchId = null;
    state.roll = 0;
    state.pitch = 0;
    if (stickKnob) stickKnob.style.transform = '';
  }

  if (stickEl) {
    stickEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      stickTouchId = t.identifier;
      const rect = stickEl.getBoundingClientRect();
      stickCenterX = rect.left + rect.width / 2;
      stickCenterY = rect.top + rect.height / 2;
      updateStickFromTouch(t);
    }, { passive: false });
  }

  document.addEventListener('touchmove', (e) => {
    if (stickTouchId === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier === stickTouchId) {
        e.preventDefault();
        updateStickFromTouch(t);
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickTouchId) {
        releaseStick();
      }
    }
  });
  document.addEventListener('touchcancel', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickTouchId) {
        releaseStick();
      }
    }
  });

  function bindHoldButton(el, onPress, onRelease) {
    if (!el) return;
    let activeTouchId = null;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      activeTouchId = t.identifier;
      el.classList.add('active');
      onPress();
    }, { passive: false });
    const release = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouchId) {
          activeTouchId = null;
          el.classList.remove('active');
          onRelease();
        }
      }
    };
    el.addEventListener('touchend', release);
    el.addEventListener('touchcancel', release);
  }

  bindHoldButton(btnThrust,
    () => { state.thrust = true; },
    () => { state.thrust = false; });
  bindHoldButton(btnHover,
    () => { state.hover = true; },
    () => { state.hover = false; });

  // Fire is edge-triggered: latch on press, consumed by snapshot().
  if (btnFire) {
    btnFire.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btnFire.classList.add('active');
      state.fire = true;
    }, { passive: false });
    const fireRelease = () => btnFire.classList.remove('active');
    btnFire.addEventListener('touchend', fireRelease);
    btnFire.addEventListener('touchcancel', fireRelease);
  }

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
