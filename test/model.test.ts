import { describe, expect, it } from 'vitest';
import { createGame, move } from '../src/game/model';

describe('Ganjumanji temple model', () => {
  it('starts with a complete campaign state', () => {
    const state = createGame();
    expect(state.status).toBe('playing');
    expect(state.regionId).toBe('root_halls');
    expect(state.health).toBe(3);
    expect(state.maxHealth).toBe(3);
    expect(state.wards).toBe(0);
    expect(state.checkpoints).toHaveLength(2);
    expect(state.relicGoal).toBe(3);
    expect(state.campaignRelicGoal).toBe(6);
    expect(state.relics).toHaveLength(3);
    expect(state.turn).toBe(0);
    expect(state.regionTurn).toBe(0);
  });

  it('does not consume a move when stone blocks the player', () => {
    const state = createGame();
    const blocked = move(state, 'left');
    expect(blocked.player).toEqual(state.player);
    expect(blocked.turn).toBe(0);
    expect(blocked.message).toMatch(/stone blocks/i);
  });

  it('collects each relic only once and tracks campaign totals', () => {
    const state = createGame();
    state.player = { x: 2, y: 3 };
    const collected = move(state, 'up');
    expect(collected.collected).toBe(1);
    expect(collected.campaignCollected).toBe(1);
    expect(collected.relics).toHaveLength(2);
    const leave = move(collected, 'down');
    const revisit = move(leave, 'up');
    expect(revisit.collected).toBe(1);
    expect(revisit.campaignCollected).toBe(1);
  });

  it('consumes a trap after it deals damage', () => {
    const state = createGame();
    state.player = { x: 4, y: 7 };
    const trapped = move(state, 'up');
    expect(trapped.health).toBe(2);
    expect(trapped.hazards.some((hazard) => hazard.x === 4 && hazard.y === 6)).toBe(false);
    const leave = move(trapped, 'down');
    const revisit = move(leave, 'up');
    expect(revisit.health).toBe(2);
  });

  it('collects a resin ward and consumes it before health', () => {
    const state = createGame();
    state.player = { x: 1, y: 1 };
    const warded = move(state, 'right');
    expect(warded.wards).toBe(1);
    expect(warded.wardCaches).toHaveLength(1);
    warded.player = { x: 4, y: 7 };
    const protectedState = move(warded, 'up');
    expect(protectedState.wards).toBe(0);
    expect(protectedState.health).toBe(3);
    expect(protectedState.message).toMatch(/absorbs the damage/i);
  });

  it('restores health at a sanctuary only once', () => {
    const state = createGame();
    state.health = 1;
    state.player = { x: 1, y: 4 };
    const healed = move(state, 'up');
    expect(healed.health).toBe(2);
    expect(healed.visitedCheckpoints).toHaveLength(1);
    const leave = move(healed, 'down');
    const revisit = move(leave, 'up');
    expect(revisit.health).toBe(2);
    expect(revisit.visitedCheckpoints).toHaveLength(1);
  });

  it('keeps a region passage locked until its relic seeds are recovered', () => {
    const state = createGame();
    state.player = { x: 9, y: 2 };
    const atGate = move(state, 'up');
    expect(atGate.status).toBe('playing');
    expect(atGate.regionId).toBe('root_halls');
    expect(atGate.message).toMatch(/still missing/i);
  });

  it('clears Root Halls into Sunken Archive without ending the campaign', () => {
    const state = createGame();
    state.player = { x: 9, y: 2 };
    state.collected = 3;
    state.campaignCollected = 3;
    state.relics = [];
    const transitioned = move(state, 'up');
    expect(transitioned.status).toBe('playing');
    expect(transitioned.regionId).toBe('sunken_archive');
    expect(transitioned.regionsCleared).toEqual(['root_halls']);
    expect(transitioned.collected).toBe(0);
    expect(transitioned.relicGoal).toBe(2);
    expect(transitioned.campaignCollected).toBe(3);
    expect(transitioned.regionTurn).toBe(0);
  });

  it('wins only after the final Vault Heart relic and exit are secured', () => {
    let state = createGame();
    state.player = { x: 9, y: 2 };
    state.collected = 3;
    state.campaignCollected = 3;
    state.relics = [];
    state = move(state, 'up');

    state.player = { x: 9, y: 6 };
    state.collected = 2;
    state.campaignCollected = 5;
    state.relics = [];
    state = move(state, 'down');
    expect(state.regionId).toBe('vault_heart');
    expect(state.status).toBe('playing');

    state.player = { x: 9, y: 2 };
    state.collected = 1;
    state.campaignCollected = 6;
    state.relics = [];
    const escaped = move(state, 'up');
    expect(escaped.status).toBe('won');
    expect(escaped.regionsCleared).toEqual(['root_halls', 'sunken_archive', 'vault_heart']);
    expect(escaped.message).toMatch(/living seed vault recovered/i);
  });

  it('can lose when temple pressure depletes health', () => {
    const state = createGame();
    state.player = { x: 4, y: 7 };
    state.health = 1;
    const lost = move(state, 'up');
    expect(lost.status).toBe('lost');
    expect(lost.health).toBe(0);
  });
});
