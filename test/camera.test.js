import { describe, it, expect } from 'vitest';
import { cameraPosition, worldToCamera, projectCamera, project } from '../src/render/camera.js';
import { vec3 } from '../src/math/vec3.js';
import { CAMERA_BACK_FROM_SHIP, CAMERA_HEIGHT_ABOVE_SHIP, SCREEN_W, SCREEN_H } from '../src/constants.js';

describe('camera', () => {
  const ship = { pos: vec3(10, 5, 7) };
  const cam = cameraPosition(ship);

  it('camera sits above-and-behind the ship', () => {
    expect(cam.x).toBe(10);
    expect(cam.y).toBe(5 + CAMERA_HEIGHT_ABOVE_SHIP);
    expect(cam.z).toBe(7 + CAMERA_BACK_FROM_SHIP);
  });

  it('worldToCamera at the camera position is the origin', () => {
    const c = worldToCamera(cam, cam);
    expect(c.x).toBeCloseTo(0);
    expect(c.y).toBeCloseTo(0);
    expect(c.z).toBeCloseTo(0);
  });

  it('projecting a point on the camera forward axis lands at screen centre', () => {
    // Forward in camera space is -Z; place a vertex 5 in front of camera
    // (camera-space (0, 0, -5)) and project.
    const cs = { x: 0, y: 0, z: -5 };
    const s = projectCamera(cs);
    expect(s).toBeTruthy();
    expect(s.x).toBeCloseTo(SCREEN_W / 2);
    expect(s.y).toBeCloseTo(SCREEN_H / 2);
  });

  it('projects null behind the near plane', () => {
    const cs = { x: 0, y: 0, z: 0.1 };
    expect(projectCamera(cs)).toBeNull();
  });

  it('vertical position above zero maps to upper half (smaller y)', () => {
    const cs = { x: 0, y: 1, z: -5 };
    const s = projectCamera(cs);
    expect(s.y).toBeLessThan(SCREEN_H / 2);
  });
});
