import Phaser from 'phaser';
import './styles.css';
import { GameAudio, type AudioCue } from './game/audio';
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
const tools = document.querySelector('#tools') as HTMLElement;
const guardians = document.querySelector('#guardians') as HTMLElement;
const regions = document.querySelector('#regions') as HTMLElement;
const checkpoints = document.querySelector('#checkpoints') as HTMLElement;
const danger = document.querySelector('#danger') as HTMLElement;
const turns = document.querySelector('#turns') as HTMLElement;
const regionName = document.querySelector('#regionName') as HTMLElement;
const regionRelics = document.querySelector('#regionRelics') as HTMLElement;
const regionTitle = document.querySelector('#regionTitle') as HTMLElement;
const regionDescription = document.querySelector('#regionDescription') as HTMLElement;
const pressureHint = document.querySelector('#pressureHint') as HTMLElement;
const message = document.querySelector('#message') as HTMLElement;
const audioButton = document.querySelector('#audioButton') as HTMLButtonElement;
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
const continueResultButton = document.querySelector('#continueResultButton') as HTMLButtonElement;
const playAgainButton = document.querySelector('#playAgainButton') as HTMLButtonElement;

function getStorage(): Storage | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

const audio = new GameAudio(getStorage());

function syncAudioButton() {
  const enabled = audio.isEnabled();
  audioButton.textContent = enabled ? 'Sound On' : 'Sound Off';
  audioButton.setAttribute('aria-pressed', String(enabled));
}

function syncRecord() {
  const record = readRecord(getStorage());
  bestMoves.textContent = record.bestMoves > 0 ? `${record.bestMoves} moves` : '—';
  winCount.textContent = `${record.wins} completed expedition${record.wins === 1 ? '' : 's'}`;
}

function syncResult() {
  const ended = state.status !== 'playing';
  resultModal.hidden = !ended;
  if (!ended) {
    continueResultButton.hidden = true;
    return;
  }
  const won = state.status === 'won';
  resultEyebrow.textContent = won ? 'Expedition Complete' : 'Expedition Lost';
  resultTitle.textContent = won ? 'Living Seed Vault Recovered' : 'The Temple Claimed This Run';
  const checkpointAvailable = !won && Boolean(loadExpedition(getStorage()));
  resultText.textContent = won
    ? 'Every relic seed is secure. Your route is recorded—return and try to escape in fewer moves.'
    : checkpointAvailable
      ? 'Return to the last safe checkpoint or start a fresh expedition.'
      : 'No safe checkpoint is available. Start a fresh expedition and choose another route.';
  resultMoves.textContent = String(state.turn);
  resultRelics.textContent = `${state.campaignCollected} / ${state.campaignRelicGoal}`;
  resultRegions.textContent = `${state.regionsCleared.length} / 3`;
  continueResultButton.hidden = !checkpointAvailable;
  playAgainButton.textContent = won ? 'Start New Expedition' : 'Restart Expedition';
}

function syncHud() {
  const region = getRegion(state);
  health.textContent = `${state.health} / ${state.maxHealth}`;
  relics.textContent = `${state.campaignCollected} / ${state.campaignRelicGoal}`;
  wards.textContent = String(state.wards);
  tools.textContent = String(state.tools);
  guardians.textContent = String(state.guardians.length);
  regions.textContent = `${state.regionsCleared.length} / 3`;
  checkpoints.textContent = `${state.visitedCheckpoints.length} / ${state.checkpoints.length}`;
  danger.textContent = `${state.danger} / 10`;
  turns.textContent = String(state.turn);
  regionName.textContent = region.name;
  regionRelics.textContent = `${state.collected} / ${state.relicGoal}`;
  regionTitle.textContent = region.name;
  regionDescription.textContent = region.subtitle;
  pressureHint.textContent = region.pressureLabel;
  message.textContent = state.message;
  restartButton.textContent = state.status === 'playing' ? 'Restart' : 'Play Again';
  saveButton.disabled = state.status !== 'playing';
  continueButton.disabled = !loadExpedition(getStorage());
  document.querySelectorAll<HTMLElement>('[data-region-step]').forEach((step) => {
    const id = step.dataset.regionStep as RegionId | undefined;
    if (!id) return;
    step.dataset.state = state.regionsCleared.includes(id) ? 'complete' : id === state.regionId ? 'current' : 'locked';
  });
  syncAudioButton();
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
    continueResultButton.hidden = true;
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
    audio.play('win');
  } else {
    saveStatus.textContent = 'Last safe checkpoint preserved';
    audio.play('lose');
  }
}

