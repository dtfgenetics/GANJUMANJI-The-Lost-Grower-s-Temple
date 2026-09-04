import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/game/content';
import { createGame, move, type Direction, type Point, type TempleState } from '../src/game/model';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const pointKey = (point: Point) => `${point.x},${point.y}`;
const listKey = (points: Point[]) => points.map(pointKey).sort().join('|');

function stateKey(state: TempleState) {
  const surgeEvery = REGIONS[state.regionId].surgeEvery;
  return [
    state.regionId,
    pointKey(state.player),
    state.health,
    state.wards,
    state.tools,
    state.collected,
    state.campaignCollected,
    state.regionTurn % surgeEvery,
    listKey(state.relics),
    listKey(state.hazards),
    listKey(state.wardCaches),
    listKey(state.toolCaches),
    listKey(state.guardians),
    listKey(state.visitedCheckpoints),
    [...state.regionsCleared].sort().join('|')
  ].join('::');
}

function findWinningRoute(maxExplored = 150_000): Direction[] | null {
  const start = createGame();
  const queue: Array<{ state: TempleState; route: Direction[] }> = [{ state: start, route: [] }];
  const seen = new Set<string>([stateKey(start)]);
  let cursor = 0;

  while (cursor < queue.length && cursor < maxExplored) {
    const current = queue[cursor++];
    for (const direction of DIRECTIONS) {
      const next = move(current.state, direction);
      if (next.status === 'won') return [...current.route, direction];
      if (next.status !== 'playing' || next.turn === current.state.turn) continue;

      const key = stateKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: next, route: [...current.route, direction] });
    }
  }

  return null;
}

describe('Ganjumanji campaign solvability', () => {
  it('keeps at least one survivable route through every region and the final vault', () => {
    const route = findWinningRoute();
    expect(route, 'campaign balance must preserve a complete survivable route').not.toBeNull();
    expect(route!.length).toBeGreaterThan(0);
    expect(route!.length).toBeLessThan(220);
  });
});
