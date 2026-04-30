// End-to-end smoke test: instantiate the game with a real Canvas (via
// jsdom-canvas mock if available), run several physics steps, ensure no
// exception is thrown and ship state evolves sensibly.
//
// jsdom doesn't ship a native Canvas implementation, so we stub the 2D
// context with the small surface the game actually touches. This lets
// us detect runtime errors (NaN propagation, undefined accesses, etc.)
// without requiring a real browser.

import { describe, it, expect, beforeAll } from 'vitest';
import { createGame } from '../src/game.js';

class FakeCtx {
  constructor() {
    this.calls = 0;
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 1;
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
    this.imageSmoothingEnabled = false;
  }
  fillRect()    { this.calls++; }
  strokeRect()  { this.calls++; }
  beginPath()   { this.calls++; }
  closePath()   {}
  moveTo()      {}
  lineTo()      {}
  fill()        { this.calls++; }
  stroke()      { this.calls++; }
  fillText()    { this.calls++; }
  clearRect()   {}
  save()        {}
  restore()     {}
}

class FakeCanvas {
  constructor() {
    this.width = 320;
    this.height = 256;
    this._ctx = new FakeCtx();
  }
  getContext() { return this._ctx; }
}

const fakeInput = {
  snapshot: () => ({ pitch: 0, roll: 0, thrust: false, hover: false, fire: false, pointerLocked: false }),
  reset: () => {},
};

describe('smoke', () => {
  beforeAll(() => {
    // jsdom localStorage works; nothing to set up.
  });

  it('createGame returns a working state machine', () => {
    const canvas = new FakeCanvas();
    const game = createGame(canvas, fakeInput);
    expect(game.state.lives).toBe(5);
    expect(game.state.score.value).toBe(0);
    expect(game.state.objects.length).toBeGreaterThan(0);
  });

  it('a render pass does not throw', () => {
    const canvas = new FakeCanvas();
    const game = createGame(canvas, fakeInput);
    const ctx = canvas.getContext('2d');
    return import('../src/render/pipeline.js').then(({ render }) => {
      const particles = [];
      expect(() => render(ctx, game.state, particles)).not.toThrow();
    });
  });

  it('simulated flight: thrust lifts the ship; cutting thrust drops it', async () => {
    const { createShip, stepShip } = await import('../src/sim/ship.js');
    const ship = createShip();
    ship.landed = false;

    // Thrust full for 100 fixed steps.
    const startY = ship.pos.y;
    for (let i = 0; i < 100; i++) {
      stepShip(ship, { pitch: 0, roll: 0, thrust: true, hover: false, fire: false });
    }
    expect(ship.pos.y).toBeGreaterThan(startY);
    expect(ship.fuel).toBeLessThan(1000); // burned some

    // Cut thrust — gravity wins eventually.
    const peakY = ship.pos.y;
    for (let i = 0; i < 200; i++) {
      stepShip(ship, { pitch: 0, roll: 0, thrust: false, hover: false, fire: false });
    }
    expect(ship.pos.y).toBeLessThan(peakY);
  });

  it('hover thrust roughly cancels gravity in steady state', async () => {
    const { createShip, stepShip } = await import('../src/sim/ship.js');
    const ship = createShip();
    ship.landed = false;
    ship.pos.y = 20;
    ship.vel.y = 0;
    // Run hover for many steps; vy should stay near zero.
    for (let i = 0; i < 200; i++) {
      stepShip(ship, { pitch: 0, roll: 0, thrust: false, hover: true, fire: false });
    }
    expect(Math.abs(ship.vel.y)).toBeLessThan(0.05);
  });

  it('object placement contains varied object types', async () => {
    const { buildObjects } = await import('../src/world/objects.js');
    const objs = buildObjects(1987);
    const types = new Set(objs.map(o => o.type));
    expect(objs.length).toBeGreaterThan(100);
    expect(types.size).toBeGreaterThanOrEqual(3);
    // The launchpad's three rockets are guaranteed.
    expect(objs.filter(o => o.type === 'rocket').length).toBeGreaterThanOrEqual(3);
  });
});
