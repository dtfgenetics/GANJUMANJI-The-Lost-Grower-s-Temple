import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/game/content';
import type { Point } from '../src/game/model';

const key = (point: Point) => `${point.x},${point.y}`;

function reachablePoints(width: number, height: number, start: Point, walls: Point[]) {
  const blocked = new Set(walls.map(key));
  const seen = new Set<string>([key(start)]);
  const queue = [start];
  const steps = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  while (queue.length) {
    const current = queue.shift()!;
    for (const delta of steps) {
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      const id = key(next);
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height || blocked.has(id) || seen.has(id)) continue;
      seen.add(id);
      queue.push(next);
    }
  }
  return seen;
}

describe('Ganjumanji campaign content', () => {
  for (const region of Object.values(REGIONS)) {
    it(`${region.name} keeps every required gameplay tile valid and reachable`, () => {
      const wallKeys = new Set(region.walls.map(key));
      const required = [region.start, region.exit, ...region.relics, ...region.wardCaches, ...region.toolCaches, ...region.guardians, ...region.checkpoints, ...region.hazards];
      for (const point of required) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThan(region.width);
        expect(point.y).toBeLessThan(region.height);
        expect(wallKeys.has(key(point))).toBe(false);
      }

      const reachable = reachablePoints(region.width, region.height, region.start, region.walls);
      expect(reachable.has(key(region.exit))).toBe(true);
      for (const point of [...region.relics, ...region.wardCaches, ...region.toolCaches, ...region.guardians, ...region.checkpoints]) {
        expect(reachable.has(key(point))).toBe(true);
      }
    });

    it(`${region.name} does not duplicate critical pickups or encounters`, () => {
      const objectKeys = [...region.relics, ...region.wardCaches, ...region.toolCaches, ...region.guardians, ...region.checkpoints].map(key);
      expect(new Set(objectKeys).size).toBe(objectKeys.length);
    });
  }
});
