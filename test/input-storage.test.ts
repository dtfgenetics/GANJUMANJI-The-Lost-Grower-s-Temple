import { describe, expect, it } from 'vitest';
import { actionFromKeyboard, actionFromMoveControl } from '../src/game/input';
import { createGame, move } from '../src/game/model';
import { parseExpedition, serializeExpedition } from '../src/game/storage';

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
  it('round-trips progression-aware expedition state', () => {
    const state = createGame();
    state.wards = 2;
    state.visitedCheckpoints = [{ x: 1, y: 3 }];
    const advanced = move(state, 'right');
    const restored = parseExpedition(serializeExpedition(advanced));
    expect(restored).toEqual(advanced);
    expect(restored).not.toBe(advanced);
  });

  it('migrates version 1 saves without progression fields', () => {
    const legacy = createGame();
    const legacyState = { ...legacy } as Record<string, unknown>;
    delete legacyState.maxHealth;
    delete legacyState.wards;
    delete legacyState.wardCaches;
    delete legacyState.checkpoints;
    delete legacyState.visitedCheckpoints;
    const restored = parseExpedition(JSON.stringify({ version: 1, state: legacyState }));
    expect(restored?.maxHealth).toBe(3);
    expect(restored?.wards).toBe(0);
    expect(restored?.wardCaches).toEqual([]);
    expect(restored?.checkpoints).toEqual([]);
    expect(restored?.visitedCheckpoints).toEqual([]);
  });

  it('rejects malformed or unsupported saves', () => {
    expect(parseExpedition(null)).toBeNull();
    expect(parseExpedition('{bad-json')).toBeNull();
    expect(parseExpedition(JSON.stringify({ version: 99, state: createGame() }))).toBeNull();
    expect(parseExpedition(JSON.stringify({ version: 1, state: { health: 3 } }))).toBeNull();
  });
});
