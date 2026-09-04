export type Point = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'playing' | 'won' | 'lost';

export type TempleState = {
  width: number;
  height: number;
  turn: number;
  danger: number;
  health: number;
  player: Point;
  exit: Point;
  walls: Point[];
  hazards: Point[];
  relics: Point[];
  collected: number;
  relicGoal: number;
  status: GameStatus;
  message: string;
};

const START: Point = { x: 1, y: 7 };
const EXIT: Point = { x: 9, y: 1 };
const RELICS: Point[] = [{ x: 2, y: 2 }, { x: 8, y: 6 }, { x: 6, y: 3 }];
const HAZARDS: Point[] = [{ x: 4, y: 6 }, { x: 7, y: 5 }, { x: 5, y: 2 }];
const WALLS: Point[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 },
  { x: 0, y: 8 }, { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 }, { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 },
  { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 7 },
  { x: 10, y: 1 }, { x: 10, y: 2 }, { x: 10, y: 3 }, { x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 6 }, { x: 10, y: 7 },
  { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 3, y: 4 }, { x: 3, y: 5 },
  { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
  { x: 8, y: 2 }, { x: 8, y: 3 },
  { x: 1, y: 5 }, { x: 2, y: 5 }
];

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const hasPoint = (points: Point[], point: Point) => points.some((candidate) => samePoint(candidate, point));

export function createGame(): TempleState {
  return {
    width: 11,
    height: 9,
    turn: 0,
    danger: 0,
    health: 3,
    player: { ...START },
    exit: { ...EXIT },
    walls: WALLS.map((point) => ({ ...point })),
    hazards: HAZARDS.map((point) => ({ ...point })),
    relics: RELICS.map((point) => ({ ...point })),
    collected: 0,
    relicGoal: RELICS.length,
    status: 'playing',
    message: 'Recover all three relic seeds, then escape through the vault gate.'
  };
}

function destinationFor(player: Point, direction: Direction): Point {
  const delta: Record<Direction, Point> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  return { x: player.x + delta[direction].x, y: player.y + delta[direction].y };
}

export function move(state: TempleState, direction: Direction): TempleState {
  if (state.status !== 'playing') return state;

  const next = structuredClone(state) as TempleState;
  const target = destinationFor(next.player, direction);

  if (hasPoint(next.walls, target)) {
    next.message = 'Ancient stone blocks that route.';
    return next;
  }

  next.player = target;
  next.turn += 1;
  next.danger = Math.min(10, Math.floor(next.turn / 3));
  next.message = 'The temple shifts around you.';

  const relicIndex = next.relics.findIndex((relic) => samePoint(relic, next.player));
  if (relicIndex >= 0) {
    next.relics.splice(relicIndex, 1);
    next.collected += 1;
    next.message = `Relic seed recovered. ${next.relicGoal - next.collected} remain.`;
  }

  const hazardIndex = next.hazards.findIndex((hazard) => samePoint(hazard, next.player));
  if (hazardIndex >= 0) {
    next.hazards.splice(hazardIndex, 1);
    next.health = Math.max(0, next.health - 1);
    next.message = 'Temple trap! You lose 1 health.';
  }

  if (next.turn > 0 && next.turn % 9 === 0 && next.status === 'playing') {
    next.health = Math.max(0, next.health - 1);
    next.message = 'The temple surges. You lose 1 health.';
  }

  if (next.health <= 0) {
    next.status = 'lost';
    next.message = 'The temple claimed the expedition. Restart and try another route.';
    return next;
  }

  if (samePoint(next.player, next.exit)) {
    if (next.collected >= next.relicGoal) {
      next.status = 'won';
      next.message = `Vault escaped in ${next.turn} moves with every relic seed.`;
    } else {
      next.message = `The vault gate rejects you. ${next.relicGoal - next.collected} relic seed${next.relicGoal - next.collected === 1 ? '' : 's'} still missing.`;
    }
  }

  return next;
}

export function tileKind(state: TempleState, point: Point): 'wall' | 'relic' | 'hazard' | 'exit' | 'floor' {
  if (hasPoint(state.walls, point)) return 'wall';
  if (hasPoint(state.relics, point)) return 'relic';
  if (hasPoint(state.hazards, point)) return 'hazard';
  if (samePoint(state.exit, point)) return 'exit';
  return 'floor';
}
