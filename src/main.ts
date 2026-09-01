import './style.css';
import { InputController } from './input';
import { TempleWorldRenderer } from './render/world';
import { createInitialState, restartGame, stepGame, type GameState } from './simulation/state';
import { TempleHud } from './ui/hud';

const root = document.querySelector<HTMLElement>('#app');
const sceneMount = document.querySelector<HTMLElement>('#scene');
if (!root || !sceneMount) throw new Error('Ganjumanji game shell is incomplete.');

let state: GameState = createInitialState();
const input = new InputController(root);
const hud = new TempleHud(root, resetRun);
let world: TempleWorldRenderer;

try {
  world = new TempleWorldRenderer(sceneMount, (message) => hud.announce(message));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  sceneMount.innerHTML = `<div class="webgl-fallback"><strong>3D scene unavailable.</strong><span>${escapeHtml(message)}</span></div>`;
  hud.announce('This browser could not start the 3D Temple Atrium. Try a current browser with WebGL enabled.');
  throw error;
}

hud.update(state, []);

const FIXED_STEP = 1 / 60;
const MAX_FRAME_DELTA = 0.25;
let accumulator = 0;
let previousTime = performance.now();
let frameId = 0;

function resetRun() {
  state = restartGame();
  accumulator = 0;
  hud.update(state, []);
}

function frame(now: number) {
  const frameDelta = Math.min(MAX_FRAME_DELTA, Math.max(0, (now - previousTime) / 1000));
  previousTime = now;
  accumulator += frameDelta;

  if (input.consumeRestart()) resetRun();

  const events = [];
  while (accumulator >= FIXED_STEP) {
    const result = stepGame(state, input.snapshot(), FIXED_STEP);
    state = result.state;
    events.push(...result.events);
    accumulator -= FIXED_STEP;
  }

  hud.update(state, events);
  world.update(state, frameDelta);
  frameId = requestAnimationFrame(frame);
}

frameId = requestAnimationFrame(frame);

window.addEventListener('pagehide', () => {
  cancelAnimationFrame(frameId);
  input.dispose();
  world.dispose();
}, { once: true });

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}
