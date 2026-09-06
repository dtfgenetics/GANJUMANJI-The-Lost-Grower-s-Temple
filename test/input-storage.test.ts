import { describe, expect, it } from 'vitest';
import { actionFromKeyboard, actionFromMoveControl } from '../src/game/input';
import { createGame, move } from '../src/game/model';
import {
  CHECKPOINT_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  clearExpedition,
  loadCheckpoint,
  loadExpedition,
  parseExpedition,
  saveCheckpoint,
  saveExpedition,
  serializeExpedition
} from '../src/game/storage';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); }
  };
}

describe('Ganjumanji input mapping', () => {
  it('maps keyboard movement and restart actions', () => {
    expect(actionFromKeyboard({ key: 'ArrowUp', repeat: false })).toEqual({ type: 'move', direction: 'up' });
    expect(actionFromKeyboard({ key: 'd', repeat: false })).toEqual({ type: 'move', direction: 'right' });
    expect(actionFromKeyboard({ key: 'R', repeat: false })).toEqual({ type: 'restart' });
    expect(actionFromKeyboard({ key: 'ArrowUp', repeat: true })).toBeNull();
  });

  it('accepts only valid touch movement controls', () => {
    expect(actionFromMoveControl('left')).toEqual({ type: 'move', direction: 'left' });
    expect(actionFromMoveControl('jump')).toBeNull();
    expect(actionFromMoveControl(undefined)).toBeNull();
  });
});

describe('Ganjumanji save boundary', () => {
  it('round-trips progression-aware five-region campaign state', () => {
    const state = createGame();
    state.wards = 2; state.tools = 1; state.visitedCheckpoints = [{ x: 1, y: 3 }];
    const advanced = move(state, 'right');
    const restored = parseExpedition(serializeExpedition(advanced));
    expect(restored).toEqual(advanced); expect(restored).not.toBe(advanced);
    expect(restored?.regionId).toBe('root_halls'); expect(restored?.campaignRelicGoal).toBe(10); expect(restored?.tools).toBe(1);
    expect(JSON.parse(serializeExpedition(advanced)).version).toBe(SAVE_VERSION);
  });

  it('keeps normal autosave and safe recovery checkpoint independent', () => {
    const storage = memoryStorage();
    const entrance = createGame();
    expect(saveCheckpoint(storage, entrance)).toBe(true);

    const moved = move(entrance, 'right');
    expect(saveExpedition(storage, moved)).toBe(true);
    expect(loadExpedition(storage)?.turn).toBe(moved.turn);
    expect(loadCheckpoint(storage)?.turn).toBe(0);
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
    expect(storage.getItem(CHECKPOINT_KEY)).not.toBeNull();

    clearExpedition(storage);
    expect(loadExpedition(storage)).toBeNull();
    expect(loadCheckpoint(storage)).toBeNull();
  });

  it('migrates version 1 saves into the current campaign safely', () => {
    const legacy = createGame();
    const legacyState = { ...legacy } as Record<string, unknown>;
    for (const field of ['maxHealth','wards','tools','wardCaches','toolCaches','guardians','checkpoints','visitedCheckpoints','regionId','regionTurn','campaignCollected','campaignRelicGoal','regionsCleared']) delete legacyState[field];
    const restored = parseExpedition(JSON.stringify({ version: 1, state: legacyState }));
    expect(restored?.maxHealth).toBe(3); expect(restored?.wards).toBe(0); expect(restored?.tools).toBe(0);
    expect(restored?.toolCaches.length).toBeGreaterThan(0); expect(restored?.guardians.length).toBeGreaterThan(0);
    expect(restored?.regionId).toBe('root_halls'); expect(restored?.regionTurn).toBe(0);
    expect(restored?.campaignCollected).toBe(0); expect(restored?.campaignRelicGoal).toBe(10); expect(restored?.regionsCleared).toEqual([]);
  });

  it('upgrades old save metadata to the expanded campaign goal', () => {
    const legacy = createGame();
    legacy.campaignRelicGoal = 6;
    const restored = parseExpedition(JSON.stringify({ version: 4, state: legacy }));
    expect(restored?.campaignRelicGoal).toBe(10);
  });

  it('rejects malformed or unsupported saves', () => {
    expect(parseExpedition(null)).toBeNull(); expect(parseExpedition('{bad-json')).toBeNull();
    expect(parseExpedition(JSON.stringify({ version: 99, state: createGame() }))).toBeNull();
    expect(parseExpedition(JSON.stringify({ version: 1, state: { health: 3 } }))).toBeNull();
  });
});
