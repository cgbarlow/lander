// The rendering pipeline. Per frame:
//   1. Sky + sea wash background
//   2. Build terrain triangles (back-to-front)
//   3. Add object triangles within view
//   4. Add ship, bullets, rocks, particles
//   5. Project, cull, sort, fill via Canvas 2D
//
// Reference: ADR-003, SPEC-003-A.

import {
  SCREEN_W, SCREEN_H, FAR_Z, SKY_COLOR,
  SUN_DIR, AMBIENT, DIFFUSE, vidcToRgbTinted, SEA_COLOR_VIDC,
} from '../constants.js';
import { cameraPosition, worldToCamera, projectCamera } from './camera.js';
import { buildTerrain } from './terrainMesh.js';
import { SHAPES, ship as shipShape, shapeRadius } from '../world/shapes.js';
import { rock as rockShape } from '../world/shapes.js';
import { shipOrientation, mulVec, rotY } from '../math/mat3.js';
import { dot, normalize, sub, cross, vec3 } from '../math/vec3.js';
import { height } from '../world/terrain.js';
import { drawHud } from './hud.js';
import { drawParticles } from './particles.js';

export function render(ctx, gameState, particles) {
  const { ship, objects, bullets, rocks, score, lives, hiScore, message } = gameState;
  const cam = cameraPosition(ship);

  // 1. Background — sky + sea horizon band.
  drawBackground(ctx);

  // 2. Terrain (back-to-front, no sort needed).
  const terrainTris = buildTerrain(cam.x, cam.z);
  // 3. Objects.
  const objectTris = collectObjects(objects, cam);
  // 4. Ship/bullets/rocks.
  const shipTris   = collectShip(ship, cam);
  const bulletTris = collectBullets(bullets, cam);
  const rockTris   = collectRocks(rocks, cam);

  // Project terrain (already ordered).
  drawList(ctx, terrainTris.map((t) => projectTriangle(t, cam, false)).filter(Boolean));

  // Other (non-terrain) triangles need sorting since they live above the
  // ground in arbitrary positions.
  const overlay = [
    ...objectTris,
    ...shipTris,
    ...bulletTris,
    ...rockTris,
  ].map((t) => projectTriangle(t, cam, true)).filter(Boolean);

  overlay.sort((a, b) => b.depth - a.depth); // far to near
  drawList(ctx, overlay);

  // 5. Particles (point sprites).
  drawParticles(ctx, particles, cam);

  // 6. HUD.
  drawHud(ctx, score.value, ship.fuel, lives, hiScore, message);
}

function drawBackground(ctx) {
  // Sky.
  ctx.fillStyle = SKY_COLOR;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  // Sea band along the bottom horizon.
  ctx.fillStyle = vidcToRgbTinted(SEA_COLOR_VIDC, 0.55);
  ctx.fillRect(0, SCREEN_H * 0.55, SCREEN_W, SCREEN_H * 0.45);
}

function collectObjects(objects, cam) {
  const out = [];
  for (const obj of objects) {
    const dx = obj.x - cam.x, dz = obj.z - cam.z;
    if (dx * dx + dz * dz > FAR_Z * FAR_Z) continue;

    const shape = SHAPES[obj.type];
    if (!shape) continue;

    const groundY = height(obj.x, obj.z);
    const orient = rotY(obj.yaw);
    // Object vertices are authored with y up; their feet are at y=0 in
    // local space (after our flip). Place the base at the ground.
    const baseY = groundY;

    if (obj.destroyed) continue;

    for (const f of shape.faces) {
      const va = transformVertex(shape.vertices[f.a], orient, obj.x, baseY, obj.z);
      const vb = transformVertex(shape.vertices[f.b], orient, obj.x, baseY, obj.z);
      const vc = transformVertex(shape.vertices[f.c], orient, obj.x, baseY, obj.z);
      const lum = faceLum(va, vb, vc);
      out.push({
        a: va, b: vb, c: vc,
        color: vidcToRgbTinted(f.colorVidc, lum),
        type: 'object',
      });
    }
  }
  return out;
}

