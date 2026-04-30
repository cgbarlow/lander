// Top-level game state machine + fixed-step loop.
// States: 'menu' | 'playing' | 'crashed' | 'gameOver'.

import {
  PHYSICS_HZ, STARTING_LIVES, FUEL_MAX, SCORE_LAND,
  REFUEL_RATE, BULLET_COST,
} from './constants.js';
import { createShip, stepShip, refuel } from './sim/ship.js';
import { stepBullets, fireBullet } from './sim/bullets.js';
import { stepRocks, maybeSpawnRock } from './sim/rocks.js';
import {
  checkGround, shipVsObjects, bulletsVsObjects, rocksVsShip, bulletsVsRocks,
} from './sim/collision.js';
import { buildObjects } from './world/objects.js';
import {
  createParticles, addExhaust, addExplosion, addSmoke, stepParticles,
} from './render/particles.js';
import { render } from './render/pipeline.js';

const STEP_MS = 1000 / PHYSICS_HZ;

export function createGame(canvas, input) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const hiScore = Number(localStorage.getItem('lander.hi') || 0);

  const state = {
    mode: 'playing',
    ship: createShip(),
    objects: buildObjects(1987),
    bullets: [],
    rocks: [],
    score: { value: 0 },
    lives: STARTING_LIVES,
    hiScore,
    message: '',
    messageTimer: 0,
    landedTimer: 0,
  };

  const particles = createParticles();
  let last = performance.now();
  let acc = 0;

  function update(snap) {
    if (state.mode === 'gameOver') {
      if (snap.fire) restart();
      return;
    }
    if (state.mode === 'crashed') {
      stepParticles(particles);
      state.messageTimer--;
      if (state.messageTimer <= 0) {
        if (state.lives <= 0) endGame();
        else respawn();
      }
      return;
    }

    // Fire?
    if (snap.fire && state.ship.fuel > 0 && !state.ship.landed) {
      const b = fireBullet(state.ship, state.score);
      state.bullets.push(b);
    }

    // Physics step.
    stepShip(state.ship, snap);

    // Engines emit exhaust.
    if ((snap.thrust || snap.hover) && state.ship.fuel > 0) {
      addExhaust(particles, state.ship, snap.thrust ? 5 : 2);
    }

    stepBullets(state.bullets);
    stepRocks(state.rocks);
    maybeSpawnRock(state.rocks, state.ship, state.score);
    stepParticles(particles);

    // Collision.
    const ground = checkGround(state.ship);
    if (ground === 'land') {
      handleLanding();
    } else if (ground === 'crash') {
      handleCrash();
      return;
    }

    const objHit = shipVsObjects(state.ship, state.objects);
    if (objHit) {
      objHit.destroyed = true;
      handleCrash();
      return;
    }

    const rockHit = rocksVsShip(state.rocks, state.ship);
    if (rockHit) {
      handleCrash();
      return;
    }

    const objBulletHits = bulletsVsObjects(state.bullets, state.objects);
    for (const { bullet, object } of objBulletHits) {
      object.destroyed = true;
      state.score.value += object.score;
      addSmoke(particles, object.x, -0.5, object.z, 12);
      bullet.life = 0;
    }

    const rockBulletHits = bulletsVsRocks(state.bullets, state.rocks);
    for (const { bullet, rock } of rockBulletHits) {
      addExplosion(particles, rock.pos.x, rock.pos.y, rock.pos.z, 20);
      rock.life = 0;
      bullet.life = 0;
      state.score.value += 10;
    }

    // Refuel while landed on the pad.
    if (state.ship.landed) {
      state.landedTimer++;
      if (state.landedTimer === 1) {
        state.score.value += SCORE_LAND;
        flashMessage('LANDED');
      }
      refuel(state.ship);
    } else {
      state.landedTimer = 0;
    }

    if (state.messageTimer > 0) state.messageTimer--;
    else state.message = '';
  }

  function handleLanding() { /* no-op extra; refuel handled in main update */ }

  function handleCrash() {
    addExplosion(particles, state.ship.pos.x, state.ship.pos.y, state.ship.pos.z, 80);
    state.lives--;
    state.mode = 'crashed';
    state.message = 'CRASH';
    state.messageTimer = 80;  // ~1.6 s at 50 Hz
  }

  function respawn() {
    state.ship = createShip();
    state.bullets.length = 0;
    state.rocks.length = 0;
    state.mode = 'playing';
    state.message = '';
    input.reset();
  }

  function endGame() {
    state.mode = 'gameOver';
    state.message = 'GAME OVER — F TO RESTART';
    state.messageTimer = 999999;
    if (state.score.value > state.hiScore) {
      state.hiScore = state.score.value;
      localStorage.setItem('lander.hi', '' + state.hiScore);
    }
  }

  function restart() {
    state.score.value = 0;
    state.lives = STARTING_LIVES;
    state.objects = buildObjects(1987 + (Math.random() * 1000 | 0));
    respawn();
  }

  function flashMessage(text) {
    state.message = text;
    state.messageTimer = 90;
  }

  function frame(now) {
    const dt = now - last;
    last = now;
    acc += dt;
    while (acc >= STEP_MS) {
      const snap = input.snapshot();
      update(snap);
      acc -= STEP_MS;
    }
    render(ctx, state, particles);
    requestAnimationFrame(frame);
  }

  return {
    start() { requestAnimationFrame(frame); },
    state,
  };
}
