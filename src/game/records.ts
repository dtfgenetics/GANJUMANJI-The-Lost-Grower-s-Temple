export const RECORD_KEY = 'dtf-ganjumanji-record-v1';

export type RunRecord = {
  bestMoves: number;
  wins: number;
};

export function readRecord(storage: Storage | null | undefined): RunRecord {
  const fallback = { bestMoves: 0, wins: 0 };
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(RECORD_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<RunRecord>;
    if (typeof parsed.bestMoves !== 'number' || typeof parsed.wins !== 'number') return fallback;
    return { bestMoves: Math.max(0, Math.floor(parsed.bestMoves)), wins: Math.max(0, Math.floor(parsed.wins)) };
  } catch {
    return fallback;
  }
}

export function recordWin(storage: Storage | null | undefined, moves: number): RunRecord {
  const current = readRecord(storage);
  const next = {
    bestMoves: current.bestMoves === 0 ? moves : Math.min(current.bestMoves, moves),
    wins: current.wins + 1
  };
  try { storage?.setItem(RECORD_KEY, JSON.stringify(next)); } catch {}
  return next;
}
