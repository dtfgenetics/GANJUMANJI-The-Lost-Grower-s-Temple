import Phaser from 'phaser';
import './styles.css';
import { createGame, move, tileKind, type Direction, type TempleState } from './game/model';

const TILE = 64;
let state: TempleState = createGame();
let sceneRef: TempleScene | null = null;

const health = document.querySelector('#health') as HTMLElement;
const relics = document.querySelector('#relics') as HTMLElement;
const danger = document.querySelector('#danger') as HTMLElement;
const turns = document.querySelector('#turns') as HTMLElement;
const message = document.querySelector('#message') as HTMLElement;
const restartButton = document.querySelector('#restartButton') as HTMLButtonElement;

function syncHud() {
  health.textContent = String(state.health);
  relics.textContent = `${state.collected} / ${state.relicGoal}`;
  danger.textContent = `${state.danger} / 10`;
  turns.textContent = String(state.turn);
  message.textContent = state.message;
  restartButton.textContent = state.status === 'playing' ? 'Restart Expedition' : 'Play Again';
}

function dispatchMove(direction: Direction) {
  if (state.status !== 'playing') return;
  state = move(state, direction);
  syncHud();
  sceneRef?.renderState(state);
}

class TempleScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Arc;
  private statusText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;

  constructor() { super('temple'); }

  create() {
    sceneRef = this;
    this.graphics = this.add.graphics();
    this.player = this.add.circle(0, 0, TILE * .26, 0xf5df8e).setStrokeStyle(4, 0x1f472c);
    this.statusText = this.add.text(14, 12, '', { fontFamily: 'system-ui, sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#fff5cf', backgroundColor: '#07110bcc', padding: { x: 10, y: 6 } }).setDepth(5);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') dispatchMove('up');
      if (key === 'arrowdown' || key === 's') dispatchMove('down');
      if (key === 'arrowleft' || key === 'a') dispatchMove('left');
      if (key === 'arrowright' || key === 'd') dispatchMove('right');
    });
    this.renderState(state);
  }

  update() {
    void this.cursors;
    void this.wasd;
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
        } else if (kind === 'exit') {
          this.graphics.fillStyle(0x4a8b70, 1).fillRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
          this.graphics.lineStyle(4, 0xd9bd72, 1).strokeRoundedRect(x * TILE + 11, y * TILE + 8, 42, 48, 8);
        }
      }
    }

    this.player.setPosition(next.player.x * TILE + TILE / 2, next.player.y * TILE + TILE / 2);
    this.statusText.setText(next.status === 'won' ? 'VAULT ESCAPED' : next.status === 'lost' ? 'EXPEDITION LOST' : `RELICS ${next.collected}/${next.relicGoal}`);
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

restartButton.addEventListener('click', () => {
  state = createGame();
  syncHud();
  sceneRef?.renderState(state);
});

document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => {
  button.addEventListener('click', () => dispatchMove(button.dataset.move as Direction));
});

syncHud();