function cueForMove(previous: TempleState, next: TempleState): AudioCue {
  if (previous.regionId !== next.regionId) return 'region';
  if (next.campaignCollected > previous.campaignCollected) return 'relic';
  if (next.tools > previous.tools) return 'tool';
  if (next.guardians.length < previous.guardians.length) return 'guardian';
  if (next.wards > previous.wards) return 'ward';
  if (next.visitedCheckpoints.length > previous.visitedCheckpoints.length) return 'checkpoint';
  if (next.health < previous.health || next.wards < previous.wards) return 'damage';
  return 'move';
}

function dispatch(action: GameAction | null) {
  if (!action) return;
  if (action.type === 'restart') { restartGame(); return; }
  if (state.status !== 'playing') return;
  const previous = structuredClone(state) as TempleState;
  const previousTurn = state.turn;
  const previousRegion = state.regionId;
  const previousStatus = state.status;
  state = move(state, action.direction);
  if (state.turn !== previousTurn) audio.play(cueForMove(previous, state));
  if (state.turn !== previousTurn && state.status === 'playing') persistState(previousRegion !== state.regionId ? 'Region checkpoint saved' : 'Checkpoint saved');
  finishRun(previousStatus);
  renderState();
}

class TempleScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Container;
  private statusText!: Phaser.GameObjects.Text;
  private lastRegionId: RegionId | null = null;
  private lastPlayer: { x: number; y: number } | null = null;
  private reducedMotion = false;

  constructor() { super('temple'); }

  create() {
    sceneRef = this;
    this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.graphics = this.add.graphics();
    this.player = this.createSeedExplorer();
    this.statusText = this.add.text(14, 12, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: 'bold',
      color: '#fff5cf', backgroundColor: '#07110bcc', padding: { x: 10, y: 6 }
    }).setDepth(5);
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => dispatch(actionFromKeyboard(event)));
    this.renderState(state);
  }

  private createSeedExplorer() {
    const body = this.add.ellipse(0, 2, 31, 39, 0xb98255).setStrokeStyle(3, 0x2b1d13);
    const belly = this.add.ellipse(2, 5, 18, 25, 0xd9a878, 0.5);
    const eyeLeft = this.add.circle(-6, -4, 2.2, 0x15100c);
    const eyeRight = this.add.circle(6, -4, 2.2, 0x15100c);
    const smile = this.add.arc(0, 1, 6, 18, 162, false, 0x000000, 0).setStrokeStyle(2, 0x2b1d13);
    const stem = this.add.rectangle(0, -23, 3, 10, 0x4f8b4c).setRotation(-0.08);
    const leafLeft = this.add.ellipse(-6, -29, 12, 7, 0x62a85d).setRotation(-0.42);
    const leafRight = this.add.ellipse(6, -30, 12, 7, 0x70b96a).setRotation(0.35);
    return this.add.container(0, 0, [stem, leafLeft, leafRight, body, belly, eyeLeft, eyeRight, smile]).setDepth(4);
  }

  private drawFloorDetail(regionId: RegionId, x: number, y: number) {
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    if (regionId === 'root_halls' && (x * 3 + y) % 5 === 0) {
      this.graphics.lineStyle(2, 0x4f7b4f, 0.35).beginPath().moveTo(cx - 18, cy + 22).lineTo(cx - 6, cy + 8).lineTo(cx + 4, cy + 13).strokePath();
      this.graphics.fillStyle(0x69945f, 0.32).fillEllipse(cx - 7, cy + 8, 9, 5);
    } else if (regionId === 'sunken_archive' && (x + y * 2) % 4 === 0) {
      this.graphics.lineStyle(2, 0x80c9cf, 0.25).strokeEllipse(cx, cy + 15, 30, 8).strokeEllipse(cx, cy + 15, 18, 5);
    } else if (regionId === 'vault_heart' && (x + y) % 3 === 0) {
      this.graphics.lineStyle(2, 0xe0b95e, 0.2).strokeRect(cx - 7, cy - 7, 14, 14);
      this.graphics.fillStyle(0xf0d57f, 0.24).fillCircle(cx, cy, 3);
    }
  }

  private positionPlayer(next: TempleState) {
    const x = next.player.x * TILE + TILE / 2;
    const y = next.player.y * TILE + TILE / 2;
    const changedRegion = this.lastRegionId !== null && this.lastRegionId !== next.regionId;
    const moved = this.lastPlayer !== null && (this.lastPlayer.x !== next.player.x || this.lastPlayer.y !== next.player.y);
    this.tweens.killTweensOf(this.player);
    if (!this.reducedMotion && moved && !changedRegion) this.tweens.add({ targets: this.player, x, y, duration: 120, ease: 'Sine.Out' });
    else this.player.setPosition(x, y);
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
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;
        this.graphics.fillStyle(fill, 1).fillRect(x * TILE, y * TILE, TILE - 2, TILE - 2);
        if (kind === 'floor') this.drawFloorDetail(next.regionId, x, y);
        if (kind === 'relic') {
          this.graphics.fillStyle(0xe8c766, 1).fillCircle(cx, cy, 13);
          this.graphics.lineStyle(3, 0xfff1a6, 1).strokeCircle(cx, cy, 20);
        } else if (kind === 'hazard') {
          this.graphics.fillStyle(0x8c342d, .95).fillTriangle(x * TILE + 12, y * TILE + 52, cx, y * TILE + 12, x * TILE + 52, y * TILE + 52);
        } else if (kind === 'ward') {
          this.graphics.fillStyle(0xc78f35, 1).fillRoundedRect(x * TILE + 17, y * TILE + 17, 30, 30, 8);
          this.graphics.lineStyle(3, 0xffdf85, 1).strokeRoundedRect(x * TILE + 14, y * TILE + 14, 36, 36, 10);
        } else if (kind === 'tool') {
          this.graphics.fillStyle(0x5ca6a8, 1).fillRoundedRect(x * TILE + 15, y * TILE + 20, 34, 25, 5);
          this.graphics.lineStyle(3, 0xb9f0ea, 1).strokeRoundedRect(x * TILE + 15, y * TILE + 20, 34, 25, 5);
          this.graphics.lineStyle(3, 0xb9f0ea, 1).strokeRect(x * TILE + 25, y * TILE + 14, 14, 8);
        } else if (kind === 'guardian') {
          this.graphics.fillStyle(0x5b2f68, .95).fillCircle(cx, cy, 21);
          this.graphics.lineStyle(3, 0xdca7ee, 1).strokeCircle(cx, cy, 25);
          this.graphics.fillStyle(0xf5d4ff, 1).fillEllipse(cx, cy, 22, 11);
          this.graphics.fillStyle(0x24122b, 1).fillCircle(cx, cy, 5);
        } else if (kind === 'checkpoint') {
          const visited = next.visitedCheckpoints.some(point => point.x === x && point.y === y);
          this.graphics.fillStyle(visited ? 0x315f56 : 0x3c7c8f, 1).fillCircle(cx, cy, 20);
          this.graphics.lineStyle(4, visited ? 0x7db7a7 : 0xaee8ff, 1).strokeCircle(cx, cy, 24);
        } else if (kind === 'exit') {
          this.graphics.fillStyle(region.palette.accent, .75).fillRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
          this.graphics.lineStyle(4, 0xffefb0, 1).strokeRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
        }
      }
    }
    this.positionPlayer(next);
    this.statusText.setText(next.status === 'won' ? 'LIVING SEED VAULT RECOVERED' : next.status === 'lost' ? 'EXPEDITION LOST' : `${region.name.toUpperCase()} · RELICS ${next.collected}/${next.relicGoal} · KITS ${next.tools}`);
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

audioButton.addEventListener('click', () => { audio.toggle(); syncAudioButton(); });
restartButton.addEventListener('click', restartGame);
playAgainButton.addEventListener('click', restartGame);
continueResultButton.addEventListener('click', continueGame);
saveButton.addEventListener('click', () => persistState());
continueButton.addEventListener('click', continueGame);
document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => button.addEventListener('click', () => dispatch(actionFromMoveControl(button.dataset.move))));

syncHud();
