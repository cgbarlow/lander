// Particle system — exhaust, smoke, sparks, debris.
// Reference: Lander.arm:MoveAndDrawParticles @ 2780, AddExhaustParticleToBuffer @ 3566.

import { worldToCamera, projectCamera } from './camera.js';
import { vidcToRgb } from '../constants.js';

const MAX_PARTICLES = 484;  // (Lander.arm:51)

export function createParticles() {
  return [];
}

export function addExhaust(particles, ship, count = 4) {
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    particles.push({
      pos: { x: ship.pos.x + rand(-0.05, 0.05),
             y: ship.pos.y - 0.3,
             z: ship.pos.z + rand(-0.05, 0.05) },
      vel: { x: ship.vel.x * 0.5 + rand(-0.05, 0.05),
             y: ship.vel.y * 0.5 - rand(0.1, 0.25),
             z: ship.vel.z * 0.5 + rand(-0.05, 0.05) },
      life: 18 + Math.random() * 10,
      kind: 'exhaust',
    });
  }
}

export function addExplosion(particles, x, y, z, count = 60) {
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI;
    const s = 0.15 + Math.random() * 0.35;
    particles.push({
      pos: { x, y, z },
      vel: {
        x: Math.cos(a) * Math.sin(b) * s,
        y: Math.cos(b) * s + 0.05,
        z: Math.sin(a) * Math.sin(b) * s,
      },
      life: 40 + Math.random() * 30,
      kind: 'explosion',
    });
  }
}

export function addSmoke(particles, x, y, z, count = 8) {
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) break;
    particles.push({
      pos: { x: x + rand(-0.2, 0.2), y, z: z + rand(-0.2, 0.2) },
      vel: { x: rand(-0.02, 0.02), y: 0.04 + Math.random() * 0.04, z: rand(-0.02, 0.02) },
      life: 80 + Math.random() * 40,
      kind: 'smoke',
    });
  }
}

export function stepParticles(particles, gravity = 0.01) {
  for (const p of particles) {
    p.pos.x += p.vel.x;
    p.pos.y += p.vel.y;
    p.pos.z += p.vel.z;
    if (p.kind === 'explosion') p.vel.y -= gravity;
    p.life--;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

export function drawParticles(ctx, particles, cam) {
  for (const p of particles) {
    const c = worldToCamera(p.pos, cam);
    const s = projectCamera(c);
    if (!s) continue;
    let color, size;
    switch (p.kind) {
      case 'exhaust':
        color = p.life > 15 ? '#ffffaa' : (p.life > 8 ? '#ff8800' : '#553333');
        size = 1.5;
        break;
      case 'explosion':
        color = p.life > 40 ? '#ffffff' : (p.life > 20 ? '#ffaa00' : '#440000');
        size = 1.8;
        break;
      case 'smoke':
        color = vidcToRgb(0x444);
        size = 1.5;
        break;
      default:
        color = '#fff';
        size = 1;
    }
    const scale = Math.max(0.5, 6 / s.z);
    ctx.fillStyle = color;
    ctx.fillRect(s.x - size * scale * 0.5, s.y - size * scale * 0.5, size * scale, size * scale);
  }
}

function rand(a, b) { return a + Math.random() * (b - a); }
