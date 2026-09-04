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
  it('round-trips expedition simulation state', () => {
    const advanced = move(createGame(), 'right');
    const restored = parseExpedition(serializeExpedition(advanced));
    expect(restored).toEqual(advanced);
    expect(restored).not.toBe(advanced);
  });

  it('rejects malformed or unsupported saves', () => {
    expect(parseExpedition(null)).toBeNull();
    expect(parseExpedition('{bad-json')).toBeNull();
    expect(parseExpedition(JSON.stringify({ version: 99, state: createGame() }))).toBeNull();
    expect(parseExpedition(JSON.stringify({ version: 1, state: { health: 3 } }))).toBeNull();
  });
});
