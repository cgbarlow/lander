// Entry point — wires Canvas + Input + Game.

import { createInput } from './input.js';
import { createGame } from './game.js';

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas #game not found');

// Disable image smoothing on the canvas itself for the chunky look.
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

const input = createInput(canvas);
const game = createGame(canvas, input);
game.start();

// Expose for debugging from the console.
if (typeof window !== 'undefined') window.lander = { game, input };
