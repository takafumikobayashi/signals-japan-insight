import { describe, expect, it } from 'vitest';
import { median, stackDots, stripTicks } from './strip.ts';

describe('stackDots', () => {
  it('別の区間の点はどれも軸のすぐ上（0段）に置く', () => {
    const out = stackDots([{ px: 1 }, { px: 21 }, { px: 41 }], 10, 0);
    expect(out.map((d) => d.level)).toEqual([0, 0, 0]);
  });

  it('同じ区間の点は上へ積み、区間の中心に揃える', () => {
    const out = stackDots([{ px: 12 }, { px: 11 }, { px: 18 }], 10, 0);
    expect(out.map((d) => d.level)).toEqual([0, 1, 2]);
    expect(new Set(out.map((d) => d.binPx))).toEqual(new Set([15]));
  });
});

describe('stripTicks', () => {
  it('値の範囲の内側に、0 を含む目盛りを置く', () => {
    const t = stripTicks(-7.5, 3.8);
    expect(t[0]).toBeGreaterThanOrEqual(-7.5);
    expect(t.at(-1)).toBeLessThanOrEqual(3.8);
    expect(t).toContain(0);
    expect(t.length).toBeGreaterThanOrEqual(3);
  });
});

describe('median', () => {
  it('奇数個・偶数個の中央値', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});
