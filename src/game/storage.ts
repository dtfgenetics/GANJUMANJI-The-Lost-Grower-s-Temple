import type { TempleState } from './model';

export const SAVE_KEY = 'dtf-ganjumanji-expedition-v1';

export type SavedExpedition = {
  version: 2;
  savedAt: string;
  state: TempleState;
};

type LegacyTempleState = Partial<TempleState> & {
  width: number;
  height: number;
  health: number;
  turn: number;
  player: TempleState['player'];
  walls: TempleState['walls'];
  hazards: TempleState['hazards'];
  relics: TempleState['relics'];
};

export function serializeExpedition(state: TempleState): string {
  const payload: SavedExpedition = {
    version: 2,
    savedAt: new Date().toISOString(),
    state: structuredClone(state)
  };
  return JSON.stringify(payload);
}

function isBaseState(state: Partial<TempleState>): state is LegacyTempleState {
  return typeof state.width === 'number' &&
    typeof state.height === 'number' &&
    typeof state.health === 'number' &&
    typeof state.turn === 'number' &&
    Boolean(state.player) &&
    Array.isArray(state.walls) &&
    Array.isArray(state.hazards) &&
    Array.isArray(state.relics);
}

function migrateState(state: LegacyTempleState): TempleState {
  return {
    ...state,
    maxHealth: typeof state.maxHealth === 'number' ? state.maxHealth : 3,
    wards: typeof state.wards === 'number' ? state.wards : 0,
    wardCaches: Array.isArray(state.wardCaches) ? state.wardCaches : [],
    checkpoints: Array.isArray(state.checkpoints) ? state.checkpoints : [],
    visitedCheckpoints: Array.isArray(state.visitedCheckpoints) ? state.visitedCheckpoints : []
  } as TempleState;
}

export function parseExpedition(raw: string | null): TempleState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; state?: Partial<TempleState> };
    if (![1, 2].includes(Number(parsed.version)) || !parsed.state || !isBaseState(parsed.state)) return null;
    return structuredClone(migrateState(parsed.state));
  } catch {
    return null;
  }
}

export function saveExpedition(storage: Storage | null | undefined, state: TempleState): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, serializeExpedition(state));
    return true;
  } catch {
    return false;
  }
}

export function loadExpedition(storage: Storage | null | undefined): TempleState | null {
  if (!storage) return null;
  try {
    return parseExpedition(storage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}

export function clearExpedition(storage: Storage | null | undefined): void {
  try { storage?.removeItem(SAVE_KEY); } catch {}
}
