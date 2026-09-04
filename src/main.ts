import Phaser from 'phaser';
import './styles.css';
import { createGame, move, tileKind, type TempleState } from './game/model';
import { actionFromKeyboard, actionFromMoveControl, type GameAction } from './game/input';
import { clearExpedition, loadExpedition, saveExpedition } from './game/storage';

const TILE = 64;
let state: TempleState = createGame();
let sceneRef: TempleScene | null = null;

const health = document.querySelector('#health') as HTMLElement;
const relics = document.querySelector('#relics') as HTMLElement;
const wards = document.querySelector('#wards') as HTMLElement;
const checkpoints = document.querySelector('#checkpoints') as HTMLElement;
const danger = document.querySelector('#danger') as HTMLElement;
const turns = document.querySelector('#turns') as HTMLElement;
const message = document.querySelector('#message') as HTMLElement;
const restartButton = document.querySelector('#restartButton') as HTMLButtonElement;
const saveButton = document.querySelector('#saveButton') as HTMLButtonElement;
const continueButton = document.querySelector('#continueButton') as HTMLButtonElement;
const saveStatus = document.querySelector('#saveStatus') as HTMLElement;

function getStorage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function syncHud() {
  health.textContent = `${state.health} / ${state.maxHealth}`;
  relics.textContent = `${state.collected} / ${state.relicGoal}`;
  wards.textContent = String(state.wards);
  checkpoints.textContent = `${state.visitedCheckpoints.length} / ${state.checkpoints.length}`;
  danger.textContent = `${state.danger} / 10`;
  turns.textContent = String(state.turn);
  message.textContent = state.message;
  restartButton.textContent = state.status === 'playing' ? 'Restart Expedition' : 'Play Again';
  continueButton.disabled = !loadExpedition(getStorage());
}

function renderState() {
  syncHud();
  sceneRef?.renderState(state);
}

function persistState(label = 'Expedition saved') {
  const saved = saveExpedition(getStorage(), state);
  saveStatus.textContent = saved ? label : 'Save unavailable in this browser';
  continueButton.disabled = !saved;
}

function restartGame() {
  state = createGame();
  clearExpedition(getStorage());
  saveStatus.textContent = 'Fresh expedition';
  renderState();
}

function continueGame() {
  const loaded = loadExpedition(getStorage());
  if (!loaded) {
    saveStatus.textContent = 'No saved expedition found';
    continueButton.disabled = true;
    return;
  }
  state = loaded;
  state.message = 'Saved expedition restored.';
  saveStatus.textContent = 'Save restored';
  renderState();
}

function dispatch(action: GameAction | null) {
  if (!action) return;
  if (action.type === 'restart') {
    restartGame();
    return;
  }
  if (state.status !== 'playing') return;
  const previousTurn = state.turn;
  state = move(state, action.direction);
  if (state.turn !== previousTurn) persistState('Checkpoint saved');
  renderState();
}

class TempleScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Arc;
  private statusText!: Phaser.GameObjects.Text;

  constructor() { super('temple'); }

  create() {
    sceneRef = this;
    this.graphics = this.add.graphics();
    this.player = this.add.circle(0, 0, TILE * .26, 0xf5df8e).setStrokeStyle(4, 0x1f472c);
    this.statusText = this.add.text(14, 12, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: 'bold',
      color: '#fff5cf', backgroundColor: '#07110bcc', padding: { x: 10, y: 6 }
    }).setDepth(5);
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => dispatch(actionFromKeyboard(event)));
    this.renderState(state);
  }

  renderState(next: TempleState) {
    if (!this.graphics || !this.player || !this.statusText) return;
    this.graphics.clear();

    for (let y = 0; y < next.height; y += 1) {
      for (let x = 0; x < next.width; x += 1) {
        const kind = tileKind(next, { x, y });
        const fill = kind === 'wall' ? 0x18251d : ((x + y) % 2 ? 0x294b35 : 0x24422f);
        this.graphics.fillStyle(fill, 1).fillRect(x * TILE, y * TILE, TILE - 2, TILE - 2);
        if (kind === 'relic') {
          this.graphics.fillStyle(0xe8c766, 1).fillCircle(x * TILE + TILE / 2, y * TILE + TILE / 2, 13);
          this.graphics.lineStyle(3, 0xfff1a6, 1).strokeCircle(x * TILE + TILE / 2, y * TILE + TILE / 2, 20);
        } else if (kind === 'hazard') {
          this.graphics.fillStyle(0x8c342d, .95).fillTriangle(x * TILE + 12, y * TILE + 52, x * TILE + 32, y * TILE + 12, x * TILE + 52, y * TILE + 52);
        } else if (kind === 'ward') {
          this.graphics.fillStyle(0xc78f35, 1).fillRoundedRect(x * TILE + 17, y * TILE + 17, 30, 30, 8);
          this.graphics.lineStyle(3, 0xffdf85, 1).strokeRoundedRect(x * TILE + 14, y * TILE + 14, 36, 36, 10);
        } else if (kind === 'checkpoint') {
          const visited = next.visitedCheckpoints.some(point => point.x === x && point.y === y);
          this.graphics.fillStyle(visited ? 0x315f56 : 0x3c7c8f, 1).fillCircle(x * TILE + TILE / 2, y * TILE + TILE / 2, 20);
          this.graphics.lineStyle(4, visited ? 0x7db7a7 : 0xaee8ff, 1).strokeCircle(x * TILE + TILE / 2, y * TILE + TILE / 2, 24);
        } else if (kind === 'exit') {
          this.graphics.fillStyle(0x4a8b70, 1).fillRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
          this.graphics.lineStyle(4, 0xd9bd72, 1).strokeRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
        }
      }
    }

    this.player.setPosition(next.player.x * TILE + TILE / 2, next.player.y * TILE + TILE / 2);
    this.statusText.setText(next.status === 'won' ? 'VAULT ESCAPED' : next.status === 'lost' ? 'EXPEDITION LOST' : `RELICS ${next.collected}/${next.relicGoal} · WARDS ${next.wards}`);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 11 * TILE,
  height: 9 * TILE,
  backgroundColor: '#152019',
  pixelArt: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: TempleScene
});

restartButton.addEventListener('click', restartGame);
saveButton.addEventListener('click', () => persistState());
continueButton.addEventListener('click', continueGame);

document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
  button.addEventListener('click', () => dispatch(actionFromMoveControl(button.dataset.move)));
});

syncHud();
