import { describe, expect, it } from 'vitest';
import { readRecord, recordWin } from '../src/game/records';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => { data.delete(key); },
    setItem: (key, value) => { data.set(key, value); }
  };
}

describe('Ganjumanji run records', () => {
  it('starts empty and records the first completed expedition', () => {
    const storage = memoryStorage();
    expect(readRecord(storage)).toEqual({ bestMoves: 0, wins: 0 });
    expect(recordWin(storage, 54)).toEqual({ bestMoves: 54, wins: 1 });
  });

  it('keeps the fastest escape while counting every win', () => {
    const storage = memoryStorage();
    recordWin(storage, 54);
    recordWin(storage, 62);
    expect(recordWin(storage, 48)).toEqual({ bestMoves: 48, wins: 3 });
  });

  it('recovers safely from malformed persisted records', () => {
    const storage = memoryStorage();
    storage.setItem('dtf-ganjumanji-record-v1', '{broken');
    expect(readRecord(storage)).toEqual({ bestMoves: 0, wins: 0 });
  });
});
