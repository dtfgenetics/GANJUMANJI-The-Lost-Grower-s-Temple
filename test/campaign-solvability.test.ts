import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/game/content';
import { createGame, move, type Direction, type Point, type TempleState } from '../src/game/model';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const pointKey = (point: Point) => `${point.x},${point.y}`;
const listKey = (points: Point[]) => points.map(pointKey).sort().join('|');

type SearchNode = { state: TempleState; depth: number };
type Resources = { health: number; wards: number; tools: number; depth: number };

function structuralKey(state: TempleState) {
  const surgeEvery = REGIONS[state.regionId].surgeEvery;
  return [
    state.regionId,
    pointKey(state.player),
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

function dominates(a: Resources, b: Resources) {
  return a.depth <= b.depth && a.health >= b.health && a.wards >= b.wards && a.tools >= b.tools;
}

function admit(frontiers: Map<string, Resources[]>, state: TempleState, depth: number) {
  const key = structuralKey(state);
  const candidate: Resources = { health: state.health, wards: state.wards, tools: state.tools, depth };
  const frontier = frontiers.get(key) ?? [];

  if (frontier.some((existing) => dominates(existing, candidate))) return false;

  frontiers.set(key, frontier.filter((existing) => !dominates(candidate, existing)).concat(candidate));
  return true;
}

function findWinningDepth(maxDepth = 219): { depth: number; explored: number } | null {
  const start = createGame();
  const queue: SearchNode[] = [{ state: start, depth: 0 }];
  const frontiers = new Map<string, Resources[]>();
  admit(frontiers, start, 0);
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor++];
    if (current.depth >= maxDepth) continue;

    for (const direction of DIRECTIONS) {
      const next = move(current.state, direction);
      if (next.turn === current.state.turn) continue;
      const depth = current.depth + 1;
      if (next.status === 'won') return { depth, explored: cursor };
      if (next.status !== 'playing') continue;
      if (!admit(frontiers, next, depth)) continue;
      queue.push({ state: next, depth });
    }
  }

  return null;
}

describe('Ganjumanji campaign solvability', () => {
  it('keeps at least one survivable route through every region and the final vault', () => {
    const result = findWinningDepth();
    expect(result, 'campaign balance must preserve a complete survivable route').not.toBeNull();
    expect(result!.depth).toBeGreaterThan(0);
    expect(result!.depth).toBeLessThan(220);
    expect(result!.explored).toBeLessThan(150_000);
  });
});
