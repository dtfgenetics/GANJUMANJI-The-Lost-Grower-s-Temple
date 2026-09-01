import { TEMPLE_ATRIUM, type Obstacle, type TempleAtriumData } from './world-data';

export type GamePhase = 'playing' | 'won';

export type GameState = Readonly<{
  phase: GamePhase;
  player: Readonly<{ x: number; z: number }>;
  facing: Readonly<{ x: number; z: number }>;
  resolve: number;
  collectedSigils: readonly string[];
  message: string;
  runTimeMs: number;
}>;

export type InputSnapshot = Readonly<{
  x: number;
  z: number;
  sprint: boolean;
}>;

export type GameEvent =
  | Readonly<{ type: 'sigil-collected'; id: string; name: string }>
  | Readonly<{ type: 'hazard-hit'; id: string; resolve: number }>
  | Readonly<{ type: 'gate-opened' }>
  | Readonly<{ type: 'won' }>;

export type StepResult = Readonly<{
  state: GameState;
  events: readonly GameEvent[];
}>;

export function createInitialState(data: TempleAtriumData = TEMPLE_ATRIUM): GameState {
  return {
    phase: 'playing',
    player: { ...data.spawn },
    facing: { x: 0, z: -1 },
    resolve: 3,
    collectedSigils: [],
    message: 'Recover the three Seed Sigils.',
    runTimeMs: 0,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distanceSquared(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

function circleHitsObstacle(x: number, z: number, radius: number, obstacle: Obstacle) {
  const nearestX = clamp(x, obstacle.x - obstacle.halfWidth, obstacle.x + obstacle.halfWidth);
  const nearestZ = clamp(z, obstacle.z - obstacle.halfDepth, obstacle.z + obstacle.halfDepth);
  return distanceSquared(x, z, nearestX, nearestZ) < radius * radius;
}

function resolveMovement(
  x: number,
  z: number,
  nextX: number,
  nextZ: number,
  data: TempleAtriumData,
) {
  const radius = data.playerRadius;
  const boundedX = clamp(nextX, data.bounds.minX + radius, data.bounds.maxX - radius);
  const boundedZ = clamp(nextZ, data.bounds.minZ + radius, data.bounds.maxZ - radius);

  let resolvedX = boundedX;
  if (data.obstacles.some((obstacle) => circleHitsObstacle(resolvedX, z, radius, obstacle))) {
    resolvedX = x;
  }

  let resolvedZ = boundedZ;
  if (data.obstacles.some((obstacle) => circleHitsObstacle(resolvedX, resolvedZ, radius, obstacle))) {
    resolvedZ = z;
  }

  return { x: resolvedX, z: resolvedZ };
}

export function restartGame(data: TempleAtriumData = TEMPLE_ATRIUM) {
  return createInitialState(data);
}

export function stepGame(
  state: GameState,
  input: InputSnapshot,
  dtSeconds: number,
  data: TempleAtriumData = TEMPLE_ATRIUM,
): StepResult {
  if (!Number.isFinite(dtSeconds) || dtSeconds < 0) {
    throw new RangeError('dtSeconds must be a finite non-negative number');
  }
  if (state.phase === 'won') return { state, events: [] };

  const events: GameEvent[] = [];
  const inputLength = Math.hypot(input.x, input.z);
  const normalizedX = inputLength > 1 ? input.x / inputLength : input.x;
  const normalizedZ = inputLength > 1 ? input.z / inputLength : input.z;
  const speed = input.sprint ? data.sprintSpeed : data.walkSpeed;
  const movement = resolveMovement(
    state.player.x,
    state.player.z,
    state.player.x + normalizedX * speed * dtSeconds,
    state.player.z + normalizedZ * speed * dtSeconds,
    data,
  );

  let next: GameState = {
    ...state,
    player: movement,
    facing: inputLength > 0.001 ? { x: normalizedX, z: normalizedZ } : state.facing,
    runTimeMs: state.runTimeMs + dtSeconds * 1000,
  };

  const hazard = data.hazards.find((item) =>
    distanceSquared(next.player.x, next.player.z, item.x, item.z) <= item.radius * item.radius,
  );
  if (hazard) {
    const remaining = next.resolve - 1;
    events.push({ type: 'hazard-hit', id: hazard.id, resolve: Math.max(0, remaining) });
    next = remaining <= 0
      ? {
          ...createInitialState(data),
          message: 'The temple overwhelmed you. The run has restarted.',
        }
      : {
          ...next,
          player: { ...data.spawn },
          resolve: remaining,
          message: 'A spore vent caught you. Back to the atrium entrance.',
        };
    return { state: next, events };
  }

  const collected = new Set(next.collectedSigils);
  for (const sigil of data.sigils) {
    if (collected.has(sigil.id)) continue;
    if (distanceSquared(next.player.x, next.player.z, sigil.x, sigil.z) <= data.pickupRadius * data.pickupRadius) {
      collected.add(sigil.id);
      events.push({ type: 'sigil-collected', id: sigil.id, name: sigil.name });
      next = {
        ...next,
        collectedSigils: [...collected],
        message: `${sigil.name} recovered.`
      };
    }
  }

  if (state.collectedSigils.length < data.sigils.length && next.collectedSigils.length === data.sigils.length) {
    events.push({ type: 'gate-opened' });
    next = { ...next, message: 'All Seed Sigils recovered. Reach the Canopy Gate.' };
  }

  const gateReady = next.collectedSigils.length === data.sigils.length;
  if (
    gateReady &&
    distanceSquared(next.player.x, next.player.z, data.gate.x, data.gate.z) <= data.gate.radius * data.gate.radius
  ) {
    events.push({ type: 'won' });
    next = { ...next, phase: 'won', message: 'The Canopy Gate opens. Atrium cleared.' };
  }

  return { state: next, events };
}
