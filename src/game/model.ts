import { CAMPAIGN_RELIC_GOAL, REGIONS, type RegionId } from './content';

export type Point = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameStatus = 'playing' | 'won' | 'lost';

export type TempleState = {
  width: number; height: number; turn: number; regionTurn: number; danger: number;
  health: number; maxHealth: number; wards: number; tools: number;
  player: Point; exit: Point; walls: Point[]; hazards: Point[]; relics: Point[];
  wardCaches: Point[]; toolCaches: Point[]; guardians: Point[]; checkpoints: Point[]; visitedCheckpoints: Point[];
  collected: number; relicGoal: number; campaignCollected: number; campaignRelicGoal: number;
  regionId: RegionId; regionsCleared: RegionId[]; status: GameStatus; message: string;
};

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const hasPoint = (points: Point[], point: Point) => points.some((candidate) => samePoint(candidate, point));
const clonePoints = (points: Point[]) => points.map((point) => ({ ...point }));

function regionState(regionId: RegionId) {
  const region = REGIONS[regionId];
  return {
    width: region.width, height: region.height, player: { ...region.start }, exit: { ...region.exit },
    walls: clonePoints(region.walls), hazards: clonePoints(region.hazards), relics: clonePoints(region.relics),
    wardCaches: clonePoints(region.wardCaches), toolCaches: clonePoints(region.toolCaches), guardians: clonePoints(region.guardians),
    checkpoints: clonePoints(region.checkpoints), visitedCheckpoints: [] as Point[], collected: 0,
    relicGoal: region.relics.length, regionTurn: 0, danger: 0
  };
}

export function createGame(): TempleState {
  return { ...regionState('root_halls'), turn: 0, health: 3, maxHealth: 3, wards: 0, tools: 0,
    campaignCollected: 0, campaignRelicGoal: CAMPAIGN_RELIC_GOAL, regionId: 'root_halls', regionsCleared: [],
    status: 'playing', message: 'Recover the Root Hall relic seeds and reach the sealed passage.' };
}

function destinationFor(player: Point, direction: Direction): Point {
  const delta: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  return { x: player.x + delta[direction].x, y: player.y + delta[direction].y };
}

function takeDamage(state: TempleState, message: string): void {
  if (state.wards > 0) { state.wards -= 1; state.message = `${message} A resin ward absorbs the damage.`; return; }
  state.health = Math.max(0, state.health - 1);
  state.message = `${message} You lose 1 health.`;
}

function enterRegion(state: TempleState, regionId: RegionId): void {
  const nextRegion = REGIONS[regionId];
  const carriedTools = state.tools;
  const carriedWards = state.wards;
  Object.assign(state, regionState(regionId));
  state.tools = carriedTools;
  state.wards = carriedWards;
  state.health = state.maxHealth;
  state.regionId = regionId;
  state.message = `${nextRegion.name}: ${nextRegion.subtitle} Safe passage fully restores health. ${nextRegion.pressureLabel}.`;
}

function clearCurrentRegion(state: TempleState): void {
  if (!state.regionsCleared.includes(state.regionId)) state.regionsCleared.push(state.regionId);
  const definition = REGIONS[state.regionId];
  if (definition.nextRegion) { enterRegion(state, definition.nextRegion); return; }
  state.status = 'won';
  state.message = `Living Seed Vault recovered in ${state.turn} moves. All ${state.campaignRelicGoal} relic seeds are secure.`;
}

export function move(state: TempleState, direction: Direction): TempleState {
  if (state.status !== 'playing') return state;
  const next = structuredClone(state) as TempleState;
  const target = destinationFor(next.player, direction);
  if (hasPoint(next.walls, target)) { next.message = 'Ancient stone blocks that route.'; return next; }

  next.player = target;
  next.turn += 1;
  next.regionTurn += 1;
  const region = REGIONS[next.regionId];
  next.danger = Math.min(10, Math.floor((next.regionTurn / region.surgeEvery) * 3));
  next.message = 'The temple shifts around you.';

  const relicIndex = next.relics.findIndex((relic) => samePoint(relic, next.player));
  if (relicIndex >= 0) {
    next.relics.splice(relicIndex, 1); next.collected += 1; next.campaignCollected += 1;
    next.message = `Relic seed recovered. ${next.relicGoal - next.collected} remain in ${region.name}.`;
  }

  const wardIndex = next.wardCaches.findIndex((cache) => samePoint(cache, next.player));
  if (wardIndex >= 0) { next.wardCaches.splice(wardIndex, 1); next.wards += 1; next.message = `Resin ward recovered. ${next.wards} protection charge${next.wards === 1 ? '' : 's'} ready.`; }

  const toolIndex = next.toolCaches.findIndex((cache) => samePoint(cache, next.player));
  if (toolIndex >= 0) { next.toolCaches.splice(toolIndex, 1); next.tools += 1; next.message = `Expedition kit recovered. ${next.tools} kit${next.tools === 1 ? '' : 's'} ready for guardian encounters.`; }

  if (hasPoint(next.checkpoints, next.player) && !hasPoint(next.visitedCheckpoints, next.player)) {
    next.visitedCheckpoints.push({ ...next.player });
    const before = next.health; next.health = Math.min(next.maxHealth, next.health + 1);
    next.message = before === next.health ? 'Sanctuary checkpoint secured.' : 'Sanctuary checkpoint secured. Health restored by 1.';
  }

  const guardianIndex = next.guardians.findIndex((guardian) => samePoint(guardian, next.player));
  if (guardianIndex >= 0) {
    next.guardians.splice(guardianIndex, 1);
    if (next.tools > 0) { next.tools -= 1; next.message = 'Temple guardian encountered. An expedition kit opens a safe route past it.'; }
    else takeDamage(next, 'Temple guardian ambush!');
  }

  const hazardIndex = next.hazards.findIndex((hazard) => samePoint(hazard, next.player));
  if (hazardIndex >= 0) { next.hazards.splice(hazardIndex, 1); takeDamage(next, 'Temple trap!'); }

  if (next.regionTurn > 0 && next.regionTurn % region.surgeEvery === 0 && next.status === 'playing') takeDamage(next, `${region.name} surges.`);

  if (next.health <= 0) { next.status = 'lost'; next.message = 'The temple claimed the expedition. Restart and try another route.'; return next; }

  if (samePoint(next.player, next.exit)) {
    if (next.collected >= next.relicGoal) clearCurrentRegion(next);
    else {
      const missing = next.relicGoal - next.collected;
      next.message = `The passage remains sealed. ${missing} relic seed${missing === 1 ? '' : 's'} still missing in this region.`;
    }
  }
  return next;
}

export function getRegion(state: TempleState) { return REGIONS[state.regionId]; }

export function tileKind(state: TempleState, point: Point): 'wall' | 'relic' | 'hazard' | 'ward' | 'tool' | 'guardian' | 'checkpoint' | 'exit' | 'floor' {
  if (hasPoint(state.walls, point)) return 'wall';
  if (hasPoint(state.relics, point)) return 'relic';
  if (hasPoint(state.hazards, point)) return 'hazard';
  if (hasPoint(state.wardCaches, point)) return 'ward';
  if (hasPoint(state.toolCaches, point)) return 'tool';
  if (hasPoint(state.guardians, point)) return 'guardian';
  if (hasPoint(state.checkpoints, point)) return 'checkpoint';
  if (samePoint(state.exit, point)) return 'exit';
  return 'floor';
}
