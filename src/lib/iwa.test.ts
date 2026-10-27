import { describe, expect, it } from 'vitest';
import { rankHistory, rankIwa } from './iwa.ts';

const ids = ['4.A.1', '4.A.2', '4.A.3', 'Other IWA'];

describe('rankIwa', () => {
  it('降順に並べ、Other IWA は順位から外して別に返す', () => {
    const { ranked, other } = rankIwa(ids, [0.1, 0.5, 0.2, 0.3]);
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([
      ['4.A.2', 1],
      ['4.A.3', 2],
      ['4.A.1', 3],
    ]);
    expect(other).toBe(0.3);
  });

  it('同値は同順位にする', () => {
    const { ranked } = rankIwa(ids, [0.2, 0.5, 0.2, 0.1]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 2]);
  });
});

describe('rankHistory', () => {
  it('公開されていない四半期は null', () => {
    const quarters = { '2025-01-01': [0.1, 0.5, 0.2, 0.2] };
    expect(rankHistory(ids, quarters, ['2025-01-01', '2025-04-01'], '4.A.3')).toEqual([2, null]);
  });
});
