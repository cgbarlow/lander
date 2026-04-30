// HUD — score, fuel, lives, hi-score, transient messages.

import { SCREEN_W, SCREEN_H, FUEL_MAX } from '../constants.js';

const FONT = '8px "Menlo", "Consolas", monospace';

export function drawHud(ctx, score, fuel, lives, hiScore, message) {
  ctx.font = FONT;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText(`SCORE ${pad(score, 5)}`, 4, 4);
  ctx.textAlign = 'center';
  ctx.fillText(`HI ${pad(hiScore, 5)}`, SCREEN_W / 2, 4);
  ctx.textAlign = 'right';
  ctx.fillText(`LIVES ${lives}`, SCREEN_W - 4, 4);

  // Fuel bar at the bottom-left.
  const barX = 4, barY = SCREEN_H - 12, barW = 80, barH = 6;
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW, barH);
  const f = Math.max(0, Math.min(1, fuel / FUEL_MAX));
  const fuelColor = f > 0.4 ? '#44dd44' : (f > 0.15 ? '#dddd44' : '#dd4444');
  ctx.fillStyle = fuelColor;
  ctx.fillRect(barX + 1, barY + 1, (barW - 1) * f, barH - 1);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText('FUEL', barX, barY - 10);

  // Center message (e.g., "LANDED!", "CRASH").
  if (message) {
    ctx.font = '14px "Menlo", "Consolas", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillRect(SCREEN_W / 2 - 80, SCREEN_H / 2 - 12, 160, 24);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(SCREEN_W / 2 - 80 + 0.5, SCREEN_H / 2 - 12 + 0.5, 160, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(message, SCREEN_W / 2, SCREEN_H / 2 - 5);
  }
}

function pad(n, w) {
  const s = '' + Math.max(0, n | 0);
  return s.length >= w ? s : '0'.repeat(w - s.length) + s;
}
