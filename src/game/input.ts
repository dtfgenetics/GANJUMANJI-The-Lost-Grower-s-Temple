import type { Direction } from './model';

export type GameAction = { type: 'move'; direction: Direction } | { type: 'restart' };

const KEY_TO_DIRECTION: Record<string, Direction | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right'
};

export function actionFromKeyboard(event: Pick<KeyboardEvent, 'key' | 'repeat'>): GameAction | null {
  if (event.repeat) return null;
  const direction = KEY_TO_DIRECTION[event.key];
  if (direction) return { type: 'move', direction };
  if (event.key === 'r' || event.key === 'R') return { type: 'restart' };
  return null;
}

export function actionFromMoveControl(value: string | undefined): GameAction | null {
  if (value === 'up' || value === 'down' || value === 'left' || value === 'right') {
    return { type: 'move', direction: value };
  }
  return null;
}
