import type { InputSnapshot } from './simulation/state';

type InputAction = 'forward' | 'back' | 'left' | 'right' | 'sprint';

const keyMap = new Map<string, InputAction>([
  ['KeyW', 'forward'],
  ['ArrowUp', 'forward'],
  ['KeyS', 'back'],
  ['ArrowDown', 'back'],
  ['KeyA', 'left'],
  ['ArrowLeft', 'left'],
  ['KeyD', 'right'],
  ['ArrowRight', 'right'],
  ['ShiftLeft', 'sprint'],
  ['ShiftRight', 'sprint'],
]);

export class InputController {
  private readonly active = new Set<InputAction>();
  private restartQueued = false;

  constructor(private readonly root: HTMLElement) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp, { passive: false });
    this.bindTouchButtons();
  }

  snapshot(): InputSnapshot {
    return {
      x: Number(this.active.has('right')) - Number(this.active.has('left')),
      z: Number(this.active.has('back')) - Number(this.active.has('forward')),
      sprint: this.active.has('sprint'),
    };
  }

  consumeRestart() {
    const queued = this.restartQueued;
    this.restartQueued = false;
    return queued;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'KeyR') {
      this.restartQueued = true;
      event.preventDefault();
      return;
    }
    const action = keyMap.get(event.code);
    if (!action) return;
    this.active.add(action);
    event.preventDefault();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const action = keyMap.get(event.code);
    if (!action) return;
    this.active.delete(action);
    event.preventDefault();
  };

  private bindTouchButtons() {
    for (const element of this.root.querySelectorAll<HTMLButtonElement>('[data-action]')) {
      const raw = element.dataset.action;
      if (!raw) continue;
      if (raw === 'restart') {
        element.addEventListener('click', () => {
          this.restartQueued = true;
        });
        continue;
      }
      if (!['forward', 'back', 'left', 'right', 'sprint'].includes(raw)) continue;
      const action = raw as InputAction;
      const press = (event: Event) => {
        event.preventDefault();
        this.active.add(action);
        element.setPointerCapture?.((event as PointerEvent).pointerId);
      };
      const release = (event: Event) => {
        event.preventDefault();
        this.active.delete(action);
      };
      element.addEventListener('pointerdown', press);
      element.addEventListener('pointerup', release);
      element.addEventListener('pointercancel', release);
      element.addEventListener('pointerleave', release);
    }
  }
}
