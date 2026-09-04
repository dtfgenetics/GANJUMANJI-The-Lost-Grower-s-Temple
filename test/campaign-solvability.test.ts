import { describe, expect, it } from 'vitest';
import { REGIONS, type RegionId } from '../src/game/content';
import { createGame, move, type Direction, type Point, type TempleState } from '../src/game/model';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const pointKey = (point: Point) => `${point.x},${point.y}`;
const listKey = (points: Point[]) => points.map(pointKey).sort().join('|');
const manhattan = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

type SearchNode = { state: TempleState; depth: number; score: number };
type Resources = { health: number; wards: number; tools: number; depth: number };

class MinHeap {
  private items: SearchNode[] = [];

  get size() { return this.items.length; }

  push(node: SearchNode) {
    this.items.push(node);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].score <= node.score) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = node;
  }

  pop(): SearchNode {
    const root = this.items[0];
    const tail = this.items.pop()!;
    if (this.items.length === 0) return root;

    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.items.length) break;
      const child = right < this.items.length && this.items[right].score < this.items[left].score ? right : left;
      if (this.items[child].score >= tail.score) break;
      this.items[index] = this.items[child];
      index = child;
    }
    this.items[index] = tail;
    return root;
  }
}

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

function routeLowerBound(start: Point, relics: Point[], exit: Point): number {
  if (relics.length === 0) return manhattan(start, exit);
  let best = Number.POSITIVE_INFINITY;

  const visit = (position: Point, remaining: Point[], distance: number) => {
    if (distance >= best) return;
    if (remaining.length === 0) {
      best = Math.min(best, distance + manhattan(position, exit));
      return;
    }
    for (let index = 0; index < remaining.length; index += 1) {
      const target = remaining[index];
      visit(target, remaining.filter((_, candidate) => candidate !== index), distance + manhattan(position, target));
    }
  };

  visit(start, relics, 0);
  return best;
}

const futureRegionLowerBound = new Map<RegionId, number>();
for (const region of Object.values(REGIONS)) {
  futureRegionLowerBound.set(region.id, routeLowerBound(region.start, region.relics, region.exit));
}

function heuristic(state: TempleState): number {
  let estimate = routeLowerBound(state.player, state.relics, state.exit);
  let nextRegion = REGIONS[state.regionId].nextRegion;
  while (nextRegion) {
    estimate += futureRegionLowerBound.get(nextRegion) ?? 0;
    nextRegion = REGIONS[nextRegion].nextRegion;
  }
  return estimate;
}

function findWinningDepth(maxDepth = 219): { depth: number; explored: number } | null {
  const start = createGame();
  const open = new MinHeap();
  open.push({ state: start, depth: 0, score: heuristic(start) });
  const frontiers = new Map<string, Resources[]>();
  admit(frontiers, start, 0);
  let explored = 0;

  while (open.size > 0) {
    const current = open.pop();
    explored += 1;
    if (current.depth >= maxDepth) continue;

    for (const direction of DIRECTIONS) {
      const next = move(current.state, direction);
      if (next.turn === current.state.turn) continue;
      const depth = current.depth + 1;
      if (next.status === 'won') return { depth, explored };
      if (next.status !== 'playing' || !admit(frontiers, next, depth)) continue;
      open.push({ state: next, depth, score: depth + heuristic(next) });
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
    expect(result!.explored).toBeGreaterThan(0);
  }, 20_000);
});
