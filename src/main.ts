import Phaser from 'phaser';
import './styles.css';
import type { RegionId } from './game/content';
import { createGame, getRegion, move, tileKind, type TempleState } from './game/model';
import { actionFromKeyboard, actionFromMoveControl, type GameAction } from './game/input';
import { readRecord, recordWin } from './game/records';
import { clearExpedition, loadExpedition, saveExpedition } from './game/storage';

const TILE = 64;
let state: TempleState = createGame();
let sceneRef: TempleScene | null = null;

const health = document.querySelector('#health') as HTMLElement;
const relics = document.querySelector('#relics') as HTMLElement;
const wards = document.querySelector('#wards') as HTMLElement;
const regions = document.querySelector('#regions') as HTMLElement;
const checkpoints = document.querySelector('#checkpoints') as HTMLElement;
const danger = document.querySelector('#danger') as HTMLElement;
const turns = document.querySelector('#turns') as HTMLElement;
const regionName = document.querySelector('#regionName') as HTMLElement;
const regionRelics = document.querySelector('#regionRelics') as HTMLElement;
const regionTitle = document.querySelector('#regionTitle') as HTMLElement;
const regionDescription = document.querySelector('#regionDescription') as HTMLElement;
const message = document.querySelector('#message') as HTMLElement;
const restartButton = document.querySelector('#restartButton') as HTMLButtonElement;
const saveButton = document.querySelector('#saveButton') as HTMLButtonElement;
const continueButton = document.querySelector('#continueButton') as HTMLButtonElement;
const saveStatus = document.querySelector('#saveStatus') as HTMLElement;
const bestMoves = document.querySelector('#bestMoves') as HTMLElement;
const winCount = document.querySelector('#winCount') as HTMLElement;
const resultModal = document.querySelector('#resultModal') as HTMLElement;
const resultEyebrow = document.querySelector('#resultEyebrow') as HTMLElement;
const resultTitle = document.querySelector('#resultTitle') as HTMLElement;
const resultText = document.querySelector('#resultText') as HTMLElement;
const resultMoves = document.querySelector('#resultMoves') as HTMLElement;
const resultRelics = document.querySelector('#resultRelics') as HTMLElement;
const resultRegions = document.querySelector('#resultRegions') as HTMLElement;
const playAgainButton = document.querySelector('#playAgainButton') as HTMLButtonElement;

function getStorage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

function syncRecord() {
  const record = readRecord(getStorage());
  bestMoves.textContent = record.bestMoves > 0 ? `${record.bestMoves} moves` : '—';
  winCount.textContent = `${record.wins} completed expedition${record.wins === 1 ? '' : 's'}`;
}

function syncResult() {
  const ended = state.status !== 'playing';
  resultModal.hidden = !ended;
  if (!ended) return;
  const won = state.status === 'won';
  resultEyebrow.textContent = won ? 'Expedition Complete' : 'Expedition Lost';
  resultTitle.textContent = won ? 'Living Seed Vault Recovered' : 'The Temple Claimed This Run';
  resultText.textContent = won
    ? 'Every relic seed is secure. Your route is recorded—return and try to escape in fewer moves.'
    : 'Use Continue to return to the last safe checkpoint, or start a fresh expedition.';
  resultMoves.textContent = String(state.turn);
  resultRelics.textContent = `${state.campaignCollected} / ${state.campaignRelicGoal}`;
  resultRegions.textContent = `${state.regionsCleared.length} / 3`;
  playAgainButton.textContent = won ? 'Start New Expedition' : 'Restart Expedition';
}

function syncHud() {
  const region = getRegion(state);
  health.textContent = `${state.health} / ${state.maxHealth}`;
  relics.textContent = `${state.campaignCollected} / ${state.campaignRelicGoal}`;
  wards.textContent = String(state.wards);
  regions.textContent = `${state.regionsCleared.length} / 3`;
  checkpoints.textContent = `${state.visitedCheckpoints.length} / ${state.checkpoints.length}`;
  danger.textContent = `${state.danger} / 10`;
  turns.textContent = String(state.turn);
  regionName.textContent = region.name;
  regionRelics.textContent = `${state.collected} / ${state.relicGoal}`;
  regionTitle.textContent = region.name;
  regionDescription.textContent = region.subtitle;
  message.textContent = state.message;
  restartButton.textContent = state.status === 'playing' ? 'Restart Expedition' : 'Play Again';
  saveButton.disabled = state.status !== 'playing';
  continueButton.disabled = !loadExpedition(getStorage());
  document.querySelectorAll<HTMLElement>('[data-region-step]').forEach((step) => {
    const id = step.dataset.regionStep as RegionId | undefined;
    if (!id) return;
    step.dataset.state = state.regionsCleared.includes(id) ? 'complete' : id === state.regionId ? 'current' : 'locked';
  });
  syncRecord();
  syncResult();
}

