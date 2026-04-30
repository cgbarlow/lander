import { describe, it, expect } from 'vitest';
import {
  ship, rock, smallLeafyTree, tallLeafyTree, firTree, gazebo, building, rocket,
  shapeHeight, shapeRadius, SHAPES,
} from '../src/world/shapes.js';

describe('shapes — counts match Lander.arm source', () => {
  // (Lander.arm: object* labels)
  it('player ship has 9 vertices and 9 faces', () => {
    expect(ship.vertices.length).toBe(9);
    expect(ship.faces.length).toBe(9);
  });
  it('rock has 6 vertices and 8 faces', () => {
    expect(rock.vertices.length).toBe(6);
    expect(rock.faces.length).toBe(8);
  });
  it('small leafy tree has 11 vertices and 5 faces', () => {
    expect(smallLeafyTree.vertices.length).toBe(11);
    expect(smallLeafyTree.faces.length).toBe(5);
  });
  it('tall leafy tree has 14 vertices and 6 faces', () => {
    expect(tallLeafyTree.vertices.length).toBe(14);
    expect(tallLeafyTree.faces.length).toBe(6);
  });
  it('fir tree has 5 vertices and 2 faces', () => {
    expect(firTree.vertices.length).toBe(5);
    expect(firTree.faces.length).toBe(2);
  });
  it('gazebo has 13 vertices and 8 faces', () => {
    expect(gazebo.vertices.length).toBe(13);
    expect(gazebo.faces.length).toBe(8);
  });
  it('building has 16 vertices and 12 faces', () => {
    expect(building.vertices.length).toBe(16);
    expect(building.faces.length).toBe(12);
  });
  it('rocket has 13 vertices and 8 faces', () => {
    expect(rocket.vertices.length).toBe(13);
    expect(rocket.faces.length).toBe(8);
  });
});

describe('shapes — derived properties', () => {
  it('shapeHeight returns positive max y magnitude', () => {
    expect(shapeHeight(ship)).toBeGreaterThan(0);
  });

  it('shapeRadius returns positive horizontal extent', () => {
    expect(shapeRadius(ship)).toBeGreaterThan(0);
  });

  it('all named shapes are exported', () => {
    for (const name of ['smallLeafyTree','tallLeafyTree','firTree','gazebo','building','rocket']) {
      expect(SHAPES[name]).toBeTruthy();
    }
  });

  it('face vertex indices are valid', () => {
    for (const shape of [ship, rock, smallLeafyTree, tallLeafyTree, firTree, gazebo, building, rocket]) {
      for (const f of shape.faces) {
        expect(f.a).toBeGreaterThanOrEqual(0);
        expect(f.a).toBeLessThan(shape.vertices.length);
        expect(f.b).toBeLessThan(shape.vertices.length);
        expect(f.c).toBeLessThan(shape.vertices.length);
      }
    }
  });

  it('every face has a colour string', () => {
    for (const f of ship.faces) {
      expect(f.color.startsWith('rgb(')).toBe(true);
    }
  });
});
