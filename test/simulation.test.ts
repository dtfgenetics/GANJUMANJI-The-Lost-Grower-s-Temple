import assert from 'node:assert/strict';
import { createInitialState, restartGame, stepGame, type GameState } from '../src/simulation/state';
import { TEMPLE_ATRIUM } from '../src/simulation/world-data';

const idle = { x: 0, z: 0, sprint: false } as const;

function at(state: GameState, x: number, z: number): GameState {
  return { ...state, player: { x, z } };
}

{
  const state = createInitialState();
  assert.equal(state.phase, 'playing');
  assert.deepEqual(state.player, TEMPLE_ATRIUM.spawn);
  assert.equal(state.resolve, 3);
  assert.deepEqual(state.collectedSigils, []);
}

{
  const state = createInitialState();
  const walked = stepGame(state, { x: 0, z: -1, sprint: false }, 0.5).state;
  const sprinted = stepGame(state, { x: 0, z: -1, sprint: true }, 0.5).state;
  assert.ok(walked.player.z < state.player.z, 'walking should move forward');
  assert.ok(sprinted.player.z < walked.player.z, 'sprinting should cover more distance than walking');
}

{
  const state = at(createInitialState(), 0, -2.5);
  const result = stepGame(state, { x: 0, z: -1, sprint: false }, 1);
  assert.ok(result.state.player.z > -4, 'center altar should block forward movement');
}

{
  const state = at(createInitialState(), TEMPLE_ATRIUM.hazards[0].x, TEMPLE_ATRIUM.hazards[0].z);
  const result = stepGame(state, idle, 0);
  assert.equal(result.events[0]?.type, 'hazard-hit');
  assert.equal(result.state.resolve, 2);
  assert.deepEqual(result.state.player, TEMPLE_ATRIUM.spawn);
}

{
  let state: GameState = { ...createInitialState(), resolve: 1 };
  state = at(state, TEMPLE_ATRIUM.hazards[1].x, TEMPLE_ATRIUM.hazards[1].z);
  const result = stepGame(state, idle, 0);
  assert.equal(result.events[0]?.type, 'hazard-hit');
  assert.equal(result.state.resolve, 3, 'zero Resolve should restart the run');
  assert.deepEqual(result.state.collectedSigils, []);
  assert.deepEqual(result.state.player, TEMPLE_ATRIUM.spawn);
}

{
  let state = createInitialState();
  for (const sigil of TEMPLE_ATRIUM.sigils) {
    state = at(state, sigil.x, sigil.z);
    const result = stepGame(state, idle, 0);
    state = result.state;
    assert.ok(state.collectedSigils.includes(sigil.id), `${sigil.name} should be collected`);
  }
  assert.equal(state.collectedSigils.length, 3);

  const gateResult = stepGame(at(state, TEMPLE_ATRIUM.gate.x, TEMPLE_ATRIUM.gate.z), idle, 0);
  assert.equal(gateResult.state.phase, 'won');
  assert.ok(gateResult.events.some((event) => event.type === 'won'));
}

{
  const state = createInitialState();
  const prematureGate = stepGame(at(state, TEMPLE_ATRIUM.gate.x, TEMPLE_ATRIUM.gate.z), idle, 0);
  assert.equal(prematureGate.state.phase, 'playing', 'gate must stay locked until all sigils are collected');
}

{
  const won: GameState = { ...createInitialState(), phase: 'won' };
  const result = stepGame(won, { x: 1, z: 0, sprint: true }, 1);
  assert.equal(result.state, won, 'won state must be stable');
  assert.deepEqual(result.events, []);
}

{
  assert.throws(() => stepGame(createInitialState(), idle, -0.01), /dtSeconds/);
  assert.deepEqual(restartGame().player, TEMPLE_ATRIUM.spawn);
}

console.log('Temple Atrium simulation tests passed.');