function renderState() {
  syncHud();
  sceneRef?.renderState(state);
}

function persistState(label = 'Expedition saved') {
  if (state.status !== 'playing') return;
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

function finishRun(previousStatus: TempleState['status']) {
  if (previousStatus !== 'playing' || state.status === 'playing') return;
  if (state.status === 'won') {
    recordWin(getStorage(), state.turn);
    clearExpedition(getStorage());
    saveStatus.textContent = 'Campaign complete';
  } else {
    saveStatus.textContent = 'Last safe checkpoint preserved';
  }
}

function dispatch(action: GameAction | null) {
  if (!action) return;
  if (action.type === 'restart') {
    restartGame();
    return;
  }
  if (state.status !== 'playing') return;
  const previousTurn = state.turn;
  const previousRegion = state.regionId;
  const previousStatus = state.status;
  state = move(state, action.direction);
  if (state.turn !== previousTurn && state.status === 'playing') {
    persistState(previousRegion !== state.regionId ? 'Region checkpoint saved' : 'Checkpoint saved');
  }
  finishRun(previousStatus);
  renderState();
}

class TempleScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Arc;
  private statusText!: Phaser.GameObjects.Text;
  private lastRegionId: RegionId | null = null;
  private lastPlayer: { x: number; y: number } | null = null;
  private reducedMotion = false;

  constructor() { super('temple'); }

  create() {
    sceneRef = this;
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.graphics = this.add.graphics();
    this.player = this.add.circle(0, 0, TILE * .26, 0xf5df8e).setStrokeStyle(4, 0x1f472c).setDepth(4);
    this.statusText = this.add.text(14, 12, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: 'bold',
      color: '#fff5cf', backgroundColor: '#07110bcc', padding: { x: 10, y: 6 }
    }).setDepth(5);
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => dispatch(actionFromKeyboard(event)));
    this.renderState(state);
  }

  private positionPlayer(next: TempleState) {
    const x = next.player.x * TILE + TILE / 2;
    const y = next.player.y * TILE + TILE / 2;
    const changedRegion = this.lastRegionId !== null && this.lastRegionId !== next.regionId;
    const moved = this.lastPlayer !== null && (this.lastPlayer.x !== next.player.x || this.lastPlayer.y !== next.player.y);
    this.tweens.killTweensOf(this.player);

    if (!this.reducedMotion && moved && !changedRegion) {
      this.tweens.add({ targets: this.player, x, y, duration: 120, ease: 'Sine.Out' });
    } else {
      this.player.setPosition(x, y);
    }

    if (!this.reducedMotion && changedRegion) {
      this.cameras.main.flash(220, 232, 199, 102, false);
      this.player.setAlpha(0.2).setScale(0.72);
      this.tweens.add({ targets: this.player, alpha: 1, scale: 1, duration: 220, ease: 'Back.Out' });
    }

    this.lastRegionId = next.regionId;
    this.lastPlayer = { ...next.player };
  }

  renderState(next: TempleState) {
    if (!this.graphics || !this.player || !this.statusText) return;
    const region = getRegion(next);
    this.graphics.clear();

    for (let y = 0; y < next.height; y += 1) {
      for (let x = 0; x < next.width; x += 1) {
        const kind = tileKind(next, { x, y });
        const fill = kind === 'wall' ? region.palette.wall : ((x + y) % 2 ? region.palette.floorA : region.palette.floorB);
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
          this.graphics.fillStyle(region.palette.accent, .75).fillRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
          this.graphics.lineStyle(4, 0xffefb0, 1).strokeRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
        }
      }
    }

    this.positionPlayer(next);
    this.statusText.setText(next.status === 'won' ? 'LIVING SEED VAULT RECOVERED' : next.status === 'lost' ? 'EXPEDITION LOST' : `${region.name.toUpperCase()} · RELICS ${next.collected}/${next.relicGoal} · WARDS ${next.wards}`);
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
playAgainButton.addEventListener('click', restartGame);
saveButton.addEventListener('click', () => persistState());
continueButton.addEventListener('click', continueGame);

document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
  button.addEventListener('click', () => dispatch(actionFromMoveControl(button.dataset.move)));
});

syncHud();