function collectShip(ship, cam) {
  const out = [];
  const orient = shipOrientation(ship.pitch, ship.roll);
  for (const f of shipShape.faces) {
    const va = transformVertex(shipShape.vertices[f.a], orient, ship.pos.x, ship.pos.y, ship.pos.z);
    const vb = transformVertex(shipShape.vertices[f.b], orient, ship.pos.x, ship.pos.y, ship.pos.z);
    const vc = transformVertex(shipShape.vertices[f.c], orient, ship.pos.x, ship.pos.y, ship.pos.z);
    const lum = faceLum(va, vb, vc);
    out.push({
      a: va, b: vb, c: vc,
      color: vidcToRgbTinted(f.colorVidc, lum),
      type: 'ship',
    });
  }
  return out;
}

function collectBullets(bullets, cam) {
  // Bullets are tiny — render as small bright tetrahedral squares (2 tris).
  const out = [];
  for (const b of bullets) {
    const r = 0.05;
    const a = { x: b.pos.x - r, y: b.pos.y - r, z: b.pos.z };
    const c = { x: b.pos.x + r, y: b.pos.y - r, z: b.pos.z };
    const d = { x: b.pos.x + r, y: b.pos.y + r, z: b.pos.z };
    const e = { x: b.pos.x - r, y: b.pos.y + r, z: b.pos.z };
    out.push({ a, b: c, c: d, color: '#ffeeaa', type: 'bullet' });
    out.push({ a, b: d, c: e, color: '#ffeeaa', type: 'bullet' });
  }
  return out;
}

function collectRocks(rocks, cam) {
  const out = [];
  for (const r of rocks) {
    const orient = rotY(r.rotation);
    for (const f of rockShape.faces) {
      const va = transformVertex(rockShape.vertices[f.a], orient, r.pos.x, r.pos.y, r.pos.z);
      const vb = transformVertex(rockShape.vertices[f.b], orient, r.pos.x, r.pos.y, r.pos.z);
      const vc = transformVertex(rockShape.vertices[f.c], orient, r.pos.x, r.pos.y, r.pos.z);
      const lum = faceLum(va, vb, vc);
      out.push({
        a: va, b: vb, c: vc,
        color: vidcToRgbTinted(f.colorVidc, lum * 0.9),
        type: 'rock',
      });
    }
  }
  return out;
}

function transformVertex(v, orient, ox, oy, oz) {
  const r = mulVec(orient, v);
  return { x: r.x + ox, y: r.y + oy, z: r.z + oz };
}

function faceLum(a, b, c) {
  const n = normalize(cross(sub(b, a), sub(c, a)));
  return AMBIENT + DIFFUSE * Math.max(0, dot(n, SUN_DIR));
}

function projectTriangle(tri, cam, doBackfaceCull) {
  const ca = worldToCamera(tri.a, cam);
  const cb = worldToCamera(tri.b, cam);
  const cc = worldToCamera(tri.c, cam);

  // Backface cull in camera space. The camera is at the origin, so the
  // view ray to the face is just `ca`. A face is back-facing iff its
  // outward normal has a positive component along that ray, i.e.
  // dot(ca, n) > 0. (Using `n.z > 0` only works for faces at the camera
  // origin and would wrongly cull off-axis faces — e.g. the top of the
  // ship when viewed from above-and-behind.)
  if (doBackfaceCull) {
    const n = cross(sub(cb, ca), sub(cc, ca));
    if (dot(ca, n) > 0) return null;
  }

  const pa = projectCamera(ca);
  const pb = projectCamera(cb);
  const pc = projectCamera(cc);
  if (!pa || !pb || !pc) return null;

  const depth = Math.min(pa.z, pb.z, pc.z);
  return { pa, pb, pc, color: tri.color, depth, type: tri.type };
}

function drawList(ctx, list) {
  for (const t of list) {
    ctx.fillStyle = t.color;
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(t.pa.x, t.pa.y);
    ctx.lineTo(t.pb.x, t.pb.y);
    ctx.lineTo(t.pc.x, t.pc.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
