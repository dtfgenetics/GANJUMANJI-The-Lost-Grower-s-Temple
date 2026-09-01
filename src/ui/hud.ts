import type { GameEvent, GameState } from '../simulation/state';
import { TEMPLE_ATRIUM } from '../simulation/world-data';

export class TempleHud {
  private readonly objective = this.requireElement<HTMLElement>('objective');
  private readonly sigilCount = this.requireElement<HTMLElement>('sigil-count');
  private readonly resolveCount = this.requireElement<HTMLElement>('resolve-count');
  private readonly prompt = this.requireElement<HTMLElement>('prompt');
  private readonly winDialog = this.requireElement<HTMLDialogElement>('win-dialog');
  private readonly playAgain = this.requireElement<HTMLButtonElement>('play-again');
  private lastMessage = '';

  constructor(private readonly root: HTMLElement, onRestart: () => void) {
    this.playAgain.addEventListener('click', () => {
      this.winDialog.close();
      onRestart();
    });
  }

  update(state: GameState, events: readonly GameEvent[]) {
    this.sigilCount.textContent = `${state.collectedSigils.length} / ${TEMPLE_ATRIUM.sigils.length}`;
    this.resolveCount.textContent = String(state.resolve);

    const gateReady = state.collectedSigils.length === TEMPLE_ATRIUM.sigils.length;
    this.objective.textContent = gateReady
      ? 'Reach the open Canopy Gate.'
      : `Recover ${TEMPLE_ATRIUM.sigils.length - state.collectedSigils.length} more Seed Sigil${TEMPLE_ATRIUM.sigils.length - state.collectedSigils.length === 1 ? '' : 's'}.`;

    if (state.message && state.message !== this.lastMessage) {
      this.prompt.textContent = state.message;
      this.lastMessage = state.message;
    } else if (events.length === 0 && state.runTimeMs > 4500 && state.phase === 'playing') {
      this.prompt.textContent = 'WASD / arrows to move · Shift to sprint · R to restart';
    }

    this.root.dataset.phase = state.phase;
    this.root.dataset.playerX = state.player.x.toFixed(3);
    this.root.dataset.playerZ = state.player.z.toFixed(3);
    this.root.dataset.sigils = String(state.collectedSigils.length);
    this.root.dataset.resolve = String(state.resolve);

    if (state.phase === 'won' && !this.winDialog.open) {
      this.winDialog.showModal();
      this.playAgain.focus();
    }
  }

  announce(message: string) {
    this.prompt.textContent = message;
    this.lastMessage = message;
  }

  private requireElement<T extends HTMLElement>(id: string): T {
    const element = this.root.querySelector<T>(`#${id}`);
    if (!element) throw new Error(`Missing HUD element #${id}`);
    return element;
  }
}
