import { describe, expect, it } from 'vitest';

type Resources = { health: number; wards: number; tools: number; depth: number };
const dominates = (a: Resources, b: Resources) => a.depth <= b.depth && a.health >= b.health && a.wards >= b.wards && a.tools >= b.tools;

describe('campaign solver dominance', () => {
  it('prunes only equal-or-better resource labels reached no later', () => {
    const strong = { health: 3, wards: 1, tools: 1, depth: 20 };
    expect(dominates(strong, { health: 2, wards: 1, tools: 0, depth: 20 })).toBe(true);
    expect(dominates(strong, { health: 3, wards: 1, tools: 1, depth: 19 })).toBe(false);
    expect(dominates(strong, { health: 3, wards: 2, tools: 1, depth: 20 })).toBe(false);
    expect(dominates(strong, { health: 3, wards: 1, tools: 2, depth: 20 })).toBe(false);
  });
});
