import type { TempleState } from './model';

export const SAVE_KEY = 'dtf-ganjumanji-expedition-v1';

export type SavedExpedition = {
  version: 1;
  savedAt: string;
  state: TempleState;
};

export function serializeExpedition(state: TempleState): string {
  const payload: SavedExpedition = {
    version: 1,
    savedAt: new Date().toISOString(),
    state: structuredClone(state)
  };
  return JSON.stringify(payload);
}

export function parseExpedition(raw: string | null): TempleState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SavedExpedition>;
    if (parsed.version !== 1 || !parsed.state) return null;
    const state = parsed.state;
    if (
      typeof state.width !== 'number' ||
      typeof state.height !== 'number' ||
      typeof state.health !== 'number' ||
      typeof state.turn !== 'number' ||
      !state.player ||
      !Array.isArray(state.walls) ||
      !Array.isArray(state.hazards) ||
      !Array.isArray(state.relics)
    ) return null;
    return structuredClone(state);
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
